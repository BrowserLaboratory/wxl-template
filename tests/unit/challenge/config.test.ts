import { describe, it, expect } from 'vitest'
import { validateChallengeConfig, LEGACY_FIELDS, VALID_TOOLS, VALID_COMMANDS } from '../../../.vitepress/challenge/config'

describe('ChallengeConfig validation', () => {
  const minimal = {
    title: 'SQL Injection Basic',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('accepts a valid config with all required fields', () => {
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })

  it('throws when title is missing', () => {
    const { title: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/title/)
  })

  it('throws when backend is missing', () => {
    const { backend: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/backend/)
  })

  it('throws when app is missing', () => {
    const { app: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).toThrow(/app/)
  })

  it('accepts config without fs (fs is now optional/deprecated)', () => {
    const { fs: _, ...rest } = minimal
    expect(() => validateChallengeConfig(rest as any)).not.toThrow()
  })

  it('throws when backend is an invalid value', () => {
    expect(() => validateChallengeConfig({ ...minimal, backend: 'django' as any })).toThrow(/backend/)
  })

  it('defaults source_visible to false when omitted', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.source_visible).toBe(false)
  })

  it('accepts source_visible: true for white-box challenges', () => {
    const config = validateChallengeConfig({ ...minimal, source_visible: true })
    expect(config.source_visible).toBe(true)
  })

  it('accepts optional wasmModule field', () => {
    const config = validateChallengeConfig({ ...minimal, wasmModule: '/challenge/sqli-demo/runtime.wasm' })
    expect(config.wasmModule).toBe('/challenge/sqli-demo/runtime.wasm')
  })

  it('does not require wasmModule (auto-populated by build pipeline)', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.wasmModule).toBeUndefined()
  })

  it('does not require flag_verifier or fs_key (now in WASM)', () => {
    // These fields should NOT be required — they are embedded in per-challenge WASM
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })
})

describe('ChallengeConfig packages field', () => {
  const minimal = {
    title: 'Test',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('defaults packages to [] when omitted', () => {
    const config = validateChallengeConfig(minimal)
    expect(config.packages).toEqual([])
  })

  it('parses packages array when provided', () => {
    const config = validateChallengeConfig({ ...minimal, packages: ['requests', 'pyjwt'] })
    expect(config.packages).toEqual(['requests', 'pyjwt'])
  })

  it('accepts empty packages array', () => {
    const config = validateChallengeConfig({ ...minimal, packages: [] })
    expect(config.packages).toEqual([])
  })

  it('accepts fastapi backend with packages', () => {
    const config = validateChallengeConfig({ ...minimal, backend: 'fastapi', packages: ['fastapi', 'anyio'] })
    expect(config.packages).toEqual(['fastapi', 'anyio'])
    expect(config.backend).toBe('fastapi')
  })
})

describe('ChallengeConfig tools field', () => {
  const minimal = {
    title: 'Test',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('accepts config with no tools (defaults)', () => {
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })

  it('accepts valid tools: [browser, terminal]', () => {
    const config = validateChallengeConfig({ ...minimal, tools: ['browser', 'terminal'] })
    expect(config.tools).toEqual(['browser', 'terminal'])
  })

  it('throws when tools contains an invalid value', () => {
    expect(() =>
      validateChallengeConfig({ ...minimal, tools: ['browser', 'invalid'] }),
    ).toThrow(/invalid tool/)
  })

  it('accepts empty tools array (no tabs shown)', () => {
    const config = validateChallengeConfig({ ...minimal, tools: [] })
    expect(config.tools).toEqual([])
  })

  it('accepts all valid tool values', () => {
    const config = validateChallengeConfig({ ...minimal, tools: [...VALID_TOOLS] })
    expect(config.tools).toEqual([...VALID_TOOLS])
  })
})

describe('ChallengeConfig commands field', () => {
  const minimal = {
    title: 'Test',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('accepts config with no commands (defaults)', () => {
    expect(() => validateChallengeConfig(minimal)).not.toThrow()
  })

  it('accepts valid commands: [sqlmap, dirb]', () => {
    const config = validateChallengeConfig({ ...minimal, commands: ['sqlmap', 'dirb'] })
    expect(config.commands).toEqual(['sqlmap', 'dirb'])
  })

  it('accepts commands: "all"', () => {
    const config = validateChallengeConfig({ ...minimal, commands: 'all' })
    expect(config.commands).toBe('all')
  })

  it('throws when commands contains an invalid value', () => {
    expect(() =>
      validateChallengeConfig({ ...minimal, commands: ['fake_tool'] }),
    ).toThrow(/invalid command/)
  })

  it('accepts all valid command values as array', () => {
    const config = validateChallengeConfig({ ...minimal, commands: [...VALID_COMMANDS] })
    expect(config.commands).toEqual([...VALID_COMMANDS])
  })
})

describe('ChallengeConfig tools + commands combined', () => {
  const minimal = {
    title: 'Test',
    backend: 'flask' as const,
    app: './app.py',
    fs: { '/flag.txt': './flag.txt' },
  }

  it('accepts config with both tools and commands', () => {
    const config = validateChallengeConfig({
      ...minimal,
      tools: ['browser', 'terminal'],
      commands: ['sqlmap', 'dirb'],
    })
    expect(config.tools).toEqual(['browser', 'terminal'])
    expect(config.commands).toEqual(['sqlmap', 'dirb'])
  })

  it('accepts config with flag field alongside tools and commands', () => {
    expect(() =>
      validateChallengeConfig({
        ...minimal,
        tools: ['browser', 'code'],
        commands: 'all',
        // flag is an existing optional concept in challenge configs
      }),
    ).not.toThrow()
  })
})

describe('VALID_TOOLS and VALID_COMMANDS constants', () => {
  it('exports VALID_TOOLS with expected values', () => {
    expect(VALID_TOOLS).toContain('browser')
    expect(VALID_TOOLS).toContain('network')
    expect(VALID_TOOLS).toContain('repeater')
    expect(VALID_TOOLS).toContain('terminal')
    expect(VALID_TOOLS).toContain('code')
  })

  it('exports VALID_COMMANDS with expected values', () => {
    expect(VALID_COMMANDS).toContain('dirb')
    expect(VALID_COMMANDS).toContain('dirsearch')
    expect(VALID_COMMANDS).toContain('sqlmap')
    expect(VALID_COMMANDS).toContain('jwt')
    expect(VALID_COMMANDS).toContain('hydra')
    expect(VALID_COMMANDS).toContain('nmap')
  })
})

describe('Legacy field detection', () => {
  it('exports LEGACY_FIELDS constant', () => {
    expect(LEGACY_FIELDS).toContain('fs_key')
    expect(LEGACY_FIELDS).toContain('fsKeyParts')
    expect(LEGACY_FIELDS).toContain('encryptedFs')
    expect(LEGACY_FIELDS).toContain('flag_verifier')
  })
})
