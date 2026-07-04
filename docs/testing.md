# Testing strategy

This doc explains how Orin is tested today, why we bother, and what you get out of it. No prior testing experience required.

## The short version

Orin has **56 unit tests** in **11 files**, all under `lib/`. They run in about a second with:

```bash
npm test
```

We test **pure logic on the server** — quotas, encryption, redirects, message cleanup — not the full UI or live APIs.

That matches Phase 5 of the architecture plan: lock in the code where bugs would **cost money**, **leak secrets**, or **break trust**, without building a huge test suite for a portfolio project.

---

## Why test at all?

Most of Orin is a web app: buttons, chat bubbles, voice overlays. You *could* click through everything manually before every change. That works once. It does not scale.

Tests are **automated checks** that run the same way every time. They answer: “Did I break something important?” before you merge or deploy.

For Orin specifically, the scary failures are not “button is 2px off.” They are:

| If this breaks… | What goes wrong |
| --- | --- |
| Quota checks | Someone uses your OpenAI/ElevenLabs keys for free, or paying users get blocked wrongly |
| API key encryption | User BYOK keys stored in plaintext or shown in the UI |
| Auth redirects | Login sends people to a malicious site (`?next=https://evil.com`) |
| Message sanitization | Empty or broken messages confuse the model or waste tokens |

Those paths live in **`lib/`** — plain TypeScript with inputs and outputs. That is the easiest and highest-value place to test.

---

## What we test

Each row is a real file (or group) in the repo.

| Area | Test file(s) | What it proves |
| --- | --- | --- |
| Quota limits | `lib/quotas/limits.test.ts` | Anonymous vs signed-in caps, voice minute billing, admin bypass |
| Quota + BYOK resolution | `lib/quotas/resolve.test.ts`, `keys.test.ts` | Over limit → signup or “add keys”; under limit → platform key |
| Quota API errors | `lib/quotas/errors.test.ts`, `client-errors.test.ts` | Stable error codes for the UI (`signup_required`, `keys_required`) |
| BYOK crypto | `lib/crypto/secrets.test.ts` | Encrypt/decrypt round-trip; masked keys never show the full secret |
| Auth redirects | `lib/safe-redirect.test.ts` | Only same-origin paths allowed after login |
| Chat input hygiene | `lib/ai/message-utils.test.ts` | Empty turns stripped before hitting the model |
| Personality config | `lib/orin/personality/parse.test.ts`, `prompts.test.ts` | Bad cookie/DB input falls back safely; prompts assemble |
| Voice disconnect UX | `lib/voice/disconnect-toast.test.ts` | ElevenLabs disconnect reasons map to the right toast |

**Total: 56 assertions** across those modules.

---

## What we deliberately do *not* test

We are **not** trying to test everything. These are out of scope on purpose:

- **Full browser flows** (open app → sign up → chat → voice call)
- **React / Nexus UI components** (snapshots, “does this button render”)
- **Live Supabase, OpenAI, or ElevenLabs** in CI
- **The voice sidecar** WebSocket server end-to-end

Those need real services, browsers, and time. They are valuable later; they are not required for the current strategy.

Manual testing and preview deploys still cover “does the app feel right?” Unit tests cover “did we break the rules of the system?”

---

## How the tests run (mental model)

### Unit tests

A **unit test** calls one function (or a small group) with a fixed input and checks the output.

Example idea (not exact code):

```ts
expect(safeRedirectUrl("//evil.com")).toBe("/new");
```

If someone changes `safeRedirectUrl` and open redirects work again, this test **fails immediately** with a clear message. You fix the code before users get phished.

No browser. No database. Usually no network. Fast.

### Co-located tests

Tests live next to the code they protect:

```text
lib/quotas/limits.ts
lib/quotas/limits.test.ts
```

When you change `limits.ts`, the matching `.test.ts` is right there. You are more likely to update both.

### Mocks (fake dependencies)

Some modules normally talk to Supabase (`createAdminClient`). In tests we **mock** that: we replace the database with a fake that returns canned numbers.

That lets us test “when usage is 8/8, block the anon user” without a real Postgres project.

Quota resolution tests mock `isUnderQuota` and `getStoredUserKeys` so we can simulate “over limit + no BYOK” without seeding rows.

### `server-only` and secrets

Many `lib/` files import `"server-only"` (Next.js guard: this must not run in the browser). Vitest stubs that import via `vitest.server-only-stub.ts`.

Crypto tests need `API_KEY_ENCRYPTION_SECRET`. Vitest sets a dummy value in `vitest.setup.ts` so you do not need `.env.local` to run tests.

---

## Running tests locally

```bash
# Run once (CI does this)
npm test

# Re-run on file save while you work
npm run test:watch
```

You should see **11 passed** test files, **56 passed** tests. No API keys or Supabase project required.

---

## CI (GitHub Actions)

On every pull request and push to `main`, the **Tests** workflow runs `npm test`. If a test fails, the check goes red and the PR should not merge until it is fixed.

That stops quota or crypto regressions from slipping in when you (or a contributor) change `lib/` without running tests locally.

---

## When should *you* add a test?

Add or extend a test when you change logic that:

1. **Enforces limits or billing-like rules** (`lib/quotas/`)
2. **Handles secrets** (`lib/crypto/`)
3. **Decides where users go after auth** (`lib/safe-redirect.ts`, `lib/auth/`)
4. **Shapes what the model sees** (`lib/ai/message-utils.ts`, personality parse/build)

Skip tests for:

- One-off UI layout tweaks
- Copy / styling
- Thin wrappers that only call an API with no branching

**Rule of thumb:** if a bug would embarrass you in a demo or cost real API money, it deserves a unit test in `lib/`.

---

## Adding a new test file

1. Create `lib/your-module.test.ts` next to `lib/your-module.ts`.
2. Import `describe`, `it`, `expect` from `vitest`.
3. Run `npm test`.

Vitest picks up any `lib/**/*.test.ts` automatically (see `vitest.config.ts`).

Example skeleton:

```ts
import { describe, expect, it } from "vitest";

import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("does the important thing", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

---

## What this strategy accomplishes

By the time you merge:

- **Quota bypass** in shared resolution logic is caught before deploy.
- **BYOK crypto** cannot silently regress to leaking full keys in masks.
- **Open redirects** on login stay blocked.
- **Garbage messages** do not get sent to the model.
- **Contributors** (open source) get a fast, zero-setup command to verify `lib/` behavior.

It does **not** prove the whole product works in a browser. It proves the **rules Orin is built on** still hold. For a project of this size, that is the right tradeoff.
