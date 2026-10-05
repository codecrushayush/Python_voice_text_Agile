# Scrum Roles

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Framework:** Scrum (single-team, single-developer academic implementation)
**Related artefacts:** `docs/agile/USER_STORIES.md`, `docs/agile/PRODUCT_BACKLOG.md`, `docs/agile/SPRINT_PLAN.md`, `docs/agile/SCRUM_CEREMONIES.md`, `docs/agile/BURNDOWN.md`

Scrum defines exactly three accountabilities: Product Owner, Scrum Master and Developers. This document records how each accountability was interpreted and exercised while delivering the 64-point backlog of this project across Sprint 0 (Setup, 8 pts), Sprint 1 (Text-to-Speech, 18 pts), Sprint 2 (STT & Virtual Assistant, 22 pts) and Sprint 3 (Testing & Finalization, 16 pts).

## Product Owner

### Responsibilities
- Owns and orders the Product Backlog; is the single voice of the customer/stakeholder.
- Writes and clarifies user stories with measurable acceptance criteria.
- Defines the priorities that maximise the value of each increment.
- Accepts or rejects the increment at the Sprint Review against the Definition of Done.
- Answers developer questions about scope without becoming a bottleneck.

### How the role was applied in this project
- Authored `docs/agile/USER_STORIES.md` containing all 15 user stories **US-01..US-15**, each with a role, action, business value, story points and acceptance criteria.
- Prioritised `docs/agile/PRODUCT_BACKLOG.md` into a single ordered list, splitting the work into four value slices: environment setup (Sprint 0, 8 pts), text-to-speech output (Sprint 1, 18 pts), speech input plus the rule-based assistant (Sprint 2, 22 pts), hardening and release (Sprint 3, 16 pts).
- Ran the MoSCoW prioritisation recorded in `docs/agile/REQUIREMENTS_ENGINEERING.md`, deciding that authentication was *Won't* (out of assignment scope) and that dark mode was *Should* rather than *Must*.
- Accepted each increment at the Sprint Review by executing the acceptance tests AT-01..AT-30 in a real browser against `http://127.0.0.1:8000`, and by confirming `pytest` reported 38 passed before signing off Sprint 3.
- Converted stakeholder feedback into backlog items: the classmate tester's request for a settings page and dark mode became **US-14** and **US-15** (change log rows in `REQUIREMENTS_ENGINEERING.md`).

### Artifacts owned

| Artefact | File / location | Purpose |
|---|---|---|
| Product Backlog | `docs/agile/PRODUCT_BACKLOG.md` | Single ordered list of all 15 user stories with points and priority |
| User Stories | `docs/agile/USER_STORIES.md` | US-01..US-15 with acceptance criteria |
| Prioritisation decisions | `docs/agile/REQUIREMENTS_ENGINEERING.md` (MoSCoW, change log) | Why a feature was built now or deferred |
| Acceptance sign-off | `docs/agile/ACCEPTANCE_TESTS.md` (AT-01..AT-30, Status = Pass) | Formal acceptance of the increment |
| Release notes / increment summary | Sprint Review section in `docs/agile/SCRUM_CEREMONIES.md` | What the customer saw and accepted |

## Scrum Master

### Responsibilities
- Facilitates every Scrum event and keeps it inside its timebox.
- Ensures the Scrum Guide is understood and enacted; coaches the team rather than directing it.
- Maintains the visualisation of work (Kanban board) and the sprint burndown.
- Removes impediments: environment issues, tooling failures, unclear requirements.
- Shields the team from external distraction and keeps the Definition of Done honest.

### How the role was applied in this project
- Ran all five ceremonies documented in `docs/agile/SCRUM_CEREMONIES.md`: Sprint Planning (2 h), Daily Scrum (15 min), Sprint Review (1 h), Sprint Retrospective (45 min) and Backlog Refinement (30 min), each with a written log entry.
- Maintained the Kanban board columns *To Do → In Progress → In Review → Done* and updated `docs/agile/BURNDOWN.md` at the end of each of the 8 working days in Sprint 2 and Sprint 3.
- Removed concrete blockers: resolved the *backend CORS error when running the Vite dev server* by registering `CORSMiddleware` in `backend/app/main.py` with `http://localhost:5173` allowed; enabled the *MP3 upload needs ffmpeg* path by installing the ffmpeg binary required by `pydub` in `backend/app/utils/audio_utils.py`; restored CI after a failing workflow by pinning the Node version in `.github/workflows/ci.yml`.
- Enforced the timebox on Daily Scrum — the eight sample entries in `SCRUM_CEREMONIES.md` are deliberately short and end with a blocker line.
- Escalated scope questions to the Product Owner accountability instead of silently absorbing them (for example, whether history search should match `output_text` as well as `input_text`).

### Artifacts owned

| Artefact | File / location | Purpose |
|---|---|---|
| Ceremony logs | `docs/agile/SCRUM_CEREMONIES.md` | Purpose, timebox, inputs, outputs of each event |
| Kanban board | `docs/agile/KANBAN_BOARD.md` (board snapshot) | Flow of US-01..US-15 across columns |
| Sprint Burndown | `docs/agile/BURNDOWN.md` + `docs/agile/burndown_chart.png` | Progress against ideal line for Sprint 2 and Sprint 3 |
| Impediment log | Blocker lines in `SCRUM_CEREMONIES.md` Daily Scrum entries | Trackers for CORS, ffmpeg, permissions, CI |
| Velocity table | `docs/agile/BURNDOWN.md` (Velocity section) | 8 / 18 / 22 / 16 completed points per sprint |

## Developer

### Responsibilities
- Turns selected backlog items into a working, tested increment.
- Writes clean, maintainable code and automated tests; keeps the build green.
- Estimates stories, decomposes them into tasks and signs up for work.
- Fixes defects found during the sprint rather than deferring them.

### How the role was applied in this project
- Implemented the backend package structure: `backend/app/main.py` (FastAPI app, CORS, routers), `backend/app/database.py`, `backend/app/models/history.py`, `backend/app/schemas/`, `backend/app/routers/{tts,stt,assistant,history}.py`, `backend/app/services/{tts_service,stt_service,assistant_service,history_service}.py` and `backend/app/utils/{validators,audio_utils,exceptions}.py`.
- Implemented the rule-based assistant dispatch in `backend/app/services/assistant_service.py` using Python conditions, dictionaries and handlers for `hello/hi`, `what time is it`, `what is today's date`, `open Google`, `open YouTube`, `search Google for ...`, `help`, `about application` and `clear`.
- Implemented the React 18 frontend: `frontend/src/components/` (Sidebar, Topbar, StatCard, AudioPlayer, MicrophoneButton, LoadingSpinner, HistoryTable, ConfirmationModal, Toast, EmptyState), `frontend/src/pages/` (Dashboard, TextToSpeech, SpeechToText, Assistant, History, Settings), `frontend/src/services/api.js`, `frontend/src/context/SettingsContext.jsx` and `frontend/src/utils/recorder.js`.
- Authored the test suite: 7 files under `backend/tests/` containing 38 pytest tests, all passing, covering validators, audio limits, TTS, STT, assistant rules and history CRUD.
- Kept CI green: `.github/workflows/ci.yml` installs Python 3.13 and Node 22, runs `pytest` and `npm run build` on every push.
- Verified runtime behaviour end-to-end: empty text returns 422 `ValidationError`, missing history id returns 404 `NotFoundError`, uploads above 10 MB are rejected by `backend/app/utils/audio_utils.py`, and a stopped backend surfaces *"Cannot reach the backend server..."* through `errorMessage()` in `frontend/src/services/api.js`.

### Artifacts owned

| Artefact | File / location | Purpose |
|---|---|---|
| Application source | `backend/app/**`, `frontend/src/**` | The working increment |
| Automated tests | `backend/tests/` (7 files, 38 tests) | Proof of correctness for every service |
| CI pipeline | `.github/workflows/ci.yml` | Continuous verification on every push |
| Task breakdown | sprint task lists in `docs/agile/SPRINT_PLAN.md` | Decomposition of each US into tasks |
| Sprint Backlog | `docs/agile/SPRINT_PLAN.md` | Items selected for the current sprint |

## Role Summary Table

| Role | Key Responsibilities | Outputs |
|---|---|---|
| Product Owner | Owns and orders the backlog, writes and clarifies stories, maximises value, accepts the increment | `PRODUCT_BACKLOG.md`, `USER_STORIES.md`, MoSCoW decisions, acceptance sign-off in `ACCEPTANCE_TESTS.md` |
| Scrum Master | Facilitates ceremonies within timeboxes, maintains board and burndown, removes impediments, coaches Scrum | `SCRUM_CEREMONIES.md`, `BURNDOWN.md`, `burndown_chart.png`, Kanban snapshot, impediment log |
| Developer | Designs, implements and tests the increment; estimates and decomposes stories; keeps the build green | `backend/app/**`, `frontend/src/**`, `backend/tests/**` (38 passing tests), `.github/workflows/ci.yml` |

## Academic Individual Project Note

This is a single-student coursework project, so **one person simulates all three Scrum accountabilities**. The simulation was kept honest by separating the *artefacts and decision points* of each role rather than merging them into one undifferentiated workflow.

- **Simulating the Product Owner.** The PO body of work was done during the requirements-analysis phase, before any code was written: the assignment brief was decomposed into elicited requirements (see `REQUIREMENTS_ENGINEERING.md`, Requirements Elicitation), those requirements were written as 15 user stories with acceptance criteria in `USER_STORIES.md`, and they were given points and a strict order in `PRODUCT_BACKLOG.md`. Product-owner time was deliberately front-loaded and revisited at Backlog Refinement, so that prioritisation decisions (for example moving `GET /api/stats` dashboard work ahead of history CSV export) were made *as a PO*, not incidentally while coding. Acceptance was likewise performed as a separate act: at each Sprint Review the code was run in the browser and checked against the acceptance criteria, and only then marked Pass in `ACCEPTANCE_TESTS.md`.
- **Simulating the Scrum Master.** The SM body of work was done in weekly ceremony logs: every Sprint Planning, Daily Scrum, Sprint Review, Sprint Retrospective and Backlog Refinement has a written entry in `SCRUM_CEREMONIES.md` with its timebox, inputs and outputs, and the eight Daily Scrum entries show the yesterday/today/blocker structure used day by day. The same accountability maintained the Kanban board state and the burndown numbers for Sprint 2 and Sprint 3 in `BURNDOWN.md`, and recorded impediment resolution (CORS for the Vite dev server, ffmpeg for MP3 decoding via `pydub`, microphone `NotAllowedError` handling in `recorder.js`). By writing the ceremony down even when it lasted ten minutes, the facilitation role was exercised rather than merely asserted.
- **Simulating the Developer.** The Developer body of work *is* the code: `backend/app/**`, `frontend/src/**`, the 38 tests in `backend/tests/` and the CI workflow. Because the developer role is the only one that produces running software, it necessarily consumed most of the elapsed effort; the other two roles existed to ensure that what was built was the right thing (PO) and that it was built sustainably (SM).

The separation matters academically: an assessor can inspect three distinct sets of outputs — prioritised backlog and acceptance sign-off (PO), ceremony logs and burndown (SM), source and tests (Developer) — and verify that Scrum was practised rather than named.

## How the roles would split in a team of 4

In a four-person team the three accountabilities are distributed as 1 Product Owner, 1 Scrum Master (who also codes) and 2 Developers. The table below contrasts a real team's split with how this project simulated each share of the work.

| Role | Responsibilities in a real team | How this project simulates it |
|---|---|---|
| Product Owner (1 person) | Owns the ordered backlog, represents stakeholders and users, defines acceptance criteria, accepts or rejects each increment, decides scope trade-offs mid-sprint | Requirements-analysis phase produced `USER_STORIES.md` (US-01..US-15) and the ordered `PRODUCT_BACKLOG.md`; MoSCoW and the change log record scope trade-offs; acceptance performed by executing AT-01..AT-30 at each Sprint Review |
| Scrum Master (1 person, also a developer) | Facilitates all five ceremonies to their timeboxes, removes impediments, coaches the team on Scrum, keeps the board and burndown accurate, typically contributes ~50% coding capacity | Weekly ceremony logs in `SCRUM_CEREMONIES.md` (2 h / 15 min / 1 h / 45 min / 30 min), Kanban column updates, `BURNDOWN.md` updated per working day, impediment entries for CORS, ffmpeg and CI; remaining capacity spent coding |
| Developer (2 people) | Build the increment, write unit and integration tests, keep CI passing, estimate and decompose stories, review each other's work, fix defects in-sprint | Source split across backend (`backend/app/**`) and frontend (`frontend/src/**`) as if by two developers; 38 pytest tests in `backend/tests/` plus `.github/workflows/ci.yml` enforce the same Definition of Done two developers would share; pair-style review simulated by the Sprint Review demo |
| Whole team (4 together) | Jointly attend Sprint Planning, Review and Retrospective; collective ownership of the Definition of Done | Sprint Review demoed the full stack (FastAPI + React) end to end and the Retrospective produced action items that were carried into the next sprint's planning |

The main difference in a real team is **communication overhead and hand-offs**: two developers would need interface contracts between the API and the UI, code review of each other's pull requests, and a shared branch strategy. In this project those were replaced by the API schema itself (Pydantic models in `backend/app/schemas/` consumed by Axios in `frontend/src/services/api.js`) and by CI as the automated reviewer. The main difference on the Scrum Master side is capacity: a part-time SM in a team of four would have roughly half a sprint's worth of coding, whereas here the facilitation work was interleaved with full-time development.
