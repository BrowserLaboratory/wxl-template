## ADDED Requirements

### Requirement: Skill grills the user to converge challenge design before parameter collection

Before collecting challenge parameters (the existing Round-based parameter collection step), the `wxl-create` skill SHALL conduct a design-convergence interview (Step 0) that applies the `grilling` technique inline as prose — it SHALL NOT dispatch the `grilling` skill through any host-agent skill-invocation mechanism. The interview SHALL:

- Ask exactly one question at a time and wait for the user's reply before asking the next question.
- Provide a recommended answer for each question.
- Look up any fact that can be resolved from the environment (filesystem, tools) rather than asking the user; only genuine design decisions SHALL be put to the user.
- NOT scaffold, generate code, or write any file until the user confirms shared understanding of the design.
- Interrogate the challenge *design*, not merely the parameter fields — covering at minimum: vulnerability realism and non-obviousness, the expected exploitation path, difficulty calibration against the scenario, whether misdirection or red herrings are wanted, and the plausibility of the flag's placement — and resolve dependencies between these design decisions one by one.

Design conclusions reached in Step 0 (in particular `slug`, `backend`, `vuln`, `description`, `difficulty`) SHALL be treated as already-provided parameters and fed into the existing parameter-collection step, which SHALL skip the corresponding questions and prompt only for fields left undecided by Step 0.

When the user's initial prompt already describes the design clearly enough to generate precise vulnerable code, the skill SHALL be permitted to summarize the design and ask for a single confirmation, rather than forcing a question for every design dimension.

Step 0 SHALL remain host-agent-neutral: its prose SHALL NOT use `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, `subagent_type`, or any other host-agent-specific primitive.

#### Scenario: Step 0 precedes parameter collection

- **WHEN** the user invokes the `wxl-create` skill
- **THEN** the skill SHALL run the Step 0 design-convergence interview before emitting any Round-based parameter question block, and SHALL NOT scaffold or write any file during Step 0

#### Scenario: One question at a time with a recommended answer

- **WHEN** the skill asks a Step 0 design question
- **THEN** the skill SHALL ask exactly one question, include a recommended answer, and wait for the user's reply before asking the next question

#### Scenario: Facts are looked up, decisions are asked

- **WHEN** a piece of information needed for Step 0 can be resolved from the environment (for example, whether a challenge directory already exists, or whether the canonical reference is readable)
- **THEN** the skill SHALL resolve it by inspecting the environment rather than asking the user, and SHALL reserve questions for genuine design decisions

#### Scenario: Step 0 grills design dimensions beyond the parameter fields

- **WHEN** the skill conducts the Step 0 interview
- **THEN** the questions SHALL cover the vulnerability's realism and non-obviousness, the expected exploitation path, difficulty calibration, whether misdirection or red herrings are wanted, and the plausibility of the flag placement

#### Scenario: Step 0 conclusions feed parameter collection without re-asking

- **WHEN** Step 0 has converged on `backend` and `vuln` (and any other parameter)
- **THEN** the parameter-collection step SHALL treat those as already provided and SHALL prompt only for the fields Step 0 left undecided

#### Scenario: Design already clear in the initial prompt

- **WHEN** the user's initial prompt already specifies a precise, generatable design
- **THEN** the skill SHALL be permitted to summarize the design and request a single confirmation instead of grilling every design dimension

#### Scenario: Design not confirmed blocks downstream steps

- **WHEN** the user has not yet confirmed shared understanding of the design in Step 0
- **THEN** the skill SHALL NOT run `pnpm create:challenge`, generate vulnerable code, or write any challenge file

#### Scenario: Step 0 prose stays host-agent-neutral

- **WHEN** a maintainer greps the skill prose (including the Step 0 section) for `AskUserQuestion`, `EnterPlanMode`, `ExitPlanMode`, `TaskCreate`, or `subagent_type`
- **THEN** no matches SHALL be found under `.agent/skills/wxl-create/`

#### Scenario: Grilling is inlined, not dispatched

- **WHEN** an inspector reads the Step 0 prose in `.agent/skills/wxl-create/SKILL.md`
- **THEN** Step 0 SHALL describe the grilling technique inline and SHALL NOT instruct the host agent to invoke or dispatch the separate `grilling` skill

#### Scenario: Localized mirror includes Step 0

- **WHEN** an inspector compares `.agent/skills/wxl-create/SKILL.md` and `.agent/skills/wxl-create/SKILL.zhTW.md`
- **THEN** both files SHALL contain a Step 0 design-convergence section and both workflow diagrams SHALL include the Step 0 node preceding the parameter-collection node
