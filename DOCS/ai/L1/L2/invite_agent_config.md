# Invite Agent Config

> **When to Read This:** Load this document when you are changing the agent's prompt, voice, VAD behavior, model selection, or wiring a bring-your-own-key (BYOK) provider.

## Where It Lives

All of the managed agent configuration is built in `app/api/invite-agent/route.ts`. The route receives `{ requester_id, channel_name }` from `LandingPage`, constructs an `Agent` from `agora-agent-server-sdk`, and starts a session bound to the requester's RTC channel.

## Top-Level Constants

| Constant            | Default                                              | Purpose                                                   |
| ------------------- | ---------------------------------------------------- | --------------------------------------------------------- |
| `ADA_PROMPT`        | Long-form instructions for "Ada", an Agora assistant | The system prompt for the LLM.                            |
| `GREETING`          | Friendly first line                                   | Spoken on session start unless `NEXT_AGENT_GREETING` set. |

`NEXT_AGENT_GREETING` overrides `GREETING` at runtime. `ADA_PROMPT` has no env override — edit the constant.

## The Agent Builder Chain

```ts
const agent = new Agent({
  instructions: ADA_PROMPT,
  greeting: process.env.NEXT_AGENT_GREETING ?? GREETING,
  failureMessage: 'Please wait a moment.',
  maxHistory: 50,
  turnDetection: {
    config: {
      start_of_speech: { /* VAD on-start params */ },
      end_of_speech:   { /* VAD on-end params */ },
    },
  },
  advancedFeatures: { enable_rtm: true, enable_tools: true },
  parameters: {
    data_channel: 'rtm',
    enable_error_message: true,
    enable_metrics: true,
  },
})
  .withStt(new DeepgramSTT({ model: 'nova-3' }))
  .withLlm(new OpenAI({ model: 'gpt-4o-mini' }))
  .withTts(new MiniMaxTTS({
    model: 'speech_2_6_turbo',
    voiceId: 'English_captivating_female1',
  }));
```

## Session Options

```ts
await agent.createSession({
  channelName: channel_name,
  remoteUids: [requester_id],
  idleTimeout: 30,
  expiresIn: ExpiresIn.hours(1),
  area: Area.US,
});
```

| Option        | Effect                                                                                 |
| ------------- | -------------------------------------------------------------------------------------- |
| `remoteUids`  | Restricts the agent to the requester's UID — protects against cross-channel sniping.   |
| `idleTimeout` | Seconds of silence before the session ends.                                            |
| `expiresIn`   | Hard ceiling on session length, mirrors the 1-hour RTC token.                          |
| `area`        | Region for the managed agent — change only if your project provisions a different one. |

## Editing Each Surface

### Change the prompt

Edit `ADA_PROMPT`. Keep it under the LLM's context window — `gpt-4o-mini` handles thousands of tokens but very long prompts amplify latency.

### Change the greeting

Either edit `GREETING` (changes everyone) or set `NEXT_AGENT_GREETING` in `.env.local` / Vercel (changes the deployment only).

### Change VAD behavior

Edit `turnDetection.config.start_of_speech` and `turnDetection.config.end_of_speech`. Both blocks accept the new VAD param shape — do **not** revert to the deprecated `turnDetection.type: 'agora_vad'`.

### Swap the STT model

Replace the `DeepgramSTT` constructor. To use Deepgram with a BYOK key, set `NEXT_DEEPGRAM_API_KEY` and pass `apiKey: process.env.NEXT_DEEPGRAM_API_KEY` to the constructor.

### Swap the LLM

Replace `OpenAI` with another LLM class from `agora-agent-server-sdk`. For a custom URL, point the constructor at `process.env.NEXT_LLM_URL` and pass `apiKey: process.env.NEXT_LLM_API_KEY`. Wiring through `app/api/chat/completions/route.ts` is documented in `DOCS/ai/L1/05_workflows.md`.

### Swap the TTS

Replace `MiniMaxTTS`. ElevenLabs is the common BYOK choice — use `NEXT_ELEVENLABS_API_KEY` and `NEXT_ELEVENLABS_VOICE_ID`. The commented BYOK example in the route shows the constructor shape.

## Response Contract

On success the route returns `AgentResponse`:

```json
{
  "agent_id": "string",
  "create_ts": 1700000000,
  "state": "RUNNING"
}
```

`agent_id` is what `LandingPage` later passes to `/api/stop-conversation`.

## Verification

`scripts/verify-api-contracts.ts` mocks `Agent.prototype.createSession` and asserts:

- Missing `channel_name` or `requester_id` → `400`.
- Mocked success → `200` with `agent_id`, `create_ts`, `state`.

After editing this file, run:

```bash
pnpm run verify:api
pnpm run typecheck
```

## Failure Modes

| Symptom                                                | Cause                                                          |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `400 channel_name and requester_id are required`       | Browser sent an empty body or wrong field names.               |
| `500 Agora credentials are not set`                    | `NEXT_AGORA_APP_CERTIFICATE` missing in env.                   |
| Agent joins but never speaks                           | TTS misconfigured (wrong `voiceId` or missing BYOK key).       |
| Agent state stuck on `IDLE`                            | `enable_rtm: true` missing or RTM client not subscribed yet.   |
| `verify:api` fails on the route                        | New required field added without updating the harness.         |

## See Also

- [Back to Workflows](../05_workflows.md)
- [Back to Interfaces](../06_interfaces.md)
- [Token Model](token_model.md)
