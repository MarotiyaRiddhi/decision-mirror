# convoai-quickstart-web-nextjs — Repo Card

> Next.js quickstart for building conversational AI applications with Agora's Conversational AI Engine.

## Identity

| Field         | Value                                                             |
| ------------- | ----------------------------------------------------------------- |
| Repo          | `AgoraIO-Conversational-AI/agent-quickstart-nextjs`               |
| Type          | `frontend-app`                                                    |
| Language      | TypeScript + Next.js 16 (App Router) + React 19                   |
| Deploy Target | Vercel (single Next.js app, route handlers in `app/api`)          |
| Owner         | Agora Conversational AI DevEx                                     |
| Last Reviewed | 2026-05-15                                                        |

## L1 — Summaries

The Audience column helps agents prioritise: **Use** = consuming the quickstart's behavior, **Maintain** = modifying internals.

| File                                     | Purpose                                                       | Audience       |
| ---------------------------------------- | ------------------------------------------------------------- | -------------- |
| [01_setup](L1/01_setup.md)               | pnpm setup, env vars, doctor, dev/build/verify commands       | Use & Maintain |
| [02_architecture](L1/02_architecture.md) | Voice session lifecycle, RTC + RTM + managed agent topology   | Maintain       |
| [03_code_map](L1/03_code_map.md)         | Directory tree, key files in `app/`, `components/`, `lib/`    | Maintain       |
| [04_conventions](L1/04_conventions.md)   | TypeScript strict, ESLint, hook ownership, transcript helpers | Maintain       |
| [05_workflows](L1/05_workflows.md)       | Add a route, change prompt/VAD/model/voice, verify, deploy    | Use            |
| [06_interfaces](L1/06_interfaces.md)     | `app/api/*` contracts, env vars, RTM event shapes             | Use & Maintain |
| [07_gotchas](L1/07_gotchas.md)           | StrictMode `isReady`, uid `"0"` sentinel, doc drift           | Maintain       |
| [08_security](L1/08_security.md)         | Cert handling, token expiry/renewal, public vs server env     | Maintain       |
