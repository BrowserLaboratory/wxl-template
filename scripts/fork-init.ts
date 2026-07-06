/**
 * fork-init.ts
 *
 * Deterministic edits to fork this template repo into a new project.
 * The wxl-fork-init skill calls this CLI instead of hand-editing files.
 *
 * Usage:
 *   pnpm fork:init --author <name> --repo <owner/repo>
 *                  [--base <path> | --base none]
 *                  [--name <pkg-name>] [--description <text>]
 *                  [--rebrand <newshortname>] [--dry-run]
 *
 * Modes:
 *   A (default)          minimal fork: identity fields, base, GitHub URLs, deploy workflow.
 *   B (--rebrand <name>) A + classified `wxl` short-name rename with runtime-sensitive-key report.
 *
 * Exit codes:
 *   0  success
 *   1  user input error (missing/invalid flag)
 */

import { parseArgs } from 'node:util'
import {
  existsSync,
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
} from 'node:fs'
import { dirname, resolve, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const PROJECT_ROOT = resolve(__dirname, '..')

// ─── args ────────────────────────────────────────────────────────────────────

export interface ForkInitArgs {
  author: string
  repo: string
  /** undefined = leave as-is; null = remove (--base none); string = set to this path */
  base?: string | null
  name?: string
  description?: string
  /** present => rebrand (B) mode */
  rebrand?: string
  dryRun: boolean
}

export class ForkInitArgError extends Error {
  constructor(
    message: string,
    public readonly exitCode: number = 1,
  ) {
    super(message)
    this.name = 'ForkInitArgError'
  }
}

const REPO_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/
// A safe VitePress base: absolute, slash-separated, only URL-path-safe chars.
// Rejects quotes and `$` so the value cannot break out of the generated string
// literal in .vitepress/config.mts (an executable TS module).
const BASE_RE = /^\/([A-Za-z0-9._~-]+\/)*$/

export function parseForkInitArgs(argv: string[]): ForkInitArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      author: { type: 'string' },
      repo: { type: 'string' },
      base: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      rebrand: { type: 'string' },
      'dry-run': { type: 'boolean', default: false },
    },
  })

  if (!values.author) throw new ForkInitArgError('missing required flag: --author <name>')
  if (!values.repo) throw new ForkInitArgError('missing required flag: --repo <owner/repo>')
  if (!REPO_RE.test(values.repo)) {
    throw new ForkInitArgError(`--repo must be in owner/repo form, got: ${values.repo}`)
  }
  if (values.rebrand && values.rebrand.toLowerCase().includes('wxl')) {
    throw new ForkInitArgError('--rebrand name must not contain "wxl" (case-insensitive; would reintroduce the token and break idempotent rename)')
  }

  let base: string | null | undefined
  if (values.base === undefined) base = undefined
  else if (values.base === 'none') base = null
  else {
    if (!BASE_RE.test(values.base)) {
      throw new ForkInitArgError(
        `--base must be an absolute URL path like /myfork/ (letters, digits, . _ ~ - and slashes), or "none"; got: ${values.base}`,
      )
    }
    base = values.base
  }

  return {
    author: values.author,
    repo: values.repo,
    base,
    name: values.name,
    description: values.description,
    rebrand: values.rebrand,
    dryRun: values['dry-run'] ?? false,
  }
}

// ─── result ──────────────────────────────────────────────────────────────────

export interface SensitiveKeyEdit {
  key: string
  files: string[]
}

export interface ForkInitResult {
  exitCode: number
  message: string
  changedFiles: string[]
  sensitiveKeys: SensitiveKeyEdit[]
  /** Files that still contain a case-insensitive `wxl` the exact-case rename did not cover. */
  residualFiles: string[]
  warnings: string[]
}

const UPSTREAM_SLUG = 'BrowserLaboratory/wxl-template'

// Directories/files never touched by the rebrand rename.
// `.agent` and the host-config dirs `.claude`/`.codex`/`.gemini` are excluded because
// skill identifiers (e.g. `wxl-create`) are structural: they name directories under
// `.agent` and the host thin pointers reference those exact paths, so a content-only
// rename would break them without a coordinated path rename (out of scope; see warning).
const EXCLUDED_DIRS = new Set(['.git', 'node_modules', '.agent', '.claude', '.codex', '.gemini'])
const EXCLUDED_FILE = new Set(['pnpm-lock.yaml', 'pnpm-lock.yml'])
const EXCLUDED_PATH_FRAGMENT = join('openspec', 'changes', 'archive')
// This tool's own source must not be rewritten — it needs the literal `wxl`/`WXL`
// probes to keep detecting sensitive keys on subsequent runs.
const SELF_EXCLUDE = new Set([join('scripts', 'fork-init.ts')])

// Runtime-sensitive keys: (report label -> substring that identifies it in original content).
const SENSITIVE_KEYS: ReadonlyArray<{ key: string; probe: RegExp }> = [
  { key: 'wxl-locale', probe: /wxl-locale/ },
  { key: 'WXL_VERIFY_RUNTIME', probe: /WXL_VERIFY_RUNTIME/ },
  { key: 'tmp/wxl-verify', probe: /tmp\/wxl-verify/ },
  { key: 'release-asset', probe: /wxl-\$\{/ },
]

// ─── core ────────────────────────────────────────────────────────────────────

export function runForkInit(
  args: ForkInitArgs,
  opts: { projectRoot: string },
): ForkInitResult {
  const root = opts.projectRoot
  const changedFiles: string[] = []
  const warnings: string[] = []
  const sensitiveMap = new Map<string, Set<string>>()

  const abs = (rel: string) => join(root, rel)
  const readIf = (rel: string): string | null =>
    existsSync(abs(rel)) ? readFileSync(abs(rel), 'utf8') : null

  const applyEdit = (rel: string, next: string, prev: string) => {
    if (next === prev) return
    changedFiles.push(rel)
    if (!args.dryRun) writeFileSync(abs(rel), next)
  }

  // ── A-mode: package.json identity ──
  const pkgRaw = readIf('package.json')
  if (pkgRaw) {
    const pkg = JSON.parse(pkgRaw)
    pkg.version = '0.1.0'
    pkg.author = args.author
    pkg.repository = { ...(pkg.repository ?? {}), type: 'git', url: `git+https://github.com/${args.repo}.git` }
    pkg.bugs = { ...(pkg.bugs ?? {}), url: `https://github.com/${args.repo}/issues` }
    pkg.homepage = `https://github.com/${args.repo}#readme`
    pkg.license = 'ECL-2.0'
    if (args.rebrand) pkg.name = args.name ?? args.rebrand
    else if (args.name) pkg.name = args.name
    if (args.description) pkg.description = args.description
    applyEdit('package.json', JSON.stringify(pkg, null, 2) + '\n', pkgRaw)
  }

  // ── A-mode: VitePress base + GitHub URL swap ──
  const cfgRaw = readIf('.vitepress/config.mts')
  if (cfgRaw) {
    let cfg = cfgRaw.split(UPSTREAM_SLUG).join(args.repo)
    cfg = setViteBase(cfg, args.base)
    applyEdit('.vitepress/config.mts', cfg, cfgRaw)
  }

  // ── A-mode: README / CONTRIBUTE GitHub URLs ──
  for (const rel of ['README.md', 'CONTRIBUTE.md']) {
    const raw = readIf(rel)
    if (raw) applyEdit(rel, raw.split(UPSTREAM_SLUG).join(args.repo), raw)
  }

  // ── A-mode: copy deploy workflow (idempotent, never clobbers a customized one) ──
  const tmplRaw = readIf('.agent/skills/wxl-fork-init/deploy.yml.template')
  if (tmplRaw) {
    const target = '.github/workflows/deploy.yml'
    const existing = readIf(target)
    if (existing === null) {
      changedFiles.push(target)
      if (!args.dryRun) {
        mkdirSync(dirname(abs(target)), { recursive: true })
        writeFileSync(abs(target), tmplRaw)
      }
    } else if (existing !== tmplRaw) {
      warnings.push(
        `${target} already exists with different content — left untouched; merge the deploy workflow manually if needed.`,
      )
    }
  }

  // ── B-mode: classified rebrand rename ──
  const residualFiles: string[] = []
  if (args.rebrand) {
    const lower = args.rebrand
    const upper = args.rebrand.toUpperCase()
    // Protect user-supplied identity that legitimately contains "wxl" (e.g. a fork
    // named owner/wxl-ctf) so the blind rename does not corrupt the repo/author.
    const protectedStrings = [args.repo, args.author].filter((s) => /wxl/i.test(s))
    const files = walkTextFiles(root)
    for (const rel of files) {
      const raw = readFileSync(abs(rel), 'utf8')
      for (const { key, probe } of SENSITIVE_KEYS) {
        if (probe.test(raw)) {
          if (!sensitiveMap.has(key)) sensitiveMap.set(key, new Set())
          sensitiveMap.get(key)!.add(rel)
        }
      }
      // Sentinel token contains no `wxl`/`WXL` (else the rename would mangle it) and
      // is vanishingly unlikely to appear in source.
      const sentinels = protectedStrings.map((s, i) => ({ s, token: `__FORKINIT_KEEP_${i}__` }))
      let work = raw
      for (const { s, token } of sentinels) work = work.split(s).join(token)
      work = work.split('wxl').join(lower).split('WXL').join(upper)
      for (const { s, token } of sentinels) work = work.split(token).join(s)
      applyEdit(rel, work, raw)
      // Residual scan: only exact-case `wxl`/`WXL` are auto-renamed. Surface every
      // remaining case-insensitive `wxl` (Title-case compounds like Wxlsh, path-
      // referencing dirs like chall-wasm/wxlsh-parser) so the user finishes manually.
      let resCheck = work
      for (const { s } of sentinels) resCheck = resCheck.split(s).join('')
      if (/wxl/i.test(resCheck)) residualFiles.push(rel)
    }
    warnings.push(
      'Rebrand renames only exact-case "wxl"/"WXL". It skips .agent/.claude/.codex/.gemini (structural skill identifiers) and this tool\'s own source. Directory/path names (e.g. chall-wasm/wxlsh-parser) are NOT auto-renamed — the build will not run until you rename those dirs, and Title-case tokens (Wxlsh, X-Wxlsh-*) need a manual pass.',
    )
    if (residualFiles.length) {
      warnings.push(
        `${residualFiles.length} file(s) still contain a case-insensitive "wxl" — run \`git grep -i wxl\` and finish the rebrand manually.`,
      )
    }
  }

  const sensitiveKeys: SensitiveKeyEdit[] = [...sensitiveMap.entries()].map(([key, files]) => ({
    key,
    files: [...files].sort(),
  }))

  // de-dupe changedFiles (a file may be edited by both A and B stages)
  const uniqueChanged = [...new Set(changedFiles)]

  return {
    exitCode: 0,
    message: args.dryRun
      ? `dry-run: ${uniqueChanged.length} file(s) would change`
      : `fork:init done — ${uniqueChanged.length} file(s) changed`,
    changedFiles: uniqueChanged,
    sensitiveKeys,
    residualFiles,
    warnings,
  }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

/** Set, replace, or remove the VitePress `base` declaration. */
function setViteBase(cfg: string, base: string | null | undefined): string {
  if (base === undefined) return cfg
  const lines = cfg.split('\n')
  const baseIdx = lines.findIndex((l) => /^\s*base:\s*/.test(l))
  if (base === null) {
    return baseIdx >= 0 ? lines.filter((_, i) => i !== baseIdx).join('\n') : cfg
  }
  if (baseIdx >= 0) {
    // function replacer so any `$` in `base` is never reinterpreted by String.replace
    lines[baseIdx] = lines[baseIdx].replace(/base:\s*['"][^'"]*['"]/, () => `base: '${base}'`)
    return lines.join('\n')
  }
  // insert before the first `title:` line, matching its indentation
  const titleIdx = lines.findIndex((l) => /^\s*title:\s*/.test(l))
  const anchor = titleIdx >= 0 ? titleIdx : 1
  const indent = lines[anchor]?.match(/^\s*/)?.[0] ?? '  '
  lines.splice(anchor, 0, `${indent}base: '${base}',`)
  return lines.join('\n')
}

/** Recursively list repo-relative text files eligible for the rebrand rename. */
function walkTextFiles(root: string, rel = ''): string[] {
  const out: string[] = []
  for (const entry of readdirSync(join(root, rel), { withFileTypes: true })) {
    const childRel = rel ? join(rel, entry.name) : entry.name
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue
      if (childRel.startsWith(EXCLUDED_PATH_FRAGMENT)) continue
      out.push(...walkTextFiles(root, childRel))
    } else if (entry.isFile()) {
      if (EXCLUDED_FILE.has(entry.name)) continue
      if (SELF_EXCLUDE.has(childRel)) continue
      if (childRel.startsWith(EXCLUDED_PATH_FRAGMENT)) continue
      // skip binary-looking files (null byte in first chunk)
      const buf = readFileSync(join(root, childRel))
      if (buf.includes(0)) continue
      out.push(childRel)
    }
  }
  return out
}

// ─── CLI entry ───────────────────────────────────────────────────────────────

function main() {
  let args: ForkInitArgs
  try {
    args = parseForkInitArgs(process.argv.slice(2))
  } catch (err) {
    if (err instanceof ForkInitArgError) {
      console.error(`✗ ${err.message}`)
      process.exit(err.exitCode)
    }
    throw err
  }

  const result = runForkInit(args, { projectRoot: PROJECT_ROOT })
  console.log(result.message)
  if (result.changedFiles.length) {
    console.log('\nChanged files:')
    for (const f of result.changedFiles) console.log(`  ${f}`)
  }
  if (result.sensitiveKeys.length) {
    console.log('\n[!] Runtime-sensitive keys renamed (verify storage/env/release impact):')
    for (const k of result.sensitiveKeys) console.log(`  ${k.key} -> in ${k.files.join(', ')}`)
  }
  if (result.residualFiles.length) {
    console.log(`\n[!] ${result.residualFiles.length} file(s) still contain a case-insensitive "wxl" (finish manually):`)
    for (const f of result.residualFiles) console.log(`  ${f}`)
  }
  for (const w of result.warnings) console.log(`\n[i] ${w}`)
  process.exit(result.exitCode)
}

if (process.argv[1] && resolve(process.argv[1]) === __filename) {
  main()
}
