## MODIFIED Requirements

### Requirement: Code Editor supports import requests

The Code Editor panel SHALL support `import requests` in user Python code, with all requests routed through the dispatch bridge.

#### Scenario: import requests succeeds

- **WHEN** user writes and executes `import requests; r = requests.get('https://challenge-<slug>.localhost/')` in the Code Editor
- **THEN** the code executes successfully and `r.status_code`, `r.text`, `r.json()` return correct values from the challenge application
