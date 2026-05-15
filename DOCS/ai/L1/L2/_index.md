# Deep Dives Index

| Document                                              | Summary                                                                            | Load When                                                       |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [strict_mode_lifecycle.md](strict_mode_lifecycle.md)  | The `isReady` guard, hook ownership, and `AgoraVoiceAI.init` ordering              | Touching RTC join, mic publishing, or `AgoraVoiceAI` init       |
| [invite_agent_config.md](invite_agent_config.md)      | Full managed-agent payload built in `app/api/invite-agent/route.ts`                | Changing prompt / VAD / model / voice or wiring a BYOK provider |
| [token_model.md](token_model.md)                      | `RtcTokenBuilder.buildTokenWithRtm` build + dual-renewal sequence                  | Changing token issuance or renewal logic                        |
| [transcript_pipeline.md](transcript_pipeline.md)      | How `lib/conversation.ts` normalizes turns and feeds the UI                        | Touching transcript rendering or RTM event handling             |
