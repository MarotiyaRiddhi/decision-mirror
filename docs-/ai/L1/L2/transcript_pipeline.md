# Transcript Pipeline

> **When to Read This:** Load this document when you are changing how transcript turns are normalized, rendered, or filtered, or when you are wiring new RTM events into the UI.

## End-to-End Flow

```
Agora Conversational AI
    │  (transcript fragments + metrics + state)
    ▼
RTM channel ──▶ AgoraVoiceAI (toolkit)
    │
    ├─▶ TRANSCRIPT_UPDATED → normalizeTranscript → useState turns
    ├─▶ AGENT_STATE_CHANGED → mapAgentVisualizerState → useState state
    ├─▶ AGENT_METRICS → QuickstartPipelineMetrics
    ├─▶ MESSAGE_ERROR → ConversationErrorCard
    └─▶ MESSAGE_SAL_STATUS → ConnectionStatusPanel

Raw RTM `message` listener
    └─▶ JSON { object: 'message.error' | 'message.sal_status' } fallback
```

## Why the Normalization Step Exists

`AgoraVoiceAI` emits turns with `uid="0"` whenever the local user is speaking. The transcript UI splits turns by side (user vs agent) based on UID equality with `client.uid`. Without normalization, every user turn renders on the agent's side.

`lib/conversation.ts`:

```ts
export function normalizeTranscript(items: TranscriptItem[], localUid: string) {
  return items.map((item) =>
    item.uid === '0' ? { ...item, uid: localUid } : item,
  );
}
```

`ConversationComponent` passes `String(client.uid)` as `localUid` after `useJoin` reports success. If `client.uid` is still `undefined`, normalization falls through and the panel renders nothing — this is why `joinSuccess` gates `AgoraVoiceAI.init`.

## Filtering Rules

`getMessageList`:

```ts
export function getMessageList(turns: TranscriptItem[]) {
  return turns.filter((t) => t.status !== TurnStatus.IN_PROGRESS);
}
```

Only `IN_PROGRESS` is filtered. `INTERRUPTED` turns stay in the list so the UI can render them as the user's interruption + the agent's truncated reply.

`getCurrentInProgressMessage` returns the active `IN_PROGRESS` turn for live rendering at the bottom of the transcript.

## Visualizer State Mapping

`mapAgentVisualizerState(agentState)` translates `AgentState` enum values into the visualizer's three modes (idle / listening / speaking). When new agent states ship in the toolkit, extend this helper rather than branching inside components.

## Metrics Pipeline

`AGENT_METRICS` payloads carry `{ type, name, value, timestamp }`. `ConversationComponent` appends each new metric to a bounded array (the last few items, via `slice(-N)`) and passes the array to `QuickstartPipelineMetrics`. Inside `QuickstartPipelineMetrics`, a local `Map<string, QuickstartAgentMetric>` keyed on the **lowercased `type`** is rebuilt every render so each pipeline stage (STT / LLM / TTS) renders the latest metric for its `metricTypes` set. The `PIPELINE` constant maps STT to `['stt', 'asr']`, LLM to `['llm', 'mllm']`, TTS to `['tts']`.

## Raw RTM Fallback

Some issues are not exposed through `MESSAGE_ERROR` or `MESSAGE_SAL_STATUS` toolkit events yet. `ConversationComponent` also attaches a listener directly to `rtmClient` for raw `message` events:

```ts
rtmClient.addEventListener('message', (e) => {
  try {
    const payload = JSON.parse(e.message);
    if (payload.object === 'message.error') {
      // surface as connection issue
    } else if (payload.object === 'message.sal_status') {
      // surface SAL register failures
    }
  } catch { /* ignore non-JSON */ }
});
```

This is the fallback for issues like `VP_REGISTER_FAIL` / `VP_REGISTER_DUPLICATE` that may arrive as raw JSON before the toolkit normalizes them.

## Render Mode

`AgoraVoiceAI.init({ renderMode: TranscriptHelperMode.TEXT })` selects text-mode rendering. `TEXT` mode emits cumulative turn text (the full sentence as it grows). Switching to `WORD` mode would change event cadence and require the panel to handle incremental tokens.

## What `ConvoTextStream` Does Not Do

`DOCS/TEXT_STREAMING_GUIDE.md` describes the `ConvoTextStream` uikit component. The current app uses `QuickstartTranscriptPanel` instead, which is a thinner custom renderer. If you re-introduce `ConvoTextStream`:

- Make sure `messageList` includes `INTERRUPTED` turns — `ConvoTextStream` auto-opens only when there is at least one non-`IN_PROGRESS` turn.
- Keep the uid normalization step — `ConvoTextStream` relies on `uid` to choose sides.

## Failure Modes

| Symptom                                              | Cause                                                                              |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- |
| User's words show up on the agent side               | Normalization bypassed or `localUid` was empty when the turn arrived.              |
| Transcript panel never opens                         | `messageList` empty because `INTERRUPTED` was also filtered.                       |
| Metrics chips flicker between values                 | Two `AGENT_METRICS` listeners attached (probably re-init under StrictMode).        |
| `MESSAGE_ERROR` issues never display                 | Listener attached before `AgoraVoiceAI` was created — re-check init ordering.      |

## See Also

- [Back to Architecture](../02_architecture.md)
- [Back to Conventions](../04_conventions.md)
- [Back to Gotchas](../07_gotchas.md)
- [StrictMode Lifecycle](strict_mode_lifecycle.md)
