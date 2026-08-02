import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { parse } from 'yaml'

// Every job that builds challenge artifacts must install the same pinned
// toolchain. A job that misses wasm-tools silently degrades keygen to its
// copyFileSync fallback — CI stays green while the deployed payload skips the
// strip and mutate passes, which is exactly how the empty-template corruption
// went unnoticed. The spec (ci-quality-gates, "Both jobs SHALL share an
// identical setup step sequence") states the pins; this test enforces them.

const WORKFLOW_DIR = resolve(__dirname, '../../../.github/workflows')
const WORKFLOWS = ['quality-gates.yml', 'deploy.yml', 'release.yml']

const EXPECTED_TOOL_LIST = 'wasm-pack@0.14.0,wasm-tools@1.249.0'
const INSTALL_ACTION = 'taiki-e/install-action@'
const RUST_CACHE = 'Swatinem/rust-cache@'

interface Step {
  uses?: string
  with?: Record<string, unknown>
}

interface JobSteps {
  workflow: string
  jobName: string
  steps: Step[]
}

function loadAllJobs(): JobSteps[] {
  const jobs: JobSteps[] = []
  for (const workflow of WORKFLOWS) {
    const doc = parse(readFileSync(resolve(WORKFLOW_DIR, workflow), 'utf8'))
    for (const [jobName, job] of Object.entries<Record<string, unknown>>(doc.jobs)) {
      jobs.push({ workflow, jobName, steps: (job.steps as Step[]) ?? [] })
    }
  }
  return jobs
}

function stepsUsing(jobs: JobSteps[], actionPrefix: string) {
  return jobs.flatMap(({ workflow, jobName, steps }) =>
    steps
      .filter((s) => s.uses?.startsWith(actionPrefix))
      .map((step) => ({ workflow, jobName, step })),
  )
}

describe('workflow toolchain parity', () => {
  const jobs = loadAllJobs()

  it('pins the full tool list in every install-action step', () => {
    const installs = stepsUsing(jobs, INSTALL_ACTION)
    expect(installs.length).toBeGreaterThan(0)
    for (const { workflow, jobName, step } of installs) {
      expect(step.with?.tool, `${workflow} › ${jobName}`).toBe(EXPECTED_TOOL_LIST)
    }
  })

  it('disables the binary cache in every rust-cache step', () => {
    // install-action installs pinned prebuilt binaries into $CARGO_HOME/bin;
    // a restored rust-cache would shadow them with stale versions.
    const caches = stepsUsing(jobs, RUST_CACHE)
    expect(caches.length).toBeGreaterThan(0)
    for (const { workflow, jobName, step } of caches) {
      expect(step.with?.['cache-bin'], `${workflow} › ${jobName}`).toBe('false')
    }
  })

  it('installs the toolchain in exactly the five artifact-building jobs', () => {
    // quality-gates: test, build, site-smoke; deploy: build; release: release.
    // A new job that builds artifacts must join this list — and install the
    // same pinned tools — rather than silently running without them.
    const jobsWithInstall = stepsUsing(jobs, INSTALL_ACTION)
      .map(({ workflow, jobName }) => `${workflow} › ${jobName}`)
      .sort()
    expect(jobsWithInstall).toEqual([
      'deploy.yml › build',
      'quality-gates.yml › build',
      'quality-gates.yml › site-smoke',
      'quality-gates.yml › test',
      'release.yml › release',
    ])
  })
})
