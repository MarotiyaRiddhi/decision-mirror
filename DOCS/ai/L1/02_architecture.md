# 02 Architecture

> Single-deployment Next.js app: browser RTC + RTM client talks to colocated `app/api/*` route handlers, which start the managed Agora agent via the server SDK.

## High-Level Topology

```
        Browser tab                       Next.js (Vercel / localhost:3000)
    ┌──────────────────────┐          ┌────────────────────────────────────┐
    │  components/         │  fetch   │  app/api/generate-agora-token      │
    │   LandingPage.tsx    │ ───────▶ │   → RtcTokenBuilder.buildTokenWithRtm
    │   ConversationCmp.tsx│          │  app/api/invite-agent              │
    │                      │ ◀─────── │   → agora-agent-server-sdk          │
    │  agora-rtc-react     │  JSON    │  app/api/stop-conversation         │
    │  agora-rtm           │          │  app/api/chat/completions          │
    │  AgoraVoiceAI        │          └────────────────────────────────────┘
    └────────┬──────┬──────┘                          │
             │      │ RTM                             │ HTTPS
             │ RTC  │ data                            ▼
             ▼      ▼                          Agora Conversational AI
       Agora media + RTM cloud                 (managed STT/LLM/TTS)
```

## Voice Session Lifecycle

1. `LandingPage` calls `GET /api/generate-agora-token` and receives `{ token, uid, channel }`.
2. In parallel:
   - `POST /api/invite-agent` with `{ requester_id: uid, channel_name: channel }` starts the managed agent (non-fatal on failure).
   - `new AgoraRTM.RTM(appId, uid).login({ token })` then `subscribe(channel)`.
3. `ConversationComponent` mounts inside a dynamic `AgoraRTCProvider`:
   - `useJoin({ appid, channel, token, uid })` joins the RTC channel.
   - `useLocalMicrophoneTrack` + `usePublish` start mic publishing.
   - After `isReady && joinSuccess`, `AgoraVoiceAI.init({ rtcEngine, rtmConfig: { rtmEngine }, renderMode: TranscriptHelperMode.TEXT })` wires transcripts/state/metrics.
4. RTM also receives raw `message.error` / `message.sal_status` JSON as a fallback for issues not surfaced by toolkit events.
5. Ending the call: unpublish mic → `POST /api/stop-conversation { agent_id }` → `rtmClient.logout()`.
6. Token renewal: on RTC `token-privilege-will-expire`, `LandingPage` fetches two new tokens (one for RTC uid, one for the stored `agoraData.uid`) and renews both RTC + RTM.

## Key Abstractions

| Abstraction                  | Where it lives                                | Role                                                                |
| ---------------------------- | --------------------------------------------- | ------------------------------------------------------------------- |
| `AgoraVoiceAI`               | `agora-agent-client-toolkit`                  | Orchestrates transcript, agent state, and metrics over RTC + RTM.   |
| `AgoraRTCProvider`           | `agora-rtc-react` (dynamic import)            | Wraps the RTC client; `client` is held in `useRef` to survive HMR.  |
| `isReady` guard              | `components/ConversationComponent.tsx`        | Defers hook activation past React StrictMode's fake-unmount cycle.  |
| Managed agent session        | `app/api/invite-agent/route.ts`               | `Agent(...).withStt().withLlm().withTts()` + `agent.createSession`. |
| Transcript normalization     | `lib/conversation.ts`                         | Remaps uid `"0"` to local UID, keeps `INTERRUPTED` turns visible.   |

## Tech Stack (versions from `package.json`)

- `next` ^16.2.6, `react`/`react-dom` ^19.0.0, `tailwindcss` ^3.4.17
- `agora-rtc-sdk-ng` ^4.24.3, `agora-rtc-react` ^2.5.1, `agora-rtm` ^2.2.3
- `agora-agent-client-toolkit` 1.2.0, `agora-agent-uikit` 1.1.0
- `agora-agent-server-sdk` ^1.3.2 (server-side, route handlers only)
- `agora-token` ^2.0.5 (server-side, token builder)

## Why This Shape

- Single Next.js deployable keeps copyable for newcomers — no separate backend to host.
- Route handlers keep `NEXT_AGORA_APP_CERTIFICATE` and any BYOK keys off the browser.
- Managed STT/LLM/TTS defaults remove the need for vendor accounts in the base quickstart.

## Process Boundary Summary

| Concern                          | Runs in browser | Runs in route handler |
| -------------------------------- | --------------- | --------------------- |
| RTC join / mic publish           | Yes             | No                    |
| RTM login / subscribe            | Yes             | No                    |
| `AgoraVoiceAI` transcript wiring | Yes             | No                    |
| Token generation (cert read)     | No              | Yes                   |
| Managed agent start / stop       | No              | Yes                   |
| Custom LLM proxy (optional)      | No              | Yes (SSE)             |

## What This Quickstart Does NOT Do

- No global state library (no Zustand / Redux / React Query). Component-local `useState` + props is the only pattern.
- No per-user authentication. The threat model assumes the deployment is gated upstream.
- No middleware. `middleware.ts` does not exist.
- No service worker or push notifications.

## Related Deep Dives

- [StrictMode Lifecycle](L2/strict_mode_lifecycle.md) — How `isReady`, hook ownership, and `AgoraVoiceAI.init` cooperate.
- [Invite Agent Config](L2/invite_agent_config.md) — Full surface of the managed agent payload.
- [Token Model](L2/token_model.md) — Token build + renewal semantics.
