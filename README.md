# Orin

Orin is an AI companion you can talk to — text chat with a warm voice, conversation history, and auth-backed sessions.

Built with Next.js, Supabase, OpenAI, and ElevenLabs.

## Stack

- **Next.js** (App Router) — UI and API routes
- **Supabase** — auth, Postgres, realtime messages
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

Fill in `.env.local` — see `.env.example` for required variables (Supabase, OpenAI, ElevenLabs, voice server URL).

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

| Command        | Description              |
| -------------- | ------------------------ |
| `npm run dev`  | Start development server |
| `npm run build`| Production build         |
| `npm run start`| Run production server    |
| `npm run lint` | Run ESLint               |

## Project structure

```text
app/                  Routes, layouts, and API handlers
components/           UI components grouped by auth, chat, shell, shared, ui, and nexus-ui
lib/                  AI, Supabase, session, cache, and utility code
supabase/             Local Supabase config and database migrations
docs/adr/             Architecture decision records
hooks/                Shared React hooks
```

## Links

- [Twitter](https://x.com/orin__chat)
- [GitHub](https://github.com/victorcodess/orin)
