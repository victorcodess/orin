# ADR 003: Unified conversation thread

**Status:** Accepted  
**Date:** 2026-06-06

## Context

Users should be able to text Orin, start a voice call mid-conversation, and continue typing after hanging up — with full history visible throughout.

## Decision

- One `conversation_id` holds all turns (text and voice)
- `messages.source` is `text` or `voice`
- Chat UI (`app/(app)/(chat)/c/[id]`) is the canonical transcript
- Call UI is an overlay on the chat page, not a separate route
- Voice sidecar persists each transcript turn to `messages` as it happens
- Chat subscribes to new messages via Supabase Realtime during calls

## Consequences

- Voice handler must receive `conversation_id` in session metadata
- Voice messages need a visual marker (mic icon) in the UI
- No post-call "import transcript" step — data is already in the thread
