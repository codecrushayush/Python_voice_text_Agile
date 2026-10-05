# Sprint Plan

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Method:** Scrum with two-week sprints (one-week setup sprint), team of two student developers
**Total committed effort:** 64 story points across four sprints

| Sprint | Duration | Calendar window |
|--------|----------|-----------------|
| Sprint 0 — Project Setup and Planning | Week 1 | 02–08 March 2026 |
| Sprint 1 — Text-to-Speech | Weeks 2–3 | 09–22 March 2026 |
| Sprint 2 — Speech-to-Text and Virtual Assistant | Weeks 4–5 | 23 March – 05 April 2026 |
| Sprint 3 — Testing and Finalization | Weeks 6–7 | 06–19 April 2026 |

---

## Sprint 0 — Project Setup and Planning

### Sprint Goal
Establish a working development environment, a shared understanding of the requirements, and
a walking skeleton in which FastAPI answers `GET /health` and React renders the application
shell, so that feature development can start without technical delay.

### Duration & Dates
Week 1 — 02 March 2026 to 08 March 2026.

### User Stories
No user-facing stories; Sprint 0 delivers technical enablers for US-01 to US-15.

### Tasks
- [ ] Capture and sign off the functional and non-functional requirements for TTS, STT and the rule-based assistant
- [ ] Create the `docs/agile/` folder and draft `USER_STORIES.md`, `PRODUCT_BACKLOG.md`, `SPRINT_PLAN.md`, `KANBAN_BOARD.md`
- [ ] Initialise the git repository with `main`, `develop` and `feature/*` branches
- [ ] Create the project folder structure: `backend/app`, `backend/tests`, `frontend/src`, `docs/agile`
- [ ] Design the SQLite table `conversion_history (id, type, input_text, output_text, audio_path, created_at)`
- [ ] Implement `backend/app/database.py` (engine, `SessionLocal`, `Base`) and `backend/app/models/history.py`
- [ ] Draw UI wireframes for Dashboard, TextToSpeech, SpeechToText, Assistant, History and Settings
- [ ] Scaffold the React 18 + Vite application (`frontend/src/App.jsx`, `frontend/src/index.css`, `frontend/src/services/api.js`)
- [ ] Scaffold the FastAPI application with `GET /` and `GET /health` (`backend/app/main.py`)
- [ ] Commit the stub `.github/workflows/ci.yml` for activation in Sprint 3

### Story Points

| Task | Story Points |
|------|--------------|
| Requirements baseline and `docs/agile/` artefacts | 1 |
| Git repository, branch strategy and folder structure | 1 |
| SQLite schema, `database.py` and `models/history.py` | 2 |
| UI wireframes for the six pages | 1 |
| React 18 + Vite + Axios scaffold | 1 |
| FastAPI skeleton with `GET /` and `GET /health` | 1 |
| Stub `.github/workflows/ci.yml` | 1 |
| **Sprint 0 total** | **8** |

### Deliverables
- Version-controlled repository with an agreed branching strategy
- `conversion_history` table created in SQLite and mapped with SQLAlchemy
- Runnable FastAPI service answering `GET /` and `GET /health`
- Runnable React + Vite front end showing the application shell
- The four agile artefacts in `docs/agile/`
- Wireframes for all six pages

### Acceptance Criteria
- `uvicorn app.main:app` starts and `GET /health` returns a JSON status response
- `npm run dev` renders the React shell without console errors
- The `conversion_history` table exists with the six agreed columns
- Every team member can clone the repository and run both applications from the README draft
- All four agile documents are committed under `docs/agile/`

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Assistant command scope remains ambiguous | High — rework of `assistant_service.py` in Sprint 2 | Freeze the ten rule-based commands in the backlog during Sprint 0 |
| Team unfamiliar with FastAPI and Vite conventions | Medium — slow start in Sprint 1 | Complete short tutorials before Sprint 1 and commit the skeleton early |
| Schema change after data has been written | Medium — manual SQLite migration | Review all six columns with both developers; keep mappings in `models/history.py` only |
| Merge conflicts on shared branches | Low — delivery delay | Short-lived `feature/*` branches, daily pushes, peer review of every merge |

### Sprint Review
Demonstrated: repository layout, the `conversion_history` table, `GET /health` returning a
status payload, and the React shell with the planned navigation. Accepted by the
stakeholder (supervisor) on the condition that the four agile documents are kept current.

### Sprint Retrospective

#### What Went Well
- Requirements and the ten assistant commands were agreed before coding began, which removed scope debate later.
- The FastAPI and Vite skeletons were running on day three, so Sprint 1 started with a green baseline.

#### What Did Not Go Well
- Wireframing was started too late and had to be compressed into the final two days.
- The CI stub was committed but never executed, so its validity was unproven.

#### Action Items
- Start design artefacts in the first half of every sprint.
- Run the CI workflow on a branch as soon as it is committed.

---

## Sprint 1 — Text-to-Speech

### Sprint Goal
Deliver a complete text-to-speech vertical slice: a validated request accepted by
`POST /api/tts`, audio generated by gTTS or pyttsx3, stored under
`backend/app/static/audio`, played and downloaded in the browser, and recorded in the
history table.

### Duration & Dates
Weeks 2–3 — 09 March 2026 to 22 March 2026.

### User Stories
US-01 (Convert text to speech), US-02 (Choose language and speech rate), US-03 (Play, replay
and download generated audio).

### Tasks
- [ ] Write the Pydantic request/response models in `backend/app/schemas/tts.py` (5000-character maximum, language, engine, rate 80–300 wpm)
- [ ] Implement `backend/app/routers/tts.py` exposing `POST /api/tts`
- [ ] Implement the gTTS engine in `backend/app/services/tts_service.py`
- [ ] Add the pyttsx3 offline engine with speech-rate control to `tts_service.py`
- [ ] Implement `GET /api/tts/languages` returning the supported language catalogue
- [ ] Configure static audio storage in `backend/app/static/audio` with helpers in `backend/app/utils/audio_utils.py`
- [ ] Create `frontend/src/pages/TextToSpeech.jsx` with text area, character counter, language select, engine select and rate slider
- [ ] Build `frontend/src/components/AudioPlayer.jsx` with play, pause and replay controls
- [ ] Add the download button for the generated audio file
- [ ] Persist each successful conversion through `backend/app/services/history_service.py`
- [ ] Add validation error handling with `backend/app/utils/validators.py` and friendly messages

### Story Points

| Task | Story Points |
|------|--------------|
| TTS schemas in `backend/app/schemas/tts.py` | 2 |
| `POST /api/tts` with the gTTS engine | 3 |
| pyttsx3 offline engine with rate control | 2 |
| `GET /api/tts/languages` | 1 |
| Static audio storage in `backend/app/static/audio` | 2 |
| `TextToSpeech.jsx` page controls | 3 |
| `AudioPlayer.jsx` with replay | 2 |
| Download button | 1 |
| History persistence via `history_service.py` | 2 |
| **Sprint 1 total** | **18** |

### Deliverables
- Working `POST /api/tts` and `GET /api/tts/languages` endpoints
- Two speech engines (gTTS online, pyttsx3 offline) selectable at runtime
- Audio files persisted under `backend/app/static/audio`
- The TextToSpeech page with counter, selects and rate slider
- `AudioPlayer` component with replay and download
- History rows written for every successful conversion

### Acceptance Criteria
- A 200-character English request returns playable audio in under five seconds
- Empty text and input above 5000 characters are rejected with a readable message
- Changing language, engine or rate regenerates the audio accordingly
- The generated file can be replayed and downloaded from the browser
- The conversion appears in the `conversion_history` table with `type = 'tts'`

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| gTTS requires internet access | High — no speech output in the offline laboratory | Ship pyttsx3 as an offline fallback engine |
| pyttsx3 voices missing on laboratory machines | Medium — engine tests fail | Detect voices at start-up and skip the engine test through pytest fixtures |
| Generated audio accumulates in `static/audio` | Medium — disk exhaustion | Use unique file names per conversion and delete files with their history record |
| Long inputs delay synthesis | Medium — user perceives a freeze | Enforce the 5000-character limit and display `LoadingSpinner` during generation |

### Sprint Review
Demonstrated: typing text, selecting English/Hindi, moving the rate slider, generating
speech with both engines, replaying and downloading the file, and confirming the new row on
the History data source. Accepted; the supervisor requested that the character counter turn
red above 5000 characters.

### Sprint Retrospective

#### What Went Well
- Splitting schemas, service and router into separate files kept `POST /api/tts` easy to test.
- Delivering both engines in one sprint removed the offline-availability risk early.

#### What Did Not Go Well
- Audio file naming collided twice during parallel work and had to be moved into `audio_utils.py`.
- The download button was implemented before the player and had to be reworked once `AudioPlayer.jsx` existed.

#### Action Items
- Agree shared file-naming conventions in sprint planning, not during coding.
- Sequence component dependencies before starting UI tasks.

---

## Sprint 2 — Speech-to-Text and Virtual Assistant

### Sprint Goal
Complete the two remaining feature pillars: speech-to-text from microphone recording and
file upload, and the rule-based virtual assistant, together with the History and Dashboard
pages that make the system usable end to end.

### Duration & Dates
Weeks 4–5 — 23 March 2026 to 05 April 2026.

### User Stories
US-04, US-05, US-06, US-07, US-08, US-09, US-10, US-11, US-12, US-13.

### Tasks
- [ ] Implement the browser WAV recorder `frontend/src/utils/recorder.js` with elapsed-time and recording indicators
- [ ] Build `frontend/src/components/MicrophoneButton.jsx` with MediaDevices permission handling
- [ ] Implement `POST /api/stt` (multipart) in `backend/app/routers/stt.py` using SpeechRecognition and pydub
- [ ] Enforce upload validation in `backend/app/utils/audio_utils.py`: WAV, MP3, OGG, WebM, FLAC, M4A and a 10 MB maximum
- [ ] Create `frontend/src/pages/SpeechToText.jsx` with recognised text, copy, download `.txt` and reset
- [ ] Implement the rule engine for the ten commands in `backend/app/services/assistant_service.py`
- [ ] Expose `POST /api/assistant` and `GET /api/assistant/commands` in `backend/app/routers/assistant.py`
- [ ] Create `frontend/src/pages/Assistant.jsx` with chat bubbles, timestamps, command chips, microphone input and spoken responses
- [ ] Implement `GET /api/history` (type, search, limit, offset) and both `DELETE` variants in `backend/app/routers/history.py`
- [ ] Create `frontend/src/pages/History.jsx` with search, type filter, `ConfirmationModal`, clear all and record download
- [ ] Implement `GET /api/stats` and the Dashboard with `StatCard`, quick actions and recent activity
- [ ] Add `frontend/src/components/EmptyState.jsx` and `frontend/src/components/Toast.jsx` for feedback

### Story Points

| Task | Story Points |
|------|--------------|
| WAV recorder `frontend/src/utils/recorder.js` | 3 |
| `MicrophoneButton.jsx` permission handling | 2 |
| `POST /api/stt` multipart endpoint with pydub conversion | 3 |
| Upload validation (six formats, 10 MB) in `utils/audio_utils.py` | 2 |
| `SpeechToText.jsx` result page with copy and `.txt` download | 2 |
| Rule engine for ten commands plus assistant endpoints | 3 |
| `Assistant.jsx` chat UI, chips, microphone input and speech output | 2 |
| History API and `History.jsx` with search, filter and confirmation modal | 3 |
| `GET /api/stats` and `Dashboard.jsx` | 2 |
| **Sprint 2 total** | **22** |

### Deliverables
- Browser microphone recording producing WAV uploads
- `POST /api/stt` with format and size validation
- SpeechToText page with copy and `.txt` download
- Rule-based assistant supporting all ten commands, typed and spoken
- History page with search, filter, single delete, bulk clear and confirmation modal
- Dashboard with statistics, quick actions and recent activity

### Acceptance Criteria
- A recorded WAV and an uploaded MP3 both return recognised text
- A 12 MB file and a `.txt` file posing as audio are rejected with friendly messages
- All ten assistant commands return the expected rule-based response, including `clear`
- A history record can be located by search, removed individually after confirmation, or cleared by type
- Dashboard counts match the rows returned by `GET /api/history`

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Microphone permission denied by the browser | High — transcription unusable | Show an instructive toast and keep the file-upload path as an alternative |
| MediaRecorder emits WebM in one browser and WAV in another | Medium — server rejects the upload | Normalise audio in `recorder.js` and pydub; test on Chrome, Edge and Firefox |
| Uploads larger than 10 MB block the worker | Medium — timeouts and disk pressure | Reject on type and size in `audio_utils.py` before any decoding |
| Rule matching brittle against phrasing variants | Medium — unhelpful assistant replies | Match on normalised keywords and return the help message as fallback |

### Sprint Review
Demonstrated: recording with a live timer, uploading an MP3 file, copying and downloading
recognised text, executing all ten assistant commands by typing and by voice with the
response spoken back, searching and deleting history rows through the confirmation modal,
and reading dashboard statistics. Accepted by the supervisor with no outstanding defects.

### Sprint Retrospective

#### What Went Well
- Reusing `recorder.js` for both the SpeechToText page and the assistant microphone input avoided duplicated code.
- Implementing the history API before the Dashboard made both pages straightforward.

#### What Did Not Go Well
- Browser audio format differences cost roughly a day of debugging before pydub normalisation was added.
- The assistant initially matched only exact strings; keyword normalisation was added mid-sprint.

#### Action Items
- Probe browser capability differences in the first task of any media-related story.
- Write fuzzy-match test cases alongside rule implementation, not afterwards.

---

## Sprint 3 — Testing and Finalization

### Sprint Goal
Harden the completed product: prove correctness with an automated pytest suite and CI,
improve usability with dark mode, settings and responsive layout, refactor for maintainability,
and produce the final documentation.

### Duration & Dates
Weeks 6–7 — 06 April 2026 to 19 April 2026.

### User Stories
US-14 (Change theme and speech settings), US-15 (Receive friendly errors at any screen
size); regression coverage for US-01 to US-13.

### Tasks
- [ ] Create `backend/tests/conftest.py` with the FastAPI test client and an isolated SQLite database
- [ ] Write `backend/tests/test_health.py`, `test_tts.py`, `test_stt.py`, `test_assistant.py`, `test_history.py`, `test_validation.py` (38 tests in total)
- [ ] Refactor shared logic into `backend/app/services/` and `backend/app/utils/` (`validators.py`, `audio_utils.py`, `exceptions.py`)
- [ ] Implement light/dark theming in `frontend/src/index.css` using CSS custom properties
- [ ] Create `frontend/src/context/SettingsContext.jsx` and `frontend/src/pages/Settings.jsx` (default language, speech rate, auto-play, backend status, `localStorage`)
- [ ] Make `frontend/src/components/Sidebar.jsx` and `Topbar.jsx` collapse responsively
- [ ] Polish `Toast`, `EmptyState` and `ConfirmationModal` across all six pages
- [ ] Activate `.github/workflows/ci.yml`: install Python 3.13, run pytest, build the Vite bundle
- [ ] Write `README.md` with setup steps, API reference and screenshots
- [ ] Execute the full regression pass and the acceptance checklist

### Story Points

| Task | Story Points |
|------|--------------|
| Pytest suite of 38 tests across seven test files | 5 |
| Refactoring into `services/` and `utils/` | 3 |
| Dark mode, `SettingsContext.jsx` and `Settings.jsx` | 3 |
| Responsive sidebar, toasts and empty states | 2 |
| GitHub Actions CI in `.github/workflows/ci.yml` | 2 |
| `README.md`, screenshots and documentation review | 1 |
| **Sprint 3 total** | **16** |

### Deliverables
- 38 passing pytest tests covering health, TTS, STT, assistant, history and validation
- Refactored backend organised into routers, services, schemas and utils
- Dark and light themes with persistent user settings
- Responsive layout verified at 375 px, 768 px and 1440 px
- A green GitHub Actions pipeline on every push
- Final `README.md` with screenshots and the API reference

### Acceptance Criteria
- `pytest` reports 38 passed, 0 failed on a clean machine
- The CI workflow passes on the `main` branch
- Theme, language, rate and auto-play preferences survive a page reload
- No horizontal scrolling occurs at a viewport width of 375 px
- All fifteen user stories in `USER_STORIES.md` are demonstrated and signed off
- The README alone is sufficient to install and run the project

### Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Test coverage too shallow to catch regressions | High — defects escape to the final deliverable | Cover all seven routers with 38 tests and run them in CI on every push |
| Refactoring breaks working endpoints | High — regression in a delivered feature | Refactor only while the suite is green and re-run it after each move |
| Dark mode introduces unreadable contrast | Medium — usability defect | Centralise colours as CSS custom properties in `index.css` and check all six pages |
| CI differs from the local environment | Medium — pipeline failures unrelated to code | Pin Python 3.13 and the Node version in `ci.yml` and cache `pip` / `npm` |

### Sprint Review
Demonstrated: the full pytest run showing 38 passed tests, a successful GitHub Actions
build, dark and light themes across all six pages, settings persistence after reload, the
responsive sidebar at mobile width, and a walkthrough of every acceptance criterion from
the fifteen user stories. Final acceptance granted by the supervisor.

### Sprint Retrospective

#### What Went Well
- Writing tests after the features existed made the 38 test cases quick to specify and stable.
- Centralising colours as CSS custom properties made dark mode a single-session change.

#### What Did Not Go Well
- Two tests initially depended on the developer's local database and had to be reworked in `conftest.py`.
- Documentation was left to the last three days, compressing screenshot capture.

#### Action Items
- Isolate test data in fixtures from the first test onward.
- Capture screenshots as each feature is demonstrated, not at project end.

---

## Sprint Summary

| Sprint | Goal | User Stories | Story Points | Status |
|--------|------|--------------|--------------|--------|
| Sprint 0 | Project setup and planning with a walking skeleton | — (technical enablers) | 8 | Completed |
| Sprint 1 | End-to-end text-to-speech with playback and download | US-01, US-02, US-03 | 18 | Completed |
| Sprint 2 | Speech-to-text, rule-based assistant, history and dashboard | US-04, US-05, US-06, US-07, US-08, US-09, US-10, US-11, US-12, US-13 | 22 | Completed |
| Sprint 3 | Testing, refactoring, usability polish and documentation | US-14, US-15 (regression for US-01–US-13) | 16 | Completed |
| **Total** | | **15 stories** | **64** | **4 of 4 completed** |
