## MODIFIED Requirements

### Requirement: Description panel collapsible on all breakpoints

The description panel on challenge pages SHALL support a collapse/expand toggle. When collapsed, the tools panel SHALL expand to occupy the full width. A "📖 題目" button SHALL appear in the merged navigation bar when the description is collapsed, allowing users to re-expand it. The `DescriptionModal` component SHALL NOT exist in the codebase — the collapse/expand mechanism replaces it entirely.

#### Scenario: Description collapsed hides panel and shows nav button

- **WHEN** the user clicks the collapse toggle on the description panel
- **THEN** the description panel width SHALL animate to zero
- **AND** the tools panel SHALL expand to full width
- **AND** a "📖 題目" button SHALL appear in MergedNav

#### Scenario: DescriptionModal component does not exist

- **WHEN** inspecting the codebase for modal-based description display
- **THEN** no `DescriptionModal.vue` component SHALL exist
- **AND** `ChallengeLayout.vue` SHALL NOT import or reference `DescriptionModal`
- **AND** no `descriptionModalVisible` ref SHALL exist in `ChallengeLayout.vue`
