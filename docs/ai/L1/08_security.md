# 08 Security

> Trust boundaries, secret handling, and the small set of security-relevant invariants this quickstart relies on.

## Trust Model

- The browser is untrusted. It may not see `NEXT_AGORA_APP_CERTIFICATE` or any BYOK vendor key.
- Route handlers under `app/api/` are the only place certificates and BYOK keys are read.
- Tokens issued by `/api/generate-agora-token` are time-bounded (1 hour) and the only credential the browser holds.

## Environment Variable Boundaries

| Boundary       | Variables                                                                                     |
| -------------- | --------------------------------------------------------------------------------------------- |
| Browser (public) | `NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_PUBLIC_AGENT_UID`                                          |
| Server-only      | `NEXT_AGORA_APP_CERTIFICATE`, `NEXT_AGENT_GREETING`, `NEXT_DEEPGRAM_API_KEY`, `NEXT_LLM_URL`, `NEXT_LLM_API_KEY`, `NEXT_ELEVENLABS_API_KEY`, `NEXT_ELEVENLABS_VOICE_ID` |
| Build-only       | `NEXT_PUBLIC_VERCEL_URL` (Vercel injects from `${VERCEL_URL}`; harmless if public)            |

In Vercel, mark the `NEXT_AGORA_APP_CERTIFICATE` and any BYOK keys as **Sensitive** to keep them out of build logs.

## Token Issuance

- `/api/generate-agora-token` calls `RtcTokenBuilder.buildTokenWithRtm` with `EXPIRATION_TIME_IN_SECONDS = 3600`.
- The same token string is used for RTC join and RTM login (both privileges encoded in one token).
- The route accepts optional `uid` and `channel` query params. If a client omits them, the server generates a uid + channel, returns them in the response, and uses them in the token.

## Token Renewal

- RTC fires `token-privilege-will-expire` ~30 seconds before expiry.
- `LandingPage.handleTokenWillExpire` fetches two fresh tokens — one keyed on the RTC `client.uid`, one keyed on `agoraData.uid` — and renews RTC and RTM separately.
- If a renewal request fails, the conversation continues until the token expires; the next failure surfaces through `MESSAGE_ERROR` or RTC disconnect.

## API Route Authentication

- There is no per-user authentication on the `app/api/*` routes. The threat model assumes the deployment is gated upstream (single-tenant demo, Vercel access controls, or a custom middleware you add).
- If you add a real auth layer, do it in `middleware.ts` and update `scripts/verify-api-contracts.ts` so the contracts continue to assert the new headers.

## Input Validation

- `/api/invite-agent` and `/api/stop-conversation` reject missing required fields with `400` before touching the SDK.
- `/api/chat/completions` parses the body inside a `try/catch`, returns `400` on invalid JSON, and refuses to start the stream if `NEXT_LLM_URL` / `NEXT_LLM_API_KEY` are missing.

## CSP / Security Headers

- `next.config.mjs` does **not** set Content-Security-Policy, HSTS, or other security headers.
- `vercel.json` has no `headers` block.
- If you need a CSP, add it via `next.config.mjs` `headers()` and verify that Agora's media servers + your TURN endpoints are allow-listed.

## Secret Handling Rules

- `.env.local` is git-ignored.
- `env.local.example` documents shape and order; do not store real values there.
- Never log full env values. `console.error('...', errorMessage)` is fine; `console.error(process.env)` is not.
- BYOK examples in `invite-agent/route.ts` are commented out — uncomment only after the matching env var is wired in Vercel.

## Known Limitations

- No rate limiting on `app/api/*`. Stick something like `@vercel/edge` rate limits in front if exposed publicly.
- The custom LLM route streams SSE without further sanitization — only point it at an LLM endpoint you control.
- CORS is implicit (Next's default same-origin). There is no global CORS middleware.

## Secret Rotation

- Rotating `NEXT_AGORA_APP_CERTIFICATE` requires redeploying — Vercel only re-reads env at build time.
- Existing tokens stay valid until their 1-hour expiry; rotating the cert does not invalidate them.
- For an emergency revoke, stop the agent via `/api/stop-conversation` and tear down the channel from the Agora dashboard.

## Threat Model Summary

The quickstart assumes:

- The deployment URL is the only trust boundary. Anyone with the URL can start an agent session.
- Vercel build env vars are not leaked to the browser.
- The Agora project is provisioned to a single tenant or environment.
- BYOK keys, if used, point at vendor accounts you control.

Anything outside that envelope — multi-tenant isolation, per-user quotas, audit logging — needs additional code beyond what ships here.

## Related Deep Dives

- [Token Model](L2/token_model.md) — Token build + renewal details.
