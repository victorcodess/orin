# ADR 002: Voice sidecar

**Status:** Accepted  
**Date:** 2026-06-06

## Context

ElevenLabs Speech Engine requires a persistent WebSocket server (`engine.attach(httpServer, "/ws")`). Vercel serverless cannot host long-lived WebSocket connections reliably.

## Decision

Run a **voice sidecar** (`server/`) as a separate Node process in the same repo:

- Shares `lib/ai` with the Next.js app via direct imports
- Deployed to Railway, Fly.io, or Render in production
- Exposed via ngrok during local development

The Next.js app issues conversation tokens via `app/api/voice/token/route.ts` and never exposes `ELEVENLABS_API_KEY` to the browser.

## Consequences

- `npm run dev` runs both processes (via `concurrently`)
- Two deploy targets in production (Vercel + voice host)
- Full control over LLM logic during voice calls
