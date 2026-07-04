# Contributing

Thanks for your interest in Orin. This is an independent portfolio project — bug reports, ideas, and pull requests are welcome.

## Before you start

1. Read [README.md](README.md) for setup and [docs/testing.md](docs/testing.md) for test scope.
2. Search [existing issues](https://github.com/victorcodess/orin/issues) before opening a duplicate.
3. For large changes, open an issue first to align on direction.

## Development setup

```bash
git clone https://github.com/victorcodess/orin.git
cd orin
npm install
cp .env.example .env.local
# Fill in .env.local — see README
npx supabase db push   # or apply migrations in the Supabase SQL editor
npm run dev
```

Voice calls need the sidecar plus a public tunnel in local dev. See [README.md](README.md#voice-setup-local) and [docs/deploy.md](docs/deploy.md).

## Pull requests

1. Branch from `main`.
2. Keep changes focused — one concern per PR when possible.
3. Run before opening:

   ```bash
   npm test
   npm run lint
   npm run build
   ```

4. Add or update tests when changing logic in `lib/` (quotas, crypto, auth redirects, message sanitization).
5. Update docs if behavior or setup steps change.

## Code style

- Match existing patterns in the file you edit.
- Prefer small, readable diffs over abstractions.
- Server-only logic belongs in `lib/` with `"server-only"` where appropriate.

## Reporting bugs

Include:

- What you expected vs what happened
- Steps to reproduce
- Browser/OS if UI-related
- Relevant logs (no API keys or secrets)

Use [GitHub Issues](https://github.com/victorcodess/orin/issues).

## Security

Do not open public issues for vulnerabilities. See [SECURITY.md](SECURITY.md).
