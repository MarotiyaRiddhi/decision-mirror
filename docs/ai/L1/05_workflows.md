# 05 Workflows

> Step-by-step recipes for the tasks contributors actually do in this repo.

## Add a New API Route

1. Create `app/api/<name>/route.ts` with the desired HTTP verb export (`GET`, `POST`, …).
2. Validate inputs and return `NextResponse.json(...)` with explicit status codes; follow the patterns in `app/api/invite-agent/route.ts`.
3. Add types to `types/conversation.ts` (or a new file under `types/`) so client callers stay typed.
4. If the browser will call the route, add a fetch wrapper or call site in `components/LandingPage.tsx` / `ConversationComponent.tsx`.
5. Extend `scripts/verify-api-contracts.ts` with at least one happy-path and one validation case for the route.
6. Run `pnpm run verify:api`, then `pnpm run verify`.

## Change Agent Prompt, VAD, Model, or Voice

Edit `app/api/invite-agent/route.ts`:

- **Prompt:** modify the `ADA_PROMPT` constant at the top of the file.
- **Greeting:** modify `GREETING` (or set `NEXT_AGENT_GREETING` in the deployment env).
- **VAD:** edit the `turnDetection.config` block — keep `start_of_speech` and `end_of_speech` nested; do **not** revert to the deprecated flat `turnDetection.type: 'agora_vad'`.
- **LLM:** change the `.withLlm(new OpenAI({...}))` constructor (model name, temperature, max tokens).
- **STT:** change `.withStt(new DeepgramSTT({...}))` (model, language).
- **TTS:** change `.withTts(new MiniMaxTTS({...}))` (model, `voiceId`).

After editing, run `pnpm run verify:api` (mocks the SDK) and `pnpm run typecheck`.

## Wire the Custom-LLM Route

`app/api/chat/completions/route.ts` ships as an OpenAI-compatible SSE proxy but is **not** consumed by the browser today.

1. Set `NEXT_LLM_URL` and `NEXT_LLM_API_KEY`.
2. Point the managed agent at the route by updating `invite-agent/route.ts` to pass a custom LLM endpoint (replace the `OpenAI` constructor with the route's URL).
3. Test with `curl -N -X POST http://localhost:3000/api/chat/completions ...`.

## Verify Locally

```bash
pnpm run lint
pnpm run typecheck
pnpm run verify:api
pnpm run build
pnpm run verify        # runs all of the above
```

None of these require live Agora credentials. `pnpm run dev` is the only command that hits the network and Agora services.

## Deploy to Vercel

1. Push the branch and open it in Vercel.
2. In Vercel project settings → Environment Variables, paste in `NEXT_PUBLIC_AGORA_APP_ID` and `NEXT_AGORA_APP_CERTIFICATE` (mark the certificate **Sensitive**).
3. Optional: add `NEXT_AGENT_GREETING`, `NEXT_PUBLIC_AGENT_UID`, or any BYOK vendor keys you have wired.
4. The `vercel.json` `buildCommand` / `installCommand` already use `pnpm`.
5. Trigger a build; the production URL serves both the UI and `app/api/*` route handlers.

## Handle Token Renewal

Token renewal is automatic — `ConversationComponent` listens for the RTC `token-privilege-will-expire` event and calls `handleTokenWillExpire` in `LandingPage`, which fetches two new tokens (one for the RTC uid, one for the RTM uid) and renews each client. If you change UID handling, update `handleTokenWillExpire` in lockstep.

## Update Module Guides After Behavior Changes

If you change `components/`, `app/api/`, or `lib/` behavior in a meaningful way, also update:

- `README.md`
- `docs/GUIDE.md` or `docs/TEXT_STREAMING_GUIDE.md` if the user-facing flow changed
- The relevant file in `docs/ai/L1/` and the `Last Reviewed` field in `docs/ai/L0_repo_card.md`

## Roll Back a Bad Deploy

1. In Vercel, open the project's Deployments tab.
2. Find the last green production deployment.
3. Click "Promote to Production" — Vercel keeps prior builds reachable without rebuilding.
4. Open a `fix/` branch to address the regression; the rollback itself is not committed.

## Refresh Static Assets

`public/site.webmanifest` and `app/layout.tsx` reference favicon PNGs that are present in `public/` today. To refresh them:

1. Place the new files under `public/` (the names already referenced are `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-192x192.png`, `android-chrome-512x512.png`).
2. Confirm `app/layout.tsx` icon block still matches.
3. Re-run `pnpm run build` to surface 404s on any missed paths.

## Related Deep Dives

- [Invite Agent Config](L2/invite_agent_config.md) — Full managed agent payload reference.
- [Token Model](L2/token_model.md) — Build + renewal sequence.
