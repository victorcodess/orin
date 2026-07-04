# Security policy

## Supported versions

Security fixes are applied on the `main` branch. There is no long-term support schedule for older releases.

## Reporting a vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**

Email the maintainer via the contact link on [victorwilliams.me](https://victorwilliams.me) with:

- Description of the issue and potential impact
- Steps to reproduce
- Any suggested fix (optional)

You should receive a response within a reasonable timeframe. Please allow time to investigate and patch before public disclosure.

## Scope notes

Orin handles user conversations and optional BYOK API keys (encrypted at rest). Areas we treat as high sensitivity:

- Quota and API key resolution (`lib/quotas/`)
- Encryption of stored user keys (`lib/crypto/`)
- Auth redirects and session handling (`lib/auth/`, `lib/safe-redirect.ts`)
- Server routes that use the Supabase service role

If you are running your own deployment, rotate `API_KEY_ENCRYPTION_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`, and platform API keys if you suspect compromise.
