## ADDED Requirements

### Requirement: Attack sessions are persisted to IndexedDB

The `saveAttackSession` function SHALL deep-clone the session object (removing Vue reactive proxies) before storing it in IndexedDB. This ensures compatibility with the structured clone algorithm used by IndexedDB, which cannot handle Proxy objects.

#### Scenario: Session with reactive proxy headers is saved

- **WHEN** an attack session contains HTTP events whose `requestHeaders` or `responseHeaders` arrays are Vue reactive proxies
- **THEN** `saveAttackSession` SHALL serialize the session via `JSON.parse(JSON.stringify(session))` before calling `db.put()`, and the operation SHALL succeed without DataCloneError
