# Extreme Programming (XP)

## 1. Introduction

Extreme Programming (XP) is an agile software development framework formulated by Kent Beck in 1996 and expanded in *Extreme Programming Explained* (1999, 2nd ed. 2004). Its distinguishing move is to take "good" software engineering practices — testing, review, continuous integration, simple design, refactoring — and push them to the *extreme*: test everything, integrate many times a day, refactor whenever duplication appears, keep the design no more elaborate than the current requirement demands.

XP is organised around five values — **communication, feedback, simplicity, courage and respect** — and twelve core practices. This document records how each relevant practice was applied to *Python Text-to-Speech, Speech-to-Text and Virtual Assistant*.

---

## 2. Core Practices Applied in this Project

### 2.1 Refactoring

**Definition.** Refactoring is changing the internal structure of code without changing its externally observable behaviour (Martin Fowler, *Refactoring: Improving the Design of Existing Code*, 1999). It is done in small steps, guarded by tests, to keep the code easy to read and extend.

**Applied in this project**

- Speech logic originally lived inside `backend/app/routers/tts.py` and `stt.py`; it was moved into `services/tts_service.py` and `services/stt_service.py` so the routers only validate, delegate and shape the HTTP response.
- Repeated text checks across the TTS, STT and assistant routers were extracted into `backend/app/utils/validators.py`.
- Repeated `try/except` blocks in every route were replaced by a single `DomainError` handler registered in `backend/app/main.py`.
- Duplicated React buttons, cards and table markup became reusable components: `Sidebar`, `StatCard`, `AudioPlayer`, `MicrophoneButton`, `HistoryTable`, `ConfirmationModal`, `Toast`, `LoadingSpinner`, `EmptyState`.
- History CRUD and the statistics query were consolidated into `services/history_service.py`.
- Full worked before/after examples are in `docs/agile/REFACTORING.md`.

### 2.2 Pair Programming

**Definition.** Two developers work at one machine on the same code: one drives (types), the other navigates (reviews, thinks ahead). Roles swap frequently. The intent is continuous review, shared knowledge and fewer defects.

**Applied in this project — an honest account.** This is an individual university submission, so continuous two-person pairing was not possible for most of the work. What was actually done:

| Activity | Form of pairing | Outcome |
|----------|-----------------|---------|
| Design of `assistant_service.py` | **Mob review** — two classmates walked the router and the `COMMANDS` dict together on a whiteboard for ~40 minutes | Agreement that the assistant stays rule-based (Python conditions, dicts, handlers); no AI/LLM scope creep |
| `routers/stt.py` + `audio_utils.py` | **Peer review of a diff** — classmate read the branch before merge and suggested rejecting non-WAV/MP3 uploads explicitly | `validate_upload()` gained an allow-list instead of a generic "bad file" error |
| Test design in `tests/conftest.py` | **Pair session** — pair-programmed the fixture that patches the TTS engine and the recogniser | Fixtures reused unchanged by all 38 tests |
| Dashboard statistics | **Walkthrough after the fact** — presenter + reviewer at the sprint review | Confirmed `GET /api/stats` aggregation logic |

Everything else was solo work with asynchronous pull-request review. Had this been a team project, the intended policy was: all `feature/*` branches require one reviewer, and any change to `app/utils/validators.py` or `app/services/*` is pair-written because those modules are shared by multiple stories.

**How pairing would work in a team setting**

- Driver/navigator roles swap at least every 30 minutes.
- Pair on the risky or shared code (services, validators, fixtures) and work solo on leaf code (page layout, styling).
- The navigator is responsible for suggesting the next test — this is how XP merges pairing with TDD.
- Rotate pairs daily so knowledge of `assistant_service.py` does not sit with one person.

### 2.3 Small Releases

**Definition.** Release working software in small, frequent increments. Each release is potentially shippable, keeps feedback short and limits the amount of untested code in flight.

**Applied in this project**

| Release | Sprint | Contents |
|---------|--------|----------|
| R0 | Sprint 0 Setup (8 pts) | Repository skeleton, FastAPI app, SQLite + SQLAlchemy wiring, `GET /health`, pytest + Vite scaffolding, CI workflow |
| R1 | Sprint 1 TTS (18 pts) | `POST /api/tts`, `GET /api/tts/languages`, `TextToSpeech.jsx`, `AudioPlayer`, `MicrophoneButton`, history persistence |
| R2 | Sprint 2 STT & Assistant (22 pts) | `POST /api/stt`, `POST /api/assistant`, `GET /api/assistant/commands`, `SpeechToText.jsx`, `Assistant.jsx`, `History.jsx` with search/filter and delete |
| R3 | Sprint 3 Testing/Finalization (16 pts) | `Dashboard.jsx` + `GET /api/stats`, `Settings.jsx` with light/dark theme, 38-test suite, GitHub Actions CI, documentation |

Each release ended at a sprint review with a live demonstration of the increment on the `develop` branch.

### 2.4 Simple Design

**Definition.** The system must pass all tests, reveal intention, avoid duplication, and consist of the fewest possible classes and methods (Beck's four rules). Design for today's requirement, not a hypothetical tomorrow.

**Applied in this project**

- The assistant is a lookup over `COMMANDS` in `assistant_service.py` with eight handlers — no rule engine, no NLP pipeline, because the requirement was eight fixed utterances.
- `conversion_history` has six columns; no soft delete, no audit trail, no multi-user column.
- `history_service.py` exposes exactly the operations the four history endpoints need: list, get, delete one, delete all, stats.
- No ORM relationships beyond the single `History` model in `models/history.py`, because there is one table.
- Schemas in `app/schemas/` mirror the actual request/response payloads rather than anticipating future versions.

### 2.5 Coding Standards

**Definition.** An agreed, consistently applied style so that any developer can read any file. Standards remove pointless debate and make refactoring safe.

**Applied in this project**

| Area | Convention |
|------|------------|
| Python | PEP 8, `snake_case` functions and variables, `PascalCase` classes, docstrings on service functions, type hints on public signatures |
| Backend layout | `routers/` handle HTTP, `services/` hold business logic, `utils/` hold cross-cutting helpers, `schemas/` hold Pydantic contracts |
| Exceptions | Domain failures raise `DomainError` subclasses from `utils/exceptions.py`; no bare `except:` |
| JavaScript/React | Function components with hooks, `PascalCase` component files (`.jsx`), `camelCase` props, `services/api.js` as the single Axios entry point |
| Naming | Verb-first service methods (`synthesize`, `transcribe`, `execute`, `delete_record`, `get_stats`) |
| Commits | Conventional Commits — `feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:` (see `VERSION_CONTROL.md`) |
| Tests | `tests/test_<area>.py`, one test class or function group per endpoint, `assert` with an explanatory message where the condition is not obvious |

### 2.6 Continuous Integration

**Definition.** Integrate (merge and verify) working code many times a day. Every integration is verified by an automated build and the full test suite, so the mainline is always releasable.

**Applied in this project**

- Feature branches (`feature/text-to-speech`, `feature/speech-to-text`, `feature/virtual-assistant`, `feature/history`, `feature/dashboard-ui`, `feature/testing-ci`) are merged into `develop`, and `develop` merges to `main` at the end of each sprint.
- `.github/workflows/ci.yml` runs two jobs on every push and pull request targeting `main` and `develop`: **backend-tests** (`pip install -r requirements.txt` then `python -m pytest` on Python 3.13) and **frontend-build** (`npm ci` then `npm run build` on Node 20).
- Locally the same gates are `python -m pytest` and `npm run build`; a merge only happens when both are green.
- See `docs/agile/CONTINUOUS_INTEGRATION.md` for the full pipeline.

### 2.7 Test Driven Development

**Definition.** Write a failing test, write the minimum code to pass it, then refactor with the safety of the test. The test is written *first* because it forces the API to be designed from the caller's point of view.

**Applied in this project**

- Worked example 1: an empty TTS text rejection test → `validators.validate_text()`.
- Worked example 2: a 404 for a missing history record → `history_service.get_record()` raising `NotFoundError`.
- Worked example 3: rejection of an unsupported audio file → `audio_utils.validate_upload()`.
- Full detail, including the Red-Green-Refactor cycle and the 38-test suite breakdown, is in `docs/agile/TDD.md`.

### 2.8 Technical Debt

**Definition.** Technical debt is the future cost caused by taking a shortcut now — the software analogue of financial debt: sometimes a deliberate, sensible loan, sometimes an accident. It must be tracked and repaid, not ignored.

**Applied in this project**

| Debt item | Origin | Repayment |
|-----------|--------|-----------|
| Speech logic inside routers | Written fast in Sprint 1 to get the demo working | Moved to `tts_service.py` / `stt_service.py` in Sprint 3 refactor |
| Copy-pasted text validation in three routes | Each route needed the rule immediately | Extracted to `utils/validators.py` |
| Duplicated error handling per route | Inconsistent error responses appearing in testing | Single `DomainError` handler in `main.py` |
| Inline card/button markup in pages | Same UI built three times | Nine shared components under `frontend/src/components/` |
| Two separate query paths for history and stats | Stats added in a later sprint without checking | Consolidated into `history_service.py` |
| Hand-rolled WAV encoding inside the recorder hook | Prototype code from the mic spike | Extracted to `frontend/src/utils/recorder.js` |

The full list of what was repaid, and the debt deliberately *not* taken on (no unused auth, no speculative abstractions), is in `REFACTORING.md`.

### 2.9 Timeboxing

**Definition.** Allocate a fixed amount of time to an activity and treat the box as a hard constraint. When the box closes, the activity stops and the result is reviewed; scope, not quality, is reduced.

**Applied in this project**

| Timebox | Duration | Contents |
|---------|----------|----------|
| Sprint 0 — Setup | 1 week | 8 pts: project skeleton, DB, health endpoint, test harness |
| Sprint 1 — TTS | 2 weeks | 18 pts: conversion, download, persistence |
| Sprint 2 — STT & Assistant | 2 weeks | 22 pts: transcription, commands, history UI |
| Sprint 3 — Testing/Finalization | 1 week | 16 pts: dashboard, settings, 38 tests, CI, docs |
| Individual spikes | 1–3 hours | Browser microphone permission spike; gTTS vs pyttsx3 comparison spike |

Spikes were explicitly timeboxed: when the microphone permission investigation hit its box, the outcome (use `navigator.mediaDevices.getUserMedia`, handle the rejection case in `MicrophoneButton.jsx`) was recorded and work moved on.

### 2.10 Velocity

**Definition.** Velocity is the number of story points a team completes per iteration. It is a planning and forecasting tool, not a performance measure — its value is in making commitments realistic.

**Applied in this project**

Measured on the same scale each sprint (Fibonacci 1/2/3/5/8):

| Sprint | Stories | Points Planned | Points Completed |
|--------|---------|----------------|------------------|
| Sprint 0 — Setup | 4 | 8 | 8 |
| Sprint 1 — TTS | 5 | 18 | 18 |
| Sprint 2 — STT & Assistant | 6 | 22 | 22 |
| Sprint 3 — Testing/Finalization | 5 | 16 | 16 |
| **Total** | **20 (15 core stories)** | **64** | **64** |

The plan used the rolling observation that ~16–18 points per two-week box was realistic; Sprint 2 was the heaviest (22 pts) and required deferring the dashboard statistics story to Sprint 3 — a planning adjustment made *because* velocity data existed, which is the point of measuring it.

### 2.11 Stories

**Definition.** A user story is a short description of a capability from the user's perspective, typically in the form "As a … I want … so that …". It is a placeholder for a conversation, carries acceptance criteria, and is small enough to fit in an iteration.

**Applied in this project**

Fifteen stories (US-01 … US-15) totalling 64 points were written into the product backlog. Examples:

| ID | Story | Points |
|----|-------|--------|
| US-01 | As a user I want invalid input rejected with a clear message so that I do not submit broken requests | 3 |
| US-02 | As a user I want to convert typed text to audible speech so that I can listen to it | 8 |
| US-05 | As a user I want to upload an audio file and receive its transcript so that I do not need to retype it | 5 |
| US-06 | As a user I want the assistant to execute a command such as *what time is it* so that I get an immediate answer | 5 |
| US-11 | As a user I want a dashboard showing TTS/STT/assistant counts so that I can see my usage | 3 |

Every story carried acceptance criteria that map directly onto a pytest test or an acceptance-test ID (`AT-xx` in `docs/agile/ACCEPTANCE_TESTS.md`) — the practice that links XP's stories to TDD's test-first discipline.

---

## 3. XP Practice Adoption

| Practice | Adopted | How |
|----------|---------|-----|
| Planning game | Yes | Sprint plan with 64 points across Sprint 0–3; backlog re-estimated after each review |
| Small releases | Yes | R0–R3, one per sprint, each demonstrated at review |
| Metaphor | Partially | Layered "voice pipeline" metaphor: hear input → convert → speak output → remember in history |
| Simple design | Yes | Eight assistant handlers, six-column table, one model, no speculative abstractions |
| Refactoring | Yes | Service extraction, shared validators, nine React components, consolidated history service |
| Pair programming | Partially | Peer review of diffs, one mob review of the assistant router, one paired fixture session (individual coursework) |
| Test-driven development | Yes | Red-Green-Refactor applied to validation, history 404 and upload validation; 38 tests |
| Collective ownership | Partially | Module ownership table in `FDD.md`; any module readable by all, changes flagged in PRs |
| Continuous integration | Yes | GitHub Actions on `main`/`develop`: pytest + Vite build; local equivalents run before merge |
| Coding standards | Yes | PEP 8, router/service/utils layering, Conventional Commits |
| Sustainable pace | Yes | Two-week sprints, scoped points, no overtime planned |
| Whole team | No | Individual project; substituted with classmate peer review and supervisor sprint reviews |

---

## 4. Velocity per Sprint

| Sprint | Stories | Points Planned | Points Completed |
|--------|---------|----------------|------------------|
| Sprint 0 — Setup | 4 | 8 | 8 |
| Sprint 1 — Text-to-Speech | 5 | 18 | 18 |
| Sprint 2 — Speech-to-Text & Assistant | 6 | 22 | 22 |
| Sprint 3 — Testing / Finalization | 5 | 16 | 16 |
| **Total** | **20** | **64** | **64** |

Completion was 100% of planned points in every sprint; the mechanism that protected this was moving a story (dashboard statistics) out of Sprint 2 rather than carrying over unfinished work.

---

## 5. Small Releases

| Release | Sprint | Contents |
|---------|--------|----------|
| R0 — Foundation | Sprint 0 (8 pts) | `backend/app/main.py`, `database.py`, `models/history.py`, `GET /health`, pytest harness with `conftest.py`, Vite React app, `.github/workflows/ci.yml` |
| R1 — Text-to-Speech | Sprint 1 (18 pts) | `POST /api/tts`, `GET /api/tts/languages`, `tts_service.py`, `TextToSpeech.jsx`, `AudioPlayer`, download of generated MP3 |
| R2 — Speech-to-Text, Assistant, History | Sprint 2 (22 pts) | `POST /api/stt`, `POST /api/assistant`, `GET /api/assistant/commands`, `GET /api/history`, `DELETE /api/history/{id}`, `DELETE /api/history`, `SpeechToText.jsx`, `Assistant.jsx`, `History.jsx` |
| R3 — Dashboard, Settings, Quality | Sprint 3 (16 pts) | `GET /api/stats`, `Dashboard.jsx`, `Settings.jsx`, light/dark theme, 38-test suite, CI green, all `docs/agile/` documentation |

---

## 6. Summary

XP contributed to this project a discipline rather than a ceremony: tests written before production code, small branches merged only when both CI jobs pass, refactoring treated as normal work rather than a special task, and design kept to exactly what the current story requires. The practices that a single-person coursework project could not perform honestly — continuous pairing and whole-team ownership — are reported above with the substitute activities that were actually used.
