---
recipe_version: 0.1.0
recipe_status: stable
extension_points:
  - id: api.routes
    name: API routes
  - id: prompts.system
    name: system prompt surface
  - id: pipeline.providers
    name: managed and BYOK provider chain
  - id: ui.conversation
    name: pre-call and in-call UI
invariants:
  - id: tokens.rtc-rtm
    summary: token route issues combined RTC and RTM tokens
  - id: lifecycle.strict-mode
    summary: RTC join and mic setup remain StrictMode-safe
  - id: transcript.uid-remap
    summary: toolkit local-user UID sentinel is remapped before rendering
stable_contracts:
  - id: env.required
    summary: NEXT_PUBLIC_AGORA_APP_ID and NEXT_AGORA_APP_CERTIFICATE
  - id: api.start-stop
    summary: token, invite-agent, and stop-conversation route contracts
---

# Quickstart Recipe Profile

This repo is a reusable quickstart sample for building browser voice-agent experiences with Agora Conversational AI Engine.

## Recipe Role

- Role: `base` quickstart recipe.
- Target audience: developers bootstrapping a production-style Next.js voice agent app.
- Reuse model: clone, bind project, run, then customize prompt/pipeline/UI.

## Recipe Scope

This base recipe provides a copyable browser voice-agent starter with:

- browser RTC audio and RTM event transport
- server-side token, invite, stop, and optional custom LLM routes
- managed default STT, LLM, and TTS provider configuration
- pre-call, in-call, transcript, metrics, and connection-status UI

## Build From Scratch Map

Use this section when implementing the recipe in a new repo instead of modifying this one.

| Need | Read First | Deep Detail | Source Reference |
| --- | --- | --- | --- |
| Project setup, commands, env vars | [L1/01_setup.md](L1/01_setup.md) | [../GUIDE.md](../GUIDE.md) | `package.json`, `env.local.example` |
| End-to-end architecture and data flow | [L1/02_architecture.md](L1/02_architecture.md) | [L1/L2/conversation_lifecycle.md](L1/L2/conversation_lifecycle.md) | `components/LandingPage.tsx`, `components/ConversationComponent.tsx` |
| File/module responsibilities | [L1/03_code_map.md](L1/03_code_map.md) | none | `app/api`, `components`, `lib`, `types` |
| API payloads and response shapes | [L1/06_interfaces.md](L1/06_interfaces.md) | [L1/L2/token_model.md](L1/L2/token_model.md), [L1/L2/invite_agent_config.md](L1/L2/invite_agent_config.md) | `app/api/*/route.ts`, `types/conversation.ts` |
| Agora SDK lifecycle rules | [L1/04_conventions.md](L1/04_conventions.md) | [L1/L2/strict_mode_lifecycle.md](L1/L2/strict_mode_lifecycle.md) | `components/ConversationComponent.tsx` |
| Transcript, metrics, and RTM behavior | [L1/07_gotchas.md](L1/07_gotchas.md) | [L1/L2/transcript_pipeline.md](L1/L2/transcript_pipeline.md), [../TEXT_STREAMING_GUIDE.md](../TEXT_STREAMING_GUIDE.md) | `lib/conversation.ts`, transcript/metrics components |
| Security and secret boundaries | [L1/08_security.md](L1/08_security.md) | [L1/L2/token_model.md](L1/L2/token_model.md) | token, invite, and stop API routes |
| Validation expectations | [L1/05_workflows.md](L1/05_workflows.md) | none | `scripts/verify-api-contracts.ts` |

## Minimum Implementation Checklist

To recreate this quickstart from scratch, implement these pieces in order:

1. Create a Next.js App Router project with React, TypeScript, Tailwind, and the Agora dependencies from `package.json`.
2. Add `env.local.example` with `NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_AGORA_APP_CERTIFICATE`, optional `NEXT_PUBLIC_AGENT_UID`, optional `NEXT_AGENT_GREETING`, and BYOK examples.
3. Implement `GET /api/generate-agora-token` with `RtcTokenBuilder.buildTokenWithRtm`; return `{ token, uid, channel }` and replace invalid or zero UIDs.
4. Implement `POST /api/invite-agent` with `AgoraClient`, `Agent`, managed `DeepgramSTT`, `OpenAI`, `MiniMaxTTS`, RTM enabled, metrics enabled, and `{ requester_id, channel_name }` input.
5. Implement `POST /api/stop-conversation` with idempotent already-stopping/not-found handling.
6. Implement optional `POST /api/chat/completions` only when exposing a custom LLM SSE proxy.
7. Implement `LandingPage` to fetch token, start the agent, log into RTM, subscribe to the channel, mount the conversation, renew tokens, and log out RTM on end.
8. Implement `ConversationComponent` with StrictMode-safe `isReady`, `useJoin`, `useLocalMicrophoneTrack`, `usePublish`, `AgoraVoiceAI.init`, event subscriptions, token renewal, and hook-owned teardown.
9. Implement transcript helpers that remap `uid="0"` to the local RTC UID, normalize spacing/timestamps, keep `INTERRUPTED`, and render `IN_PROGRESS` separately.
10. Add API contract verification for token, invite, stop, and optional custom LLM behavior.

## Extension Points

- `api.routes`: add browser-facing routes under `app/api`, with shared request/response types in `types/conversation.ts` when the client consumes them.
- `prompts.system`: edit `ADA_PROMPT` and `GREETING` in `app/api/invite-agent/route.ts`.
- `pipeline.providers`: adjust the `DeepgramSTT`, `OpenAI`, and `MiniMaxTTS` builder chain, or enable the commented BYOK blocks.
- `ui.conversation`: customize `QuickstartPreCallCard`, `QuickstartConversationLayout`, `QuickstartTranscriptPanel`, and `QuickstartPipelineMetrics`.

## Invariants

- Keep `RtcTokenBuilder.buildTokenWithRtm` for RTM-capable tokens.
- Preserve StrictMode `isReady` guard for join/mic initialization.
- Preserve UID remap (`uid="0"`) and `INTERRUPTED` message-list inclusion.
- Keep documentation synchronized when workflows/contracts change.

## Stable Contracts

- `GET /api/generate-agora-token` returns `{ token, uid, channel }`.
- `POST /api/invite-agent` accepts `{ requester_id, channel_name }` and returns the agent id/state payload.
- `POST /api/stop-conversation` accepts `{ agent_id }` and treats already-stopping sessions as success.
- Required env vars are `NEXT_PUBLIC_AGORA_APP_ID` and `NEXT_AGORA_APP_CERTIFICATE`.
- `components/LandingPage.tsx` owns pre-call bootstrap and RTM client lifecycle.
- `components/ConversationComponent.tsx` owns joined-session RTC/toolkit lifecycle.
- `lib/conversation.ts` owns transcript normalization helpers.

## Internal / Subject to Change

- Visual styling and copy in the quickstart UI.
- The exact reseller defaults for STT, LLM, and TTS models.
- Connection issue display heuristics and metric chip presentation.

## Consumer Onboarding Recipe

1. Clone or scaffold from template.
2. Bind Agora project and write `.env.local`.
3. Run `pnpm run doctor` and `pnpm run dev`.
4. Validate with `pnpm run verify` before sharing modifications.
5. Customize agent behavior and UI using the supported surfaces above.
