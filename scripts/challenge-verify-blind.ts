/**
 * challenge-verify-blind.ts
 *
 * L4 blind-solve sub-routine. Driven from challenge-verify.ts (via --blind)
 * or invoked standalone via `pnpm challenge:verify:blind <slug>`.
 *
 * Exit codes:
 *   0  agent extracted a flag that byte-matches docs/challenge/<slug>/src/flag.txt
 *   1  agent extracted a flag but it does not match (regex or byte)
 *   2  inconclusive: no FINAL_FLAG line, INCONCLUSIVE sentinel, dev server down,
 *      spawn error, or runtime CLI not on PATH
 */

import {
  existsSync,
  mkdirSync,
  rmSync,
} from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildPlayerPackage,
  type PlayerPackageMeta,
} from './wxl-solver/build-player-package.ts'
import {
  resolveRuntime,
  spawnRuntime,
  type RuntimeName,
  type SpawnRuntimeResult,
  UnknownRuntimeError,
} from './wxl-solver/spawn-runtime.ts'
import {
  extractFinalFlag,
  compareToCanonical,
  readCanonicalFlag,
  type Verdict,
} from './wxl-solver/extract-flag.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const PROJECT_ROOT = resolve(__dirname, '..')

export const DEFAULT_TURN_BUDGET = 30
export const DEFAULT_FLAG_REGEX = '^(FLAG|CTF)\\{[^}]+\\}$'
export const DEFAULT_BASE_URL_TEMPLATE = (slug: string) =>
  `http://localhost:5173/challenge/${slug}/`

/**
 * Prompt template fed to the spawned agent. Five mandatory substrings appear
 * verbatim so the prompt unit test (task 5.7) can grep for them:
 *   - Target
 *   - Description
 *   - Flag format
 *   - chrome-devtools-mcp
 *   - FINAL_FLAG=
 *
 * Plus the fabrication prohibition sentence (`Do not hallucinate flags.`).
 */
export function buildPrompt(meta: PlayerPackageMeta, description: string): string {
  return [
    'You are a CTF challenge solver.',
    `Target: ${meta.base_url}`,
    `Description: ${description.trim()}`,
    `Flag format: ${meta.flag_regex}`,
    'Tools available: chrome-devtools-mcp.',
    `Solve the challenge and output exactly one line: FINAL_FLAG=<value> at the end of your response.`,
    'Do not hallucinate flags.',
    `If you cannot solve within ${meta.turn_budget} turns, output FINAL_FLAG=INCONCLUSIVE.`,
  ].join('\n')
}

export interface BlindVerifyArgs {
  slug: string
  projectRoot?: string
  runtime?: RuntimeName
  turnBudget?: number
  flagRegex?: string
  baseUrl?: string
  /** Override fetch used for the dev-server pre-flight probe. */
  preflight?: (url: string) => Promise<boolean>
  /** Override spawn for the agent CLI (used in unit tests). */
  spawn?: (cmd: string, args: string[]) => {
    status: number | null
    stdout: string | Buffer
    stderr: string | Buffer
    error?: Error
  }
  /** Override workDir root (default: tmp/wxl-verify/<slug>/). */
  workDirRoot?: string
}

export interface BlindVerifyResult {
  exitCode: number
  verdict: Verdict
  reason: string
  runtime: RuntimeName
}

async function defaultPreflight(url: string): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const to = setTimeout(() => ctrl.abort(), 2000)
    // node 18+ has global fetch
    const res = await fetch(url, { signal: ctrl.signal })
    clearTimeout(to)
    return res.ok || res.status < 500
  } catch {
    return false
  }
}

export async function verifyBlind(args: BlindVerifyArgs): Promise<BlindVerifyResult> {
  const projectRoot = args.projectRoot ?? PROJECT_ROOT
  const runtime = args.runtime ?? resolveRuntime(process.env.WXL_VERIFY_RUNTIME)
  const turnBudget = args.turnBudget ?? DEFAULT_TURN_BUDGET
  const flagRegex = args.flagRegex ?? DEFAULT_FLAG_REGEX
  const baseUrl = args.baseUrl ?? DEFAULT_BASE_URL_TEMPLATE(args.slug)
  const workDir = args.workDirRoot ?? resolve(projectRoot, 'tmp', 'wxl-verify', args.slug)

  // Pre-flight: dev server reachable?
  const preflight = args.preflight ?? defaultPreflight
  const reachable = await preflight(baseUrl)
  if (!reachable) {
    return {
      exitCode: 2,
      verdict: 'inconclusive',
      reason: `dev server not reachable at ${baseUrl}; start pnpm docs:dev before running --blind`,
      runtime,
    }
  }

  // Build player package
  mkdirSync(workDir, { recursive: true })
  const verificationRunId = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const meta: PlayerPackageMeta = {
    base_url: baseUrl,
    flag_regex: flagRegex,
    turn_budget: turnBudget,
    verification_run_id: verificationRunId,
  }
  let descriptionMd: string
  try {
    const pkg = buildPlayerPackage({ slug: args.slug, projectRoot, workDir, meta })
    const { readFileSync } = await import('node:fs')
    descriptionMd = readFileSync(pkg.descriptionPath, 'utf8')
  } catch (err) {
    await cleanupQuietly(workDir)
    return {
      exitCode: 2,
      verdict: 'inconclusive',
      reason: `player-package build failed: ${(err as Error).message}`,
      runtime,
    }
  }

  // Spawn runtime — auto-detect project-local .mcp.json so the spawned
  // non-interactive CLI (which does NOT inherit interactive MCP servers)
  // can still drive chrome-devtools-mcp for L4 solves.
  const localMcpConfig = resolve(projectRoot, '.mcp.json')
  const mcpConfigPath = existsSync(localMcpConfig) ? localMcpConfig : undefined
  const prompt = buildPrompt(meta, descriptionMd)
  let spawnResult: SpawnRuntimeResult
  try {
    spawnResult = spawnRuntime(
      { runtime, prompt, workDir, turnBudget, mcpConfigPath },
      args.spawn ? { spawn: (cmd, a) => {
        const r = args.spawn!(cmd, a)
        return {
          pid: -1,
          output: [null, r.stdout, r.stderr],
          stdout: typeof r.stdout === 'string' ? r.stdout : String(r.stdout ?? ''),
          stderr: typeof r.stderr === 'string' ? r.stderr : String(r.stderr ?? ''),
          status: r.status,
          signal: null,
          error: r.error,
        }
      } } : {},
    )
  } catch (err) {
    await cleanupQuietly(workDir)
    if (err instanceof UnknownRuntimeError) {
      return { exitCode: 2, verdict: 'inconclusive', reason: err.message, runtime }
    }
    return { exitCode: 2, verdict: 'inconclusive', reason: (err as Error).message, runtime }
  }

  if (spawnResult.error) {
    const msg = spawnResult.error.message.includes('ENOENT')
      ? `runtime ${runtime} CLI not found on PATH`
      : `spawn error: ${spawnResult.error.message}`
    await cleanupQuietly(workDir)
    return { exitCode: 2, verdict: 'inconclusive', reason: msg, runtime }
  }

  // Extract + compare
  const extracted = extractFinalFlag(spawnResult.stdout)
  let canonical: string
  try {
    canonical = readCanonicalFlag(projectRoot, args.slug)
  } catch (err) {
    await cleanupQuietly(workDir)
    return { exitCode: 2, verdict: 'inconclusive', reason: (err as Error).message, runtime }
  }

  const compare = compareToCanonical(extracted, canonical, new RegExp(flagRegex))

  await cleanupQuietly(workDir)

  const exitCode = compare.verdict === 'pass' ? 0 : compare.verdict === 'fail' ? 1 : 2
  return { exitCode, verdict: compare.verdict, reason: compare.reason, runtime }
}

async function cleanupQuietly(workDir: string): Promise<void> {
  // Debug aid: `WXL_VERIFY_KEEP_ARTEFACTS=1` skips cleanup so maintainers can
  // inspect `tmp/wxl-verify/<slug>/run.log`. Default behaviour (Decision 6)
  // is best-effort removal — failures warn but never change the exit code.
  if (process.env.WXL_VERIFY_KEEP_ARTEFACTS === '1') {
    process.stderr.write(`debug: WXL_VERIFY_KEEP_ARTEFACTS=1 — leaving ${workDir} in place\n`)
    return
  }
  try {
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true })
    }
  } catch (err) {
    process.stderr.write(`warning: failed to remove ${workDir}: ${(err as Error).message}\n`)
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: pnpm challenge:verify:blind <slug>')
    process.exit(2)
  }

  const result = await verifyBlind({ slug })
  const last = result.verdict === 'pass'
    ? `verified-blind: ${slug} (runtime=${result.runtime})`
    : result.verdict === 'fail'
      ? `failed-blind: ${slug} — ${result.reason}`
      : `inconclusive-blind: ${slug} — ${result.reason}`
  process.stdout.write(last + '\n')
  process.exit(result.exitCode)
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('challenge-verify-blind.ts')

if (isMainModule) {
  void main()
}
