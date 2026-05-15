# 01 Setup

> Local environment, env vars, and the verification commands wired through `package.json` and `scripts/`.

## Prerequisites

- **Node** `>=22` (enforced by `scripts/doctor.mjs`).
- **pnpm** as package manager — `scripts/doctor.mjs` checks `npm_config_user_agent` and fails on npm/yarn/bun.
- Agora project with App ID + App Certificate. The Agora CLI can write credentials via `agora project env write .env.local`.

## Install

```bash
pnpm install
```

The lockfile is `pnpm-lock.yaml`. There is no monorepo workspace; everything runs from the repo root.

## Environment Variables

`env.local.example` (copy to `.env.local`):

| Variable                       | Scope         | Notes                                                                  |
| ------------------------------ | ------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_AGORA_APP_ID`     | public        | Required; used by the browser RTC + RTM clients.                       |
| `NEXT_AGORA_APP_CERTIFICATE`   | server-only   | Required; used by `app/api/generate-agora-token/route.ts`.             |
| `NEXT_PUBLIC_AGENT_UID`        | public        | Optional override for the agent's UID (default `123456`).              |
| `NEXT_AGENT_GREETING`          | server-only   | Optional first utterance the agent speaks.                             |
| `NEXT_DEEPGRAM_API_KEY`        | server-only   | Optional BYOK; commented examples in `invite-agent/route.ts`.          |
| `NEXT_LLM_URL`                 | server-only   | Required only if you wire `app/api/chat/completions/route.ts`.         |
| `NEXT_LLM_API_KEY`             | server-only   | Required pair with `NEXT_LLM_URL`.                                     |
| `NEXT_ELEVENLABS_API_KEY`      | server-only   | Optional BYOK TTS.                                                     |
| `NEXT_ELEVENLABS_VOICE_ID`     | server-only   | Optional BYOK TTS voice.                                               |
| `NEXT_PUBLIC_VERCEL_URL`       | build         | Set in `vercel.json` from `${VERCEL_URL}`; not read in app code today. |

`scripts/doctor.mjs` greps for `NEXT_PUBLIC_AGORA_APP_ID=…` and `NEXT_AGORA_APP_CERTIFICATE=…` in `.env.local`.

## Quick Commands

```bash
pnpm run doctor          # Node + pnpm + .env.local sanity check
pnpm run dev             # Next dev (webpack), http://localhost:3000
pnpm run build           # Next production build
pnpm run start           # Run production build
pnpm run lint            # eslint .
pnpm run typecheck       # tsc --noEmit
pnpm run verify:api      # node --import tsx scripts/verify-api-contracts.ts
pnpm run verify          # doctor → lint → typecheck → verify:api → build
```

There is **no `test` script** — `pnpm run verify` is the closest end-to-end gate.

## Verification Safety

| Command            | Needs live Agora? | Notes                                                       |
| ------------------ | ----------------- | ----------------------------------------------------------- |
| `pnpm run lint`    | No                | ESLint over the whole tree.                                 |
| `pnpm run typecheck` | No              | `tsc --noEmit`.                                             |
| `pnpm run verify:api` | No             | Mocks `RtcTokenBuilder` + `agora-agent-server-sdk` classes. |
| `pnpm run build`   | No                | Next production build.                                      |
| `pnpm run verify`  | No                | Full chain, no network.                                     |
| `pnpm run dev`     | Yes (for use)     | Often blocked in sandboxed shells due to port binding.      |

## Common Setup Failures

- Doctor fails with **"Node version must be >=22"** → upgrade Node.
- Doctor fails with **"This project uses pnpm"** → installer ran under npm/yarn/bun; re-run with pnpm.
- Doctor fails with **".env.local missing variable"** → run `agora project env write .env.local` or copy `env.local.example` manually.
- `verify:api` fails with **"Module not found"** for `app/api/...` → a new route exists but wasn't added to `scripts/verify-api-contracts.ts`.

## What `scripts/doctor.mjs` Actually Checks

In order:

1. `process.versions.node` parses to a major version `>=22`.
2. `process.env.npm_config_user_agent` includes `pnpm/`.
3. `env.local.example` exists at the repo root.
4. `.env.local` exists at the repo root.
5. `.env.local` contains both `NEXT_PUBLIC_AGORA_APP_ID=…` and `NEXT_AGORA_APP_CERTIFICATE=…` on their own lines.

If any check fails it logs the failure and exits with `1`. The script never writes files.

## Where Verification Lives

- `scripts/verify-api-contracts.ts` dynamically imports three routes — `generate-agora-token`, `invite-agent`, `stop-conversation` — monkey-patches `RtcTokenBuilder`, `Agent.prototype.createSession`, and `AgoraClient.prototype.stopAgent`, and asserts the status code and JSON body of each. **`/api/chat/completions` is not covered** today; if you wire it into the live flow, extend the harness.
- Adding a new route requires extending this file or `pnpm run verify:api` will skip it.
- ESLint and `tsc --noEmit` run with no network access.
- `next build` is the slowest gate; expect 30-60 seconds on a warm cache.

## Related Deep Dives

- [Token Model](L2/token_model.md) — How `RtcTokenBuilder.buildTokenWithRtm` is invoked and renewed.
