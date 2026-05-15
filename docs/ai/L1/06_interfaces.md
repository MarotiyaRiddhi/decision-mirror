# 06 Interfaces

> Boundary contracts: API routes, environment variables, RTM events, and managed agent defaults.

## API Routes

| Path                          | Method | Request                                                       | Success (200)                                              | Error responses                                              |
| ----------------------------- | ------ | ------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------ |
| `/api/generate-agora-token`   | GET    | Query: optional `uid`, optional `channel`                     | `{ token, uid, channel }` (uid as string)                  | `500 { error: 'Agora credentials are not set' }` / `500 { error, details? }` |
| `/api/invite-agent`           | POST   | `{ requester_id, channel_name }` (`ClientStartRequest`)       | `{ agent_id, create_ts, state: 'RUNNING' }`                | `400 { error: 'channel_name and requester_id are required' }` / `500 { error }` |
| `/api/stop-conversation`      | POST   | `{ agent_id }` (`StopConversationRequest`)                    | `{ success: true }` or `{ success: true, state: 'already-stopping' }` | `400 { error: 'agent_id is required' }` / `500 { error }`        |
| `/api/chat/completions`       | POST   | OpenAI-compatible body; `messages` consumed, `model` ignored  | `text/event-stream` SSE chunks then `data: [DONE]`         | `400 { error: 'Invalid JSON body' }` / `500 { error: 'NEXT_LLM_API_KEY and NEXT_LLM_URL must be set' }` |

> `chat/completions` is covered by `scripts/verify-api-contracts.ts` for missing env, invalid JSON, base URL normalization, pinned model routing, streamed chunks, and final `data: [DONE]`.

Types live in `types/conversation.ts`: `AgoraTokenData`, `ClientStartRequest`, `StopConversationRequest`, `AgentResponse`, `AgoraRenewalTokens`, `ConversationComponentProps`.

## Environment Variables

| Scope         | Variable                                                                                              |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| Public        | `NEXT_PUBLIC_AGORA_APP_ID`, `NEXT_PUBLIC_AGENT_UID` (optional)                                        |
| Server-only   | `NEXT_AGORA_APP_CERTIFICATE`, `NEXT_AGENT_GREETING`, `NEXT_DEEPGRAM_API_KEY`, `NEXT_LLM_URL`, `NEXT_LLM_API_KEY`, `NEXT_ELEVENLABS_API_KEY`, `NEXT_ELEVENLABS_VOICE_ID` |
| Build-time    | `NEXT_PUBLIC_VERCEL_URL` (mapped in `vercel.json` from `${VERCEL_URL}`; not currently read in code)   |

## Token Shape

`/api/generate-agora-token` returns `{ token, uid, channel }`. `EXPIRATION_TIME_IN_SECONDS = 3600` (one hour). The token is built with `RtcTokenBuilder.buildTokenWithRtm`, so it grants both RTC and RTM privileges — see [Token Model](L2/token_model.md).

## RTM Event Contracts

`AgoraVoiceAI` emits these toolkit events that the UI subscribes to:

| Event                    | Payload (informal)                                              | Consumed in                              |
| ------------------------ | --------------------------------------------------------------- | ---------------------------------------- |
| `TRANSCRIPT_UPDATED`     | Array of turns with `uid`, `text`, `status`, `timestamp`        | `ConversationComponent` → transcript     |
| `AGENT_STATE_CHANGED`    | `AgentState` enum value                                         | Visualizer + status display              |
| `AGENT_METRICS`          | `{ type, name, value, timestamp }`                              | `QuickstartPipelineMetrics`              |
| `MESSAGE_ERROR`          | `{ module, code, message, send_ts }`                            | `ConversationErrorCard`                  |
| `MESSAGE_SAL_STATUS`     | `{ status, timestamp }`                                         | `ConnectionStatusPanel`                  |
| `AGENT_ERROR`            | SDK error info                                                  | Logged + surfaced as issue               |

Raw RTM fallback (subscribing directly on `rtmClient`): JSON messages with `object: 'message.error'` or `object: 'message.sal_status'`. The fallback exists for issues not yet surfaced by toolkit events.

## Managed Agent Defaults (invite-agent)

From `app/api/invite-agent/route.ts`:

| Field                            | Default value                                                                |
| -------------------------------- | ---------------------------------------------------------------------------- |
| `instructions`                   | `ADA_PROMPT` constant                                                         |
| `greeting`                       | `GREETING` constant or `NEXT_AGENT_GREETING`                                  |
| `failureMessage`                 | `'Please wait a moment.'`                                                     |
| `maxHistory`                     | `50`                                                                          |
| `turnDetection.config`           | `start_of_speech` + `end_of_speech` VAD                                       |
| `advancedFeatures`               | `{ enable_rtm: true, enable_tools: true }`                                    |
| `parameters`                     | `{ data_channel: 'rtm', enable_error_message: true, enable_metrics: true }`  |
| STT                              | `DeepgramSTT { model: 'nova-3' }`                                             |
| LLM                              | `OpenAI { model: 'gpt-4o-mini' }`                                             |
| TTS                              | `MiniMaxTTS { model: 'speech_2_6_turbo', voiceId: 'English_captivating_female1' }` |
| Session `idleTimeout`            | `30`                                                                          |
| Session `expiresIn`              | `ExpiresIn.hours(1)`                                                          |
| `remoteUids`                     | `[requester_id]`                                                              |
| `area`                           | `Area.US`                                                                     |

## Browser-Side Contracts

- `LandingPage` expects `/api/generate-agora-token` to return `uid` as a string but parses it numerically when joining RTC.
- `ConversationComponent` expects `agoraData.channel` and `agoraData.uid` from `LandingPage` and uses both for renewal fetches.

## Internal Types

| Type                          | Lives in                          | Used by                                    |
| ----------------------------- | --------------------------------- | ------------------------------------------ |
| `AgoraTokenData`              | `types/conversation.ts`           | `LandingPage`, `ConversationComponent`     |
| `ClientStartRequest`          | `types/conversation.ts`           | `app/api/invite-agent/route.ts`, browser   |
| `StopConversationRequest`     | `types/conversation.ts`           | `app/api/stop-conversation/route.ts`       |
| `AgentResponse`               | `types/conversation.ts`           | Invite-agent route + browser handler       |
| `AgoraRenewalTokens`          | `types/conversation.ts`           | `handleTokenWillExpire`                    |
| `ConversationComponentProps`  | `types/conversation.ts`           | `LandingPage` → `ConversationComponent`    |

## Related Deep Dives

- [Invite Agent Config](L2/invite_agent_config.md) — Full managed agent payload + BYOK examples.
- [Token Model](L2/token_model.md) — Token build + renewal details.
- [Transcript Pipeline](L2/transcript_pipeline.md) — Event handlers and `lib/conversation.ts` helpers.
