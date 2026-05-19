import { describe, it, expect } from 'vitest'
import { processChallengeFrontmatter } from '../../../.vitepress/challenge/plugin'

const BASE_FRONTMATTER = {
  title: 'Test Challenge',
  backend: 'flask' as const,
  app: './app.py',
  fs: { '/flag.txt': 'FLAG{test}' },
}

const APP_CODE = 'from flask import Flask\napp = Flask(__name__)'

describe('processChallengeFrontmatter - simplified (no encryption)', () => {
  it('returns public metadata from frontmatter', () => {
    const result = processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    expect(result.title).toBe('Test Challenge')
    expect(result.backend).toBe('flask')
    expect(result.sourceVisible).toBe(false)
  })

  it('does NOT include encryptedFs, fsKeyParts, or flagVerifier', () => {
    const result = processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    const json = JSON.stringify(result)
    expect(json).not.toContain('encryptedFs')
    expect(json).not.toContain('fsKeyParts')
    expect(json).not.toContain('flagVerifier')
  })

  it('passes through wasmModule when present', () => {
    const result = processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, wasmModule: '/challenge/test/runtime.wasm' },
      { 'app.py': APP_CODE },
    )
    expect(result.wasmModule).toBe('/challenge/test/runtime.wasm')
  })
})

describe('processChallengeFrontmatter - source_visible', () => {
  it('black-box: app source must NOT appear in output', () => {
    const result = processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, source_visible: false },
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain(APP_CODE)
  })

  it('white-box: app source MUST appear as plaintext in output', () => {
    const result = processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, source_visible: true },
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBe(APP_CODE)
  })

  it('default (no source_visible): behaves as black-box', () => {
    const result = processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    expect(result.appSource).toBeUndefined()
  })
})

describe('processChallengeFrontmatter - packages', () => {
  it('packages is passed through', () => {
    const result = processChallengeFrontmatter(
      { ...BASE_FRONTMATTER, packages: ['requests', 'pyjwt'] },
      { 'app.py': APP_CODE },
    )
    expect(result.packages).toEqual(['requests', 'pyjwt'])
  })

  it('missing packages defaults to []', () => {
    const result = processChallengeFrontmatter(
      BASE_FRONTMATTER,
      { 'app.py': APP_CODE },
    )
    expect(result.packages).toEqual([])
  })
})
