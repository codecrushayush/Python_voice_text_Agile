# The Agile Manifesto in Practice

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant

The Agile Manifesto for Software Development (Beck et al., 2001) states four values and twelve principles. This document records how each of them was interpreted while building this system — a FastAPI + SQLite backend, a React 18 frontend, 38 automated tests and a 64-point backlog delivered over four Scrum sprints. The intent is not to claim compliance with a slogan, but to show specific decisions that were taken *because* of the manifesto, and the artefacts that prove them.

## The Four Values

> "We are uncovering better ways of developing software by doing it and helping others do it. Through this work we have come to value:

### 1. Individuals and interactions over processes and tools

**Definition.** The people doing the work and the conversations between them are the primary driver of success. Processes, templates, boards and toolchains exist to support those conversations; when they start to replace them, they have failed. No amount of tooling compensates for a team that is not talking about the right thing.

**In this project:**
- **The 15-minute Daily Scrum and its written blocker line mattered more than any ceremony paperwork.** The eight stand-up logs in `SCRUM_CEREMONIES.md` are three lines each — Yesterday, Today, Blocker — and that single habit is what surfaced the two real impediments (the Vite/CORS rejection and the missing ffmpeg binary for `pydub`) on the day they appeared instead of days later. The value of the ceremony was the conversation, not the document it produced.
- **Retrospective action items changed behaviour immediately.** After Sprint 2 the retro recorded "assistant rules are only checked by hand"; the very next sprint added dedicated pytest cases for every rule *and* for the unknown-command fallback, contributing to the 7-file, 38-test suite. A more elaborate process document would not have fixed that gap; the short inspection conversation did.
- **Feedback was sought from a real person rather than inferred from a spec.** The classmate-tester interview (Requirements Elicitation) produced two features — the Settings page and dark mode — that no amount of solo analysis would have surfaced, because they came from watching someone hesitate while using the product.

### 2. Working software over comprehensive documentation

**Definition.** Progress is demonstrated by software that runs, not by documents that describe software that does not exist yet. Documentation is valuable when it captures decisions and intent; it is waste when it merely re-states what the code already makes obvious.

**In this project:**
- **The Definition of Done was executable, not editorial:** *`pytest` reports 38 passed, `npm run build` succeeds, and the feature is demonstrated in a browser against the running uvicorn server.* No story was moved to *Done* on the strength of a written description; every acceptance test in `ACCEPTANCE_TESTS.md` was executed on the live application.
- **`docs/agile/` was deliberately kept concise and tied to real artefacts.** Each file points at something that exists in the repository — `BURNDOWN.md` cites the numbers on the Kanban board, `REQUIREMENTS_ENGINEERING.md` cites FR/NFR identifiers that map to `backend/app/**` code and to test cases, `SCRUM_CEREMONIES.md` cites actual blockers from the sprints. There is no boilerplate process catalogue, no unused template, and no design document describing a system that was never built.
- **Working code was produced in the first sprint, not the last.** Sprint 0 ended with a running FastAPI service and a Vite build; Sprint 1 ended with audible speech in the browser. Had documentation been valued over working software, the four sprints would have been spent writing specifications for TTS, STT and the assistant instead of shipping them and learning from the result.

### 3. Customer collaboration over contract negotiation

**Definition.** The customer is a participant throughout development, not a signer at the beginning and a recipient at the end. Requirements emerge from dialogue and demonstrated software; a detailed up-front contract is a poor substitute for someone who answers questions.

**In this project:**
- **The instructor acted as the standing Product Owner stakeholder, and the classmate tester as a proxy end-user.** Sprint Reviews were live demos in front of them rather than status reports, and their reaction — not a clause in the brief — decided what went into the next backlog.
- **Concrete feedback items became backlog entries during the review itself.** The request for a dark theme and a place to save default language/rate produced US-14 and the Settings page (change C-02 in `REQUIREMENTS_ENGINEERING.md`); the request to narrow history to a single record type produced the `type` filter on `GET /api/history` (change C-04). Both were *Can we also…* moments that a contract-first process would have classified as out of scope.
- **Acceptance was a shared activity, not a claim.** `ACCEPTANCE_TESTS.md` records AT-01..AT-30 with their results because the reviewer executed them alongside the developer; where a test failed, the conversation was about the behaviour the customer wanted, not about the wording of an original specification.

### 4. Responding to change over following a plan

**Definition.** Plans are necessary, but they are hypotheses. New information — technical, market or user-derived — should be allowed to reorder the plan at any time, because the cost of building the wrong thing exceeds the cost of re-planning.

**In this project:**
- **Engine fallback was a mid-plan technical response.** The Sprint 0 plan assumed pyttsx3 alone; the technical spike showed it cannot be relied upon for consistent MP3 output and needs no network, while gTTS is the opposite. The plan changed to a dual-engine `tts_service.py` with an engine selector and automatic fallback (change C-01), rather than forcing the original choice to work.
- **Features were added mid-sprint without derailing the sprint goal.** The history type filter and the assistant's audio download arrived as review feedback in Sprint 2; both were absorbed by splitting and re-estimating stories at Backlog Refinement (US-13 grew from 5 to 8 points) rather than by freezing the backlog.
- **The backlog was re-ordered continuously and the plan was cut where it mattered least.** Authentication was deleted outright as *Won't* (change C-06, ~12 points removed from the original draft), volume control was demoted when the Settings page arrived, and responsive sidebar behaviour was *promoted* to Must in Sprint 3 after a 400 px viewport test showed the navigation was unusable (change C-07). The final 64 points delivered are the result of five re-plannings, not of one original estimate.

## The Twelve Principles

1. **Our highest priority is to satisfy the customer through early and continuous delivery of valuable software.** A usable TTS page shipped at the end of Sprint 1, half the project's budget before the end.
2. **Welcome changing requirements, even late in development.** The responsive-sidebar fix was promoted to Must in Sprint 3 and implemented in the same sprint.
3. **Deliver working software frequently, from a couple of weeks to a couple of months, with a preference for the shorter timescale.** Four sprints of roughly one to two weeks each, each ending in a demonstrable increment.
4. **Business people and developers must work together daily throughout the project.** The stakeholder interview, sprint demos and review feedback were continuous inputs, not a hand-off event.
5. **Build projects around motivated individuals. Give them the environment and support they need, and trust them to get the job done.** The toolchain (Python 3.13, Vite, uvicorn `--reload`, pytest watch) was set up in Sprint 0 so nothing blocked implementation later.
6. **The most efficient and effective method of conveying information is face-to-face conversation.** The 15-minute Daily Scrum and the in-person Sprint Review demo replaced long written status reports.
7. **Working software is the primary measure of progress.** Progress was counted in accepted story points and green acceptance tests, never in documents written.
8. **Agile processes promote sustainable development.** The sponsors, developers and users should be able to maintain a constant pace indefinitely. A steady 8 → 18 → 22 → 16 point cadence with a deliberately reduced Sprint 3 avoided a last-minute crunch.
9. **Continuous attention to technical excellence and good design enhances agility.** The refactor into `utils/exceptions.py` and a single `errorMessage()` helper, plus the layered router → service → model structure, kept change cheap in later sprints.
10. **Simplicity — the art of maximising the amount of work not done — is essential.** Rule-based dispatch with Python conditions and dicts replaced any temptation toward heavier natural-language machinery; authentication was cut entirely.
11. **The best architectures, requirements and designs emerge from self-organising teams.** Architecture decisions (SQLite over a server DB, multipart upload contract, `limit`/`offset` pagination) were made at planning and refinement by the people doing the work.
12. **At regular intervals the team reflects on how to become more effective, then tunes and adjusts its behaviour.** A 45-minute retrospective after every sprint produced a small, dated list of actions — test coverage for assistant rules, centralised error handling, pinned Node in CI — each carried into the next sprint's planning.

### Principles Applied

| Principle | Application in this project |
|---|---|
| 1. Satisfy the customer through early and continuous delivery | `POST /api/tts` plus the TextToSpeech page were demonstrated to the instructor at the Sprint 1 Review, four sprints before final submission. |
| 2. Welcome changing requirements, even late | Sprint 3 promoted responsive sidebar collapse (860 px breakpoint) from *Could* to *Must* and shipped it in the same sprint (change C-07). |
| 3. Deliver working software frequently | Four increments: setup+API (Sprint 0), TTS (Sprint 1), STT+assistant (Sprint 2), tested release (Sprint 3). |
| 4. Business people and developers work together daily | Classmate-tester interview plus instructor feedback at every Sprint Review fed the backlog within the same day. |
| 5. Motivated individuals with environment and support | Sprint 0 created the virtualenv, Vite scaffold and `.github/workflows/ci.yml` so no developer ever waited on tooling. |
| 6. Face-to-face conversation as the most efficient conveyance | 15-minute Daily Scrum standing at the Kanban board; the Sprint Review was a live browser demo, not a written report. |
| 7. Working software is the primary measure of progress | `BURNDOWN.md` counts only points of *accepted* stories; `ACCEPTANCE_TESTS.md` records Pass only after execution in the browser. |
| 8. Sustainable development, constant pace | Planned vs completed points were identical in all four sprints (8/18/22/16) — no sprint ended with carry-over or overtime work. |
| 9. Continuous attention to technical excellence | Sprint 3 refactor into `backend/app/utils/exceptions.py` and `errorMessage()` in `api.js`; services kept free of route-handler logic. |
| 10. Simplicity — maximise the amount of work not done | Rule-based `assistant_service.py` using conditions and dicts; authentication and cloud deployment removed as *Won't* (~12 points saved). |
| 11. Architecture emerges from self-organising teams | Choice of SQLite + SQLAlchemy, the multipart STT contract, and `GET /api/history?limit&offset` pagination were decided at Sprint Planning by the implementer. |
| 12. Regular reflection and adjustment | Three retrospectives produced dated actions: assistant rule tests, centralised error messages, and pinned Node 22 in CI — each verified in the following sprint. |

## Working Software vs Documentation

The `docs/agile/` folder exists to **support** the working increment, never to replace it. Every file in it refers to something that can be executed, observed or counted in the repository: the burndown numbers come from the Kanban board, the acceptance results come from running the application, the traceability table points at real tests, and the ceremony logs describe events that actually took place. If the software were deleted, these documents would be worthless — which is the correct relationship under the second agile value.

What the folder does provide is *evidence of process quality*: it shows that the software was not produced by accident, that requirements were elicited and validated rather than guessed, that change was managed instead of resisted, and that verification was performed rather than asserted. The table below states, for each artefact, exactly which quality it demonstrates.

| Agile Artifact | What it demonstrates |
|---|---|
| `SCRUM_ROLES.md` | That the three Scrum accountabilities (Product Owner, Scrum Master, Developer) were exercised, even by one person, and produced distinct outputs. |
| `SCRUM_CEREMONIES.md` | Process discipline: five events run to their timeboxes (2 h / 15 min / 1 h / 45 min / 30 min) with recorded inputs, outputs and blockers. |
| `BURNDOWN.md` + `burndown_chart.png` | Predictability and transparency of progress — ideal vs actual burn for Sprint 2 and Sprint 3, plus velocity 8/18/22/16 used for planning. |
| `ACCEPTANCE_TESTS.md` | Product quality and customer acceptance: 30 executed tests (AT-01..AT-30, all Pass) proving each user story behaves as specified in the running system. |
| `REQUIREMENTS_ENGINEERING.md` | Requirement completeness and control: elicitation sources, FR-01..FR-22 and NFR-01..NFR-14, MoSCoW priority, a seven-entry change log and full traceability to tests. |
| `AGILE_MANIFESTO.md` (this file) | That the team understood *why* it worked this way — the values and principles behind the ceremonies, backlog and tests. |
| `USER_STORIES.md` / `PRODUCT_BACKLOG.md` / `SPRINT_BACKLOG.md` | Scope clarity: 15 estimated, ordered, acceptance-criteriated stories and the exact commitment made at each Sprint Planning. |

**Relationship in one sentence:** the working increment — 38 passing pytest tests, a successful `npm run build`, and a browser demonstration of all six pages — is the deliverable; `docs/agile/` is the audit trail that shows how a demonstrable, testable, correctly-scoped increment came to exist.
