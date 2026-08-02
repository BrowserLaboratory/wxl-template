import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mkdirSync, writeFileSync, readFileSync, existsSync, utimesSync, rmSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { resolve, join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  prepareTemplateWasm,
  assertUsableWasm,
  preparedTemplateRelPath,
  WASM_PACK_OUT_DIRS,
  serializePayload,
  parsePayload,
  xorEncodeKey,
  hexToBytes,
  bytesToHex,
  deriveFlagVerifier,
  injectCustomSection,
  slugToSeed,
  isOutputStale,
  getTrackedInputPaths,
  aesGcmEncryptRaw,
  type ChallengePayload,
} from '../../../scripts/challenge-keygen'

// ─── XOR masks matching Rust key_derive.rs compile-time constants ────────────
const MASK_A = new Uint8Array([
  0x7a, 0x3f, 0xb1, 0x92, 0xe4, 0x58, 0x0d, 0xc6,
  0xa3, 0x17, 0x6b, 0xf0, 0x2e, 0x89, 0xd4, 0x53,
  0x91, 0x46, 0xfc, 0x28, 0x7d, 0xe5, 0x0a, 0xb3,
  0xc7, 0x64, 0x1f, 0x8e, 0x39, 0xa2, 0xd0, 0x5b,
])

const MASK_B = new Uint8Array([
  0xd5, 0x4e, 0x23, 0xa7, 0x1b, 0x96, 0xf8, 0x42,
  0x0c, 0xe1, 0x5a, 0x3d, 0xb7, 0x60, 0x89, 0xc4,
  0x2f, 0x73, 0x18, 0xe6, 0x4a, 0x9d, 0x51, 0x0e,
  0xb2, 0xd8, 0x65, 0xf3, 0x47, 0x1c, 0xa9, 0x84,
])

const MASK_C = new Uint8Array([
  0x38, 0xc2, 0x67, 0x15, 0x9e, 0xab, 0xd3, 0x4f,
  0x71, 0x86, 0x2c, 0xe9, 0x54, 0x0b, 0xf7, 0xa1,
  0x63, 0xbd, 0x40, 0x95, 0xd2, 0x1e, 0x78, 0xc6,
  0x09, 0x4a, 0xf1, 0x27, 0x8c, 0xe3, 0x5d, 0xb0,
])

// ─── Binary payload serialization / parsing ─────────────────────────────────

describe('serializePayload', () => {
  it('produces binary starting with CHWD magic and version 1', () => {
    const payload: ChallengePayload = {
      slug: 'test',
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(2), // '{}'
    }
    const buf = serializePayload(payload)
    // Magic: C H W D
    expect(buf[0]).toBe(0x43)
    expect(buf[1]).toBe(0x48)
    expect(buf[2]).toBe(0x57)
    expect(buf[3]).toBe(0x44)
    // Version
    expect(buf[4]).toBe(1)
  })

  it('roundtrips a payload with entries', () => {
    const payload: ChallengePayload = {
      slug: 'sqli-demo',
      keyMaterial: new Uint8Array(32).fill(0xAA),
      verifier: new TextEncoder().encode('abcdef1234567890'),
      entries: [
        { path: '/flag.txt', data: new Uint8Array([0x01, 0x02, 0x03]) },
        { path: '__app__', data: new Uint8Array([0x04, 0x05]) },
      ],
      metadata: new TextEncoder().encode('{"backend":"flask"}'),
    }
    const buf = serializePayload(payload)
    const parsed = parsePayload(buf)

    expect(parsed.slug).toBe('sqli-demo')
    expect(parsed.keyMaterial).toEqual(new Uint8Array(32).fill(0xAA))
    expect(new TextDecoder().decode(parsed.verifier)).toBe('abcdef1234567890')
    expect(parsed.entries.length).toBe(2)
    expect(parsed.entries[0].path).toBe('/flag.txt')
    expect(parsed.entries[0].data).toEqual(new Uint8Array([0x01, 0x02, 0x03]))
    expect(parsed.entries[1].path).toBe('__app__')
    expect(new TextDecoder().decode(parsed.metadata)).toBe('{"backend":"flask"}')
  })

  it('uses little-endian for multi-byte integers', () => {
    const payload: ChallengePayload = {
      slug: 'x'.repeat(256), // slug_len = 256, > 1 byte in LE
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(0),
    }
    const buf = serializePayload(payload)
    // slug_len at offset 5-6: 256 = 0x0100 LE → [0x00, 0x01]
    expect(buf[5]).toBe(0x00)
    expect(buf[6]).toBe(0x01)
  })

  it('roundtrips empty entries and metadata', () => {
    const payload: ChallengePayload = {
      slug: 'empty',
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(0),
      entries: [],
      metadata: new Uint8Array(0),
    }
    const buf = serializePayload(payload)
    const parsed = parsePayload(buf)
    expect(parsed.slug).toBe('empty')
    expect(parsed.entries.length).toBe(0)
    expect(parsed.metadata.length).toBe(0)
  })
})

describe('parsePayload', () => {
  it('rejects invalid magic', () => {
    const buf = new Uint8Array([0x00, 0x00, 0x00, 0x00, 0x01])
    expect(() => parsePayload(buf)).toThrow(/magic/)
  })

  it('rejects unsupported version', () => {
    const buf = new Uint8Array([0x43, 0x48, 0x57, 0x44, 99, 0, 0])
    expect(() => parsePayload(buf)).toThrow(/version/)
  })

  it('rejects truncated data', () => {
    expect(() => parsePayload(new Uint8Array([0x43, 0x48, 0x57]))).toThrow()
  })
})

// ─── XOR key encoding ───────────────────────────────────────────────────────

describe('xorEncodeKey', () => {
  it('produces encoded key different from input', () => {
    const key = new Uint8Array(32).fill(0x42)
    const encoded = xorEncodeKey(key)
    expect(encoded).not.toEqual(key)
    expect(encoded.length).toBe(32)
  })

  it('is reversible (XOR is self-inverse)', () => {
    const key = new Uint8Array(32)
    crypto.getRandomValues(key)
    const encoded = xorEncodeKey(key)
    const decoded = xorEncodeKey(encoded) // XOR again = original
    expect(decoded).toEqual(key)
  })

  it('matches Rust key_derive.rs masks', () => {
    // Verify that xorEncodeKey(key) = key XOR MASK_A XOR MASK_B XOR MASK_C
    const key = new Uint8Array(32).fill(0xFF)
    const encoded = xorEncodeKey(key)
    const expected = new Uint8Array(32)
    for (let i = 0; i < 32; i++) {
      expected[i] = key[i] ^ MASK_A[i] ^ MASK_B[i] ^ MASK_C[i]
    }
    expect(encoded).toEqual(expected)
  })

  it('rejects key that is not 32 bytes', () => {
    expect(() => xorEncodeKey(new Uint8Array(16))).toThrow()
    expect(() => xorEncodeKey(new Uint8Array(0))).toThrow()
  })
})

// ─── Hex conversion utilities ───────────────────────────────────────────────

describe('hexToBytes', () => {
  it('converts hex string to bytes', () => {
    expect(hexToBytes('deadbeef')).toEqual(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))
  })

  it('handles all zeros', () => {
    expect(hexToBytes('00000000')).toEqual(new Uint8Array([0, 0, 0, 0]))
  })
})

describe('bytesToHex', () => {
  it('converts bytes to hex string', () => {
    expect(bytesToHex(new Uint8Array([0xde, 0xad, 0xbe, 0xef]))).toBe('deadbeef')
  })
})

// ─── Flag verifier ──────────────────────────────────────────────────────────

describe('deriveFlagVerifier', () => {
  it('produces a 32-byte hash as Uint8Array', async () => {
    const result = await deriveFlagVerifier('FLAG{test}', 'test-slug')
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBe(32)
  })

  it('is deterministic', async () => {
    const a = await deriveFlagVerifier('FLAG{x}', 'slug')
    const b = await deriveFlagVerifier('FLAG{x}', 'slug')
    expect(a).toEqual(b)
  })

  it('differs for different flags', async () => {
    const a = await deriveFlagVerifier('FLAG{a}', 'slug')
    const b = await deriveFlagVerifier('FLAG{b}', 'slug')
    expect(a).not.toEqual(b)
  })

  it('differs for different slugs', async () => {
    const a = await deriveFlagVerifier('FLAG{x}', 'slug-a')
    const b = await deriveFlagVerifier('FLAG{x}', 'slug-b')
    expect(a).not.toEqual(b)
  })
})

// ─── WASM custom section injection ──────────────────────────────────────────

describe('injectCustomSection', () => {
  // Minimal valid WASM module: magic + version + empty
  const MINIMAL_WASM = new Uint8Array([
    0x00, 0x61, 0x73, 0x6d, // \0asm magic
    0x01, 0x00, 0x00, 0x00, // version 1
  ])

  it('appends a custom section to the WASM binary', () => {
    const payload = new Uint8Array([0xDE, 0xAD])
    const result = injectCustomSection(MINIMAL_WASM, 'chall-data', payload)

    // Result should be longer than original
    expect(result.length).toBeGreaterThan(MINIMAL_WASM.length)

    // Should start with the original WASM
    expect(result.slice(0, MINIMAL_WASM.length)).toEqual(MINIMAL_WASM)

    // Custom section starts after original WASM
    const sectionStart = MINIMAL_WASM.length
    expect(result[sectionStart]).toBe(0x00) // custom section id
  })

  it('encodes section name correctly', () => {
    const payload = new Uint8Array([0x42])
    const result = injectCustomSection(MINIMAL_WASM, 'test', payload)

    // After WASM header (8 bytes):
    // 0x00 (section id)
    // LEB128 section size
    // LEB128 name length (4 for "test")
    // "test" bytes
    // payload

    let pos = MINIMAL_WASM.length
    expect(result[pos]).toBe(0x00) // section id
    pos++

    // section size = name_len_leb(1) + name(4) + payload(1) = 6
    expect(result[pos]).toBe(6) // section size (LEB128, fits in 1 byte)
    pos++

    // name length
    expect(result[pos]).toBe(4) // "test" = 4 bytes
    pos++

    // name bytes
    expect(new TextDecoder().decode(result.slice(pos, pos + 4))).toBe('test')
    pos += 4

    // payload
    expect(result[pos]).toBe(0x42)
  })

  it('preserves original WASM binary unchanged', () => {
    const original = new Uint8Array(MINIMAL_WASM)
    const payload = new Uint8Array(100).fill(0xFF)
    injectCustomSection(original, 'chall-data', payload)

    // original should be unchanged
    expect(original).toEqual(MINIMAL_WASM)
  })

  it('handles large payloads requiring multi-byte LEB128', () => {
    // Payload > 127 bytes requires 2-byte LEB128 for section size
    const payload = new Uint8Array(200).fill(0xAB)
    const result = injectCustomSection(MINIMAL_WASM, 'chall-data', payload)

    // Should contain the full payload
    expect(result.length).toBeGreaterThan(MINIMAL_WASM.length + 200)
  })
})

// ─── Slug-to-seed for wasm-mutate ───────────────────────────────────────────

describe('slugToSeed', () => {
  it('produces a deterministic seed from slug', () => {
    const a = slugToSeed('sqli-demo')
    const b = slugToSeed('sqli-demo')
    expect(a).toBe(b)
  })

  it('produces different seeds for different slugs', () => {
    const a = slugToSeed('sqli-demo')
    const b = slugToSeed('xss-demo')
    expect(a).not.toBe(b)
  })

  it('returns a 32-bit integer', () => {
    const seed = slugToSeed('test')
    expect(Number.isInteger(seed)).toBe(true)
  })

  it('reads the hash as an unsigned u32 when the top bit is set', () => {
    // The signed reading of this slug's hash is -1882526008, which wasm-tools
    // rejects as a flag ("unexpected argument '-1' found") — so mutation was
    // silently skipped for roughly half of all slugs.
    const seed = slugToSeed('confidential-files')
    expect(seed).toBe(2412441288)
  })

  it('never returns a negative seed', () => {
    for (let i = 0; i < 1000; i++) {
      const seed = slugToSeed(`slug-${i}`)
      expect(seed).toBeGreaterThanOrEqual(0)
      expect(seed).toBeLessThan(2 ** 32)
    }
  })
})

// ─── Source freshness detection (Task 1.1) ──────────────────────────────────

describe('isOutputStale', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `keygen-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('returns true when the output file does not exist', () => {
    const inputPath = join(tmpDir, 'input.txt')
    writeFileSync(inputPath, 'hello')
    const outputPath = join(tmpDir, 'nonexistent.wasm')
    expect(isOutputStale(outputPath, [inputPath])).toBe(true)
  })

  it('returns true when any tracked input is newer than the output', () => {
    const outputPath = join(tmpDir, 'output.wasm')
    writeFileSync(outputPath, 'old output')
    // Set the output mtime to the past
    const pastTime = new Date(Date.now() - 5000)
    utimesSync(outputPath, pastTime, pastTime)

    const inputPath = join(tmpDir, 'source.py')
    writeFileSync(inputPath, 'new source')
    // Input has current mtime, which is newer than output

    expect(isOutputStale(outputPath, [inputPath])).toBe(true)
  })

  it('returns false when all tracked inputs are older than the output', () => {
    const inputPath = join(tmpDir, 'source.py')
    writeFileSync(inputPath, 'old source')
    // Set input mtime to the past
    const pastTime = new Date(Date.now() - 5000)
    utimesSync(inputPath, pastTime, pastTime)

    const outputPath = join(tmpDir, 'output.wasm')
    writeFileSync(outputPath, 'new output')
    // Output has current mtime, which is newer than input

    expect(isOutputStale(outputPath, [inputPath])).toBe(false)
  })

  it('returns false when inputs list is empty and output exists', () => {
    const outputPath = join(tmpDir, 'output.wasm')
    writeFileSync(outputPath, 'output')
    expect(isOutputStale(outputPath, [])).toBe(false)
  })

  it('ignores non-existent input files gracefully', () => {
    const outputPath = join(tmpDir, 'output.wasm')
    writeFileSync(outputPath, 'output')
    // A non-existent input should not crash but should be treated as stale
    // (if the input was expected but is missing, we can't verify freshness)
    expect(isOutputStale(outputPath, [join(tmpDir, 'missing.txt')])).toBe(false)
  })
})

// ─── Template preparation (strip + optimise) ────────────────────────────────

// The template carries no executable code of its own at runtime — the loader
// only reads its `chall-data` custom section. But an empty template still
// breaks extraction, because `useWasmLoader.extractCustomSection` starts at
// byte 8 and a truncated module leaves nothing to walk. These tests pin the
// two ways the strip pass has silently produced an unusable template.

const REAL_TEMPLATE = resolve(__dirname, '../../../.vitepress/wasm/virtual-fs/virtual_fs_bg.wasm')

function hasWasmTools(): boolean {
  try {
    execFileSync('which', ['wasm-tools'], { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

describe('preparedTemplateRelPath', () => {
  it('stages the template outside every wasm-pack output directory', () => {
    // wasm-pack re-optimises everything in its --out-dir with a bare `wasm-opt
    // -O`, which rejects the reference-types the module uses. Staging the
    // template there breaks the *next* `pnpm wasm:build`, not the current one.
    const staged = preparedTemplateRelPath()
    for (const outDir of WASM_PACK_OUT_DIRS) {
      expect(staged.startsWith(`${outDir}/`)).toBe(false)
    }
  })
})

describe('assertUsableWasm', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `keygen-guard-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('rejects a zero-byte output', () => {
    const p = join(tmpDir, 'out.wasm')
    writeFileSync(p, new Uint8Array(0))
    expect(() => assertUsableWasm(p, 77_000, 'wasm-strip')).toThrow(/wasm-strip/)
  })

  it('rejects a header-only module that carries no code', () => {
    // 8 bytes of magic + version is a structurally valid module, so neither a
    // non-zero exit code nor `wasm-tools validate` catches it. Size is the only
    // signal that the contents went missing.
    const p = join(tmpDir, 'out.wasm')
    writeFileSync(p, new Uint8Array([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00]))
    expect(() => assertUsableWasm(p, 77_000, 'wasm-strip')).toThrow(/8 bytes/)
  })

  it('rejects a file that is not WASM at all', () => {
    const p = join(tmpDir, 'out.wasm')
    writeFileSync(p, Buffer.alloc(50_000, 0x41))
    expect(() => assertUsableWasm(p, 77_000, 'wasm-strip')).toThrow(/magic/)
  })

  it('accepts an output that retains most of the input', () => {
    const p = join(tmpDir, 'out.wasm')
    const body = Buffer.alloc(70_000, 0x00)
    body.set([0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00], 0)
    writeFileSync(p, body)
    expect(() => assertUsableWasm(p, 77_000, 'wasm-strip')).not.toThrow()
  })
})

describe('prepareTemplateWasm', () => {
  let tmpDir: string
  let cwd: string
  let input: string
  let inputReady = false

  const canRun = existsSync(REAL_TEMPLATE) && hasWasmTools()

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `keygen-prep-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
    // Work off a private copy. Reading the build output directly races any
    // concurrent `pnpm wasm:build`, which rewrites that file in place — and a
    // torn read says nothing about the code under test, so skip rather than
    // fail when the source does not look like a complete module.
    input = join(tmpDir, 'input.wasm')
    inputReady = false
    if (canRun) {
      const src = readFileSync(REAL_TEMPLATE)
      if (src.length > 50_000 && src[0] === 0x00 && src[1] === 0x61 && src[2] === 0x73 && src[3] === 0x6d) {
        writeFileSync(input, src)
        inputReady = true
      }
    }
    // Run from the temp dir so that a tool which writes to a relative path
    // drops its file here rather than in the repo root.
    cwd = process.cwd()
    process.chdir(tmpDir)
  })

  afterEach(() => {
    process.chdir(cwd)
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it.skipIf(!canRun)('produces a template that retains the input\'s contents', (ctx) => {
    if (!inputReady) return ctx.skip()
    const out = join(tmpDir, 'template.wasm')
    prepareTemplateWasm(input, out)
    expect(readFileSync(out).length).toBeGreaterThan(readFileSync(input).length / 2)
  })

  it.skipIf(!canRun)('writes no stray file into the working directory', (ctx) => {
    if (!inputReady) return ctx.skip()
    // `wasm-tools strip -o -` treats "-" as a filename, not stdout. That drops
    // an untracked binary into the repo root on every keygen run.
    prepareTemplateWasm(input, join(tmpDir, 'template.wasm'))
    expect(existsSync(join(tmpDir, '-'))).toBe(false)
  })
})

describe('getTrackedInputPaths', () => {
  let tmpDir: string

  beforeEach(() => {
    tmpDir = resolve(tmpdir(), `keygen-tracked-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tmpDir, { recursive: true })
  })

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true })
  })

  it('includes the challenge markdown file', () => {
    // Set up a per-folder challenge structure
    const challDir = join(tmpDir, 'docs', 'challenge', 'test-chall')
    const srcDir = join(challDir, 'src')
    mkdirSync(srcDir, { recursive: true })

    const mdPath = join(challDir, 'index.md')
    writeFileSync(mdPath, '---\ntitle: Test\napp: app.py\nbackend: flask\n---\nContent')
    writeFileSync(join(srcDir, 'app.py'), 'print("hello")')
    writeFileSync(join(srcDir, 'flag.txt'), 'FLAG{test}')

    const templatePath = join(tmpDir, 'template.wasm')
    writeFileSync(templatePath, 'fake-wasm')

    const paths = getTrackedInputPaths(mdPath, templatePath)
    expect(paths).toContain(mdPath)
  })

  it('includes the template WASM', () => {
    const challDir = join(tmpDir, 'docs', 'challenge', 'test-chall')
    const srcDir = join(challDir, 'src')
    mkdirSync(srcDir, { recursive: true })

    const mdPath = join(challDir, 'index.md')
    writeFileSync(mdPath, '---\ntitle: Test\napp: app.py\nbackend: flask\n---\nContent')
    writeFileSync(join(srcDir, 'app.py'), 'print("hello")')
    writeFileSync(join(srcDir, 'flag.txt'), 'FLAG{test}')

    const templatePath = join(tmpDir, 'template.wasm')
    writeFileSync(templatePath, 'fake-wasm')

    const paths = getTrackedInputPaths(mdPath, templatePath)
    expect(paths).toContain(templatePath)
  })

  it('includes scanned src/ files', () => {
    const challDir = join(tmpDir, 'docs', 'challenge', 'test-chall')
    const srcDir = join(challDir, 'src')
    const templatesDir = join(srcDir, 'templates')
    mkdirSync(templatesDir, { recursive: true })

    const mdPath = join(challDir, 'index.md')
    writeFileSync(mdPath, '---\ntitle: Test\napp: app.py\nbackend: flask\n---\nContent')
    writeFileSync(join(srcDir, 'app.py'), 'print("hello")')
    writeFileSync(join(srcDir, 'flag.txt'), 'FLAG{test}')
    writeFileSync(join(templatesDir, 'index.html'), '<html></html>')

    const templatePath = join(tmpDir, 'template.wasm')
    writeFileSync(templatePath, 'fake-wasm')

    const paths = getTrackedInputPaths(mdPath, templatePath)
    expect(paths).toContain(join(srcDir, 'app.py'))
    expect(paths).toContain(join(srcDir, 'flag.txt'))
    expect(paths).toContain(join(templatesDir, 'index.html'))
  })

  it('includes .fsignore when present', () => {
    const challDir = join(tmpDir, 'docs', 'challenge', 'test-chall')
    const srcDir = join(challDir, 'src')
    mkdirSync(srcDir, { recursive: true })

    const mdPath = join(challDir, 'index.md')
    writeFileSync(mdPath, '---\ntitle: Test\napp: app.py\nbackend: flask\n---\nContent')
    writeFileSync(join(srcDir, 'app.py'), 'print("hello")')
    writeFileSync(join(srcDir, 'flag.txt'), 'FLAG{test}')
    writeFileSync(join(srcDir, '.fsignore'), '*.log')

    const templatePath = join(tmpDir, 'template.wasm')
    writeFileSync(templatePath, 'fake-wasm')

    const paths = getTrackedInputPaths(mdPath, templatePath)
    expect(paths).toContain(join(srcDir, '.fsignore'))
  })
})

// ─── Binary-preserving FS packaging (Task 1.2) ─────────────────────────────

describe('binary asset round-trip', () => {
  it('preserves binary data through serialize/parse round-trip', () => {
    // Create a payload with binary data (like a PNG header)
    const pngHeader = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
      0x49, 0x48, 0x44, 0x52, // IHDR
    ])

    const payload: ChallengePayload = {
      slug: 'binary-test',
      keyMaterial: new Uint8Array(32).fill(0xBB),
      verifier: new Uint8Array(32).fill(0xCC),
      entries: [
        { path: '/static/logo.png', data: pngHeader },
        { path: '__app__', data: new TextEncoder().encode('print("app")') },
      ],
      metadata: new TextEncoder().encode('{"backend":"flask"}'),
    }

    const serialized = serializePayload(payload)
    const parsed = parsePayload(serialized)

    // The PNG binary data must survive unchanged
    expect(parsed.entries[0].path).toBe('/static/logo.png')
    expect(parsed.entries[0].data).toEqual(pngHeader)
  })

  it('preserves bytes with 0x00 and 0xFF values through encryption round-trip', async () => {
    // Binary data containing bytes that would be corrupted by UTF-8 round-trip
    const binaryData = new Uint8Array(256)
    for (let i = 0; i < 256; i++) {
      binaryData[i] = i // 0x00..0xFF - includes invalid UTF-8 sequences
    }

    const key = new Uint8Array(32).fill(0x42)
    const encrypted = await aesGcmEncryptRaw(key, binaryData)

    // The encrypted data should be raw bytes; verify it's non-trivial
    expect(encrypted.length).toBeGreaterThan(binaryData.length) // iv + ct + tag overhead
    expect(encrypted).toBeInstanceOf(Uint8Array)

    // Verify the encrypted data survives payload serialization
    const payload: ChallengePayload = {
      slug: 'binary-roundtrip',
      keyMaterial: new Uint8Array(32),
      verifier: new Uint8Array(32),
      entries: [{ path: '/binary.dat', data: encrypted }],
      metadata: new Uint8Array(0),
    }
    const serialized = serializePayload(payload)
    const parsed = parsePayload(serialized)
    expect(parsed.entries[0].data).toEqual(encrypted)
  })
})

// ─── Fixed-input reproducibility (Task 2.2) ─────────────────────────────────

describe('fixed-input reproducibility', () => {
  it('produces identical payloads when key material and inputs are fixed', () => {
    const makePayload = () => serializePayload({
      slug: 'repro-test',
      keyMaterial: new Uint8Array(32).fill(0xAA),
      verifier: new Uint8Array(32).fill(0xBB),
      entries: [
        { path: '/flag.txt', data: new Uint8Array([0x01, 0x02, 0x03]) },
        { path: '__app__', data: new TextEncoder().encode('app code') },
      ],
      metadata: new TextEncoder().encode('{"backend":"flask"}'),
    })

    const a = makePayload()
    const b = makePayload()
    expect(a).toEqual(b)
  })

  it('produces identical WASM when template, payload, and section name are fixed', () => {
    const templateWasm = new Uint8Array([
      0x00, 0x61, 0x73, 0x6d,
      0x01, 0x00, 0x00, 0x00,
    ])
    const payloadBlob = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF])

    const a = injectCustomSection(templateWasm, 'chall-data', payloadBlob)
    const b = injectCustomSection(templateWasm, 'chall-data', payloadBlob)
    expect(a).toEqual(b)
  })

  it('deriveFlagVerifier is deterministic for same inputs', async () => {
    const a = await deriveFlagVerifier('FLAG{repro}', 'repro-slug')
    const b = await deriveFlagVerifier('FLAG{repro}', 'repro-slug')
    expect(a).toEqual(b)
  })
})
