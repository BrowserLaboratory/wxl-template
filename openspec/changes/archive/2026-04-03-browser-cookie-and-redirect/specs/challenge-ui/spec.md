## ADDED Requirements

### Requirement: BrowserPanel dispatches HTTP requests to the challenge runtime

The BrowserPanel SHALL manage a per-instance cookie jar (Map<string, string>). After each dispatch, the panel SHALL extract Set-Cookie values from the response header `X-Wxlsh-Set-Cookie` (transported by usePythonRuntime to bypass Fetch API forbidden response-header restrictions) and store them in the cookie jar. Before each dispatch, the panel SHALL inject stored cookies via the `X-Wxlsh-Cookie` request header. The panel SHALL wrap all dispatch calls through a unified `browserFetch()` function that handles cookie injection and extraction.

When a response has status 3xx and a `Location` header, the BrowserPanel SHALL automatically follow the redirect by issuing a new GET request to the resolved URL. The panel SHALL follow up to 5 consecutive redirects. Redirect requests SHALL include cookies from the cookie jar. The URL bar SHALL update to reflect the final resolved URL.

Cookie deletion SHALL be supported: when a Set-Cookie value contains `max-age=0` or an expired `expires` date, the corresponding cookie SHALL be removed from the jar.

#### Scenario: Login form sets session cookie and redirects to dashboard

- **WHEN** a form POST to /login returns status 302 with `X-Wxlsh-Set-Cookie: session_user=guest; Path=/; SameSite=lax` and `Location: /files`
- **THEN** the BrowserPanel stores `session_user=guest` in its cookie jar, follows the redirect to GET /files with `X-Wxlsh-Cookie: session_user=guest`, and renders the final 200 response

#### Scenario: Redirect chain limit

- **WHEN** a response triggers more than 5 consecutive redirects
- **THEN** the BrowserPanel SHALL stop following and render the last redirect response

#### Scenario: Cookie deletion via max-age=0

- **WHEN** a response contains `X-Wxlsh-Set-Cookie: session_user=; max-age=0`
- **THEN** the BrowserPanel SHALL remove `session_user` from the cookie jar
