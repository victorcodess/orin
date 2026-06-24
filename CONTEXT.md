# Orin

Orin is a voice-enabled AI companion you can text and call. Orin acts like a friend, associate, or companion — warm, thoughtful, and context-aware.

## Current status

**Phase 2 in progress:** voice calls with inline or fullscreen UI, Speech Engine sidecar, and live voice transcripts in chat.

Shipped so far:

- Landing page, app shell, inset sidebar with chat history
- Text chat with streaming replies (`/api/chat`, Vercel AI SDK)
- Speech-to-text dictation in composer (ElevenLabs Scribe)
- Read aloud for assistant messages
- Voice calls: header call button, inline/fullscreen overlay, `/api/voice/token`, voice sidecar
- Conversation persistence (anon `orin_session` cookie or authed `user_id`)
- Favorites, title editing, message regenerate/edit
- Generated Supabase types in `types/database.ts`

## Core concepts

| Term | Meaning |
|------|---------|
| **Orin** | The default assistant persona (name, personality, voice). Users can customize all three. |
| **Conversation** | A single thread spanning text messages and voice call transcripts. |
| **Message** | One turn in a conversation. `source` is `text` (typed) or `voice` (spoken). |
| **Call** | A real-time voice session overlaid on the current conversation. Transcripts persist to the same thread. |
| **Credits** | Usage currency. Free tier has limits; paid users buy credit packs. |

## Stack

- **Next.js** — App Router, server components, API routes
- **Vercel AI SDK** — LLM orchestration (unified brain for text + voice)
- **ElevenLabs Speech Engine** — Real-time STT/TTS for voice calls
- **Supabase** — Auth, Postgres, Realtime
- **shadcn/ui** — Generic UI primitives
- **Nexus UI** — AI-native chat primitives (Thread, Message, PromptInput)

## Routes

| Route | Purpose |
|-------|---------|
| `/` | Marketing landing |
| `/new` | New chat prompt (creates conversation on submit) |
| `/c/[id]` | Conversation thread |
| `/api/chat` | Streaming text chat |
| `/api/conversations` | List / create conversations |
| `/api/voice/token` | Mint WebRTC token for voice calls |
| `/api/voice/bind` | Bind ElevenLabs session to Orin conversation |

Anonymous reads and writes for conversations go through server routes using the service role where RLS does not cover anon access.

## Deployment

Two processes, deployed separately:

- **Next.js app → Vercel.** Serves the UI and the `/api/voice/*` routes.
- **Voice sidecar (`server/`) → an always-on host** (Railway, Fly, Render, a VM…). It is a long-lived inbound WebSocket server that ElevenLabs dials into, which Vercel's serverless functions cannot host. Build with `docker build -f server/Dockerfile -t orin-voice .` and run `npm run start:voice`.

The two coordinate only through Supabase (`conversations.active_voice_session_id`), so they don't need to be co-located. The browser talks to ElevenLabs (WebRTC) and Vercel; it never connects to the sidecar directly.

Sidecar env: `ELEVENLABS_API_KEY`, `ELEVENLABS_SPEECH_ENGINE_ID`, `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `VOICE_SERVER_PUBLIC_URL` (the `wss://<host>/ws` it's reachable at).

A Speech Engine resource points at a single `wsUrl`, so use a **separate engine per environment**. After deploying the sidecar, set `VOICE_SERVER_PUBLIC_URL` and run `npx tsx update-engine.mts` to point that environment's engine at it.

## Database types

Generated from the linked Supabase project:

```bash
npm run gen:types
```

Output: `types/database.ts`. Supabase clients in `lib/supabase/` are typed with `Database`.

## Architecture principles

1. **One brain** — Vercel AI SDK owns all LLM logic. ElevenLabs handles audio only.
2. **One thread** — Text and voice share a `conversation_id`. Chat UI is the canonical transcript.
3. **Config-driven persona** — Name, personality, and voice live in `assistant_configs`, not in components.
4. **Server-authoritative metering** — Usage and credits are enforced server-side.

## Phases

See [docs/adr/](docs/adr/) for architecture decisions. Build order:

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Foundation — Tailwind v4, Nexus UI, schema, rebrand | Done |
| 1 | Text chat MVP — stream, persist, default Orin | Done |
| 2 | Voice calls + live transcript in chat | In progress |
| 3 | Customization (name, personality, voice) | Planned |
| 4 | Auth + free tier limits | Planned |
| 5 | Credits + payments | Planned |
