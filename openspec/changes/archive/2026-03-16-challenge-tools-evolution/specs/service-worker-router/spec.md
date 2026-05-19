## ADDED Requirements

### Requirement: Service Worker handles navigation requests from iframe link clicks

The Service Worker SHALL handle `fetch` events with `request.mode === "navigate"` for URLs matching `challenge-<slug>.localhost`. Navigation requests SHALL be treated identically to regular fetch requests: routed through the registered challenge's `MessagePort` relay. The Service Worker SHALL NOT distinguish between navigation and non-navigation requests for challenge-origin URLs.

#### Scenario: iframe link click navigation request is intercepted

- **WHEN** a link inside the Browser Panel iframe is clicked, triggering a navigation fetch to `https://challenge-<slug>.localhost/path`
- **THEN** the Service Worker SHALL intercept the navigation request, relay it via MessageChannel, and return the response so the page-side handler can update the iframe

#### Scenario: Navigation request outside challenge origin passes through

- **WHEN** a navigation fetch event fires for a URL that does not match `challenge-*.localhost`
- **THEN** the Service Worker SHALL NOT intercept it and SHALL pass it through to the network

## MODIFIED Requirements

### Requirement: Service Worker intercepts challenge-*.localhost requests

A Service Worker registered at the root scope SHALL intercept all `fetch` events where the request URL host matches the pattern `challenge-<slug>.localhost`. Requests not matching this pattern SHALL pass through to the network unchanged. This interception SHALL apply to both regular fetch requests and navigation requests (`request.mode === "navigate"`).

#### Scenario: Matching request is intercepted

- **WHEN** a fetch event fires with URL `https://challenge-sqli-basic.localhost/api/users`
- **THEN** the Service Worker SHALL intercept the request and NOT forward it to the network

#### Scenario: Non-matching request passes through

- **WHEN** a fetch event fires with URL `https://vitepress.dev/some/path`
- **THEN** the Service Worker SHALL call `event.respondWith` with the original network fetch

#### Scenario: Navigation request to challenge origin is intercepted

- **WHEN** a navigation fetch event fires with URL `https://challenge-sqli-basic.localhost/`
- **THEN** the Service Worker SHALL intercept it and route via MessageChannel relay
