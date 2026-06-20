# Orin

Orin is a voice-enabled AI companion you can text and call. Orin acts like a friend, associate, or companion — warm, thoughtful, and context-aware.

## Current status

**Phase 1 is complete.** Phase 2 (voice sidecar + call overlay) is next.

Shipped so far:

- Landing page, app shell, inset sidebar with chat history
- Text chat with streaming replies (`/api/chat`, Vercel AI SDK)
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

Anonymous reads and writes for conversations go through server routes using the service role where RLS does not cover anon access.

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
| 2 | Voice calls + live transcript in chat | Next |
| 3 | Customization (name, personality, voice) | Planned |
| 4 | Auth + free tier limits | Planned |
| 5 | Credits + payments | Planned |
