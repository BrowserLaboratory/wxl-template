## ADDED Requirements

### Requirement: Traffic log displays request and response headers

The traffic log SHALL display a `Cookie` header in request display headers when the original request contained `X-Wxlsh-Cookie`. The `X-Wxlsh-Cookie` transport header itself SHALL NOT appear in the display.

The traffic log SHALL display `Set-Cookie` headers in response display headers by converting `X-Wxlsh-Set-Cookie` back to individual `Set-Cookie` entries (splitting by newline). The `X-Wxlsh-Set-Cookie` transport header itself SHALL NOT appear in the display.

#### Scenario: Request with transported cookie displays Cookie header

- **WHEN** a request has header `X-Wxlsh-Cookie: session_user=guest`
- **THEN** the traffic log request headers SHALL show `Cookie: session_user=guest` and SHALL NOT show `X-Wxlsh-Cookie`

#### Scenario: Response with transported set-cookie displays Set-Cookie header

- **WHEN** a response has header `X-Wxlsh-Set-Cookie: a=1\nb=2`
- **THEN** the traffic log response headers SHALL show two entries: `Set-Cookie: a=1` and `Set-Cookie: b=2`
