import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

// The spec-gates job's shell is where the gates' CI contract actually lives,
// and none of it is reachable from `python test_run.py`: the id extraction, the
// exit-code aggregation, the id whitelist, and — most consequentially — which
// steps carry an `if:`. An earlier revision ran every gate behind
// `if: steps.change.outputs.ids != ''`, so a pull request that touched no
// change directory skipped the job entirely. G7 compares all of openspec/specs/
// and needs no change id, and an archive pull request resolves no id at all
// (git records the directory move as a rename, so the pre-archive path never
// appears in --name-only) — meaning the one gate that guards archiving never
// ran on an archive. These assertions pin the shape that fixed it.

const JOB = 'spec-gates'
const WORKFLOW = resolve(__dirname, '../../../.github/workflows/quality-gates.yml')

interface Step {
  name?: string
  if?: string
  run?: string
  uses?: string
  env?: Record<string, string>
}

function specGatesSteps(): Step[] {
  const doc = parse(readFileSync(WORKFLOW, 'utf8'))
  const job = doc.jobs?.[JOB]
  expect(job, `${JOB} job is missing from quality-gates.yml`).toBeTruthy()
  return job.steps as Step[]
}

function stepRunning(fragment: string): Step {
  const step = specGatesSteps().find((s) => s.run?.includes(fragment))
  expect(step, `no spec-gates step runs \`${fragment}\``).toBeTruthy()
  return step as Step
}

describe('spec-gates CI job', () => {
  it('runs the trace-parity gate unconditionally', () => {
    // No `if:` at all — not merely a different condition. A gate that guards
    // archiving must not be skippable by the shape of the diff.
    expect(stepRunning('--trace-parity-only').if).toBeUndefined()
  })

  it('keeps the id-scoped gates behind the resolved id list', () => {
    // G1 and G2 are per-change judgements; running them without an id would
    // either fail on a bystander change or need a fabricated directory.
    const step = stepRunning('run.py "$id"')
    expect(step.if).toBe("steps.change.outputs.ids != ''")
  })

  it('excludes archived directories when resolving change ids', () => {
    const run = stepRunning('git diff --name-only') .run as string
    expect(run).toContain('openspec/changes/')
    expect(run).toMatch(/\$3\s*!=\s*"archive"/)
  })

  it('whitelists change ids before using them, failing closed', () => {
    const run = stepRunning('run.py "$id"').run as string
    expect(run).toMatch(/\[\[ "\$id" =~ \^\[a-z0-9-\]\+\$ \]\]/)
    // Naming the offending id is the difference between a diagnosable failure
    // and a job that just says no.
    expect(run).toContain('$id"')
    expect(run).toContain('exit 2')
  })

  it('lets exit 2 outrank exit 1 across multiple change ids', () => {
    // run.py separates "a gate reported FAIL" (1) from "the gates could not be
    // evaluated" (2). Collapsing both to 1 hides a broken environment behind
    // what reads as a policy violation.
    const run = stepRunning('run.py "$id"').run as string
    expect(run).toMatch(/rc"?\s*-eq 2/)
    expect(run).toMatch(/status=2/)
  })

  it('passes every fork-controlled value through env, never through templating', () => {
    // Actions expands ${{ }} into the script body before bash parses it, so a
    // branch or path carrying shell metacharacters would execute. The same
    // reasoning is documented on the prose-audit job.
    for (const step of specGatesSteps()) {
      expect(step.run ?? '', `step "${step.name}" interpolates into its shell`)
        .not.toContain('${{')
    }
    expect(stepRunning('--trace-parity-only').env?.BASE_REF).toBe('${{ github.base_ref }}')
  })

  it('writes the resolved ids through a delimited heredoc', () => {
    // The single-line `ids=$IDS` form is only safe while git keeps C-quoting
    // control characters in --name-only output — an invariant this workflow
    // does not control.
    // Comments are stripped first: the discarded form is quoted in the comment
    // that explains why it was discarded.
    const run = (stepRunning('git diff --name-only').run as string)
      .split('\n')
      .filter((l) => !l.trim().startsWith('#'))
      .join('\n')
    expect(run).toMatch(/ids<</)
    expect(run).not.toMatch(/echo "ids=/)
  })
})
