# 03 Code Map

> Where to find things. Paths are relative to the repo root.

## Top-Level Tree (curated)

```
app/                     # Next.js App Router
  layout.tsx             # Root layout, metadata, viewport, imports app/globals.css
  page.tsx               # Renders <LandingPage />
  globals.css            # Tailwind layers + Agora theme CSS variables
  api/                   # Route handlers (see Interfaces)
    generate-agora-token/route.ts
    invite-agent/route.ts
    stop-conversation/route.ts
    chat/completions/route.ts
components/              # UI + RTC/RTM lifecycle
  LandingPage.tsx
  ConversationComponent.tsx
  QuickstartConversationLayout.tsx
  QuickstartTranscriptPanel.tsx
  QuickstartPipelineMetrics.tsx
  QuickstartPreCallCard.tsx
  ConnectionStatusPanel.tsx
  ConversationErrorCard.tsx
  MicrophoneSelector.tsx
  ErrorBoundary.tsx
  LoadingSkeleton.tsx
  ui/                    # shadcn-style primitives
    button.tsx
    dropdown-menu.tsx
hooks/
  use-mobile.tsx         # useIsMobile — currently unused
lib/
  agora.ts               # DEFAULT_AGENT_UID = 123456
  conversation.ts        # Transcript normalization + visualizer state mapping
  utils.ts               # cn() (clsx + tailwind-merge)
scripts/
  doctor.mjs             # Local prereq + env gate
  verify-api-contracts.ts # Route contract regression harness
styles/
  globals.css            # Legacy shadcn baseline, currently unused at runtime
types/
  conversation.ts        # Shared client/server types
  env.d.ts               # Minimal ProcessEnv shape
  jsx.d.ts               # JSX intrinsic augmentation
public/                  # Static assets (logos, manifests)
docs/                    # Long-form guides
  GUIDE.md               # Build walkthrough (partially historical)
  TEXT_STREAMING_GUIDE.md # Transcript + RTM architecture
```

## Core Files Table

| File                                                   | Purpose                                                                       |
| ------------------------------------------------------ | ----------------------------------------------------------------------------- |
| `app/api/generate-agora-token/route.ts`                | `GET` builds RTC + RTM token via `RtcTokenBuilder.buildTokenWithRtm`.         |
| `app/api/invite-agent/route.ts`                        | `POST` starts the managed agent; owns prompt / VAD / model / voice defaults.  |
| `app/api/stop-conversation/route.ts`                   | `POST` stops the agent; idempotent on `already-stopping`.                     |
| `app/api/chat/completions/route.ts`                    | `POST` OpenAI-compatible SSE proxy for a custom LLM (not wired by default).   |
| `components/LandingPage.tsx`                           | Session bootstrap: token fetch, invite-agent, RTM login + subscribe.          |
| `components/ConversationComponent.tsx`                 | RTC join, mic publish, `AgoraVoiceAI` init, transcript/state/metrics wiring.  |
| `components/QuickstartTranscriptPanel.tsx`             | Live transcript rail (replaces `ConvoTextStream` in DOCS).                    |
| `components/QuickstartPipelineMetrics.tsx`             | Per-stage latency chips from `AGENT_METRICS` events.                          |
| `lib/conversation.ts`                                  | `normalizeTranscript`, `mapAgentVisualizerState`, `getMessageList`.           |
| `lib/agora.ts`                                         | Shared agent UID default.                                                     |
| `scripts/doctor.mjs`                                   | Validates Node, pnpm, and `.env.local` shape.                                 |
| `scripts/verify-api-contracts.ts`                      | Dynamic-imports each route, mocks SDK calls, asserts JSON + status codes.     |
| `tailwind.config.ts`                                   | Must scan `node_modules/agora-agent-uikit/dist/**/*.{js,mjs}`.                |
| `vercel.json`                                          | Vercel build/dev/install commands; maps `NEXT_PUBLIC_VERCEL_URL`.             |
| `env.local.example`                                    | Authoritative env var list for local + Vercel.                                |

## Module Boundaries

- `components/` owns RTC/RTM client lifecycle and React state.
- `app/api/` owns server-only logic and any vendor key reads.
- `lib/` owns pure helpers safe for both server and client.
- `scripts/` owns verification gates that block `pnpm run verify`.
- Repo-root `AGENTS.md` plus `docs/ai/` are the maintained agent-facing guidance. Module-level `AGENTS.md` files are not present.

## What's Not in the Repo

- No `*.test.*` or `*.spec.*` files — verification is via `scripts/verify-api-contracts.ts` + lint/typecheck/build.
- No middleware (`middleware.ts` does not exist).
- No `agent-rules/` or `.cursor/` rule trees.

## Related Deep Dives

- [Transcript Pipeline](L2/transcript_pipeline.md) — Walkthrough of `lib/conversation.ts` and `ConversationComponent`.
