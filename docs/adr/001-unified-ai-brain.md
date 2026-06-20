# ADR 001: Unified AI brain

**Status:** Accepted  
**Date:** 2026-06-06

## Context

Orin supports text chat and voice calls. Both must feel like the same companion with the same memory and personality.

## Decision

Use **Vercel AI SDK** (`streamText`) as the single LLM layer for both text and voice. ElevenLabs Speech Engine handles audio transport (STT/TTS) only — not prompt logic or model selection.

- Text: `app/api/chat/route.ts` → `lib/ai/prompts.ts` + `lib/ai/messages.ts`
- Voice: `server/handlers/speech-engine.ts` → same shared modules (Phase 2)

Shared modules:

- `lib/ai/prompts.ts` — system prompt from assistant config
- `lib/ai/messages.ts` — load/save conversation history
- `lib/ai/assistant-config.ts` — resolve default or user config from Supabase

## Consequences

- Personality stays consistent across modes
- Voice requires a sidecar Node server (Speech Engine WebSocket)
- We do not use ElevenLabs Conversational AI Agents platform (which would duplicate LLM logic)
