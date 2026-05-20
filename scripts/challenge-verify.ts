/**
 * challenge-verify.ts
 *
 * Layered release-blocking gate for a wxl challenge.
 *
 * Layers:
 *   L1  structure + frontmatter lint (delegates to validateChallenge())
 *   L2  content analysis + keygen + wasm-tools validate
 *   L3  Playwright e2e via tests/challenges/<slug>.spec.ts
 *   L4  blind solve via scripts/challenge-verify-blind.ts (opt-in, --blind)
 *
 * Usage:
 *   pnpm challenge:verify <slug> [--blind] [--layers L1,L2,L3,L4] [--json]
 *
 * Exit codes:
 *   0  every requested layer passed
 *   1  at least one layer failed
 *   2  L4 inconclusive (run succeeded but no verdict — no other failure)
 */

import { parseArgs } from 'node:util'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync, type SpawnSyncOptions } from 'node:child_process'
import { validateChallenge as l1Validate } from './challenge-validate.ts'
import {
  analyzeChallenge,
  validateChallenge as analyzeValidate,
  discoverChallenges as discoverForAnalyze,
} from './challenge-analyze.ts'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export const PROJECT_ROOT = resolve(__dirname, '..')

export type LayerName = 'L1' | 'L2' | 'L3' | 'L4'
export const ALL_LAYERS: readonly LayerName[] = ['L1', 'L2', 'L3', 'L4']

export type LayerStatus = 'pass' | 'fail' | 'inconclusive' | 'skip'

export interface LayerOutcome {
  layer: LayerName
  status: LayerStatus
  reason: string | null
}

export interface VerifyArgs {
  slug: string
  blind: boolean
  layers?: LayerName[]
  json: boolean
}

export interface VerifyResult {
  slug: string
  layersRun: LayerName[]
  results: LayerOutcome[]
  summary: 'verified' | 'failed' | 'inconclusive'
  failedAt: LayerName | null
  exitCode: number
}

export interface VerifyJsonOutput {
  slug: string
  layers_run: LayerName[]
  results: { layer: LayerName; status: LayerStatus; reason: string | null }[]
  summary: 'verified' | 'failed' | 'inconclusive'
  failed_at: LayerName | null
}

export class VerifyArgError extends Error {
  constructor(message: string, public readonly exitCode: number = 1) {
    super(message)
    this.name = 'VerifyArgError'
  }
}

// ─── CLI parsing ────────────────────────────────────────────────────────────

export function parseVerifyArgs(argv: string[]): VerifyArgs {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      blind: { type: 'boolean', default: false },
      layers: { type: 'string' },
      json: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  })

  if (values.help) {
    throw new VerifyArgError(formatHelp(), 0)
  }

  const slug = positionals[0]
  if (!slug) {
    throw new VerifyArgError('Missing <slug>.\n' + formatHelp(), 1)
  }

  let layers: LayerName[] | undefined
  if (values.layers !== undefined) {
    layers = values.layers
      .split(',')
      .map((l) => l.trim().toUpperCase())
      .filter((l) => l.length > 0) as LayerName[]
    for (const l of layers) {
      if (!(ALL_LAYERS as readonly string[]).includes(l)) {
        throw new VerifyArgError(
          `Invalid --layers entry "${l}". Accepted: ${ALL_LAYERS.join(', ')}.`,
          1,
        )
      }
    }
  }

  return {
    slug,
    blind: values.blind === true,
    layers,
    json: values.json === true,
  }
}

function formatHelp(): string {
  return [
    'Usage: pnpm challenge:verify <slug> [flags]',
    '',
    'Flags:',
    '  --blind                            Include the L4 blind-solve gate',
    '  --layers L1,L2,L3,L4               Run only the listed subset (debug)',
    '  --json                             Emit a single JSON object instead of human stdout',
    '  -h, --help                         Show this help',
    '',
    'Exit codes: 0 verified | 1 at least one layer failed | 2 L4 inconclusive',
  ].join('\n')
}

// ─── Layer selection ────────────────────────────────────────────────────────

export function selectLayers(args: VerifyArgs): LayerName[] {
  if (args.layers !== undefined) {
    // Preserve user-specified order (debug-friendly).
    return args.layers
  }
  return args.blind ? ['L1', 'L2', 'L3', 'L4'] : ['L1', 'L2', 'L3']
}

// ─── Default layer runners ──────────────────────────────────────────────────

export interface LayerRunners {
  L1: (slug: string) => Promise<LayerOutcome>
  L2: (slug: string) => Promise<LayerOutcome>
  L3: (slug: string) => Promise<LayerOutcome>
  L4: (slug: string) => Promise<LayerOutcome>
}

interface DefaultRunnerDeps {
  projectRoot: string
  spawn: (cmd: string, args: string[], opts?: SpawnSyncOptions) => {
    status: number | null
    stdout: string | Buffer
    stderr: string | Buffer
    error?: Error
  }
}

export function makeDefaultRunners(deps: Partial<DefaultRunnerDeps> = {}): LayerRunners {
  const projectRoot = deps.projectRoot ?? PROJECT_ROOT
  const spawn = deps.spawn ?? ((cmd, args, opts) => spawnSync(cmd, args, { encoding: 'utf8', ...opts }))

  return {
    L1: async (slug) => {
      const indexPath = resolve(projectRoot, 'docs', 'challenge', slug, 'index.md')
      if (!existsSync(indexPath)) {
        return { layer: 'L1', status: 'fail', reason: `index.md not found: ${indexPath}` }
      }
      const result = l1Validate(indexPath)
      if (result.allPassed) return { layer: 'L1', status: 'pass', reason: null }
      const failedLabels = result.checks.filter((c) => !c.passed).map((c) => c.label).join(', ')
      return { layer: 'L1', status: 'fail', reason: `validate failed: ${failedLabels}` }
    },

    L2: async (slug) => {
      const indexPath = resolve(projectRoot, 'docs', 'challenge', slug, 'index.md')
      if (!existsSync(indexPath)) {
        return { layer: 'L2', status: 'fail', reason: `index.md not found: ${indexPath}` }
      }
      const challenges = discoverForAnalyze(resolve(projectRoot, 'docs', 'challenge'), slug)
      if (challenges.length === 0) {
        return { layer: 'L2', status: 'fail', reason: `analyze could not discover slug ${slug}` }
      }
      // Content checks (flag format, localhost grep, etc.) — fail L2 on any error.
      const contentErrors = analyzeValidate(challenges[0])
      if (contentErrors.length > 0) {
        return { layer: 'L2', status: 'fail', reason: `analyze errors: ${contentErrors.join('; ')}` }
      }
      // analysis result is recorded but warnings alone do not fail L2 — the legacy
      // pnpm challenge:analyze surfaces them informationally.
      analyzeChallenge(challenges[0])

      // Keygen
      const keygen = spawn('pnpm', ['challenge:keygen', slug], { cwd: projectRoot, encoding: 'utf8' })
      if (keygen.error) {
        return { layer: 'L2', status: 'fail', reason: `keygen spawn error: ${keygen.error.message}` }
      }
      if ((keygen.status ?? 1) !== 0) {
        return { layer: 'L2', status: 'fail', reason: `keygen exit ${keygen.status}: ${String(keygen.stderr).trim()}` }
      }

      // wasm-tools validate — keygen writes to docs/public/challenge/<slug>/runtime.wasm
      const wasmPath = resolve(projectRoot, 'docs', 'public', 'challenge', slug, 'runtime.wasm')
      if (!existsSync(wasmPath)) {
        return { layer: 'L2', status: 'fail', reason: `runtime.wasm not produced at ${wasmPath}` }
      }
      const wasmTools = spawn('wasm-tools', ['validate', wasmPath], { cwd: projectRoot, encoding: 'utf8' })
      if (wasmTools.error) {
        return { layer: 'L2', status: 'fail', reason: `wasm-tools spawn error: ${wasmTools.error.message}` }
      }
      if ((wasmTools.status ?? 1) !== 0) {
        return { layer: 'L2', status: 'fail', reason: `wasm-tools validate exit ${wasmTools.status}: ${String(wasmTools.stderr).trim()}` }
      }

      return { layer: 'L2', status: 'pass', reason: null }
    },

    L3: async (slug) => {
      const specPath = resolve(projectRoot, 'tests', 'challenges', `${slug}.spec.ts`)
      if (!existsSync(specPath)) {
        return { layer: 'L3', status: 'fail', reason: `spec not found: tests/challenges/${slug}.spec.ts` }
      }
      const playwright = spawn(
        'pnpm',
        ['exec', 'playwright', 'test', `tests/challenges/${slug}.spec.ts`],
        { cwd: projectRoot, encoding: 'utf8' },
      )
      if (playwright.error) {
        return { layer: 'L3', status: 'fail', reason: `playwright spawn error: ${playwright.error.message}` }
      }
      if ((playwright.status ?? 1) !== 0) {
        const stderr = String(playwright.stderr).trim().split('\n').slice(-3).join(' | ')
        return { layer: 'L3', status: 'fail', reason: `playwright exit ${playwright.status}: ${stderr || 'see stdout'}` }
      }
      return { layer: 'L3', status: 'pass', reason: null }
    },

    L4: async (slug) => {
      const blindScript = resolve(projectRoot, 'scripts', 'challenge-verify-blind.ts')
      const child = spawn('pnpm', ['challenge:verify:blind', slug], {
        cwd: projectRoot,
        encoding: 'utf8',
      })
      if (child.error) {
        return { layer: 'L4', status: 'inconclusive', reason: `blind spawn error: ${child.error.message}` }
      }
      const code = child.status ?? 2
      if (code === 0) return { layer: 'L4', status: 'pass', reason: null }
      if (code === 2) return { layer: 'L4', status: 'inconclusive', reason: String(child.stderr).trim() || 'see run.log' }
      return { layer: 'L4', status: 'fail', reason: String(child.stderr).trim() || `blind exit ${code}` }
    },
  }
}

// ─── Orchestration ──────────────────────────────────────────────────────────

export async function runVerify(args: VerifyArgs, runners: LayerRunners): Promise<VerifyResult> {
  const layersToRun = selectLayers(args)
  const results: LayerOutcome[] = []
  let failedAt: LayerName | null = null
  let summary: VerifyResult['summary'] = 'verified'
  let exitCode = 0

  for (const layer of layersToRun) {
    const outcome = await runners[layer](args.slug)
    results.push(outcome)
    if (outcome.status === 'fail') {
      failedAt = layer
      summary = 'failed'
      exitCode = 1
      break
    }
    if (outcome.status === 'inconclusive') {
      failedAt = layer
      summary = 'inconclusive'
      exitCode = 2
      // Inconclusive halts the cascade — no other layer to run after L4.
      break
    }
  }

  return {
    slug: args.slug,
    layersRun: layersToRun.slice(0, results.length),
    results,
    summary,
    failedAt,
    exitCode,
  }
}

// ─── Output formatting ──────────────────────────────────────────────────────

export function formatHuman(result: VerifyResult): string[] {
  const lines: string[] = []
  for (const r of result.results) {
    if (r.status === 'pass') {
      lines.push(`✓ ${r.layer} passed`)
    } else if (r.status === 'skip') {
      lines.push(`- ${r.layer} skipped`)
    } else if (r.status === 'inconclusive') {
      lines.push(`? ${r.layer} inconclusive: ${r.reason ?? '(no reason)'}`)
    } else {
      lines.push(`✗ ${r.layer} failed: ${r.reason ?? '(no reason)'}`)
    }
  }
  if (result.summary === 'verified') {
    lines.push(`verified: ${result.slug} (${result.layersRun.join(' ')})`)
  } else if (result.summary === 'failed') {
    lines.push(`failed: ${result.slug} at ${result.failedAt}`)
  } else {
    lines.push(`inconclusive: ${result.slug} at ${result.failedAt}`)
  }
  return lines
}

export function formatJson(result: VerifyResult): VerifyJsonOutput {
  return {
    slug: result.slug,
    layers_run: result.layersRun,
    results: result.results.map((r) => ({ layer: r.layer, status: r.status, reason: r.reason })),
    summary: result.summary,
    failed_at: result.failedAt,
  }
}

// ─── Entry point ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  try {
    const args = parseVerifyArgs(process.argv.slice(2))
    const runners = makeDefaultRunners()
    const result = await runVerify(args, runners)
    if (args.json) {
      process.stdout.write(JSON.stringify(formatJson(result)) + '\n')
    } else {
      for (const line of formatHuman(result)) {
        process.stdout.write(line + '\n')
      }
    }
    process.exit(result.exitCode)
  } catch (err) {
    if (err instanceof VerifyArgError) {
      if (err.exitCode === 0) {
        console.log(err.message)
      } else {
        console.error(err.message)
      }
      process.exit(err.exitCode)
    }
    console.error((err as Error).stack ?? String(err))
    process.exit(1)
  }
}

const isMainModule =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith('challenge-verify.ts')

if (isMainModule) {
  main()
}
