<img width="1200" height="630" alt="image" src="https://github.com/user-attachments/assets/c92eb752-e3b5-4f93-9af1-2bd1f05bb991" />

# Orin

Orin is a voice-enabled AI companion built for **conversation**. Type when you want to think quietly, or start a voice call when speaking out loud feels better. Either way, you talk to the same Orin, in the same thread, with the same memory of what you have already said.

Live at [orin.chat](https://orin.chat). Open source under the [MIT License](LICENSE).

## What you get

- **One assistant, one brain, two surfaces** — text chat and voice calls share the same AI logic, personality config, and `messages` thread
- **Try without signing in** — anonymous users get a small demo allowance in the browser
- **Sign in with Google** — save history, sync across devices, unlock voice calls and read-aloud
- **Make Orin yours** — tone, warmth, voice, and speaking speed in Settings; onboarding walks you through it after first sign-in
- **Platform allowance + BYOK** — no Stripe or billing. Free tier runs on the deployer's API keys; signed-in users can add their own OpenAI and ElevenLabs keys when quota runs out (encrypted at rest)

Voice runs on a separate Node sidecar because real-time audio needs a persistent WebSocket — a poor fit for serverless. The sidecar calls the same shared AI layer as `/api/chat`, so Orin never gets two personalities depending on how you talk to it.

## Stack

| Layer | Technology |
| --- | --- |
| Web app & API | Next.js (App Router), Vercel AI SDK |
| UI | shadcn/ui, Nexus UI |
| Auth & data | Supabase (Google OAuth, Postgres, RLS) |
| Text chat | OpenAI via AI SDK |
| Voice | ElevenLabs Speech Engine + WebRTC |
| Sidecar | Node WebSocket server (`server/`) |

See [CONTEXT.md](CONTEXT.md), [docs/adr/](docs/adr/), and [docs/deploy.md](docs/deploy.md) for architecture and deployment details.

## Getting started

### Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- OpenAI and ElevenLabs API keys
- Google OAuth credentials (for sign-in)

### Setup

```bash
git clone https://github.com/victorcodess/orin.git
cd orin
npm install
cp .env.example .env.local
```

Fill in `.env.local` — see [.env.example](.env.example) for all variables.

Apply the database schema:

```bash
npx supabase db push
# or run migrations from supabase/migrations/ in the Supabase SQL editor
```

Start the dev server:

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000). New chat lives at `/new`.

### Google OAuth (Supabase)

Sign-in requires Google as the auth provider:

1. In [Google Cloud Console](https://console.cloud.google.com/), create OAuth 2.0 credentials (Web application).
2. Add authorized redirect URI: `https://<your-supabase-project-ref>.supabase.co/auth/v1/callback`
3. In Supabase → **Authentication → Providers → Google**, paste Client ID and Client Secret.
4. In Supabase → **Authentication → URL configuration**, set Site URL to `http://localhost:3000` (or your production URL) and add redirect URL: `http://localhost:3000/auth/callback`

Match `NEXT_PUBLIC_SITE_URL` in `.env.local` to your Site URL.

### Voice setup (local)

Text chat works out of the box. Voice calls need the sidecar reachable by ElevenLabs:

1. `npm run dev` — starts Next.js and the sidecar on port 3001
2. In another terminal: `npm run dev:tunnel` — exposes port 3001 via ngrok
3. Set `VOICE_SERVER_PUBLIC_URL=wss://<ngrok-host>/ws` in `.env.local`
4. Run `npx tsx update-engine.mts` to point your Speech Engine at the tunnel
5. Verify: `npm run verify:voice`

Use a **separate ElevenLabs Speech Engine per environment**. Full production steps: [docs/deploy.md](docs/deploy.md).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Next.js + voice sidecar |
| `npm run dev:web` | Next.js only |
| `npm run dev:tunnel` | ngrok tunnel for voice sidecar (port 3001) |
| `npm run verify:voice` | Check sidecar + Speech Engine configuration |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests in watch mode |

## Testing

56 unit tests under `lib/**/*.test.ts` cover quotas, BYOK crypto, auth redirects, and message sanitization. See [docs/testing.md](docs/testing.md) for strategy and scope.

```bash
npm test
```

CI runs tests and a production build on every PR and push to `main`.

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
components/           UI (auth, chat, shell, settings, voice, nexus-ui)
lib/                  AI, quotas, crypto, Supabase, shared logic
server/               ElevenLabs Speech Engine sidecar
supabase/             Local Supabase config and database migrations
docs/                 ADRs, testing guide, deployment guide
```

## Contributing

Bug reports, ideas, and pull requests are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md). For security issues, see [SECURITY.md](SECURITY.md).

## Links

- [orin.chat](https://orin.chat) — live app
- [About](https://orin.chat/about) — product overview
- [GitHub](https://github.com/victorcodess/orin)
- [@orin__chat](https://x.com/orin__chat)
