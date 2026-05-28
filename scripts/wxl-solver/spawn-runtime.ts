/**
 * wxl-solver/spawn-runtime.ts
 *
 * Dispatcher that spawns a fresh agent CLI session for L4 blind solve.
 * Selection is driven by the WXL_VERIFY_RUNTIME environment variable
 * (default: claude). The mapping table mirrors `.agent/skills/wxl-creator/reference/runtime-cli.md`.
 */

import { appendFileSync, openSync, closeSync } from 'node:fs'
import { resolve } from 'node:path'
import { spawnSync, type SpawnSyncReturns } from 'node:child_process'

export type RuntimeName = 'claude' | 'codex' | 'gemini'
export const KNOWN_RUNTIMES: readonly RuntimeName[] = ['claude', 'codex', 'gemini']

export interface SpawnRuntimeOptions {
  runtime: RuntimeName
  prompt: string
  workDir: string
  turnBudget: number
  /**
   * Absolute path to a project-local MCP config (typically `<projectRoot>/.mcp.json`).
   * When set, the dispatcher forwards it to runtimes that accept an explicit
   * MCP-config flag. Currently only `claude` honours it directly via
   * `--mcp-config`; `codex` and `gemini` rely on their user-level config files
   * and ignore this parameter (the design's runtime-cli.md documents the gap).
   */
  mcpConfigPath?: string
}

export interface SpawnRuntimeCommand {
  cmd: string
  args: string[]
}

export interface SpawnRuntimeResult {
  command: SpawnRuntimeCommand
  status: number | null
  stdout: string
  stderr: string
  error?: Error
}

export class UnknownRuntimeError extends Error {
  constructor(runtime: string) {
    super(`unknown WXL_VERIFY_RUNTIME "${runtime}". Accepted: ${KNOWN_RUNTIMES.join(', ')}.`)
    this.name = 'UnknownRuntimeError'
  }
}

/**
 * Build the command line for a runtime. Splitting this out keeps unit tests
 * focused on argv assembly without actually invoking the agent CLI.
 */
export function buildRuntimeCommand(opts: SpawnRuntimeOptions): SpawnRuntimeCommand {
  switch (opts.runtime) {
    case 'claude': {
      // Plain-text output: `--output-format text` (the default) keeps the
      // `FINAL_FLAG=<value>` contract line on a raw line of stdout where
      // extract-flag.ts can find it. Using `--output-format json` here wraps
      // the response in a JSON envelope (`{result: "..."}`) and breaks the
      // contract — extract-flag.ts intentionally never decodes per-runtime JSON.
      //
      // Argument order matters: `--mcp-config <configs...>` is variadic and
      // eats positional tokens until it sees another flag. Place it BEFORE
      // `--add-dir` (a non-variadic flag) so the prompt at the end is not
      // accidentally consumed as a second MCP config path.
      const claudeArgs = ['--print']
      if (opts.mcpConfigPath) {
        claudeArgs.push('--mcp-config', opts.mcpConfigPath)
      }
      claudeArgs.push(
        '--add-dir', opts.workDir,
        '--max-turns', String(opts.turnBudget),
        opts.prompt,
      )
      return { cmd: 'claude', args: claudeArgs }
    }
    case 'codex':
      return {
        cmd: 'codex',
        args: [
          'exec',
          '--output-format', 'json',
          '--working-dir', opts.workDir,
          '--max-turns', String(opts.turnBudget),
          opts.prompt,
        ],
      }
    case 'gemini':
      return {
        cmd: 'gemini',
        args: [
          '-p', opts.prompt,
          '--working-dir', opts.workDir,
          '--max-turns', String(opts.turnBudget),
          '--output-format', 'json',
        ],
      }
    default:
      throw new UnknownRuntimeError(opts.runtime)
  }
}

export function resolveRuntime(envValue: string | undefined): RuntimeName {
  const raw = (envValue ?? 'claude').toLowerCase()
  if (!(KNOWN_RUNTIMES as readonly string[]).includes(raw)) {
    throw new UnknownRuntimeError(raw)
  }
  return raw as RuntimeName
}

export interface SpawnDeps {
  spawn?: (cmd: string, args: string[]) => SpawnSyncReturns<string>
}

export function spawnRuntime(opts: SpawnRuntimeOptions, deps: SpawnDeps = {}): SpawnRuntimeResult {
  const command = buildRuntimeCommand(opts)
  const runner = deps.spawn ?? ((cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' }))

  const runLogPath = resolve(opts.workDir, 'run.log')
  let logFd: number | null = null
  try {
    logFd = openSync(runLogPath, 'w')
    closeSync(logFd)
  } catch {
    // Best-effort log init; the spawn still runs even if logging fails.
  }

  const ret = runner(command.cmd, command.args)
  const stdout = typeof ret.stdout === 'string' ? ret.stdout : String(ret.stdout ?? '')
  const stderr = typeof ret.stderr === 'string' ? ret.stderr : String(ret.stderr ?? '')

  try {
    appendFileSync(
      runLogPath,
      `# command: ${command.cmd} ${command.args.map((a) => JSON.stringify(a)).join(' ')}\n` +
        `# exit: ${ret.status}\n` +
        `# stderr:\n${stderr}\n` +
        `# stdout:\n${stdout}\n`,
      'utf8',
    )
  } catch {
    // logging is best-effort
  }

  return {
    command,
    status: ret.status,
    stdout,
    stderr,
    error: ret.error,
  }
}
