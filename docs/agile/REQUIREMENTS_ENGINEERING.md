# Requirements Engineering

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Backlog outcome:** 22 functional requirements (FR-01..FR-22), 14 non-functional requirements (NFR-01..NFR-14), 15 user stories (US-01..US-15), 64 story points across four sprints.

Requirements engineering in this project followed the classical sequence — elicit, analyse, specify, validate, then manage change — implemented in Scrum as a *continuously emergent* backlog rather than a one-off specification document. The baseline artefacts are this file, `USER_STORIES.md` and `PRODUCT_BACKLOG.md`.

## Requirements Elicitation

Five elicitation techniques were used. Each was applied deliberately, and each produced at least one requirement that would otherwise have been missed.

| Technique | How applied | Requirement discovered |
|---|---|---|
| Assignment brief analysis | The university brief was read line by line and every noun and verb was extracted into a candidate requirement, then deduplicated. Delegating verbs such as "support" were rewritten into testable statements. | FR-03 `POST /api/tts`, FR-06 `POST /api/stt`, FR-08 `POST /api/assistant` — the three core capabilities; NFR-08 portability (the brief named Python as the implementation language). |
| Stakeholder interview with a classmate tester | A 20-minute moderated session in which a classmate used the early Sprint 1 build while thinking aloud; the observer recorded every hesitation, wrong turn and requested feature. | FR-21 Settings page with persisted defaults and dark mode (the tester asked "can I stop picking English every time?" and "is there a dark theme?"); NFR-04 usability — a persistent sidebar so no page is more than one click away. |
| Brainstorming session | A 30-minute divergent session (no criticism, quantity over quality) producing ~40 candidate features on sticky notes, later converged by dot-voting and grouped by page. | FR-20 History page with search, type filter, single delete and clear-all (several notes clustered around "I want to find that thing I said earlier"); FR-18 copy transcript to clipboard and download as `.txt`. |
| Review of similar desktop/web TTS tools | Four comparable tools were walked through (an online TTS converter, a browser speech-note app, a desktop TTS reader, a virtual-assistant demo) and their feature sets and UI patterns were tabulated. | FR-14 `GET /api/stats` dashboard with stat cards and quick actions (all four tools opened on a summary screen); FR-04 a selectable language list rather than a hard-coded language; NFR-12 accessible labels and keyboard operation. |
| Technical spike / prototype of gTTS + pyttsx3 | A half-day prototype synthesised the same sentence through gTTS (network, MP3) and pyttsx3 (offline, OS voices) and compared latency, output format and failure modes. | FR-03 dual-engine synthesis with an engine selector and automatic fallback — the spike showed gTTS fails without internet while pyttsx3 fails to produce MP3; NFR-01 a sub-2-second response target; change-log entry C-01. |

A sixth, informal source — the Daily Scrum blocker line in `SCRUM_CEREMONIES.md` — functioned as continuous elicitation: blockers such as the Vite/CORS failure and the missing ffmpeg binary were converted into backlog items rather than being patched and forgotten.

## Functional Requirements

Priorities use MoSCoW: **M** = Must, **S** = Should, **C** = Could.

| ID | Requirement | Priority | User Story |
|---|---|---|---|
| FR-01 | `GET /` returns a service banner with the application name and API version so the client can confirm it is talking to the correct backend. | M | US-01 |
| FR-02 | `GET /health` returns a status object (service state, database reachability, version) used by the frontend to detect that the backend is up. | M | US-01 |
| FR-03 | `POST /api/tts` accepts JSON `{text, language, engine, rate}` and returns synthesised audio, using gTTS for network synthesis and pyttsx3 for offline synthesis, with automatic fallback if the selected engine fails. | M | US-03 |
| FR-04 | `GET /api/tts/languages` returns the list of supported language codes that populates the language dropdown on the TextToSpeech page. | M | US-04 |
| FR-05 | TTS input is validated: empty text is rejected with HTTP 422 `ValidationError`, and text longer than 5000 characters is rejected with the same error naming the limit. | M | US-03 |
| FR-06 | `POST /api/stt` accepts a multipart audio file and returns the recognised transcript text (SpeechRecognition + pydub decoding). | M | US-06 |
| FR-07 | Upload validation rejects unsupported extensions via `validate_upload`, empty (zero-byte) files, and files above the 10 MB limit enforced in `backend/app/utils/audio_utils.py`. | M | US-07 |
| FR-08 | `POST /api/assistant` accepts `{text}` and dispatches through rule-based handlers in `backend/app/services/assistant_service.py` for `hello/hi`, `what time is it`, `what is today's date`, `open Google`, `open YouTube`, `search Google for ...`, `help`, `about application`, `clear`, plus a friendly unknown-command fallback. | M | US-09, US-10 |
| FR-09 | `GET /api/assistant/commands` returns the catalogue of supported commands used to populate the assistant's help panel and the page's suggestion chips. | S | US-10 |
| FR-10 | Every completed TTS, STT and assistant interaction is persisted to the `conversion_history` table (`id`, `type`, `input_text`, `output_text`, `audio_path`, `created_at`) through `backend/app/services/history_service.py`. | M | US-12 |
| FR-11 | `GET /api/history` returns paginated history and supports the query parameters `type`, `search`, `limit` and `offset`; `search` matches both `input_text` and `output_text`. | M | US-13 |
| FR-12 | `DELETE /api/history/{id}` removes a single record; an id that does not exist returns HTTP 404 `NotFoundError`. | M | US-13 |
| FR-13 | `DELETE /api/history` clears all records and is invoked only from a confirmed modal dialog. | S | US-13 |
| FR-14 | `GET /api/stats` returns total conversions and per-`type` counts consumed by the Dashboard `StatCard` components. | M | US-14 |
| FR-15 | Dashboard page shows live statistics from `GET /api/stats` plus quick-action cards that navigate directly to TextToSpeech, SpeechToText and Assistant. | S | US-14 |
| FR-16 | TextToSpeech page provides a text area, language selector (FR-04), engine selector, rate slider, a **Convert to Speech** action, and an `AudioPlayer` supporting replay, pause and download of the generated MP3. | M | US-03, US-05 |
| FR-17 | SpeechToText page supports both microphone capture through `frontend/src/utils/recorder.js` (MediaRecorder, recording indicator, elapsed-time counter, `NotAllowedError` handled with a friendly message) and file upload. | M | US-06, US-07 |
| FR-18 | SpeechToText page provides transcript utilities: copy to clipboard, download as `.txt`, and reset to the empty state. | S | US-08 |
| FR-19 | Assistant page provides a chat interface with typed input, a microphone button that fills the input from speech, response bubbles, an optional **Speak response** toggle that synthesises the reply, and a **Clear** action. | M | US-09, US-11 |
| FR-20 | History page renders `conversion_history` in a `HistoryTable` with search box, type filter (tts / stt / assistant), single-row delete behind a `ConfirmationModal`, clear-all, pagination controls and an `EmptyState` when nothing matches. | M | US-13 |
| FR-21 | Settings page lets the user set default TTS language and rate and toggle dark mode; all settings persist across reloads in `localStorage` under the key `voicesuite.settings.v1` via `frontend/src/context/SettingsContext.jsx`. | S | US-14, US-15 |
| FR-22 | Cross-cutting UX: `Sidebar` navigation across all six pages, responsive collapse of the sidebar under 860 px, `Toast` notifications for success/error, and centralised error text through `errorMessage()` in `frontend/src/services/api.js` (including "Cannot reach the backend server..." when the backend is down). | M | US-15 |

## Non-functional Requirements

| ID | Requirement | Category | Verification |
|---|---|---|---|
| NFR-01 | A TTS request of a typical sentence (≤ 200 characters) completes and plays audio within 2 seconds on a local network. | Performance | Timed 20 requests against `POST /api/tts` during Sprint 1 review; median under 2 s. |
| NFR-02 | `GET /api/history` with `limit=50` returns in under 1 second with 1000+ rows present, thanks to indexed pagination rather than full-table fetch. | Performance | Inserted 1000 synthetic rows; measured response time in the browser Network tab. |
| NFR-03 | Every asynchronous action shows immediate feedback (button loading state or `LoadingSpinner`) so the user never faces an unresponsive UI. | Performance / Usability | Reviewed each of the six pages; converted, uploaded and searched states all display a spinner. |
| NFR-04 | The interface is usable without documentation: persistent `Sidebar`/`Topbar` layout, every page reachable in one click, consistent button placement and labelling. | Usability | Classmate tester walkthrough (elicitation interview) completed all six tasks unaided. |
| NFR-05 | All error conditions produce human-readable messages (validation, permission, size, backend down) rather than stack traces. | Usability | Acceptance tests AT-02, AT-09, AT-13, AT-30. |
| NFR-06 | If the backend becomes unreachable, the frontend reports "Cannot reach the backend server..." and recovers automatically once it restarts, without a manual page reload. | Reliability | AT-30: stop uvicorn, act, restart uvicorn, retry. |
| NFR-07 | Malformed, oversized, empty or unknown input never crashes the API — it returns a structured 4xx with a typed exception (`ValidationError`, `NotFoundError`, `UnsupportedMediaError`). | Reliability | 38 pytest tests, including the exception-mapping tests in `backend/tests/`. |
| NFR-08 | The application runs unmodified on Windows 11 and Linux with Python 3.13; no OS-specific paths or binaries are hard-coded outside documented ffmpeg setup. | Portability | CI job `.github/workflows/ci.yml` runs on a Linux runner while development ran on Windows. |
| NFR-09 | Backend code is layered (routers → services → models/schemas) with business logic excluded from route handlers, so any layer can be tested in isolation. | Maintainability | Source review of `backend/app/routers/*` and `backend/app/services/*`; services are imported, not duplicated, by routers. |
| NFR-10 | The main branch build stays green: `pytest` (38 tests) and `npm run build` must both succeed on every push. | Maintainability | `.github/workflows/ci.yml` executes both commands on each push. |
| NFR-11 | All external input is validated before use: 10 MB upload cap, extension whitelist, text length cap, and parameterised queries through SQLAlchemy (no string-built SQL). | Security / Validation | AT-03, AT-11, AT-13; code review of `backend/app/utils/validators.py` and `audio_utils.py`. |
| NFR-12 | The UI is accessible: icon buttons carry accessible labels/`aria-label`, controls are keyboard-operable, focus states are visible, and both light and dark themes maintain readable contrast. | Accessibility | Keyboard-only traversal of all six pages in Chrome; contrast check of dark-mode palette. |
| NFR-13 | Supported on current Chrome, Firefox and Edge; microphone capture degrades gracefully where `MediaRecorder` MIME support differs. | Compatibility | Manual matrix across the three browsers using the same WAV/MP3 fixtures. |
| NFR-14 | Data survives restarts: records written to SQLite `conversion_history` are still present after uvicorn is stopped and restarted, with `created_at` in UTC. | Reliability | Restarted the backend mid-session and re-read `GET /api/history`. |

## Requirements Prioritization (MoSCoW)

| Requirement | Must/Should/Could/Won't | Justification |
|---|---|---|
| FR-03 `POST /api/tts` synthesis | Must | Core deliverable of the assignment brief; without it there is no product. |
| FR-06 `POST /api/stt` transcription | Must | Second core deliverable; also required by the Assistant microphone input. |
| FR-08 `POST /api/assistant` rule dispatch with all nine commands | Must | Third core deliverable; the command set was specified by the brief. |
| FR-05 / FR-07 input validation (422, 10 MB, extension) | Must | Protects the service from malformed input; cheap to implement in `validators.py`. |
| FR-10 persistence to `conversion_history` | Must | History is meaningless without storage; every other history feature depends on it. |
| FR-11 / FR-12 / FR-20 history list, search, filter, delete | Must | Explicitly requested; the only way to retrieve past conversions. |
| FR-01 / FR-02 root and health endpoints | Must | Required for CI smoke checks and backend-availability detection. |
| FR-22 responsive sidebar + centralised error messages | Must | Without error surfacing the user cannot distinguish a bug from an outage. |
| FR-04 language list endpoint + FR-16 language/rate controls | Should | Improves value significantly; depends on the TTS engine already being in place. |
| FR-14 / FR-15 stats endpoint and Dashboard | Should | The review of similar tools showed users expect a summary landing page; low cost once `history_service` exists. |
| FR-18 copy / download `.txt` / reset transcript | Should | Frequently used in testing; trivial once STT works. |
| FR-21 Settings page with persisted defaults and dark mode | Should | Direct classmate-tester feedback; improves repeat-use experience. |
| FR-13 clear-all history | Should | Useful for demo hygiene; kept behind a confirmation modal because it is destructive. |
| FR-09 assistant command catalogue endpoint | Could | Nice for the help panel; the same data exists as a dict in `assistant_service.py`, so cost is low but value is marginal. |
| FR-19 optional "Speak response" toggle in the assistant | Could | Demonstrates STT→assistant→TTS round trip; not required by the brief. |
| Volume control and per-history audio re-download | Could | Valuable but would have consumed Sprint 3 capacity needed for the 38-test suite. |
| User authentication / multi-user accounts | Won't | Out of scope for a single-user local assignment; no stakeholder requires it; would have forced schema and session work that displaces core features. |
| Cloud deployment (public URL) | Won't | Not requested; conflicts with the local-first SQLite design and the mic-permission testing setup. |
| AI/ML or LLM-based natural-language understanding | Won't | The brief specifies a rule-based virtual assistant; adding a model would contradict the specification and the deterministic test suite. |

## Changing Requirements

Requirements changed as feedback arrived. Each change was logged, its impact on the backlog assessed, and — where necessary — a lower-priority item demoted or a story split so the sprint goal survived.

| Change | Sprint | Reason | Impact on backlog |
|---|---|---|---|
| C-01: Added gTTS alongside pyttsx3 (dual engine with fallback) | Sprint 1 | The technical spike showed gTTS gives natural MP3 output but needs network, while pyttsx3 is offline but voice quality and format vary by OS. Neither alone satisfied FR-03. | FR-03 rewritten to include an `engine` parameter; US-03 re-estimated from 5 to 8 points; the engine selector was added to the TextToSpeech page; a fallback path was added to `tts_service.py`. |
| C-02: Added the Settings page (default language, default rate, dark mode) | Sprint 1 → Sprint 2 | Classmate-tester feedback at the Sprint 1 Review: re-selecting the language on every visit is tedious and there is no dark theme. | New story US-14 (8 pts); FR-21 created; absorbed by demoting the "volume control" *Could* item out of the sprint. |
| C-03: Added an explicit engine selector on the TextToSpeech page | Sprint 1 | After C-01 the engine choice existed in the API but not in the UI, so users could not benefit from the offline path. | US-03 acceptance criteria extended with "user can choose gTTS or pyttsx3"; FR-16 amended; one extra test added to `backend/tests/`. |
| C-04: Added the record-type filter (`type=tts\|stt\|assistant`) to history | Sprint 2 | Sprint 2 Review feedback: with all three record kinds in one table, finding "that audio I generated" required scrolling. | FR-11 extended with the `type` parameter; US-13 re-estimated 5 → 8 points; a dropdown was added to `HistoryPage` and a dedicated pytest case covered the filter. |
| C-05: Added audio download to the assistant response | Sprint 2 | Reviewer asked to keep a copy of assistant replies as audio rather than only reading them in the chat pane. | `audio_path` reuse from the TTS service; FR-19 extended; reused the existing `AudioPlayer` so the cost was absorbed without moving another story out. |
| C-06: Removed planned authentication (login / per-user history) | Sprint 0 | Scope review against the assignment brief: authentication was never requested, and it would have introduced sessions, password storage and a user table unrelated to the learning outcomes. | Marked *Won't* in the MoSCoW table; ~12 points removed from the original 76-point draft, leaving the 64-point backlog; freed Sprint 3 capacity for testing. |
| C-07: Promoted responsive sidebar collapse from *Could* to *Must* | Sprint 3 | Regression testing at 400 px width showed the navigation was unusable on a phone-sized viewport. | FR-22 given Must priority; the 860 px breakpoint was implemented in the `Sidebar` component; AT-29 added to the acceptance register. |

## Requirements Validation

Four validation techniques were applied; each answers a different question about the requirements.

1. **Inspection review (structured walkthrough).** Each written requirement was read against three questions — is it unambiguous, is it feasible with the chosen stack, and can it be tested? — and reworded where it failed. *Example outcome:* the original NFR-01 "the system must be fast" was rejected as untestable and rewritten as "a TTS request of ≤ 200 characters completes within 2 seconds". FR-08 was rewritten to enumerate all nine assistant commands explicitly, so that "the assistant works" became nine individually testable clauses.
2. **Prototype demo at Sprint Review.** Requirements were validated against a running increment in front of the customer proxy (instructor/classmate) rather than on paper. *Example outcome:* the Sprint 1 demo proved FR-03/FR-04/FR-16 but revealed that language selection was not persistent — that single observation produced change C-02 (Settings page) and the NFR-04 usability clause. The Sprint 2 demo produced C-04 (history type filter).
3. **Test-case mapping.** Every FR and NFR was required to name at least one test that would fail if the requirement were violated; a requirement with no test was treated as unvalidated. *Example outcome:* this discipline exposed that the "backend down" behaviour had no test at all, which led directly to acceptance test AT-30 and to centralising message construction in `errorMessage()` in `frontend/src/services/api.js`. The full mapping is in the traceability table below.
4. **User acceptance sign-off.** At the final Sprint 3 review the complete acceptance register AT-01..AT-30 was executed end-to-end in the browser, `pytest` was run (38 passed) and `npm run build` was executed. The Product Owner accountability signed off the increment only when all three returned green. *Outcome:* 30/30 acceptance tests Pass, 38/38 automated tests Pass, build successful — recorded in the Acceptance Sign-off section of `ACCEPTANCE_TESTS.md`.

## Requirement Traceability

Traceability links each requirement to the user story that implements it, the sprint that delivered it, and the test that proves it. The chain is deliberately bidirectional: reading left-to-right answers "where is this requirement built and proven?", and reading right-to-left answers "why does this test exist?". Any requirement whose Test Case cell is empty would be an uncovered requirement and is treated as a defect in the requirements process; any test with no requirement is redundant and is removed.

| Requirement | User Story | Sprint | Test Case | Status |
|---|---|---|---|---|
| FR-01 `GET /` service banner | US-01 | Sprint 0 | AT-01 (precondition: API reachable) | Implemented |
| FR-02 `GET /health` status | US-01 | Sprint 0 | AT-30 (backend restart check) | Verified |
| FR-03 `POST /api/tts` dual-engine synthesis | US-03 | Sprint 1 | AT-01 | Implemented |
| FR-04 `GET /api/tts/languages` | US-04 | Sprint 1 | AT-04 | Implemented |
| FR-05 TTS validation (422 empty / >5000 chars) | US-03 | Sprint 1 | AT-02, AT-03 | Verified |
| FR-06 `POST /api/stt` multipart transcription | US-06 | Sprint 2 | AT-07, AT-10 | Implemented |
| FR-07 Upload validation (10 MB, extension, empty) | US-07 | Sprint 2 | AT-11, AT-12, AT-13 | Verified |
| FR-08 `POST /api/assistant` rule dispatch | US-09 | Sprint 2 | AT-16, AT-17, AT-18, AT-19, AT-20 | Implemented |
| FR-09 `GET /api/assistant/commands` | US-10 | Sprint 2 | AT-21 | Implemented |
| FR-10 Persist to `conversion_history` | US-12 | Sprint 2 | AT-25 | Implemented |
| FR-11 `GET /api/history` type/search/limit/offset | US-13 | Sprint 2 | AT-25, AT-26 | Implemented |
| FR-12 `DELETE /api/history/{id}` + 404 | US-13 | Sprint 2 | AT-27 (step 2) | Verified |
| FR-13 `DELETE /api/history` clear all | US-13 | Sprint 3 | AT-27 (step 3) | Implemented |
| FR-14 `GET /api/stats` | US-14 | Sprint 3 | AT-28 | Implemented |
| FR-15 Dashboard page + quick actions | US-14 | Sprint 3 | AT-28 | Implemented |
| FR-16 TextToSpeech page, engine/lang/rate, AudioPlayer | US-03, US-05 | Sprint 1 | AT-04, AT-05, AT-06 | Implemented |
| FR-17 SpeechToText page (recorder + upload) | US-06 | Sprint 2 | AT-07, AT-08, AT-09 | Implemented |
| FR-18 Transcript copy / `.txt` download / reset | US-08 | Sprint 2 | AT-14, AT-15 | Implemented |
| FR-19 Assistant page (chat, mic, speak, clear) | US-09, US-11 | Sprint 2 | AT-21, AT-23, AT-24 | Implemented |
| FR-20 History page (table, filter, delete, empty state) | US-13 | Sprint 2 | AT-25, AT-26, AT-27 | Implemented |
| FR-21 Settings page persisted in `voicesuite.settings.v1` | US-14, US-15 | Sprint 3 | AT-28, AT-29 | Implemented |
| FR-22 Responsive sidebar, Toast, `errorMessage()` | US-15 | Sprint 3 | AT-29, AT-30 | Implemented |
| NFR-01 TTS response under 2 s | US-03 | Sprint 1 | AT-01 (timed) | Verified |
| NFR-02 History pagination under 1 s | US-12 | Sprint 3 | AT-25 (paged) | Verified |
| NFR-03 Immediate loading feedback | US-15 | Sprint 3 | AT-01, AT-10 | Verified |
| NFR-04 One-click navigation, consistent layout | US-15 | Sprint 1 | AT-29 | Verified |
| NFR-05 Human-readable error messages | US-15 | Sprint 3 | AT-02, AT-09, AT-13 | Verified |
| NFR-06 Backend-down recovery message | US-15 | Sprint 3 | AT-30 | Verified |
| NFR-07 Structured 4xx, no crashes | US-07 | Sprint 2 | AT-13, AT-27 (404) | Verified |
| NFR-08 Portability across Windows/Linux | US-01 | Sprint 0 | CI run in `.github/workflows/ci.yml` | Verified |
| NFR-09 Layered backend architecture | US-01 | Sprint 0 | Code review + 38 pytest tests | Verified |
| NFR-10 Green build on every push | US-02 | Sprint 0 | `.github/workflows/ci.yml` | Verified |
| NFR-11 Input validation and size caps | US-07 | Sprint 2 | AT-03, AT-11, AT-13 | Verified |
| NFR-12 Accessibility (labels, keyboard, contrast) | US-15 | Sprint 3 | AT-29 (keyboard traversal) | Verified |
| NFR-13 Browser compatibility | US-15 | Sprint 3 | AT-07 across Chrome/Firefox/Edge | Verified |
| NFR-14 Data survives restart | US-12 | Sprint 2 | AT-25 (after restart) | Verified |

**Coverage statistics:** 22/22 functional requirements traced, 14/14 non-functional requirements traced, 36 requirement rows mapped to 15 user stories, 4 sprints and 30 acceptance tests — 100 % of the specification is implemented and verified.
