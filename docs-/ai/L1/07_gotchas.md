# 07 Gotchas

> Concrete pitfalls that have been hit before. Read this before refactoring real-time code.

## StrictMode Double-Mount

React 19 StrictMode mounts, unmounts, and remounts components in dev. RTC hooks initialized eagerly would join twice, publish twice, and `AgoraVoiceAI.init` would race itself.

- `useJoin` and `useLocalMicrophoneTrack` MUST be gated by `isReady` (`components/ConversationComponent.tsx`).
- The RTC `client` MUST be held in `useRef` inside a dynamic `AgoraRTCProvider` — switching to `useMemo` re-creates the client and breaks `useJoin`'s cleanup.
- Never set `reactStrictMode: false` in `next.config.mjs` as a workaround.

## `uid="0"` Sentinel

The toolkit emits `uid="0"` for the local user's turns. `lib/conversation.ts` `normalizeTranscript` remaps `'0'` → `String(client.uid)` before the transcript renders. Bypassing this remap (or returning early before it runs) puts user speech on the agent's side of the transcript.

## `INTERRUPTED` Turns Must Stay in the List

`getMessageList` only filters `TurnStatus.IN_PROGRESS`. If you also exclude `INTERRUPTED` turns, an interrupted first turn means `messageList` is empty and the transcript panel never opens.

## Token Builder Requirement

`/api/generate-agora-token` MUST use `RtcTokenBuilder.buildTokenWithRtm`. A standard RTC-only token does **not** grant RTM access, and RTM login will fail with no obvious error. `scripts/verify-api-contracts.ts` mocks this exact symbol; do not swap to `buildTokenWithUid` or similar.

## Tailwind Must Scan UIKit `dist`

`tailwind.config.ts` `content` includes `./node_modules/agora-agent-uikit/dist/**/*.{js,mjs}`. Removing it strips uikit's runtime Tailwind classes and the visualizer + buttons render unstyled.

## VAD API Shape

Use `turnDetection.config.start_of_speech` and `turnDetection.config.end_of_speech`. The deprecated flat `turnDetection.type: 'agora_vad'` is rejected by current SDK versions — the agent session will fail to start with a vague error.

## Audio PTS Parameter

`ConversationComponent` sets `AgoraRTC.setParameter('ENABLE_AUDIO_PTS', true)` at module scope. This is intentional — it improves transcript timing. If you remove or duplicate the call, transcripts may desync or warn in dev.

## Doc Drift to Watch For

- `DOCS/TEXT_STREAMING_GUIDE.md` mentions `ConvoTextStream` and "uid=0 token" renewal. The current code uses `QuickstartTranscriptPanel` and renews with `agoraData.uid`. Treat the doc as background reading, not implementation truth.
- `DOCS/GUIDE.md` has scaffolding excerpts older than the current `components/` layout.
- Root `AGENTS.md` and `app/api/AGENTS.md` reference `chat/route.ts`; the actual file is `app/api/chat/completions/route.ts`.

## Missing Static Assets

`app/layout.tsx` and `public/site.webmanifest` reference favicon PNGs (`favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`, `android-chrome-*.png`) that are not in `public/`. Adding the files is fine; do not change `layout.tsx` to drop the references unless you also update the manifest.

## Unused Tree Branches

- `hooks/use-mobile.tsx` exports `useIsMobile` but nothing imports it.
- `styles/globals.css` is shadcn baseline output but `app/layout.tsx` imports `./globals.css` instead. Treat `styles/globals.css` as legacy and avoid editing it.

## `app/api/chat/completions/route.ts` Is Not Wired

The route compiles and is contract-tested, but `components/` does not call it. Voice agents use the LLM configured in `invite-agent/route.ts`, not this route. Wiring it requires pointing the managed agent at the route's URL — see `05_workflows.md`.

## PostCSS Plugin Set

`postcss.config.mjs` only lists the `tailwindcss` plugin. `autoprefixer` is a `package.json` dependency but is not enabled. If you need vendor prefixes, add `autoprefixer` to `postcss.config.mjs` rather than installing it again.

## RTC Module-Level Parameters

`ConversationComponent` calls `AgoraRTC.setParameter('ENABLE_AUDIO_PTS', true)` at module scope. Module-scope side effects bypass StrictMode but also bypass `useEffect` cleanup — any new `AgoraRTC.setParameter` belongs alongside this one, not inside a component effect.

## Idempotent Stop Path

`/api/stop-conversation` returns `200 { success: true, state: 'already-stopping' }` when the SDK reports the agent was already stopping. Treat both `success: true` shapes as success on the client; do not branch UI on the missing `state` field.

## RTM Renewal Uses `agoraData.uid`, Not RTC `uid`

`handleTokenWillExpire` fetches two tokens with different `uid` query parameters. The RTM renewal token uses `agoraData.uid` (the original logged-in UID), not the RTC `client.uid`. Swapping them silently breaks renewal because RTM rejects tokens that do not match the logged-in account.

## Doctor Script Hard Fails

`scripts/doctor.mjs` exits with code `1` rather than warning. CI and `pnpm run verify` both treat that as fatal. If you intentionally want to skip the doctor (e.g. in a partial CI job), run the narrower `pnpm run lint` / `pnpm run typecheck` / `pnpm run verify:api` / `pnpm run build` chain directly.

## Build Command Uses Webpack, Not Turbopack

`pnpm run dev` runs `next dev --webpack`. The Next 16 default is Turbopack, but this repo opts out for parity with the build pipeline. If you switch to Turbopack you may see different HMR behavior and slightly different module resolution; verify `pnpm run build` still passes before merging.

## Related Deep Dives

- [StrictMode Lifecycle](L2/strict_mode_lifecycle.md) — Why the `isReady` pattern looks the way it does.
- [Transcript Pipeline](L2/transcript_pipeline.md) — Detailed walkthrough of normalization and event handlers.
