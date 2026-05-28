import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  buildRuntimeCommand,
  resolveRuntime,
  spawnRuntime,
  UnknownRuntimeError,
} from '../../../../scripts/wxl-solver/spawn-runtime'

describe('buildRuntimeCommand (task 5.2)', () => {
  const opts = {
    prompt: 'Solve the challenge. FINAL_FLAG=<value>',
    workDir: '/tmp/wxl-verify/door-is-open',
    turnBudget: 30,
  }

  it('assembles claude argv', () => {
    const cmd = buildRuntimeCommand({ ...opts, runtime: 'claude' })
    expect(cmd.cmd).toBe('claude')
    expect(cmd.args).toContain('--print')
    expect(cmd.args).toContain('--max-turns')
    expect(cmd.args).toContain('30')
    expect(cmd.args).toContain('--add-dir')
    expect(cmd.args).toContain('/tmp/wxl-verify/door-is-open')
    expect(cmd.args[cmd.args.length - 1]).toBe(opts.prompt)
    // Without mcpConfigPath, --mcp-config is omitted.
    expect(cmd.args).not.toContain('--mcp-config')
  })

  it('threads mcpConfigPath into claude argv when provided', () => {
    const cmd = buildRuntimeCommand({
      ...opts,
      runtime: 'claude',
      mcpConfigPath: '/abs/path/.mcp.json',
    })
    const idx = cmd.args.indexOf('--mcp-config')
    expect(idx).toBeGreaterThan(-1)
    expect(cmd.args[idx + 1]).toBe('/abs/path/.mcp.json')
    // Prompt remains the last argument.
    expect(cmd.args[cmd.args.length - 1]).toBe(opts.prompt)
  })

  it('assembles codex argv with `exec` subcommand', () => {
    const cmd = buildRuntimeCommand({ ...opts, runtime: 'codex' })
    expect(cmd.cmd).toBe('codex')
    expect(cmd.args[0]).toBe('exec')
    expect(cmd.args).toContain('--working-dir')
    expect(cmd.args).toContain('--max-turns')
    expect(cmd.args).toContain('30')
  })

  it('assembles gemini argv with -p prompt flag', () => {
    const cmd = buildRuntimeCommand({ ...opts, runtime: 'gemini' })
    expect(cmd.cmd).toBe('gemini')
    expect(cmd.args).toContain('-p')
    expect(cmd.args).toContain(opts.prompt)
    expect(cmd.args).toContain('--working-dir')
    expect(cmd.args).toContain('--max-turns')
    expect(cmd.args).toContain('30')
    expect(cmd.args).toContain('--output-format')
    expect(cmd.args).toContain('json')
  })
})

describe('resolveRuntime (task 5.2)', () => {
  it('defaults to claude when env var is unset', () => {
    expect(resolveRuntime(undefined)).toBe('claude')
  })

  it('accepts uppercase / mixed-case', () => {
    expect(resolveRuntime('CODEX')).toBe('codex')
    expect(resolveRuntime('Gemini')).toBe('gemini')
  })

  it('throws on unknown runtime', () => {
    expect(() => resolveRuntime('davinci')).toThrow(UnknownRuntimeError)
  })
})

describe('spawnRuntime (task 5.2)', () => {
  let workDir: string

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 'spawn-rt-'))
  })

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true })
  })

  it('writes run.log with command + stdout + stderr', () => {
    const fakeSpawn = (cmd: string, args: string[]) => ({
      pid: -1,
      output: [null, 'agent stdout', 'agent stderr'],
      stdout: 'agent stdout',
      stderr: 'agent stderr',
      status: 0,
      signal: null,
    })
    const result = spawnRuntime(
      { runtime: 'claude', prompt: 'p', workDir, turnBudget: 30 },
      { spawn: fakeSpawn as any },
    )
    expect(result.status).toBe(0)
    expect(result.stdout).toBe('agent stdout')
    const logPath = join(workDir, 'run.log')
    expect(existsSync(logPath)).toBe(true)
    const log = readFileSync(logPath, 'utf8')
    expect(log).toContain('# command:')
    expect(log).toContain('agent stdout')
    expect(log).toContain('agent stderr')
  })
})
