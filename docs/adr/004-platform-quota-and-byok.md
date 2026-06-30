# ADR 004: Platform quota and bring-your-own-key

**Status:** Accepted  
**Date:** 2026-06-30

## Context

Orin is a portfolio project, not a commercial product. The original plan included Stripe billing, a credit ledger, and purchasable credit packs. That adds significant complexity (payments, webhooks, refunds, pricing UI) for little portfolio value.

We still need to:

- Limit anonymous demo usage so platform API keys are not abused
- Give signed-in users a slightly larger free allowance
- Let power users continue after limits by supplying their own OpenAI and ElevenLabs keys
- Support voice (sidecar) and read-aloud, which require server-side API access

## Decision

### Two credential pools

| Pool | Source | When used |
|------|--------|-----------|
| **Platform allowance** | `OPENAI_API_KEY` / `ELEVENLABS_API_KEY` env vars | User is under their free operation quota |
| **User keys (BYOK)** | Encrypted columns on `profiles` | Authed user exceeded quota and has saved keys |

Resolution order on every metered operation:

1. If under platform quota → use env keys
2. Else if authed and user has keys → decrypt and use user keys
3. Else → block with actionable error (signup CTA for anon; add keys CTA for authed)

Anonymous users never get BYOK. They only see signup prompts when blocked.

### Operation-based quotas (not token metering)

Count discrete operations, not tokens or minutes. Limits are tunable constants in `lib/quotas/limits.ts`.

| Operation | Anonymous | Authenticated |
|-----------|-----------|---------------|
| New conversations | 1 | few (e.g. 3) |
| Message turns (user sends) | few (e.g. 5) | few (e.g. 20) |
| Voice call sessions | 0 (blocked) | few (e.g. 3) |
| Read-aloud | 0 (blocked) | few (e.g. 5) |

Counts can be derived from existing rows (`conversations`, `messages`, voice bind events) plus optional `usage_events` rows for the settings UI. No credit ledger or balance field.

### API key storage

Store user keys **server-side on `profiles`**, encrypted at rest with `API_KEY_ENCRYPTION_SECRET` (AES-256-GCM). RLS restricts read/write to the owning user.

- **Not localStorage** — voice sidecar and server routes need keys without the browser re-sending them every request; localStorage also does not sync across devices
- **Not plaintext DB** — minimal encryption utility (~30 lines) is enough for a portfolio demo; document the tradeoff in README

Settings UI shows masked values (`sk-…xxxx`) after save. Full keys are never returned to the client post-save.

### Auth

- **Google OAuth** is the primary sign-up/login method (Supabase Auth)
- **Email/password** remains as secondary

### Onboarding

After first sign-up, redirect to `/onboarding` — a brief screen reusing the settings personalization UI (tone + voice). User can save or skip straight to `/new`. Track completion via `profiles.onboarding_completed`.

### Signup merge

On first auth, attach orphan conversations (matching `orin_session` cookie) to the new `user_id`. Merge anon assistant config cookie into `assistant_configs` if present.

### Removed

- Stripe / Checkout / webhooks
- `credit_transactions` table (deprecated; do not build against it)
- `profiles.credits_balance` as a payment concept (deprecate or repurpose for display-only quota remaining)
- Phase 5 billing from the build plan

## Consequences

- `lib/quotas/` replaces `lib/billing/` — limits check + key resolution helpers
- Chat, read-aloud, voice token, and voice sidecar routes all call the same quota + key resolver
- Voice sidecar loads user ElevenLabs key by `user_id` when platform quota is exhausted
- Settings gains **Usage** (allowance remaining + history) and **API keys** sections
- Platform cost stays bounded; portfolio demo stays fully functional with BYOK
