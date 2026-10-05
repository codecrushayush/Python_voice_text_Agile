# Scrum Ceremonies

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Sprints:** Sprint 0 (Setup, 8 pts), Sprint 1 (Text-to-Speech, 18 pts), Sprint 2 (STT & Virtual Assistant, 22 pts), Sprint 3 (Testing & Finalization, 16 pts)
**Total backlog:** 64 story points across US-01..US-15

This document records the five Scrum events used in the project, each with its purpose, timebox, participants, inputs, outputs and the way it was actually applied. All logs were kept by the Scrum Master accountability (see `docs/agile/SCRUM_ROLES.md`).

## Sprint Planning

**Purpose:** Decide *what* can be delivered in the sprint and *how* the team will deliver it; produce a sprint goal and a sprint backlog.

**Timebox:** 2 hours.

**Participants:** Product Owner, Scrum Master, Developer (in this project: one student wearing all three hats, plus the assignment brief as the standing stakeholder reference).

**Inputs:**
- Ordered `PRODUCT_BACKLOG.md` with US-01..US-15 and story points.
- `REQUIREMENTS_ENGINEERING.md` (FR-01..FR-22, NFR-01..NFR-14, MoSCoW table).
- Definition of Done (38 pytest tests passing, `npm run build` succeeds, demo works in the browser).
- Velocity from the previous sprint (`BURNDOWN.md`, Velocity table).

**Outputs:**
- Sprint goal statement.
- `SPRINT_BACKLOG.md`: selected stories plus their task decomposition.
- Updated Kanban board (selected items moved to *To Do*).
- Confirmed capacity: 8 working days per sprint.

**How it was applied in this project:**
- **Sprint 0 (8 pts):** planned the environment — Python 3.13 virtualenv, FastAPI + Uvicorn skeleton in `backend/app/main.py`, SQLite via `backend/app/database.py`, React 18 + Vite scaffold, ESLint, and `.github/workflows/ci.yml` so that continuous integration existed *before* feature code. Selected US-01 (project setup) and part of US-02 (history data model).
- **Sprint 1 (18 pts):** selected US-02..US-05 — `POST /api/tts`, `GET /api/tts/languages`, the TextToSpeech page, `AudioPlayer` replay and download. The planning session explicitly decided to build a single `tts_service.py` with both a gTTS and a pyttsx3 path, because the technical spike showed gTTS needs network access while pyttsx3 does not.
- **Sprint 2 (22 pts):** the largest sprint. Selected US-06..US-11 — `POST /api/stt` (multipart), `POST /api/assistant` with its rule handlers, `GET /api/assistant/commands`, the SpeechToText and Assistant pages, `recorder.js`, and the history router. Tasks were split API-first: contract and Pydantic schema, then service, then React page, then tests.
- **Sprint 3 (16 pts):** selected US-12..US-15 plus hardening — the 38-test suite, dashboard `GET /api/stats`, Settings page with dark mode in `SettingsContext.jsx`, responsive sidebar behaviour under 860 px, and full regression against AT-01..AT-30.

## Daily Scrum

**Purpose:** synchronise the work for the next 24 hours, surface impediments early, and keep the sprint plan honest.

**Timebox:** 15 minutes.

**Participants:** Scrum Master and Developer (stand-up against the Kanban board).

**Inputs:** Kanban board, burndown from the previous day, work completed since the last stand-up.

**Outputs:** Updated *Yesterday / Today / Blocker* log, board column moves, impediment entries, refreshed burndown numbers.

**How it was applied in this project:** Each working day of Sprint 1, Sprint 2 and Sprint 3 opened with a short written stand-up following the three-question format. The blocker line was mandatory even when the answer was "None", because that is what made the CORS and ffmpeg impediments visible instead of silently consuming a day. Eight representative entries spanning Sprints 1–3 follow.

### Daily Scrum 1 (Sprint 1, Day 1)
**Yesterday:** Created the FastAPI project structure and the SQLite conversion_history model.
**Today:** Implement POST /api/tts with the gTTS and pyttsx3 engines.
**Blocker:** None.

### Daily Scrum 2 (Sprint 1, Day 2)
**Yesterday:** Wrote tts_service.py with gTTS synthesis and pyttsx3 fallback plus GET /api/tts/languages.
**Today:** Connect the React TextToSpeech page to the API with Axios in frontend/src/services/api.js and add the AudioPlayer download button.
**Blocker:** None.

### Daily Scrum 3 (Sprint 1, Day 4)
**Yesterday:** AudioPlayer replay worked but the download link produced a broken MP3 in Chrome.
**Today:** Serve the generated audio through a proper route, set the Content-Disposition header, and test download from the browser.
**Blocker:** Backend CORS error when running the Vite dev server — preflight OPTIONS on /api/tts was rejected, fixed by adding CORSMiddleware to backend/app/main.py with http://localhost:5173 allowed.

### Daily Scrum 4 (Sprint 2, Day 1)
**Yesterday:** Planned the STT sprint and created the multipart POST /api/stt contract.
**Today:** Implement the browser WAV recorder in frontend/src/utils/recorder.js with MediaRecorder and stream the blob to the backend.
**Blocker:** None.

### Daily Scrum 5 (Sprint 2, Day 3)
**Yesterday:** Microphone capture and the recording indicator with timer were working.
**Today:** Validate uploads in backend/app/utils/audio_utils.py (10 MB limit) and reject unsupported extensions in validate_upload, then wire the error text to the UI.
**Blocker:** MP3 upload needs ffmpeg — pydub could not decode an MP3 sample because ffmpeg was missing on Windows, fixed by installing ffmpeg and adding it to PATH before running uvicorn.

### Daily Scrum 6 (Sprint 2, Day 5)
**Yesterday:** Built assistant_service.py with the condition/dict handlers for hello, time, date, open Google, open YouTube, search Google for, help, about application and clear.
**Today:** Add the Assistant page microphone command input and speak the response with the TTS engine.
**Blocker:** None.

### Daily Scrum 7 (Sprint 3, Day 2)
**Yesterday:** Added history search across input_text and output_text and the type filter dropdown for tts, stt and assistant.
**Today:** Implement the dark mode toggle in SettingsContext.jsx persisting to localStorage key voicesuite.settings.v1 and confirm it survives a refresh.
**Blocker:** None.

### Daily Scrum 8 (Sprint 3, Day 6)
**Yesterday:** Refactored duplicated error handling into utils/exceptions.py and errorMessage() in api.js, and set up the pytest run in .github/workflows/ci.yml.
**Today:** Final regression pass over AT-01..AT-30, fix the three failures found, and confirm npm run build succeeds.
**Blocker:** None — CI failed on the first run because the Node version was unpinned; fixed by pinning Node 22 in the workflow.

## Sprint Review

**Purpose:** inspect the increment with the stakeholder, demonstrate working software, gather feedback and adapt the backlog.

**Timebox:** 1 hour.

**Participants:** Product Owner (host), Scrum Master, Developer; in this project the instructor and a classmate tester acted as the customer proxy.

**Inputs:** The increment running locally (`uvicorn app.main:app` on port 8000, Vite dev server on port 5173), `ACCEPTANCE_TESTS.md`, the current Product Backlog, the Definition of Done.

**Outputs:** Accepted or rejected acceptance tests, feedback items, an updated and re-ordered Product Backlog, updated velocity.

**How it was applied in this project:**
- **Sprint 1 Review:** demoed `POST /api/tts` producing an audible MP3, language change via `GET /api/tts/languages`, rate change, replay and download. The Product Owner executed the TTS rows of `ACCEPTANCE_TESTS.md` (AT-01..AT-07) and marked them Pass. Feedback: users wanted a dark theme and a place to tune defaults → created the Settings backlog item.
- **Sprint 2 Review:** demoed microphone recording with an indicator and timer, the permission-denied path, 10 MB and extension validation, and all nine assistant commands typed and spoken. The classmate tester asked for a "record type" filter on history, which was added to the backlog during the review itself.
- **Sprint Review 3 (final):** full end-to-end demo — Dashboard stats, all six pages, dark mode toggle, mobile sidebar, and a deliberate backend shutdown to show the *"Cannot reach the backend server..."* message from `errorMessage()` in `frontend/src/services/api.js`. All 30 acceptance tests were re-executed; `pytest` reported 38 passed and `npm run build` succeeded. Sign-off recorded at the end of `ACCEPTANCE_TESTS.md`.

## Sprint Retrospective

**Purpose:** inspect how the team worked, identify what went well and what did not, and commit to a small number of actionable improvements.

**Timebox:** 45 minutes.

**Participants:** Scrum Master and Developer (whole team).

**Inputs:** Burndown and velocity data, impediment log, defect notes, CI results, personal effort log.

**Outputs:** A short list of improvement actions with owners, carried into the next Sprint Planning.

**How it was applied in this project:**
- **After Sprint 1:** *Went well* — service/router/schema layering made the tests easy to write. *Not so well* — audio download was debugged late; action: define the download contract during planning, not during testing.
- **After Sprint 2:** *Went well* — blocking issues (CORS, ffmpeg) were surfaced in the Daily Scrum blocker line on the day they appeared. *Not so well* — assistant rules were checked by hand only; action: add dedicated pytest cases for every command and for the unknown-command fallback. Those tests landed in Sprint 3 as part of the 38-test suite.
- **After Sprint 3:** *Went well* — CI caught an unpinned Node version before submission. *Not so well* — frontend error handling was duplicated across pages; action: refactor into `errorMessage()` in `frontend/src/services/api.js` and reuse it everywhere. A final action was to keep the `docs/agile/` folder concise and tied to real artefacts rather than expanding it with boilerplate.

## Backlog Refinement

**Purpose:** add detail, estimates and acceptance criteria to upcoming stories so the next Sprint Planning is short and decisive.

**Timebox:** 30 minutes.

**Participants:** Product Owner and Scrum Master (with the Developer providing estimates).

**Inputs:** Unordered or partially ordered Product Backlog, stakeholder feedback, technical discoveries from the current sprint.

**Outputs:** Refined stories with acceptance criteria and point estimates, split or merged stories, an updated order, an updated emergent requirements list.

**How it was applied in this project:**
- Refined the STT story into separate stories for recording (`recorder.js`), upload validation (10 MB limit and extension check) and transcript export (copy and `.txt` download), because each had different risk.
- Estimated the assistant work only after the technical spike on `assistant_service.py` confirmed that plain condition/dict dispatch was sufficient — no external service, no model, no training data. This is what kept the description accurate: a rule-based virtual assistant, not an AI or chatbot.
- Re-estimated NFR items after the responsiveness review: making the sidebar collapse under 860 px and keeping `GET /api/history` paginated with `limit`/`offset` were promoted from *Could* to *Should*.
- Split the settings story once feedback showed dark mode and audio defaults were separable, allowing dark mode (persisted in `localStorage` key `voicesuite.settings.v1`) to ship even if the rest slipped.

## Ceremony Summary

| Ceremony | Timebox | Frequency | Key Output |
|---|---|---|---|
| Sprint Planning | 2 hours | Once per sprint (4 times total) | Sprint goal + `SPRINT_BACKLOG.md` with task decomposition |
| Daily Scrum | 15 minutes | Every working day of the sprint | Yesterday/Today/Blocker log + updated Kanban board |
| Sprint Review | 1 hour | Once per sprint (4 times total) | Accepted increment, AT-xx results, re-ordered backlog |
| Sprint Retrospective | 45 minutes | Once per sprint (4 times total) | 2–3 improvement actions carried into the next sprint |
| Backlog Refinement | 30 minutes | 1–2 times per sprint | Refined, estimated and re-ordered user stories |
