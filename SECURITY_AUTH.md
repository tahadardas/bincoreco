# Auth Security — Banco Ricco

## Current Strategy: localStorage-based JWT

### How it works

- **Website**: Access token and refresh token stored in `localStorage` via centralized helpers (`src/lib/token-storage.ts`)
- **Admin**: Admin token stored in `localStorage` via centralized helpers (`src/lib/token-storage.ts`)
- Tokens are sent as `Authorization: Bearer <token>` headers
- On 401 response, tokens are cleared and user is redirected
- Admin additionally receives 403 handling for forced password change

### Risk Assessment

| Risk | Severity | Mitigation |
|---|---|---|
| XSS could steal tokens | **High** | No `dangerouslySetInnerHTML` or `innerHTML` used; CSP recommended |
| Token persistence in localStorage | **Medium** | Tokens are short-lived (15m access, 7d refresh) |
| CSRF | **Low** | Tokens in headers (not cookies), so CSRF not applicable |

### XSS Mitigations

- No `dangerouslySetInnerHTML` usage in the codebase
- No `eval()` or dynamic script injection
- All user input is rendered via React (auto-escaped)
- Admin panel uses react-query with typed responses
- API responses are JSON-only

### CSP Recommendation

Add these headers at the reverse proxy level:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.example.com; font-src 'self'; base-uri 'self'; form-action 'self';
```

### Token Expiration

- Access token: 15 minutes
- Refresh token: 7 days
- On 401, both tokens are cleared immediately
- The `banco-auth-unauthorized` custom event notifies all listeners

### Refresh Token Handling

The API has a `/auth/refresh` endpoint. The current frontend does **not** automatically refresh tokens. If an access token expires mid-session, the user may need to re-login. This is acceptable for the current production scope, but should be improved before scaling.

### Future Migration Plan (to httpOnly cookies)

1. **API changes**:
   - Add `cookie-parser` middleware
   - On login/register, set refresh token as httpOnly, secure, SameSite=Strict cookie
   - Add CSRF token endpoint (optional)
   - Keep returning `accessToken` in response body for mobile clients
   - Add middleware to read access token from `Authorization` header OR from a signed cookie

2. **Frontend changes**:
   - Remove `token-storage.ts` access token management
   - Use `credentials: 'include'` in fetch calls
   - Read CSRF token from meta tag and send as header (if implemented)

3. **Mobile app**:
   - Mobile clients continue using `Authorization: Bearer` header
   - API checks both cookie and header based on user-agent or `X-Client-Type` header

4. **Transition**:
   - Deploy API changes first (backward compatible)
   - Then deploy frontend changes
   - Remove localStorage fallback after monitoring
