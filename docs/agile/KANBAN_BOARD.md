# Kanban Board

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Board type:** Scrum-kanban hybrid — the sprint backlog is visualised as flow columns
**Board snapshot:** taken at the Sprint 3 review; completed work has flowed into Done while
identified improvements remain in Backlog and To Do

Cards are identified by the prefix `KB-`. Owners are the two developers of the team, with
the label "Dev (student)" used for jointly owned work.

---

## Backlog

Not yet started; candidates for a future sprint, ordered by perceived value.

| ID | Task | Owner | Points | Notes |
|-----|------|-------|--------|-------|
| KB-101 | Export conversion history as CSV | Dev-B | 3 | Requires a new `GET /api/history/export` route plus a button in `History.jsx` |
| KB-102 | Offline mode for previously generated audio | Dev-A | 5 | Service worker with cache-first strategy; live gTTS calls still need the network |
| KB-103 | Waveform visualiser inside `AudioPlayer.jsx` | Dev-A | 5 | Web Audio API `AnalyserNode` over the `<audio>` element |
| KB-104 | Interface internationalisation (English/Hindi) | Dev-B | 5 | All strings are currently hard-coded in the `.jsx` pages |
| KB-105 | Docker packaging for backend and frontend | Dev-A | 3 | Multi-stage image plus a compose file for laboratory demonstration machines |
| KB-106 | Web Speech API fallback for microphone capture | Dev-B | 3 | Progressive enhancement where `MediaRecorder` cannot emit WAV |
| KB-107 | PWA manifest and install prompt | Dev-B | 2 | Depends on KB-102; would allow installation on student laptops |
| KB-108 | End-to-end browser tests with Playwright | Dev-A | 5 | Complements the 38 backend pytest tests with UI coverage |
| KB-109 | Automatic purge of history older than 90 days | Dev-B | 2 | Scheduled job over `conversion_history`; respects the 10 MB audio storage budget |

## To Do

Refined and estimated; ready to be pulled when capacity frees up.

| ID | Task | Owner | Points | Notes |
|-----|------|-------|--------|-------|
| KB-201 | Unit tests for `frontend/src/utils/format.js` | Dev-B | 2 | Covers duration and date formatting used by `AudioPlayer` and `HistoryTable` |
| KB-202 | Sort-order toggle (newest/oldest) on `History.jsx` | Dev-A | 2 | Extends the existing `limit`/`offset` query parameters with an `order` parameter |
| KB-203 | Rate limiting on `POST /api/tts` | Dev-A | 3 | Protects the gTTS quota during live demonstrations |
| KB-204 | Tooltips explaining gTTS versus pyttsx3 in `TextToSpeech.jsx` | Dev-B | 1 | One-line help text beside the engine select box |
| KB-205 | Persist the assistant transcript across refreshes | Dev-B | 2 | Mirror `SettingsContext.jsx` and store messages in `localStorage` |
| KB-206 | Accessibility pass: `aria` labels and focus rings | Dev-A | 3 | Priority on `MicrophoneButton`, `Sidebar` and `ConfirmationModal` |

## In Progress

Work actively being carried out by a developer.

| ID | Task | Owner | Points | Notes |
|-----|------|-------|--------|-------|
| KB-301 | Dark-mode contrast audit across all six pages | Dev-A | 3 | Dashboard and Settings verified; four pages remain |
| KB-302 | Debounce the `History.jsx` search input | Dev-B | 2 | Reduces `GET /api/history` calls while typing |
| KB-303 | React error boundary around route content | Dev-A | 2 | Draft component in `App.jsx`; fallback UI pending styling |

## Testing

Code complete; awaiting verification before the Definition of Done is applied.

| ID | Task | Owner | Points | Notes |
|-----|------|-------|--------|-------|
| KB-401 | `POST /api/stt` validation for all six accepted formats | Dev-B | 3 | WAV, MP3, OGG, WebM, FLAC, M4A plus the 10 MB boundary case |
| KB-402 | Assistant rule engine edge cases | Dev-A | 3 | Casing, punctuation and partial matches for the ten commands in `assistant_service.py` |
| KB-403 | Responsive layout at 375 px, 768 px and 1440 px | Dev-B | 2 | Checking `Sidebar` collapse and table overflow on the History page |
| KB-404 | Theme and settings persistence after reload | Dev-A | 1 | Verifies `SettingsContext.jsx` round-trip through `localStorage` |

## Done

Completed and accepted against the Definition of Done.

| ID | Task | Owner | Points | Notes |
|-----|------|-------|--------|-------|
| KB-501 | FastAPI skeleton with `GET /` and `GET /health` | Dev (student) | 1 | `backend/app/main.py` |
| KB-502 | SQLite `conversion_history` model | Dev-A | 2 | `database.py` and `models/history.py` |
| KB-503 | Pydantic schemas for TTS, STT, assistant, history and common errors | Dev-B | 3 | `backend/app/schemas/` |
| KB-504 | `POST /api/tts` endpoint | Dev-A | 3 | gTTS engine in `tts_service.py` |
| KB-505 | pyttsx3 offline engine with rate control | Dev-B | 2 | Engine switch at runtime |
| KB-506 | `GET /api/tts/languages` | Dev-B | 1 | Populates the language select box |
| KB-507 | Static audio storage under `backend/app/static/audio` | Dev-A | 2 | Naming and cleanup in `utils/audio_utils.py` |
| KB-508 | `TextToSpeech.jsx` page with counter, selects and rate slider | Dev-A | 3 | 5000-character counter, 80–300 wpm slider |
| KB-509 | `AudioPlayer.jsx` with replay and download | Dev-B | 2 | Play, pause, replay, file download |
| KB-510 | Browser WAV recorder `frontend/src/utils/recorder.js` | Dev-A | 3 | Timer and recording indicator |
| KB-511 | `MicrophoneButton.jsx` with permission handling | Dev-B | 2 | Friendly toast on denied permission |
| KB-512 | `POST /api/stt` multipart endpoint | Dev-A | 3 | SpeechRecognition plus pydub conversion |
| KB-513 | Upload validation for six formats and 10 MB | Dev-B | 2 | `backend/app/utils/audio_utils.py` |
| KB-514 | `SpeechToText.jsx` with copy and `.txt` download | Dev-B | 2 | Copy toast, download, reset control |
| KB-515 | Rule engine for the ten assistant commands | Dev-A | 3 | `backend/app/services/assistant_service.py`, no AI/ML |
| KB-516 | `POST /api/assistant` and `GET /api/assistant/commands` | Dev-A | 2 | Command catalogue for the UI chips |
| KB-517 | `Assistant.jsx` chat UI with chips, microphone and speech output | Dev-B | 3 | Timestamps and `clear` command |
| KB-518 | History API: `GET /api/history`, both `DELETE` routes | Dev-A | 2 | `type`, `search`, `limit`, `offset` parameters |
| KB-519 | `History.jsx` with search, filter, clear all and `ConfirmationModal` | Dev-B | 3 | Single-row delete with confirmation |
| KB-520 | `GET /api/stats` and Dashboard with `StatCard` and recent activity | Dev-A | 2 | Quick actions to the three feature pages |
| KB-521 | Dark mode with CSS custom properties | Dev-A | 3 | `frontend/src/index.css` theme tokens |
| KB-522 | `Settings.jsx` with `SettingsContext.jsx` persistence | Dev-B | 3 | Language, rate, auto-play, backend status in `localStorage` |
| KB-523 | Responsive `Sidebar`, `Topbar`, `Toast` and `EmptyState` | Dev (student) | 2 | Collapsing navigation and feedback components |
| KB-524 | Backend pytest suite of 38 tests | Dev (student) | 5 | Seven files under `backend/tests/`, all passing |
| KB-525 | GitHub Actions CI workflow | Dev-A | 2 | `.github/workflows/ci.yml`: pytest plus frontend build |
| KB-526 | `README.md` with screenshots and API reference | Dev-B | 1 | Installation, endpoints, usage walkthrough |

---

## WIP Limits

| Column | WIP Limit | Rationale |
|--------|-----------|-----------|
| Backlog | Unlimited | A replenished queue costs nothing; items are refined only when capacity approaches |
| To Do | 6 | Keeps the ready queue short enough that every card stays estimated, prioritised and understood |
| In Progress | 3 | Two developers plus one shared card; prevents starting work that cannot be finished within the daily cadence |
| Testing | 4 | Verification is fast but serial on one shared environment; more than four cards would queue behind browser and pytest runs |
| Done | Unlimited | Terminal column; cards are archived into the sprint report at the review |

## Task Movement Rules

1. Cards move strictly from left to right: Backlog → To Do → In Progress → Testing → Done; a card is never skipped over a column.
2. A developer pulls at most one new card into In Progress, and only while the column is below its WIP limit of 3.
3. A card may enter Testing only when its code is merged and the related unit tests pass locally (`pytest` green for backend work, `npm run build` clean for frontend work).
4. A card leaves Testing only after every item of the Definition of Done checklist passes: acceptance criteria verified, no regression in the 38-test suite, responsive behaviour checked, and documentation updated where applicable.
5. A blocked card receives a 🚧 marker in its Notes cell and is raised at the daily scrum until an owner and an unblocking action are agreed.
6. A defect discovered in Testing is removed from the column and re-raised in To Do as a new card with a `BUG` prefix and its own estimate; the original card returns to In Progress only if its acceptance criteria remain unmet.
7. Cards may be moved back one column (Testing → In Progress) for rework, but never retroactively from Done without a retrospective decision.
8. Owners update the Notes cell whenever they change a card's state so that the board remains the single source of truth.

## Lead Time and Cycle Time

**Lead time** is the elapsed time from the moment a card enters To Do until it reaches
Done; it measures how long a customer waits for a requested capability.

**Cycle time** is the elapsed time from the moment a card enters In Progress until it
reaches Done; it measures the efficiency of the development flow itself and excludes queue
time in To Do.

Example figures from this project: `KB-504` (`POST /api/tts`) entered To Do on day 2 of
Sprint 1 and reached Done on day 6, giving a lead time of 5 days and a cycle time of 4 days
(one day spent queued behind `KB-503`). `KB-519` (`History.jsx`) had a lead time of 6 days
and a cycle time of 5 days. The team's average cycle time across the 26 Done cards was
2.4 days, comfortably below the two-week sprint boundary.

## Board Update Cadence

The board is updated at each daily scrum (15 minutes, standing, at the start of the working
session). Every developer moves their own cards, clears finished Notes entries and flags
blocked work with the 🚧 marker before speaking. The Scrum Master additionally reviews the
board before sprint planning to confirm the Done column, and before the sprint review to
produce the flow figures quoted in the sprint report.
