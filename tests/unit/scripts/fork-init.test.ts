import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  parseForkInitArgs,
  runForkInit,
  ForkInitArgError,
} from '../../../scripts/fork-init'

// ─── fixture builder ─────────────────────────────────────────────────────────

function writeFixture(root: string) {
  const w = (rel: string, content: string) => {
    const abs = join(root, rel)
    mkdirSync(join(abs, '..'), { recursive: true })
    writeFileSync(abs, content)
  }

  w(
    'package.json',
    JSON.stringify(
      {
        name: 'wxl',
        version: '1.0.0',
        author: 'CXPh03n1x',
        description: 'Web eXploitation Laboratory — powered by WASM',
        license: 'LicenseRef-LICENSE',
        repository: { type: 'git', url: 'git+https://github.com/BrowserLaboratory/wxl-template.git' },
        bugs: { url: 'https://github.com/BrowserLaboratory/wxl-template/issues' },
        homepage: 'https://github.com/BrowserLaboratory/wxl-template#readme',
      },
      null,
      2,
    ) + '\n',
  )

  w(
    '.vitepress/config.mts',
    [
      'export default {',
      "  title: 'Web eXploitation Laboratory',",
      '  themeConfig: {',
      "    socialLinks: [{ icon: 'github', link: 'https://github.com/BrowserLaboratory/wxl-template' }],",
      '  },',
      '}',
      '',
    ].join('\n'),
  )

  w('README.md', 'git clone https://github.com/BrowserLaboratory/wxl-template.git\n')
  w('CONTRIBUTE.md', 'git remote add upstream https://github.com/BrowserLaboratory/wxl-template.git\n')
  w('.agent/skills/wxl-fork-init/deploy.yml.template', 'name: Deploy\njobs: {}\n')

  // runtime-sensitive keys
  w('.vitepress/theme/i18n/index.ts', "export const LOCALE_STORAGE_KEY = 'wxl-locale'\n")
  w('scripts/challenge-verify-blind.ts', 'const rt = process.env.WXL_VERIFY_RUNTIME\n// workDir tmp/wxl-verify/<slug>\n')
  w('.gitignore', 'tmp/wxl-verify/\n')
  w('.github/workflows/release.yml', 'run: zip -r "../../wxl-${GITHUB_REF_NAME}.zip" .\n')

  // excluded paths (must never be touched)
  w('pnpm-lock.yaml', 'wxl: 1.0.0 # lockfile, must stay\n')
  w('openspec/changes/archive/2026-01-01-old/proposal.md', 'historical wxl reference\n')
  // .agent skill identifiers are structural (path-referenced) — excluded from rename
  w('.agent/skills/wxl-create/SKILL.md', 'Read .agent/skills/wxl-create/SKILL.md — wxl brand\n')
  // host thin pointers reference the exact .agent/skills/wxl-* paths — excluded too
  w('.claude/skills/wxl-create/SKILL.md', 'Read .agent/skills/wxl-create/SKILL.md for the canonical skill content.\n')
  // the tool's own source must keep its literal wxl/WXL probes
  w('scripts/fork-init.ts', "const probe = /wxl-locale/ // WXL tool self\n")
  // a Title-case brand token the exact-case rename can't handle -> must be reported as residual
  w('.vitepress/theme/useWxlsh.ts', 'export function useWxlsh() {} // Wxlsh title-case identifier\n')
}

function writeConfigWithBase(root: string, basePath: string) {
  writeFileSync(
    join(root, '.vitepress/config.mts'),
    [
      'export default {',
      `  base: '${basePath}',`,
      "  title: 'Web eXploitation Laboratory',",
      '  themeConfig: {',
      "    socialLinks: [{ icon: 'github', link: 'https://github.com/BrowserLaboratory/wxl-template' }],",
      '  },',
      '}',
      '',
    ].join('\n'),
  )
}

const A_ARGS = ['--author', 'me', '--repo', 'me/myfork', '--base', '/myfork/']

describe('parseForkInitArgs', () => {
  it('requires --repo and rejects a malformed owner/repo value', () => {
    expect(() => parseForkInitArgs(['--author', 'me'])).toThrow(ForkInitArgError)
    expect(() => parseForkInitArgs(['--author', 'me', '--repo', 'not-a-slug'])).toThrow(ForkInitArgError)
  })

  it('names the missing flag in the error message (--author / --repo)', () => {
    expect(() => parseForkInitArgs(['--repo', 'me/myfork'])).toThrow(/--author/)
    expect(() => parseForkInitArgs(['--author', 'me'])).toThrow(/--repo/)
  })

  it('parses A-mode flags and defaults dryRun false, rebrand undefined', () => {
    const a = parseForkInitArgs(A_ARGS)
    expect(a.author).toBe('me')
    expect(a.repo).toBe('me/myfork')
    expect(a.base).toBe('/myfork/')
    expect(a.dryRun).toBe(false)
    expect(a.rebrand).toBeUndefined()
  })

  it('--base none marks base for removal, --rebrand selects B mode, --dry-run sets dryRun', () => {
    const a = parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', 'none', '--rebrand', 'acme', '--dry-run'])
    expect(a.base).toBeNull()
    expect(a.rebrand).toBe('acme')
    expect(a.dryRun).toBe(true)
  })

  it('rejects an unsafe --base value (quote or $) that could break out of the config string literal', () => {
    const bad = ["/x'); process.exit(1); ('/", '/a$b/', "/a'/", 'no-leading-slash/']
    for (const b of bad) {
      expect(() => parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', b])).toThrow(ForkInitArgError)
    }
    // a normal path and root and "none" stay accepted
    expect(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', '/ok/']).base).toBe('/ok/')
    expect(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', '/']).base).toBe('/')
  })

  it('rejects a --rebrand name whose uppercased form contains WXL (idempotency guard, case-insensitive)', () => {
    expect(() => parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'fooWXLbar'])).toThrow(ForkInitArgError)
    expect(() => parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'WXL2'])).toThrow(ForkInitArgError)
  })

  it('rejects a --rebrand value with injection-risk characters (quote/$/backtick/space/empty)', () => {
    const bad = ["x'+process.env.SECRET+'", 'a$b', 'a`b`', 'has space', '', 'semi;colon']
    for (const r of bad) {
      expect(() => parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', r])).toThrow(ForkInitArgError)
    }
    // a plain identifier stays accepted
    expect(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme-2.0_x']).rebrand).toBe('acme-2.0_x')
  })
})

describe('runForkInit — A mode (identity, base, URLs, deploy)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fork-init-a-'))
    writeFixture(root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('rewrites package.json identity and leaves no upstream slug', () => {
    const res = runForkInit(parseForkInitArgs(A_ARGS), { projectRoot: root })
    expect(res.exitCode).toBe(0)
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.version).toBe('0.1.0')
    expect(pkg.author).toBe('me')
    expect(pkg.license).toBe('ECL-2.0')
    expect(pkg.repository.url).toBe('git+https://github.com/me/myfork.git')
    expect(pkg.bugs.url).toBe('https://github.com/me/myfork/issues')
    expect(pkg.homepage).toBe('https://github.com/me/myfork#readme')
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    const contrib = readFileSync(join(root, 'CONTRIBUTE.md'), 'utf8')
    const cfg = readFileSync(join(root, '.vitepress/config.mts'), 'utf8')
    // the executable config's socialLinks URL is the one that matters most
    expect(readme + contrib + cfg).not.toContain('BrowserLaboratory/wxl-template')
    expect(readme + contrib + cfg).toContain('me/myfork')
  })

  it('sets base when a path is given and copies the deploy workflow', () => {
    runForkInit(parseForkInitArgs(A_ARGS), { projectRoot: root })
    const cfg = readFileSync(join(root, '.vitepress/config.mts'), 'utf8')
    expect(cfg).toMatch(/base:\s*['"]\/myfork\/['"]/)
    expect(existsSync(join(root, '.github/workflows/deploy.yml'))).toBe(true)
  })

  it('--base none does not declare a base', () => {
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', 'none']), { projectRoot: root })
    const cfg = readFileSync(join(root, '.vitepress/config.mts'), 'utf8')
    expect(cfg).not.toMatch(/base:/)
  })

  it('does not clobber a pre-existing deploy.yml with different content; warns instead', () => {
    mkdirSync(join(root, '.github/workflows'), { recursive: true })
    writeFileSync(join(root, '.github/workflows/deploy.yml'), 'name: MyCustomDeploy\n')
    const res = runForkInit(parseForkInitArgs(A_ARGS), { projectRoot: root })
    expect(readFileSync(join(root, '.github/workflows/deploy.yml'), 'utf8')).toBe('name: MyCustomDeploy\n')
    expect(res.warnings.some((w) => w.includes('deploy.yml'))).toBe(true)
  })

  it('replaces an existing base line exactly (H1 replacer branch), $-safe', () => {
    writeConfigWithBase(root, '/wxl-template/')
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', '/a-b_c/']), { projectRoot: root })
    const cfg = readFileSync(join(root, '.vitepress/config.mts'), 'utf8')
    expect(cfg).toMatch(/base:\s*'\/a-b_c\/'/)
    expect(cfg).not.toContain('/wxl-template/')
    expect(cfg).toContain("title: 'Web eXploitation Laboratory'") // untouched
  })

  it('--base none strips an existing base line, leaving the rest intact', () => {
    writeConfigWithBase(root, '/wxl-template/')
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--base', 'none']), { projectRoot: root })
    const cfg = readFileSync(join(root, '.vitepress/config.mts'), 'utf8')
    expect(cfg).not.toMatch(/base:/)
    expect(cfg).toContain('title:')
    expect(cfg).toContain('themeConfig')
  })

  it('sets package.json description only when --description is given', () => {
    runForkInit(parseForkInitArgs([...A_ARGS, '--description', 'My CTF platform']), { projectRoot: root })
    expect(JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).description).toBe('My CTF platform')
    // fresh fixture, no --description -> unchanged from fixture
    const root2 = mkdtempSync(join(tmpdir(), 'fork-init-desc-'))
    writeFixture(root2)
    runForkInit(parseForkInitArgs(A_ARGS), { projectRoot: root2 })
    expect(JSON.parse(readFileSync(join(root2, 'package.json'), 'utf8')).description).toBe('Web eXploitation Laboratory — powered by WASM')
    rmSync(root2, { recursive: true, force: true })
  })
})

describe('runForkInit — B mode (rebrand + sensitive keys)', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fork-init-b-'))
    writeFixture(root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('renames the four runtime-sensitive keys and reports each', () => {
    const res = runForkInit(
      parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme']),
      { projectRoot: root },
    )
    expect(res.exitCode).toBe(0)
    expect(readFileSync(join(root, '.vitepress/theme/i18n/index.ts'), 'utf8')).toContain('acme-locale')
    expect(readFileSync(join(root, 'scripts/challenge-verify-blind.ts'), 'utf8')).toContain('ACME_VERIFY_RUNTIME')
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('tmp/acme-verify')
    expect(readFileSync(join(root, '.github/workflows/release.yml'), 'utf8')).toContain('acme-${GITHUB_REF_NAME}')
    const reported = res.sensitiveKeys.map((k) => k.key).sort()
    expect(reported).toEqual(['WXL_VERIFY_RUNTIME', 'release-asset', 'tmp/wxl-verify', 'wxl-locale'].sort())
  })

  it('never touches excluded paths (lockfile, archive, .agent + host skills, and its own source)', () => {
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme']), { projectRoot: root })
    expect(readFileSync(join(root, 'pnpm-lock.yaml'), 'utf8')).toContain('wxl: 1.0.0')
    expect(readFileSync(join(root, 'openspec/changes/archive/2026-01-01-old/proposal.md'), 'utf8')).toContain('wxl reference')
    // .agent skill identifiers are structural — must remain wxl-* so paths still resolve
    expect(readFileSync(join(root, '.agent/skills/wxl-create/SKILL.md'), 'utf8')).toContain('wxl-create')
    // host thin pointers must keep pointing at the un-renamed .agent/skills/wxl-* paths
    expect(readFileSync(join(root, '.claude/skills/wxl-create/SKILL.md'), 'utf8')).toContain('.agent/skills/wxl-create/SKILL.md')
    // the tool's own source keeps its literal probes intact
    expect(readFileSync(join(root, 'scripts/fork-init.ts'), 'utf8')).toContain('wxl-locale')
  })

  it('protects a --repo/--author that legitimately contains "wxl" from the rename', () => {
    const res = runForkInit(
      parseForkInitArgs(['--author', 'wxlfan', '--repo', 'myorg/wxl-ctf', '--rebrand', 'acme']),
      { projectRoot: root },
    )
    const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.repository.url).toBe('git+https://github.com/myorg/wxl-ctf.git')
    expect(pkg.author).toBe('wxlfan')
    expect(readFileSync(join(root, 'README.md'), 'utf8')).toContain('myorg/wxl-ctf')
    // the protected identity is not counted as a residual it can't fix
    expect(res.exitCode).toBe(0)
  })

  it('applies A-mode identity in rebrand mode (name from --rebrand, --name wins)', () => {
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme']), { projectRoot: root })
    let pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('acme')
    expect(pkg.version).toBe('0.1.0')
    expect(pkg.repository.url).toContain('me/myfork')
    // --name overrides the rebrand-derived name
    const root2 = mkdtempSync(join(tmpdir(), 'fork-init-name-'))
    writeFixture(root2)
    runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme', '--name', 'pkg-x']), { projectRoot: root2 })
    pkg = JSON.parse(readFileSync(join(root2, 'package.json'), 'utf8'))
    expect(pkg.name).toBe('pkg-x')
    rmSync(root2, { recursive: true, force: true })
  })

  it('reports Title-case residuals the exact-case rename cannot cover (e.g. Wxlsh)', () => {
    const res = runForkInit(parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme']), { projectRoot: root })
    // the Title-case file is left as-is (not exact-case wxl/WXL) ...
    expect(readFileSync(join(root, '.vitepress/theme/useWxlsh.ts'), 'utf8')).toContain('useWxlsh')
    // ... but surfaced in the residual report so the user finishes manually
    expect(res.residualFiles).toContain('.vitepress/theme/useWxlsh.ts')
    expect(res.warnings.some((w) => /case-insensitive "wxl"/.test(w))).toBe(true)
  })

  it('is idempotent: a second run finds nothing left to rename', () => {
    const args = parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme'])
    runForkInit(args, { projectRoot: root })
    const second = runForkInit(args, { projectRoot: root })
    // no wxl short-name remains, so no active file (outside exclusions) still contains it
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).not.toContain('wxl-verify')
    expect(readFileSync(join(root, '.vitepress/theme/i18n/index.ts'), 'utf8')).not.toContain('acacmeme')
    expect(second.changedFiles.length).toBe(0)
  })
})

describe('wxl-fork-init skill is script-driven and host-agent-neutral', () => {
  const repoRoot = process.cwd()

  it('SKILL.md invokes pnpm fork:init and contains no host-agent-specific primitives', () => {
    const skill = readFileSync(join(repoRoot, '.agent/skills/wxl-fork-init/SKILL.md'), 'utf8')
    expect(skill).toContain('pnpm fork:init')
    expect(skill).not.toMatch(/AskUserQuestion|EnterPlanMode|ExitPlanMode|TaskCreate|TaskUpdate|subagent_type/)
  })
})

describe('runForkInit — dry-run writes nothing', () => {
  let root: string
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'fork-init-dry-'))
    writeFixture(root)
  })
  afterEach(() => rmSync(root, { recursive: true, force: true }))

  it('previews edits but leaves every file unchanged and creates no deploy.yml', () => {
    const before = readFileSync(join(root, 'package.json'), 'utf8')
    const res = runForkInit(
      parseForkInitArgs(['--author', 'me', '--repo', 'me/myfork', '--rebrand', 'acme', '--dry-run']),
      { projectRoot: root },
    )
    expect(res.exitCode).toBe(0)
    expect(res.changedFiles.length).toBeGreaterThan(0) // planned edits reported
    expect(readFileSync(join(root, 'package.json'), 'utf8')).toBe(before)
    expect(existsSync(join(root, '.github/workflows/deploy.yml'))).toBe(false)
    expect(readFileSync(join(root, '.gitignore'), 'utf8')).toContain('tmp/wxl-verify')
  })
})
