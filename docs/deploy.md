# Deployment

Orin runs as **two processes** in production:

| Process | Host | Role |
| --- | --- | --- |
| Next.js app | Vercel (or similar) | UI, API routes, auth |
| Voice sidecar | Always-on host | ElevenLabs Speech Engine WebSocket server |

They coordinate through Supabase only. The browser never connects to the sidecar directly.

## Prerequisites

- Supabase project with migrations applied (`npx supabase db push`)
- Google OAuth configured in Supabase (see README)
- OpenAI and ElevenLabs API keys
- A 32+ character `API_KEY_ENCRYPTION_SECRET`
- **Separate ElevenLabs Speech Engine per environment** (dev/staging/prod)

## 1. Deploy the Next.js app

Deploy to Vercel (or any Node host that supports Next.js App Router).

Set environment variables from [.env.example](../.env.example). In production:

- `NEXT_PUBLIC_SITE_URL` — your public URL (e.g. `https://orin.chat`)
- `NEXT_PUBLIC_SUPABASE_URL` / keys — from Supabase dashboard
- Platform API keys — your deployer's OpenAI and ElevenLabs keys
- `VOICE_SERVER_PUBLIC_URL` — set after the sidecar is live (step 2)

Add your production callback URL in Supabase Auth → URL configuration:

```text
https://your-domain.com/auth/callback
```

## 2. Deploy the voice sidecar

The sidecar must accept **long-lived inbound WebSocket connections**. Vercel serverless functions cannot host this.

```bash
docker build -f server/Dockerfile -t orin-voice .
docker run -p 3001:3001 --env-file .env.production orin-voice
```

Suitable hosts: Railway, Fly.io, Render, a VM, etc.

Required env vars on the sidecar:

- `ELEVENLABS_API_KEY`
- `ELEVENLABS_SPEECH_ENGINE_ID`
- `OPENAI_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `API_KEY_ENCRYPTION_SECRET`
- `VOICE_SERVER_PUBLIC_URL` — `wss://<your-sidecar-host>/ws`

## 3. Point ElevenLabs at the sidecar

After the sidecar is reachable at a public `wss://` URL:

```bash
# In .env.local (or production env) set VOICE_SERVER_PUBLIC_URL=wss://<host>/ws
npx tsx update-engine.mts
```

This updates the Speech Engine's `wsUrl` to match your deployment.

Verify:

```bash
npm run verify:voice
```

## Local development with voice

1. Start the app: `npm run dev` (Next.js + sidecar on port 3001)
2. Expose the sidecar: `npm run dev:tunnel` (ngrok on port 3001)
3. Set `VOICE_SERVER_PUBLIC_URL=wss://<ngrok-host>/ws` in `.env.local`
4. Run `npx tsx update-engine.mts`
5. Run `npm run verify:voice`

Text chat and read-aloud work without the tunnel. Voice calls require steps 2–4.

## Checklist

- [ ] Supabase migrations applied
- [ ] Google OAuth redirect URLs include your domain
- [ ] `API_KEY_ENCRYPTION_SECRET` is unique per environment
- [ ] Platform API keys set (or users rely on BYOK after quota)
- [ ] Sidecar deployed and healthy
- [ ] `VOICE_SERVER_PUBLIC_URL` matches sidecar public URL
- [ ] `update-engine.mts` run for this environment's Speech Engine
- [ ] `npm run verify:voice` passes

## Further reading

- [CONTEXT.md](../CONTEXT.md) — architecture overview
- [docs/adr/002-voice-sidecar.md](adr/002-voice-sidecar.md) — why the sidecar exists
- [docs/adr/004-platform-quota-and-byok.md](adr/004-platform-quota-and-byok.md) — metering model
