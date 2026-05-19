## ADDED Requirements

### Requirement: BrowserPanel sends realistic browser-like HTTP requests

Every request dispatched from `BrowserPanel.vue` SHALL include a complete set of simulated browser headers for display in the Network Traffic panel. `BrowserPanel` SHALL attach request-context metadata via `X-Wxlsh-Context` and `X-Wxlsh-Referer` headers; `useTrafficLog.wrap()` SHALL consume these metadata headers (stripping them before dispatch to the runtime), then synthesize the full simulated header set — including static browser identity headers and context-specific dynamic headers — for the recorded `TrafficEntry`. The synthesized headers SHALL follow HTTP/1.1 Title-Case convention and Chrome's conventional header ordering (Host first, Connection second, Accept-Encoding and Accept-Language last).

#### Scenario: Address bar navigation includes full browser headers

- **WHEN** a user navigates to a URL via the BrowserPanel address bar
- **THEN** the dispatched request SHALL include `User-Agent`, `Accept`, `Accept-Language`, `Accept-Encoding`, `Connection`, `Host`, `Sec-Ch-Ua`, `Sec-Ch-Ua-Mobile`, `Sec-Ch-Ua-Platform`, `Upgrade-Insecure-Requests`, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: none`, and `Sec-Fetch-User: ?1`

#### Scenario: Link click includes Referer and same-origin Sec-Fetch headers

- **WHEN** a user clicks a link inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the current page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, and `Sec-Fetch-Site: same-origin`

#### Scenario: Form GET submission includes Referer and navigation headers

- **WHEN** a user submits a GET form inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Referer` set to the form page URL, `Sec-Fetch-Dest: document`, `Sec-Fetch-Mode: navigate`, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: Form POST submission includes Origin, Referer, and Content-Length

- **WHEN** a user submits a POST form with `application/x-www-form-urlencoded` encoding inside the BrowserPanel iframe
- **THEN** the dispatched request SHALL include all static browser headers plus `Origin` set to the challenge origin, `Referer` set to the form page URL, `Content-Type: application/x-www-form-urlencoded`, `Content-Length` reflecting the byte length of the encoded body, `Sec-Fetch-Site: same-origin`, and `Sec-Fetch-User: ?1`

#### Scenario: NetworkPanel records complete headers from BrowserPanel requests

- **WHEN** BrowserPanel dispatches any request through `trackedDispatch`
- **THEN** the NetworkPanel traffic log SHALL display a header list matching the full set of browser-simulated headers defined by `buildBrowserRequest()`
