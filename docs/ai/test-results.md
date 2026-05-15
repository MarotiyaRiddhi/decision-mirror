# PD Documentation Test Results

Tested: 2026-05-15
Agent: Cursor agent (Anthropic Claude family) with delegated `explore` sub-agents
Repo: `agent-quickstart-nextjs`

## Summary

- Total questions: 8
- Passed: 7 (correct answer, right level)
- L1 gaps: 1 (Q3 — verify scope wording)
- L2 gaps: 0
- Cross-ref issues: 0
- L2 accuracy issue: 1 (note on `AGENT_METRICS` storage, not blocking)

## Results

### Setup & Build

| #   | Question                                                                | Answer Correct? | Files Read                                                       | Level Loaded     | Result |
| --- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- | ---------------- | ------ |
| 1   | How do I install and start dev? Which package manager?                  | Yes             | `AGENTS.md`, `L0_repo_card.md`, `L1/01_setup.md`, `package.json`, `scripts/doctor.mjs` | L0+L1 sufficient | Pass   |
| 2   | Which env vars are required vs optional, server-only vs public?         | Yes             | `L0`, `L1/01_setup.md`, `L1/06_interfaces.md`, `L1/08_security.md`, `env.local.example` | L0+L1 sufficient | Pass   |

### Test & Run

| #   | Question                                                                | Answer Correct? | Files Read                                                       | Level Loaded     | Result |
| --- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- | ---------------- | ------ |
| 3   | How do I run the API contract verification and what does it check?      | Partial → Pass after fix | `L1/01_setup.md`, `L1/06_interfaces.md`, `scripts/verify-api-contracts.ts` | L0+L1 sufficient | L1 gap → Pass |
| 4   | What's the full CI-equivalent verify chain without live Agora?          | Yes             | `L0`, `L1/01_setup.md`, `package.json`, `scripts/doctor.mjs`     | L0+L1 sufficient | Pass   |

### Conventions

| #   | Question                                                                | Answer Correct? | Files Read                                                       | Level Loaded     | Result |
| --- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- | ---------------- | ------ |
| 5   | What is the `isReady` pattern and why is it needed?                     | Yes             | `AGENTS.md`, `L1/04_conventions.md`, `L1/07_gotchas.md`, `ConversationComponent.tsx` | L0+L1 sufficient | Pass   |
| 6   | Where do I change the agent's prompt, voice, or VAD config?             | Yes             | `L0`, `L1/05_workflows.md`, `L1/03_code_map.md`, `L1/06_interfaces.md`, `invite-agent/route.ts` | L0+L1 sufficient | Pass   |

### Development

| #   | Question                                                                | Answer Correct? | Files Read                                                       | Level Loaded     | Result |
| --- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- | ---------------- | ------ |
| 7   | How would I add a new RTM event type to the transcript pipeline?        | Yes             | `AGENTS.md`, `L1/06_interfaces.md`, `L2/transcript_pipeline.md`, `invite-agent/route.ts`, `ConversationComponent.tsx`, `QuickstartPipelineMetrics.tsx` | L2 needed        | Pass   |

### Deep Dive

| #   | Question                                                                | Answer Correct? | Files Read                                                       | Level Loaded     | Result |
| --- | ----------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------- | ---------------- | ------ |
| 8   | Why `buildTokenWithRtm`, and how does renewal handle RTC vs RTM UID?    | Yes             | `L1/06_interfaces.md`, `L1/07_gotchas.md`, `L1/08_security.md`, `L2/token_model.md`, `generate-agora-token/route.ts`, `LandingPage.tsx`, `ConversationComponent.tsx` | L0+L1 sufficient (L2 confirmed) | Pass   |

## Recommended Fixes (Applied)

- [x] **L1/01_setup.md**: clarify that `scripts/verify-api-contracts.ts` covers only `generate-agora-token`, `invite-agent`, and `stop-conversation` — not `/api/chat/completions`.
- [x] **L1/06_interfaces.md**: add a footnote next to `/api/chat/completions` noting the harness does not cover it.
- [x] **L2/transcript_pipeline.md**: correct the `AGENT_METRICS` storage description — `ConversationComponent` appends and slices a bounded array (last 8 items); `QuickstartPipelineMetrics` rebuilds a `Map<string, QuickstartAgentMetric>` keyed on lowercased `type` each render.

## Review Fix Retest

Retested: 2026-05-15

| Finding                                                | Source checked                                                                                          | Docs changed                                                          | Result | Notes                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ | ---------------------------------------------- |
| Q3 verify-api-contracts scope wording                  | `scripts/verify-api-contracts.ts`                                                                       | `L1/01_setup.md`, `L1/06_interfaces.md`                               | Pass   | Three-route coverage and chat-route exclusion now explicit. |
| L2 `AGENT_METRICS` storage description                 | `components/ConversationComponent.tsx`, `components/QuickstartPipelineMetrics.tsx`                       | `L2/transcript_pipeline.md`                                            | Pass   | Array + `slice(-N)`, Map keyed by `type` documented correctly. |
