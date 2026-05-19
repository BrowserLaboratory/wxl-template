#!/usr/bin/env bash
# pre-commit hook for challenge validation
#
# 1. Queries staged files (including deletions) via git diff --cached
# 2. Filters for docs/challenge/** paths
# 3. Stashes unstaged changes so validation sees only the staged snapshot
# 4. Runs challenge-lint-staged.ts on affected files
# 5. Restores the stash regardless of validation result

set -euo pipefail

# Get staged challenge files (Added, Copied, Modified, Renamed, Deleted)
CHALLENGE_FILES=$(git diff --cached --name-only --diff-filter=ACMRD -- 'docs/challenge/')

# If no challenge files are staged, exit early
if [ -z "$CHALLENGE_FILES" ]; then
  exit 0
fi

# Check if there are unstaged changes or untracked files under docs/ to stash
HAS_STASHABLE=false
if ! git diff --quiet -- docs/ || [ -n "$(git ls-files --others --exclude-standard -- docs/)" ]; then
  HAS_STASHABLE=true
fi

# Stash only docs/ unstaged changes + untracked files so we validate the staged snapshot
# Scoped to docs/ to avoid stashing scripts/ or other project files the hook needs
if [ "$HAS_STASHABLE" = true ]; then
  git stash push --keep-index --include-untracked --quiet -m "pre-commit: stash unstaged changes" -- docs/
fi

# Run validation; capture exit code
VALIDATION_EXIT=0
echo "$CHALLENGE_FILES" | xargs node --experimental-strip-types scripts/challenge-lint-staged.ts || VALIDATION_EXIT=$?

# Restore stash if we stashed
if [ "$HAS_STASHABLE" = true ]; then
  git stash pop --quiet
fi

exit $VALIDATION_EXIT
