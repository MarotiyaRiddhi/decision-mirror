# 04 Conventions

> How code is structured and what patterns to keep when editing.

## Language & Tooling

- TypeScript `strict: true` (`tsconfig.json`). Path alias `@/*` resolves to repo root.
- ESLint: `eslint-config-next/core-web-vitals` + `typescript-eslint` (`eslint.config.mjs`).
  - `@typescript-eslint/no-explicit-any` is `warn`.
  - `@typescript-eslint/no-unused-vars` is `warn`, allowing `_`-prefixed unused identifiers.
- No Prettier config; ESLint is the formatter gate.
- pnpm only — see `scripts/doctor.mjs`.

## File Naming

| Layer            | Convention                                              | Example                                          |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------ |
| Components       | PascalCase `.tsx` files                                 | `QuickstartTranscriptPanel.tsx`                  |
| UI primitives    | lowercase under `components/ui/`                        | `components/ui/button.tsx`                       |
| Hooks            | `useXxx` exports, kebab-case file name                  | `hooks/use-mobile.tsx` → `useIsMobile`           |
| API routes       | `app/api/<resource>/route.ts`, default export per verb  | `app/api/invite-agent/route.ts`                  |
| Types            | flat files under `types/`                               | `types/conversation.ts`                          |

## Hook Ownership Rules

These come from `components/AGENTS.md` and the comments in `ConversationComponent.tsx`:

- `useJoin` owns `client.leave()` — never call it manually.
- `useLocalMicrophoneTrack` owns the track lifecycle — do not call `.close()` manually.
- `usePublish` owns publish state — mute via `track.setEnabled()`; never manually unpublish.
- The RTC `client` is held in `useRef` (not `useMemo`) so StrictMode's double-mount keeps the same instance.

## StrictMode `isReady` Guard

`useJoin` and `useLocalMicrophoneTrack` must be gated by `isReady`:

```tsx
const [isReady, setIsReady] = useState(false);
useEffect(() => {
  let cancelled = false;
  const id = setTimeout(() => { if (!cancelled) setIsReady(true); }, 0);
  return () => { cancelled = true; clearTimeout(id); setIsReady(false); };
}, []);
```

`AgoraVoiceAI.init` is then gated on `isReady && joinSuccess` so it runs exactly once per real mount.

## API Route Patterns

- Validate JSON body up front; return `400` with `{ error: '<field> is required' }` for missing inputs.
- Wrap external SDK calls in `try/catch`; log via `console.error`; return `500` with a sanitized `{ error }`.
- Use `requireEnv()` (in `invite-agent/route.ts`) so missing env vars throw early.
- Never return `NEXT_AGORA_APP_CERTIFICATE` or any BYOK key in responses.

## Transcript & UI Patterns

- The toolkit uses `uid="0"` as a sentinel for the local user's speech. `normalizeTranscript` in `lib/conversation.ts` remaps it to `String(client.uid)` — never bypass this remap or `ConvoTextStream`-style UIs render the user on the wrong side.
- `getMessageList` filters only `TurnStatus.IN_PROGRESS`. `INTERRUPTED` turns must remain in the list, otherwise an interrupted first turn leaves the transcript panel empty.
- Agent visualizer state comes from `mapAgentVisualizerState` — keep new agent states mapped instead of branching in components.

## Tailwind & Theming

- Theme tokens are HSL CSS variables in `app/globals.css` and consumed via `hsl(var(--token) / <alpha-value>)` in `tailwind.config.ts`.
- `tailwind.config.ts` `content` must include `./node_modules/agora-agent-uikit/dist/**/*.{js,mjs}` so uikit classes survive purge.
- `components.json` (shadcn) points Tailwind at `app/globals.css`. `styles/globals.css` exists but is not imported by the running app — treat it as legacy.

## Logging

- Server routes use `console.error`. Client uses `console.warn` for advisory issues (e.g. `ENABLE_AUDIO_PTS` parameter set) and `console.error` for failures.
- No structured logger is wired; do not add one without a discussion in `CONTRIBUTING.md`.

## Testing

- There is no Vitest/Jest harness. Behavioral coverage lives in `scripts/verify-api-contracts.ts` (route contracts) and in lint/typecheck.
- Adding a new API route requires extending `scripts/verify-api-contracts.ts` — see `app/api/AGENTS.md`.

## Module Discipline

- `app/api/` reads environment, talks to the server SDK, returns JSON. It must not import from `components/`.
- `components/` consumes route output and the toolkit. It must not import from `app/api/`.
- `lib/` is shared and must not import from `components/` or `app/api/`.
- If a helper would need both client and server code paths, split it into two helpers in `lib/` rather than `if (typeof window)` branching.

## Related Deep Dives

- [StrictMode Lifecycle](L2/strict_mode_lifecycle.md) — Full lifecycle reasoning behind the `isReady` pattern.
