# Security configuration notes

- Set `JWT_SECRET` to a unique, high-entropy secret in the backend environment. The example value is a placeholder and must never be used as a live secret.
- Set `TRUST_PROXY_HOPS` to the exact number of trusted reverse proxies in front of Express. Leave it at `0` for direct connections; an incorrect proxy count can let clients spoof their IP and evade login throttling.
- Login passwords are verified with bcrypt. Existing administrator rows whose passwords are still plaintext will not authenticate; migrate them through a controlled password reset or administrative rehash before enabling this backend.
- No default HOD account is created. Provision the first HOD through an approved out-of-band process that stores a bcrypt hash, then use that account for normal account creation.
- The development frontend keeps the eight-hour Bearer token in `sessionStorage`. Production must use HTTPS and should move credentials to a `Secure`, `HttpOnly`, `SameSite` session cookie with CSRF protection to reduce token exposure to browser script injection.
- `/api/push-subscriptions/send` now requires an HOD Bearer token. The detection process that calls it must obtain and send a valid token; do not make that route public to preserve the integration.
- Password recovery through the old security-question endpoints remains disabled. Recovery needs a verified, single-use, expiring reset-token flow before it can be enabled.
