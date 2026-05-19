## MODIFIED Requirements

### Requirement: Artifact packaging

The workflow SHALL package the `.vitepress/dist` directory into a zip file named `wxl-{tag}.zip` where `{tag}` is the git tag that triggered the workflow (e.g., `wxl-v1.0.0.zip`).

#### Scenario: Dist directory packaged as zip

- **WHEN** the build pipeline completes successfully
- **THEN** the workflow SHALL create a zip file containing the contents of `.vitepress/dist`
- **AND** the zip filename SHALL follow the pattern `wxl-{tag}.zip`
- **AND** the zip filename SHALL include the triggering tag name
