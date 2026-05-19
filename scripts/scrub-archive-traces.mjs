// ============================================================================
// ONE-SHOT SCRIPT — DO NOT RE-RUN
//
// This script was authored for a single Spectra change (project-audit-and-cleanup
// Stage 3.2) to remove the 771 `@trace` dead-link lines pointing to the three
// archived demo challenges. After that change merged, this script has no further
// purpose. Re-running it on any other state will fail the
// EXPECTED_TOTAL_REMOVED=771 assertion and may delete legitimate `@trace` lines.
//
// To intentionally re-run for verification, set env var WXL_SCRUB_INTENTIONAL=1.
// Without that flag, the script aborts immediately.
//
// Future similar work SHALL author a new script with its own EXPECTED constant
// and explicit scope, not modify this one.
// ============================================================================

// requires Node >= 22; this repo targets Node 24 per AUDIT.md
// One-shot scrub for DELETION-PLAN.md §B.4 Option A
// Removes `- docs/challenge/<sqli-demo|php-demo|fastapi-demo>[./]...` lines
// from openspec/specs/*/spec.md @trace blocks.
import { readFileSync, writeFileSync, globSync } from 'node:fs'

if (process.env.WXL_SCRUB_INTENTIONAL !== '1') {
  console.error('ERROR: This is a one-shot script for project-audit-and-cleanup Stage 3.2.')
  console.error('It has already been run; re-running may delete legitimate @trace lines.')
  console.error('If you really mean to run it, set WXL_SCRUB_INTENTIONAL=1 in env.')
  process.exit(2)
}

if (typeof globSync !== 'function') {
  throw new Error('Node 22+ required (fs.globSync not available). Got: ' + process.version)
}

const PATTERN = /^\s*-\s+docs\/challenge\/(sqli-demo|php-demo|fastapi-demo)[./].*$/
const EXPECTED_TOTAL_REMOVED = 771   // @trace dead-link lines only; the
                                     // remaining 12 normative scenario refs
                                     // stay intentionally (DELETION-PLAN §A.2).

const files = globSync('openspec/specs/*/spec.md')
let totalRemoved = 0

for (const f of files) {
  const original = readFileSync(f, 'utf8')
  const cleaned = original.split('\n').filter(line => !PATTERN.test(line)).join('\n')
  if (cleaned !== original) {
    writeFileSync(f, cleaned)
    const removed = original.split('\n').length - cleaned.split('\n').length
    totalRemoved += removed
    console.log(`${f}: removed ${removed} lines`)
  }
}

console.log(`\nTotal lines removed: ${totalRemoved} (expected ${EXPECTED_TOTAL_REMOVED})`)
if (totalRemoved !== EXPECTED_TOTAL_REMOVED) {
  console.error(`FAIL: total mismatch — expected ${EXPECTED_TOTAL_REMOVED}, got ${totalRemoved}`)
  process.exit(1)
}
