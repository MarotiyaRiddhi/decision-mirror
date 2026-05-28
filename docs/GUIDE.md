# Build Guide

This guide walks through how the quickstart is assembled from the tracked source. Use it when changing the starter flow, onboarding copy, or recipe extension points.

## What This App Builds

The app is a single Next.js 16 App Router project that runs both the browser voice UI and the server routes needed to start an Agora managed agent session.

Core path:

1. `app/page.tsx` renders `components/LandingPage.tsx`.
2. `LandingPage` fetches a token from `/api/generate-agora-token`.
3. `LandingPage` starts `/api/invite-agent` and RTM login/subscription in parallel.
4. `ConversationComponent` joins RTC, publishes the mic, initializes `AgoraVoiceAI`, and renders transcript/metrics/status UI.
5. Ending the call invokes `/api/stop-conversation`, logs out RTM, and unmounts the RTC view so Agora hooks clean up media resources.

## Prerequisites

- Node.js `>=22`
- `pnpm`
- Agora CLI
- Agora project with Conversational AI enabled

Required env vars:

```bash
NEXT_PUBLIC_AGORA_APP_ID=
NEXT_AGORA_APP_CERTIFICATE=
```

Optional quickstart customization:

```bash
NEXT_PUBLIC_AGENT_UID=123456
NEXT_AGENT_GREETING=
NEXT_DEEPGRAM_API_KEY=
NEXT_LLM_URL=https://api.openai.com/v1/chat/completions
NEXT_LLM_API_KEY=
NEXT_ELEVENLABS_API_KEY=
NEXT_ELEVENLABS_VOICE_ID=
```

## Run From a Clone

```bash
pnpm install
agora login
agora project use <your-project>
agora project env write .env.local
agora project doctor --deep
pnpm run dev
```

Open `http://localhost:3000` and start a conversation from the pre-call card.

## Route Layer

`app/api/generate-agora-token/route.ts` mints one token string with both RTC and RTM privileges through `RtcTokenBuilder.buildTokenWithRtm`. Keep this builder; RTC-only tokens break RTM transcript, state, and metrics events.

`app/api/invite-agent/route.ts` configures the managed agent. The default chain is Deepgram STT, OpenAI LLM, and MiniMax TTS using Agora-managed provider access. Edit this route for the system prompt, greeting, VAD settings, provider models, or BYOK examples.

`app/api/stop-conversation/route.ts` terminates the managed agent session. It treats already-stopping and not-found agent states as successful teardown so the browser can return to the pre-call state.

`app/api/chat/completions/route.ts` is an optional OpenAI-compatible SSE proxy for a custom LLM path. It is not part of the default runtime unless the invite route is changed to call it.

## Browser Runtime

`LandingPage` owns:

- pre-call UI state
- initial token request
- agent invite request
- RTM client creation, login, subscription, renewal, and logout
- dynamic browser-only RTC provider

`ConversationComponent` owns:

- RTC join through `useJoin`
- local mic track through `useLocalMicrophoneTrack`
- mic publication through `usePublish`
- `AgoraVoiceAI.init`
- transcript, agent state, metrics, and connection issue state
- token-renewal event handling

React StrictMode matters here. Keep the `isReady` timer guard around `useJoin` and `useLocalMicrophoneTrack`, and let the Agora React hooks own leave, unpublish, and track cleanup.

## Transcript and Metrics Flow

Transcript, state, metrics, and errors arrive over RTM through `AgoraVoiceAI` events. `ConversationComponent` stores raw turns and events, while `lib/conversation.ts` normalizes display data.

Important invariants:

- remap toolkit `uid="0"` to the real local RTC UID
- filter only `IN_PROGRESS` from message history
- keep `INTERRUPTED` turns in history
- normalize punctuation spacing and timestamps before rendering
- keep raw RTM fallback parsing for `message.error` and `message.sal_status`

## Customize the Agent

For a basic persona change, edit `ADA_PROMPT` and `GREETING` in `app/api/invite-agent/route.ts`.

For VAD changes, edit `turnDetection.config.start_of_speech` and `turnDetection.config.end_of_speech`. Do not use the deprecated flat `turnDetection.type: 'agora_vad'` shape.

For BYOK, enable the commented provider block in the invite route and add the matching env vars to `.env.local`, Vercel, `env.local.example`, and README.

## Verify Changes

Use narrow checks while iterating:

```bash
pnpm run lint
pnpm run typecheck
pnpm run verify:api
pnpm run build
```

Before shipping:

```bash
pnpm run verify
```

`pnpm run verify` runs doctor, lint, typecheck, API contract verification, and production build. It requires local env binding because `doctor` reads `.env.local`.

## Docs to Keep Aligned

When workflow, interface, environment, lifecycle, or recipe-contract behavior changes, update:

- `README.md`
- `docs/GUIDE.md`
- `docs/TEXT_STREAMING_GUIDE.md`
- `AGENTS.md`
- `docs/ai/L0_repo_card.md`
- affected `docs/ai/L1/*.md`
- affected `docs/ai/L1/L2/*.md`
- `docs/ai/RECIPE.md` when extension points, invariants, or stable contracts change
