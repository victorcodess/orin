# Voice sidecar — the always-on ElevenLabs Speech Engine WebSocket server.
# The Next.js app deploys to Vercel; this process must run somewhere that allows
# long-lived inbound WebSocket connections (Railway, Fly, Render, a VM, etc.).
#
# Build from the repo root:  docker build -f server/Dockerfile -t orin-voice .
# Run:                        docker run -p 3001:3001 --env-file .env.local orin-voice
FROM node:24-slim

WORKDIR /app

# Install deps first for better layer caching. tsx + dotenv are runtime deps so
# the sidecar can run straight from source via `start:voice`.
COPY package.json package-lock.json ./
RUN npm ci

# The sidecar imports shared code (lib/, tsconfig path alias @/*), so copy the
# repo. .dockerignore keeps build output, secrets, and node_modules out.
COPY . .

ENV NODE_ENV=production
ENV VOICE_SERVER_PORT=3001
ENV VOICE_SERVER_PATH=/ws

EXPOSE 3001

CMD ["npm", "run", "start:voice"]
