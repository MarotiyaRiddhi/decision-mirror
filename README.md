# Agora Conversational AI Next.js Quickstart

Official Next.js quickstart for building a browser-based voice AI experience with Agora Conversational AI Engine.

## Prerequisites

- [Node.js 22+](https://nodejs.org/en/download/)
- [pnpm](https://pnpm.io/installation)
- [Agora CLI](https://github.com/AgoraIO-Community/cli)

## Run It

Official flow: sign in, scaffold the Next.js template, install, and run. `agora init` clones the starter, binds an Agora project, and writes `.env.local`.

1. Install the CLI (if needed) and sign in:

   ```bash
   curl -fsSL https://raw.githubusercontent.com/AgoraIO/cli/main/install.sh | sh -s -- --add-to-path
   agora login
   ```

2. **Scaffold and run** (any directory name is fine instead of `my-nextjs-demo`):

   ```bash
   agora init my-nextjs-demo --template nextjs
   cd my-nextjs-demo
   pnpm install
   pnpm dev
   ```

3. Open **http://localhost:3000** and click **Start conversation**.

If the agent does not join or transcripts do not appear, run **`agora project doctor --deep`** to check credentials, feature enablement, network reachability, and local env binding.

### Working from a clone of this repository

Use this path if you already cloned **this** repo (for example to contribute or fork):

```bash
git clone https://github.com/AgoraIO-Conversational-AI/agent-quickstart-nextjs.git
cd agent-quickstart-nextjs
agora login
agora project use <your-project>
pnpm install
agora project env write .env.local
agora project doctor --deep
pnpm dev
```

Required variables (also documented in [`env.local.example`](env.local.example)):

- `NEXT_PUBLIC_AGORA_APP_ID`
- `NEXT_AGORA_APP_CERTIFICATE`

Optional:

- `NEXT_PUBLIC_AGENT_UID` — defaults to `123456` (must match [`app/api/invite-agent/route.ts`](app/api/invite-agent/route.ts) when set)

The default agent configuration in [`app/api/invite-agent/route.ts`](app/api/invite-agent/route.ts) uses Agora-managed STT, LLM, and TTS, so no extra vendor API keys are required for the base quickstart.

## Commands

```bash
pnpm run doctor
pnpm dev
pnpm run lint
pnpm run typecheck
pnpm run verify:api
pnpm run build
pnpm run verify
```

## Verification

Run this before shipping changes:

```bash
pnpm run verify
```

This checks local prerequisites, lint, type safety, the core API route contracts, and the production build.

## Architecture

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./system-architecture-dark.svg">
  <img src="./system-architecture.svg" alt="System architecture" />
</picture>

The browser uses the Next.js app for token generation and agent lifecycle calls, and connects to Agora Cloud for real-time audio, transcripts, and agent state.

## What You Get

- browser voice client built with Next.js App Router
- RTC audio plus RTM transcript and state events
- server routes for token generation, invite, and stop
- `AgentVisualizer` for agent state and `ConvoTextStream` for live transcript UI
- Agora-managed default STT, LLM, and TTS configuration

## How It Works

1. The browser requests an RTC + RTM token from `/api/generate-agora-token`.
2. The backend invites an Agora cloud agent with `/api/invite-agent`.
3. The browser joins the channel and publishes mic audio.
4. The client receives transcript and agent state updates over RTM.
5. The session is stopped with `/api/stop-conversation`.

## Optional BYOK

Optional BYOK examples remain commented in [`app/api/invite-agent/route.ts`](app/api/invite-agent/route.ts).

Examples:

- `NEXT_LLM_URL` and `NEXT_LLM_API_KEY`
- `NEXT_DEEPGRAM_API_KEY`
- `NEXT_ELEVENLABS_API_KEY` and `NEXT_ELEVENLABS_VOICE_ID`

## Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs&project-name=agent-quickstart-nextjs&repository-name=agent-quickstart-nextjs&env=NEXT_PUBLIC_AGORA_APP_ID,NEXT_AGORA_APP_CERTIFICATE&envDescription=Agora%20credentials%20needed%20to%20run%20the%20app&envLink=https%3A%2F%2Fgithub.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%23run-it&demo-title=Agora%20Conversational%20AI%20Next.js%20Quickstart&demo-description=Official%20Next.js%20quickstart%20for%20building%20browser-based%20voice%20AI%20with%20Agora&demo-image=https%3A%2F%2Fraw.githubusercontent.com%2FAgoraIO-Conversational-AI%2Fagent-quickstart-nextjs%2Fmain%2F.github%2Fassets%2FConversation-Ai-Client.gif)

## Repo Map

- `app/api/generate-agora-token/route.ts` issues RTC + RTM tokens
- `app/api/invite-agent/route.ts` starts the agent session
- `app/api/stop-conversation/route.ts` stops the agent session
- `components/LandingPage.tsx` starts the session and manages RTM login
- `components/ConversationComponent.tsx` manages RTC, transcript state, `AgentVisualizer`, and `ConvoTextStream`
- `AGENTS.md` is the primary agent-facing guide

## Troubleshooting

- **Agent does not join or transcripts are missing:** run `agora project doctor --deep`.
- **`pnpm run doctor` fails:** run `agora project env write .env.local`, then retry.
- **Manual clone / env values:** `agora project use <your-project>` then `agora project env write .env.local`.
- **RTM login fails:** confirm [`app/api/generate-agora-token/route.ts`](app/api/generate-agora-token/route.ts) still uses `RtcTokenBuilder.buildTokenWithRtm`.
- **Transcript speakers inverted:** check the `uid === "0"` remap in [`components/ConversationComponent.tsx`](components/ConversationComponent.tsx).
- **Agent never appears in channel:** ensure `NEXT_PUBLIC_AGENT_UID` matches the value used in [`app/api/invite-agent/route.ts`](app/api/invite-agent/route.ts).

## More Docs

- [DOCS/GUIDE.md](./DOCS/GUIDE.md)
- [DOCS/TEXT_STREAMING_GUIDE.md](./DOCS/TEXT_STREAMING_GUIDE.md)
- [AGENTS.md](./AGENTS.md)
- [Agent UIKit Preview](https://agoraio-conversational-ai.github.io/agent-uikit/)
