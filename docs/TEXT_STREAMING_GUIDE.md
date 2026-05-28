# Text Streaming Guide

This guide documents how live transcript, agent state, metrics, and signaling errors move from Agora RTM into the quickstart UI.

## Transport Model

The browser joins one Agora RTC channel for audio and uses Agora RTM as the data channel. The token route must use `RtcTokenBuilder.buildTokenWithRtm` so the same signed token can authorize both the RTC join and RTM login.

`LandingPage` logs into RTM and subscribes to the conversation channel before `ConversationComponent` mounts. That ordering matters because `AgoraVoiceAI.init` immediately subscribes to message events after the RTC join succeeds.

## Toolkit Initialization

`ConversationComponent` initializes `AgoraVoiceAI` only after:

- the StrictMode `isReady` guard is true
- `useJoin` reports `joinSuccess`
- the RTM client is already logged in and subscribed

The toolkit is initialized with `TranscriptHelperMode.TEXT` and the existing RTC/RTM engines. Cleanup calls `unsubscribe()` and `destroy()` on the toolkit instance.

## Transcript Events

`AgoraVoiceAIEvents.TRANSCRIPT_UPDATED` provides transcript helper items. The component stores those raw items, then derives render-ready messages through `lib/conversation.ts`.

Normalization rules:

- `uid === "0"` is the toolkit sentinel for local-user speech and must be remapped to `client.uid`
- compact punctuation such as `Hello.World` is normalized for display
- timestamps are normalized to milliseconds
- `IN_PROGRESS` turns render separately as the live partial bubble
- completed and `INTERRUPTED` turns stay in `messageList`

Keeping `INTERRUPTED` turns is intentional. If an agent's first turn is interrupted and omitted, the transcript can appear empty even though a real turn happened.

## Rendering

`QuickstartTranscriptPanel` receives:

- `messageList`: completed and interrupted history
- `currentInProgressMessage`: active partial turn, or `null`
- `agentUID`: used to decide whether a turn is labeled as agent or user

The panel appends the in-progress message to the visible list and scrolls to the bottom on updates.

## Agent State and Visualizer

`AgoraVoiceAIEvents.AGENT_STATE_CHANGED` updates the semantic agent state. `mapAgentVisualizerState` combines that state with RTC connection state and agent presence.

Transport state takes priority:

- disconnected/disconnecting -> `disconnected`
- connecting/reconnecting -> `joining`
- connected without agent presence -> `not-joined`
- otherwise semantic states map to listening, analyzing, talking, or ambient

This prevents the UI from showing optimistic speaking/listening states during reconnects.

## Metrics

`AgoraVoiceAIEvents.AGENT_METRICS` feeds `QuickstartPipelineMetrics`. The component keeps the recent metric window and displays latest stage latency for the default pipeline labels:

- Deepgram STT
- OpenAI LLM
- MiniMax TTS

If provider defaults change, update both the invite route and metric labels/docs.

## Error and SAL Status Events

The quickstart records issues from:

- `MESSAGE_ERROR`
- `AGENT_ERROR`
- `MESSAGE_SAL_STATUS`
- raw RTM `message` fallback parsing for `message.error`
- raw RTM `message` fallback parsing for `message.sal_status`

`VP_REGISTER_FAIL` and `VP_REGISTER_DUPLICATE` are surfaced because they indicate RTM registration/subscription trouble. Connection issue records are deduplicated over a short time window to avoid noisy cascades.

## Debug Checklist

If transcript is missing:

1. Confirm `/api/generate-agora-token` still uses `buildTokenWithRtm`.
2. Confirm RTM login and channel subscription complete before `ConversationComponent` mounts.
3. Confirm `AgoraVoiceAI.init` is gated on `isReady && joinSuccess`.
4. Confirm the `uid="0"` remap still happens before rendering.
5. Inspect `ConnectionStatusPanel` for RTM, SAL, or agent error issues.

If speaker sides are inverted, inspect `normalizeTranscript` in `lib/conversation.ts` and the `agentUID` passed to `QuickstartTranscriptPanel`.
