# Orin

Orin is a voice-enabled AI companion you can text and call. Orin acts like a friend, associate, or companion — warm, thoughtful, and context-aware.

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

## Architecture principles

1. **One brain** — Vercel AI SDK owns all LLM logic. ElevenLabs handles audio only.
2. **One thread** — Text and voice share a `conversation_id`. Chat UI is the canonical transcript.
3. **Config-driven persona** — Name, personality, and voice live in `assistant_configs`, not in components.
4. **Server-authoritative metering** — Usage and credits are enforced server-side.

## Phases

See [docs/adr/](docs/adr/) for architecture decisions. Build order:

0. Foundation (this phase)
1. Text chat MVP
2. Voice calls + live transcript in chat
3. Customization (name, personality, voice)
4. Auth + free tier limits
5. Credits + payments
