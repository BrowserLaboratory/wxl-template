import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { verifyBlind } from '../../../scripts/challenge-verify-blind'

const INDEX = [
  '---',
  'title: Door Is Open',
  '---',
  '',
  '# Door Is Open',
  '',
  'A file-sharing app with an IDOR vulnerability.',
  '',
].join('\n')

const CANONICAL_FLAG = 'FLAG{door-is-open_abcd1234}'

describe('verifyBlind orchestration (task 5.5)', () => {
  let projectRoot: string
  let workDirRoot: string

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'cvb-orch-'))
    workDirRoot = mkdtempSync(join(tmpdir(), 'cvb-work-'))
    const slugDir = join(projectRoot, 'docs', 'challenge', 'door-is-open')
    mkdirSync(join(slugDir, 'src'), { recursive: true })
    writeFileSync(join(slugDir, 'index.md'), INDEX)
    writeFileSync(join(slugDir, 'src', 'flag.txt'), CANONICAL_FLAG + '\n')
  })

  afterEach(() => {
    rmSync(projectRoot, { recursive: true, force: true })
    rmSync(workDirRoot, { recursive: true, force: true })
  })

  const preflightOk = async () => true
  const preflightDown = async () => false

  it('exit 0 / verdict=pass when agent emits matching FINAL_FLAG', async () => {
    const result = await verifyBlind({
      slug: 'door-is-open',
      projectRoot,
      runtime: 'claude',
      preflight: preflightOk,
      workDirRoot,
      spawn: () => ({ status: 0, stdout: `chatter\nFINAL_FLAG=${CANONICAL_FLAG}\n`, stderr: '' }),
    })
    expect(result.verdict).toBe('pass')
    expect(result.exitCode).toBe(0)
  })

  it('exit 1 / verdict=fail when agent emits wrong flag', async () => {
    const result = await verifyBlind({
      slug: 'door-is-open',
      projectRoot,
      runtime: 'claude',
      preflight: preflightOk,
      workDirRoot,
      spawn: () => ({ status: 0, stdout: 'FINAL_FLAG=FLAG{wrong-flag}\n', stderr: '' }),
    })
    expect(result.verdict).toBe('fail')
    expect(result.exitCode).toBe(1)
  })

  it('exit 2 / verdict=inconclusive when agent does not emit FINAL_FLAG', async () => {
    const result = await verifyBlind({
      slug: 'door-is-open',
      projectRoot,
      runtime: 'claude',
      preflight: preflightOk,
      workDirRoot,
      spawn: () => ({ status: 0, stdout: 'agent gave up\n', stderr: '' }),
    })
    expect(result.verdict).toBe('inconclusive')
    expect(result.exitCode).toBe(2)
  })

  it('exit 2 / verdict=inconclusive when dev server is unreachable', async () => {
    const result = await verifyBlind({
      slug: 'door-is-open',
      projectRoot,
      runtime: 'claude',
      preflight: preflightDown,
      workDirRoot,
      spawn: () => ({ status: 0, stdout: '', stderr: '' }),
    })
    expect(result.verdict).toBe('inconclusive')
    expect(result.exitCode).toBe(2)
    expect(result.reason).toContain('dev server not reachable')
  })

  it('exit 2 with explicit reason when runtime CLI is missing on PATH', async () => {
    const enoent = Object.assign(new Error('spawn claude ENOENT'), { code: 'ENOENT' })
    const result = await verifyBlind({
      slug: 'door-is-open',
      projectRoot,
      runtime: 'claude',
      preflight: preflightOk,
      workDirRoot,
      spawn: () => ({ status: null, stdout: '', stderr: '', error: enoent }),
    })
    expect(result.verdict).toBe('inconclusive')
    expect(result.reason).toContain('not found')
  })
})
