## ADDED Requirements

### Requirement: White-box mode displays app source code viewer

When `source_visible: true`, the challenge page SHALL display a read-only source code viewer panel showing the app's source code with syntax highlighting. When `source_visible: false` or omitted, the source viewer SHALL NOT be rendered and no source code SHALL be accessible via the DOM.

#### Scenario: White-box source viewer is shown

- **WHEN** a challenge page loads with `source_visible: true`
- **THEN** the page SHALL render a syntax-highlighted, read-only code block containing the full app source (Python or PHP)

#### Scenario: Black-box source viewer is absent

- **WHEN** a challenge page loads with `source_visible: false` or the field is omitted
- **THEN** no source viewer element SHALL exist in the DOM and no readable app source SHALL be accessible via `document.querySelector` or JavaScript

<!-- @trace
source: web-exploit-challenge-platform
code:
  - .vitepress/theme/components/SourceViewer.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
tests:
  - .vitepress/theme/components/SourceViewer.test.ts
-->

### Requirement: ChallengeLayout renders a NotesButton in the header

`ChallengeLayout.vue` SHALL render a `NotesButton` component in the right side of the challenge header, positioned to be visually symmetric with the `← Challenges` back link on the left. The button SHALL be absolutely positioned within the header's flex container.

The `NotesButton` SHALL receive `noteCount` from `pentestNotes.noteCount`. Clicking the button SHALL set `notesModalVisible.value = true`.

#### Scenario: NotesButton is visible on challenge page load

- **WHEN** a user opens a challenge page
- **THEN** the `NotesButton` SHALL be visible in the header area to the right of the challenge title

#### Scenario: Clicking NotesButton opens the modal

- **WHEN** the user clicks the `NotesButton`
- **THEN** `notesModalVisible` SHALL be set to `true` and the `NotesModal` SHALL become visible

<!-- @trace
source: add-pentest-notes
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/components/NotesButton.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/components/NotesButton.test.ts
-->

### Requirement: ChallengeLayout integrates usePentestNotes and NotesModal

`ChallengeLayout.vue` SHALL instantiate `usePentestNotes(attackSession, slug)` and call `pentestNotes.init(slug.value)` after `attackSession.init()` during `onMounted`. It SHALL render `<NotesModal>` (conditionally with `v-if="notesModalVisible"`) just before the root closing `</div>`. The modal SHALL receive `pentestNotes` as a prop and emit a `close` event that sets `notesModalVisible.value = false`.

#### Scenario: Pentest notes are initialized with attack session

- **WHEN** the challenge page mounts
- **THEN** `pentestNotes.init(slug)` SHALL be called after `attackSession.init()` so notes are loaded from IndexedDB before the modal is first opened

#### Scenario: NotesModal is not rendered when closed

- **WHEN** `notesModalVisible` is `false`
- **THEN** the `NotesModal` component SHALL NOT be present in the DOM

<!-- @trace
source: add-pentest-notes
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/usePentestNotes.ts
  - .vitepress/theme/components/NotesModal.vue
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/usePentestNotes.test.ts
-->

### Requirement: ChallengeLayout threads executionId through code execution dispatch

`ChallengeLayout.vue` SHALL maintain a module-level variable `let currentExecutionId: string | null = null`. Before invoking the code execution callback (`onCodeExecuted`), it SHALL generate `currentExecutionId = crypto.randomUUID()`. After the execution completes, it SHALL reset `currentExecutionId = null`.

The `makeSourceDispatch('code')` function SHALL read `currentExecutionId` and pass it as the `executionId` parameter when calling `attackSession.addHttpEvent(entry, 'code', currentExecutionId)`.

#### Scenario: HTTP requests made during code execution share the executionId

- **WHEN** Python code executes and makes an HTTP request via the `requests` stub
- **THEN** both the `code_execution` event and all `http_request` events generated during that execution SHALL share the same non-null `executionId`

#### Scenario: HTTP requests outside code execution have no executionId

- **WHEN** an HTTP request is made from the Browser panel, Repeater panel, or terminal (not from code execution)
- **THEN** the resulting `http_request` event SHALL have no `executionId` field

<!-- @trace
source: add-pentest-notes
code:
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
tests:
  - tests/unit/layouts/ChallengeLayout.test.ts
  - tests/unit/composables/useAttackSession.test.ts
-->

## MODIFIED Requirements

### Requirement: Flag submit form is fixed at the bottom of the left column

The left column SHALL contain a `FlagSubmit` component anchored to the bottom of the column, remaining visible regardless of description scroll position. The form SHALL have a text input and a submit button. On submission, it SHALL call the flag verification function and display a success or failure indicator.

When the flag is correct, the success state SHALL additionally display a "下載攻擊紀錄" (Download Attack Log) button. Clicking this button SHALL invoke an `onExport` callback prop provided by the parent layout, which triggers the JSON file download of the current attack session.

`FlagSubmit.vue` SHALL accept an optional `onExportNotes?: () => void` prop alongside the existing `onExport` prop. When `onExportNotes` is provided and the challenge is in the `success` state, a `下載滲透筆記` button SHALL be rendered after the existing `下載攻擊紀錄` button. Clicking the `下載滲透筆記` button SHALL invoke `onExportNotes()`.

#### Scenario: Flag submit is always accessible

- **WHEN** the challenge description is long enough to scroll
- **THEN** the `FlagSubmit` component SHALL remain visible at the bottom of the left column without scrolling

#### Scenario: Correct flag shows success message and export button

- **WHEN** a user submits the correct flag
- **THEN** the UI SHALL display a success indicator
- **AND** a "下載攻擊紀錄" button SHALL appear in the success state

#### Scenario: Export button triggers attack session download

- **WHEN** a user clicks "下載攻擊紀錄" after solving the challenge
- **THEN** the `onExport` prop callback SHALL be invoked
- **AND** the browser SHALL initiate a JSON file download of the attack session

#### Scenario: Notes download button appears after solving when prop is provided

- **WHEN** the challenge is solved and `onExportNotes` prop is set
- **THEN** the `下載滲透筆記` button SHALL be visible in the success state UI

#### Scenario: Notes download button is absent when prop is not provided

- **WHEN** `onExportNotes` is `undefined`
- **THEN** no notes download button SHALL be rendered

#### Scenario: Clicking the notes download button invokes the callback

- **WHEN** the user clicks `下載滲透筆記`
- **THEN** `onExportNotes()` SHALL be called, triggering `pentestNotes.downloadMarkdown(title, slug)` in `ChallengeLayout`

#### Scenario: Incorrect flag shows failure message without revealing answer

- **WHEN** a user submits an incorrect flag
- **THEN** the UI SHALL display a failure indicator with no hint about the correct flag
- **AND** no export button SHALL be displayed

<!-- @trace
source: challenge-ux-and-attack-session
code:
  - .vitepress/theme/components/FlagSubmit.vue
  - .vitepress/theme/layouts/ChallengeLayout.vue
  - .vitepress/theme/composables/useAttackSession.ts
  - .vitepress/theme/composables/usePentestNotes.ts
tests:
  - tests/unit/components/FlagSubmit.test.ts
  - tests/unit/layouts/ChallengeLayout.test.ts
-->
