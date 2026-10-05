# Lean Software Development

## 1. Introduction

Lean Software Development is an agile-derived methodology based on the lean manufacturing principles of the Toyota Production System, adapted for software by Mary and Tom Poppendieck in *Lean Software Development* (2003). It is not a prescriptive process but a mindset: remove everything that does not create value for the customer, shorten the feedback loop, and let the people doing the work improve the system.

Lean rests on seven principles:

| # | Principle | Core question |
|---|-----------|---------------|
| 1 | Eliminate Waste | Does this activity create value for the user? |
| 2 | Build Quality In | How do we prevent defects instead of inspecting them out? |
| 3 | Deliver Fast | How short is our feedback loop? |
| 4 | Create Knowledge | What have we learned, and is it recorded? |
| 5 | Defer Commitment | Must we decide this now, or can we decide with more information? |
| 6 | Respect People | Is the pace sustainable and is input genuinely sought? |
| 7 | Optimize the Whole | Are we optimising a subsystem at the expense of the system? |

---

## 2. Principle 1 — Eliminate Waste

**Definition.** Waste (*muda*) is anything that does not add value from the customer's point of view: extra features, partial work, hand-offs, waiting, context switching, rework and unused documentation. The Poppendiecks identify eight wastes of software development; the lean practitioner removes them relentlessly.

**In this project**

1. **No speculative auth layer.** The requirements never mentioned users, login or multi-tenancy, so no user table, token or session code was written. The `conversion_history` table (`id, type, input_text, output_text, audio_path, created_at`) contains exactly the columns consumed by the History page and the dashboard statistics — no soft-delete flag, no `updated_at`, no audit columns that nothing reads.
2. **No unused features or flags.** Only the ten endpoints listed in the requirements were implemented (`GET /health`, `POST /api/tts`, `GET /api/tts/languages`, `POST /api/stt`, `POST /api/assistant`, `GET /api/assistant/commands`, `GET /api/history`, `DELETE /api/history/{id}`, `DELETE /api/history`, `GET /api/stats`). There is no unused `PUT /api/history/{id}`, no feature-flag service, no plugin registry.
3. **Generated audio files cleaned by `delete_audio()`.** Text-to-speech output is written to `backend/app/static/audio/`; when a history record is deleted, `history_service.delete_record()` calls `audio_utils.delete_audio()` to remove the file from disk. Orphaned MP3/WAV files would otherwise be inventory waste that grows forever and is invisible to the user.
4. **No parallel partial work.** Sprints carry a small number of stories to completion rather than many stories in progress. A story leaves the board only when the slice is end-to-end working — code, test, UI — which avoids the waste of partially finished inventory.

---

## 3. Principle 2 — Build Quality In

**Definition.** Quality cannot be inspected in at the end; it must be built into the process. The lean answer is automation, fast feedback, pair-reviewed code, simple design and refactoring — so that defects are prevented rather than detected downstream.

**In this project**

1. **38 automated pytest tests** in `backend/tests/` cover health, TTS validation, STT uploads, assistant commands, history CRUD and stats. They run locally and on every push through `.github/workflows/ci.yml`.
2. **Input validation at the boundary.** `backend/app/utils/validators.py` centralises text rules (length, emptiness, supported language) and `backend/app/utils/audio_utils.py::validate_upload()` enforces allowed formats and the 10 MB size limit. Malformed data is rejected before it reaches the service or the database.
3. **A single error contract.** `DomainError` (defined in `app/utils/exceptions.py`) is handled once in `backend/app/main.py`, so every service raises the same type and the client always receives a structured `{detail: ...}` response. This removes the class of bug where one route returns HTML and another returns JSON for the same failure.
4. **CI as an automated quality gate.** `python -m pytest` and `npm run build` both run in GitHub Actions on `main` and `develop`; a green build is a precondition for merging, so a broken test cannot reach the main branch unnoticed.

---

## 4. Principle 3 — Deliver Fast

**Definition.** Speed is achieved by shortening the feedback loop, not by working longer hours. Small batches, working increments and frequent delivery produce more learning per unit of time and reduce risk.

**In this project**

1. **Two-week sprints.** Sprint 0 Setup (8 pts), Sprint 1 TTS (18 pts), Sprint 2 STT & Assistant (22 pts), Sprint 3 Testing/Finalization (16 pts) — 64 points in eight weeks, with a review at the end of each.
2. **A working increment at every sprint review.** Sprint 1 demo: type text → hear speech → see the record in History. Sprint 2 demo: speak into the microphone → transcript, plus the assistant answering *what time is it*. Sprint 3 demo: full regression run, dashboard statistics, dark theme, CI green. Nothing was "nearly working" at review time.
3. **Small feature branches merged often.** `feature/text-to-speech`, `feature/speech-to-text`, `feature/virtual-assistant`, `feature/history`, `feature/dashboard-ui`, `feature/testing-ci` were each merged into `develop` as soon as their slice was green, so the integration batch stayed small.
4. **Fast local feedback.** `python -m pytest` completes in seconds and `npm run build` in tens of seconds, so a developer can verify a change without waiting for a remote pipeline.

---

## 5. Principle 4 — Create Knowledge

**Definition.** Software development is an act of discovery under uncertainty. The team must generate knowledge continuously — through experimentation, iteration and feedback — and then preserve it so it is not rediscovered.

**In this project**

1. **`docs/agile/` — 22 markdown files.** The sprint plan, backlog, user stories, sprint reviews, retrospective notes, risk register, acceptance tests and architecture decision records form the project's knowledge base. The FDD, XP, TDD and testing documents in this directory are part of it.
2. **README and run instructions.** Setup steps for Python 3.13, `pip install -r backend/requirements.txt`, `npm ci`, and the two commands to start the application encode operational knowledge that would otherwise live only in the author's memory.
3. **The test suite as executable knowledge.** `backend/tests/test_assistant.py` documents, in code, exactly which utterances the assistant understands and what each returns. A new contributor can read the tests instead of reverse-engineering `assistant_service.py`.
4. **Sprint retrospectives.** Each retrospective produced at least one concrete process change that was recorded (for example, extracting shared validation after repeated copy-paste in Sprint 1).

---

## 6. Principle 5 — Defer Commitment

**Definition.** Decision making should be delayed until the last responsible moment — the point at which the cost of further delay exceeds the cost of committing — so that the choice is made with the most information possible. Reversible decisions are kept reversible.

**In this project**

1. **Engine abstraction in `tts_service.py`.** Rather than committing hard to a single text-to-speech engine in Sprint 0, the service wraps engine calls behind `synthesize()` and keeps gTTS (online, many languages) and pyttsx3 (offline, fallback) interchangeable. The choice of which is primary could therefore be deferred until offline behaviour was actually tested.
2. **SQLite chosen after modelling, not before.** The persistence discussion stayed abstract (relational, one table, single-user desktop use) through the model walk-through; SQLite was committed to only after the `conversion_history` columns were derived from the History page and stats queries. Because the access layer sits in `history_service.py`, a later move to PostgreSQL remains a low-cost change.
3. **Component extraction deferred until duplication appeared.** `Sidebar`, `StatCard`, `AudioPlayer`, `MicrophoneButton`, `HistoryTable`, `ConfirmationModal`, `Toast`, `LoadingSpinner` and `EmptyState` were extracted when a second call site existed — an early commitment to a component library would have produced abstractions that were never used.
4. **UI decisions deferred to the design spike.** Theme handling (light/dark via `SettingsContext.jsx`) was settled by a quick prototype rather than a specification, because the cost of being wrong was a one-hour change, not a rewrite.

---

## 7. Principle 6 — Respect People

**Definition.** Lean assumes that the people closest to the work understand it best. Respect manifests as a sustainable pace, genuine involvement in process decisions, and trust rather than surveillance.

**In this project**

1. **Small, sustainable pace.** Work was scheduled in two-week sprints with scoped points; when Sprint 2's 22 points looked heavy, the dashboard statistics story (F-10) was explicitly moved to Sprint 3 rather than absorbing overtime. No all-nighter was recorded as a plan.
2. **Retrospectives with actionable outcomes.** Each sprint ended with a retrospective whose actions were written into the next sprint plan — for example, "write the test before the router" adopted after Sprint 1, and "run the full suite before opening a pull request" adopted after a regression found late in Sprint 2.
3. **Peer review rather than unilateral approval.** Code was reviewed with a classmate before merging (see `docs/agile/XP.md`), so feedback was a conversation about the code rather than a verdict delivered after the fact.
4. **User-visible language.** Error messages produced by the validators and by `errorMessage()` in `frontend/src/services/api.js` are written for a person ("Text cannot be empty", "File type not supported"), not as leaked stack traces.

---

## 8. Principle 7 — Optimize the Whole

**Definition.** Optimising one part of a system usually degrades another. Lean looks at the entire value stream — from user click to database row to rendered page — and removes the constraint wherever it actually is.

**In this project**

1. **Frontend, backend and database considered together.** A performance concern in the History page was traced to the service layer rather than fixed with client-side caching: `history_service.py` was consolidated so that `GET /api/history` and `GET /api/stats` share query logic instead of duplicating it in two routers.
2. **One command chain runs the whole app.** The frontend is configured with a Vite dev proxy so that `npm run dev` talks to `uvicorn app.main:app --reload` on the backend without hand-written CORS origins or absolute URLs for every request; a developer starts both processes and the application behaves as one system.
3. **Shared validation across three routers.** Rather than each router implementing its own rules, `utils/validators.py` is called by `tts`, `stt` and `assistant` alike — a rule change is made once and propagates everywhere.
4. **The pipeline is a single unit.** CI runs backend tests and the frontend build as two jobs in one workflow; a green backend with a broken frontend build is still a red pipeline, because the deliverable is the whole application.

---

## 3. Seven Wastes of Software mapped to this project

| Waste | Example here | Action taken |
|-------|--------------|--------------|
| Partially done work | A TTS endpoint with no UI, or UI with no tests | Stories marked done only when the vertical slice (service → router → test → page) is complete |
| Extra features | Auth layer, unused endpoints, feature flags never read | Scope capped at the 10 specified endpoints; no speculative code written |
| Relearning | Decisions rediscovered because they were never written down | `docs/agile/` ADRs, sprint plans and the README record decisions |
| Hand-offs | Backend finished but handed over as "will work for the frontend" | Vertical slices owned end-to-end; the same person runs `npm run build` against their API |
| Task switching | Juggling three stories at once | Sprint WIP limited to the stories of one feature branch at a time |
| Delays | Waiting days for a review or a decision | Small feature branches merged into `develop` as soon as CI is green |
| Defects | Bugs found late, rework | 38 pytest tests, boundary validation in `validators.py` / `audio_utils.py`, CI on every push |
| Extra process | Documentation nobody reads, ceremony with no output | Agile docs are 22 files tied to real artefacts (backlog IDs, AT-xx tests, commit examples), no boilerplate templates |

---

## 4. Summary

Lean in this project is visible less as a ceremony and more as a set of refusals: no auth that was not asked for, no endpoint not in the specification, no audio file left on disk after its record is deleted, no design committed to before it was needed — and, on the positive side, a test suite, a written knowledge base, a short feedback loop and a pace that was planned rather than absorbed.
