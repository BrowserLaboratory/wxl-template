## ADDED Requirements

### Requirement: Browser Panel intercepts HTML form submissions inside the iframe

The Browser Panel SHALL attach a `submit` event listener to the iframe's `contentDocument` (alongside the existing `click` listener for anchor tags). When a form is submitted inside the iframe, the panel SHALL:
1. Call `preventDefault()` to suppress the native browser form navigation
2. Resolve the form's `action` attribute (or the current URL if absent) against the challenge base URL `https://challenge-<slug>.localhost/`
3. Read the form's `method` attribute (defaulting to `GET` if absent)
4. Serialize the form fields according to the form's `enctype`:
   - `application/x-www-form-urlencoded` (default): use `URLSearchParams` as the request body with `Content-Type: application/x-www-form-urlencoded`
   - `multipart/form-data`: use `FormData` as the request body without manually setting `Content-Type` (the browser SHALL generate the boundary automatically)
   - GET method: append fields as a query string to the resolved URL; no request body
5. Call `dispatch(new Request(resolvedUrl, { method, headers, body }))` and pass the response to `handleResponse()`

#### Scenario: POST form with default enctype is submitted

- **WHEN** the user submits an HTML form with `method="POST"` and no explicit `enctype` inside the iframe
- **THEN** the Browser Panel SHALL call `dispatch()` with a POST request whose `Content-Type` is `application/x-www-form-urlencoded` and whose body contains the serialized form fields

#### Scenario: POST form with multipart/form-data enctype is submitted

- **WHEN** the user submits an HTML form with `enctype="multipart/form-data"` inside the iframe
- **THEN** the Browser Panel SHALL call `dispatch()` with a POST request whose body is a `FormData` object (allowing the browser to set the `Content-Type` boundary automatically)

#### Scenario: GET form appends fields to query string

- **WHEN** the user submits an HTML form with `method="GET"` inside the iframe
- **THEN** the Browser Panel SHALL resolve the action URL, append all form fields as a query string, and call `dispatch()` with a GET request (no body)

#### Scenario: Form action relative URL resolves to challenge origin

- **WHEN** a form has `action="/login"` and the current challenge slug is `sqli-demo`
- **THEN** the resolved URL SHALL be `https://challenge-sqli-demo.localhost/login`, not `http://localhost:5173/login`

#### Scenario: Form with no action attribute submits to current URL

- **WHEN** a form has no `action` attribute
- **THEN** the Browser Panel SHALL use the current value of the URL bar (`url.value`) as the submission target
