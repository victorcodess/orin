# Orin

Orin is an AI companion you can talk to — text chat with a warm voice, one unified conversation thread, and auth-backed sessions.

Built with Next.js, Supabase, OpenAI, and ElevenLabs.

## How it works

- **One brain, two surfaces** — text chat and voice calls share the same AI logic (`lib/ai`) and the same `messages` thread.
- **Platform allowance + BYOK** — no billing or Stripe. Anonymous and signed-in users get a free operation allowance on platform API keys; after that, signed-in users add their own OpenAI / ElevenLabs keys in Settings.
- **Voice sidecar** — ElevenLabs Speech Engine runs on a small Node WebSocket service (`server/`) while the Next.js app handles UI and API routes.

See [CONTEXT.md](CONTEXT.md) and [docs/adr/](docs/adr/) for architecture details.

## Stack

- **Next.js** (App Router) — UI and API routes
- **Supabase** — auth, Postgres, RLS
- **OpenAI** — text chat via AI SDK
- **ElevenLabs** — voice and speech engine
- **shadcn/ui** + **Nexus UI** — component layers

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- OpenAI and ElevenLabs API keys

### Setup

```bash
git clone https://github.com/victorcodess/orin.git
cd orin
npm install
cp .env.example .env.local
```

Fill in `.env.local` — see `.env.example` for required variables (Supabase, OpenAI, ElevenLabs, encryption secret, voice server URL).

Apply the database schema:

```bash
npx supabase db push
# or run supabase/migrations/20250606000000_initial_schema.sql in the SQL editor
```

Start the dev server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). New chat lives at `/new`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js + voice sidecar |
| `npm run dev:web` | Next.js only |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |

## Testing

Co-located unit tests under `lib/**/*.test.ts` cover quotas, BYOK crypto, auth redirects, and message sanitization. See [docs/testing.md](docs/testing.md) for strategy, scope, and when to add tests.

```bash
npm test
```

## Metering and API keys

Orin does **not** implement payments or a credit ledger.

| Tier | Allowance (tunable in `lib/quotas/limits.ts`) |
| --- | --- |
| Anonymous | 1 conversation, 8 message turns |
| Signed in | 10 conversations, 40 message turns, voice + read-aloud caps |

When allowance is exhausted:

- **Anonymous users** — prompted to sign up
- **Signed-in users** — can add encrypted BYOK keys in Settings → Usage & API keys

Platform keys live in server env vars. User keys are encrypted at rest with `API_KEY_ENCRYPTION_SECRET`. See [ADR 004](docs/adr/004-platform-quota-and-byok.md).

## Project structure

```text
app/                  Routes, layouts, and API handlers
components/           UI components grouped by auth, chat, shell, settings, ui, and nexus-ui
lib/                  AI, quotas, crypto, Supabase, and shared logic
server/               ElevenLabs Speech Engine sidecar
supabase/             Local Supabase config and database migrations
docs/adr/             Architecture decision records
```

## Links

- [Twitter](https://x.com/orin__chat)
- [GitHub](https://github.com/victorcodess/orin)
