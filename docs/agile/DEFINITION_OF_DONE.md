# Definition of Done

## 1. Introduction

The Definition of Done (DoD) is a **team agreement** that states, in concrete and unambiguous terms, what must be true before a piece of work may be called complete. It is not a wish list and not a personal standard: it is a shared contract that removes the argument about whether something is finished.

Why an explicit agreement matters:

- **It prevents scope creep.** "Done" cannot quietly expand into "done, plus five more things I just thought of".
- **It makes progress measurable.** A story is either Done or not Done; there is no ambiguous 80%.
- **It protects quality.** Testing, review and documentation are part of Done, so they cannot be skipped under time pressure without somebody noticing.
- **It makes estimates honest.** If every story carries the same quality overhead, velocity reflects real capacity.

For *Python Text-to-Speech, Speech-to-Text and Virtual Assistant*, the DoD applies at three levels: the **increment** (what a story must satisfy), **Ready** (what a story must contain before it may be picked up), and **Ready for Release** (what the whole product must satisfy before it may be delivered).

---

## 2. Definition of Done — Increment Checklist

| # | Criterion | Status |
|---|-----------|--------|
| 1 | Feature works | Done |
| 2 | Acceptance criteria pass | Done |
| 3 | Frontend and backend integrated | Done |
| 4 | No major error | Done |
| 5 | Tests pass | Done |
| 6 | Code is readable | Done |
| 7 | Documentation updated | Done |
| 8 | Responsive behaviour checked | Done |
| 9 | Code committed | Done |
| 10 | CI succeeds | Done |

### 2.1 Feature works

- [x] The story's verb-object feature is demonstrable end-to-end in a running application, not merely present in code.
- [x] The happy path works with real input: e.g. typing "hello world" produces audible speech and a `TTSResponse.audio_url` under `/static/audio/`.
- [x] The feature works for every input the story promises (all eight assistant commands; all six pages).
- [x] The feature behaves correctly when it is used a second time (repeat conversion, second deletion, page refresh) — no stale state, no duplicate rows.
- [x] No leftover `print()` debugging, commented-out code blocks or TODO stubs in the changed files.
- [x] The feature works on the branch, not only in the author's uncommitted working tree.

### 2.2 Acceptance criteria pass

- [x] Every acceptance criterion written for the story (`US-xx`) is individually verified.
- [x] The corresponding acceptance-test IDs in `docs/agile/ACCEPTANCE_TESTS.md` (`AT-01` …) are executed and pass.
- [x] Failure criteria are also verified — e.g. empty text really does return 422, an unsupported file really does return 415.
- [x] Any AT case that could not be automated is executed manually in the browser and its result recorded.
- [x] A failing AT case blocks the story; it is not waived by agreement.
- [x] The supervisor/reviewer demonstration at the sprint review is run from the branch, not from a prepared copy.

### 2.3 Frontend and backend integrated

- [x] The React page calls the real endpoint through `frontend/src/services/api.js` — no mocked or hard-coded response remains in the shipped code.
- [x] Request payload matches the Pydantic schema (`backend/app/schemas/`) field names and types exactly.
- [x] Response fields consumed by the UI exist in the endpoint's response model (e.g. `audio_url`, `engine`, `text`, `commands`, `total/tts/stt/assistant`).
- [x] Error responses are handled: `errorMessage()` in `services/api.js` renders the backend `detail` string in a `Toast`, not a blank screen.
- [x] The Vite dev proxy resolves `/api` and `/static` so integration is verified with both servers running.
- [x] The integrated flow is exercised in the browser (not only with `TestClient`) at least once before merge.

### 2.4 No major error

- [x] No Critical or Major defect remains open for the story (`Severity` definitions in `TESTING_STRATEGY.md`).
- [x] The browser developer console shows no uncaught exception or repeated failed network request during normal use of the page.
- [x] The backend log shows no unhandled traceback during the demonstration flow.
- [x] Every anticipated failure returns a structured `{detail: ...}` body with the correct status code (422 / 404 / 415), never a raw stack trace.
- [x] Minor/cosmetic issues that are accepted are written into the defect log with severity and priority rather than being forgotten.
- [x] No resource leak observed: deleted history rows also remove their audio file (`audio_utils.delete_audio()`).

### 2.5 Tests pass

- [x] `python -m pytest` in `backend/` reports **38 passed** — zero failures, zero errors.
- [x] Any new behaviour introduced by the story has at least one new test (TDD order: written before the production code).
- [x] Any fixed bug has a regression test that fails without the fix.
- [x] `npm run build` completes with exit code 0 (frontend compile-time gate).
- [x] No test is skipped, marked `xfail`, or weakened to make the suite green.
- [x] Fixtures used by the new tests live in `backend/tests/conftest.py` and do not depend on network, microphone or real TTS engines.

### 2.6 Code is readable

- [x] PEP 8 naming: `snake_case` functions/variables, `PascalCase` classes, type hints on public service functions.
- [x] Layering respected — routers only validate and delegate; business logic sits in `app/services/`; shared rules in `app/utils/`.
- [x] No duplicated block appears a third time (three-strikes rule); extraction performed where it did.
- [x] Names state intent (`synthesize`, `transcribe`, `delete_record`, `get_stats`, `inputText`, `isSynthesizing`) rather than prototype names (`d`, `res`, `tmp_f`, `btn1`).
- [x] Public functions and service methods carry a docstring; control flow is comprehensible without one.
- [x] A second person (peer reviewer or supervisor) has read the diff without needing a verbal explanation.

### 2.7 Documentation updated

- [x] README run instructions still work from a clean clone after the change.
- [x] Endpoint list, request/response examples and the `conversion_history` schema are updated if behaviour changed.
- [x] `docs/agile/` artefacts touched by the story (backlog, sprint review, acceptance tests, risk register) reflect the new state.
- [x] Story status and feature ID (`F-xx`) marked Done in `docs/agile/FDD.md` / backlog.
- [x] Any new decision is recorded (ADRs / sprint notes) rather than left implicit in code.
- [x] No stale instruction remains that now contradicts the code.

### 2.8 Responsive behaviour checked

- [x] Page checked at 375 px (mobile), 768 px (tablet) and 1440 px (desktop).
- [x] `Sidebar` collapses/overlays correctly on narrow viewports; no horizontal scrollbar appears.
- [x] Touch targets (buttons, table actions) remain tappable at 375 px.
- [x] Long content — long transcripts, long history rows, long assistant replies — wraps or truncates rather than overflowing.
- [x] Both themes (light and dark) checked at the narrow width, since contrast bugs are theme-specific.
- [x] Layout verified in at least two browsers (Chrome and Firefox).

### 2.9 Code committed

- [x] All changes are committed to the correct `feature/<scope>` branch — nothing left uncommitted in the working tree.
- [x] Commit messages follow Conventional Commits (`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`).
- [x] Commits are small and single-purpose; unrelated changes are not bundled.
- [x] No secret, token, `.env`, database file (`backend/data/*.db`), generated audio or `node_modules/` staged (`.gitignore` verified).
- [x] Pull request opened into `develop` with title, description and linked `US-xx` story.
- [x] Reviewer comments addressed with follow-up commits (never with a force-push that erases discussion).

### 2.10 CI succeeds

- [x] GitHub Actions workflow `.github/workflows/ci.yml` reports green on the PR head commit.
- [x] Job `backend-tests` passed: checkout → setup Python 3.13 → `pip install -r requirements.txt` → `python -m pytest`.
- [x] Job `frontend-build` passed: checkout → setup Node 20 → `npm ci` → `npm run build`.
- [x] Both checks are green on the merge commit, not only on an earlier commit of the branch.
- [x] No re-run was needed to "make it pass" — a flaky re-run is investigated as a defect, not accepted.
- [x] The same commands were run locally before pushing (`python -m pytest && npm run build`).

---

## 3. Three Levels of Agreement

### 3.1 Definition of Done (increment)

Section 2 above. A user story is Done when **all ten criteria** and their sub-checks are satisfied. Partial completion is reported as "in progress", never as "nearly done".

### 3.2 Definition of Ready (story ready to be picked up)

A story may enter a sprint only when:

- [ ] **Acceptance criteria written** — concrete, testable statements in Given/When/Then form, each traceable to at least one AT ID.
- [ ] **Points estimated** — Fibonacci estimate agreed (1/2/3/5/8) and recorded in the backlog; the story fits inside one sprint.
- [ ] **UI decided** — the page/component that will change is identified, and the interaction is sketched or agreed (which page, which button, what the user sees).
- [ ] **Dependencies identified** — schema, endpoint, fixture or component dependencies named; prerequisite stories already Done.
- [ ] **No blockers** — no unresolved question about scope, no missing asset, no environment problem.
- [ ] **Test approach noted** — which pytest file will carry the test, or, if the story cannot be automated, which AT case covers it manually.
- [ ] **Sized within the team's velocity** — the sprint's total does not exceed measured capacity (16–22 points observed per sprint).

A story failing any of these is refined, not started.

### 3.3 Definition of Ready for Release

The product increment may be released when:

- [ ] Every story in the sprint is at Definition of Done — no partial stories carried silently.
- [ ] Full regression: `python -m pytest` → **38 passed**; `npm run build` → success; CI green on `develop` and on the promotion merge to `main`.
- [ ] Acceptance test suite `docs/agile/ACCEPTANCE_TESTS.md` executed end-to-end; all AT cases pass.
- [ ] Zero open Critical or Major defects; Minor/Cosmetic defects logged with priority and an agreed disposition.
- [ ] Clean-clone installation verified: README followed from a fresh clone on a clean machine/venv.
- [ ] Release readiness checklist in `CONTINUOUS_DELIVERY.md` completed with evidence.
- [ ] Version tagged in Git (`v1.0.0` etc.) on `main`.
- [ ] Run and demonstration instructions prepared for the reviewer (ports, demo script, sample inputs).
- [ ] Sprint review signed off and retrospective actions recorded.

---

## 4. DoD Checklist Applied to Story US-01

**US-01 —** *As a user I want invalid input rejected with a clear message so that I do not submit broken requests* (Feature F-01 *Validate user input*, 3 points, Sprint 0/1).

| DoD Item | Evidence | Status |
|----------|----------|--------|
| Feature works | `POST /api/tts` with `""`, `"   "` and text > 5000 chars returns 422 with a `detail` message; valid text returns 200 and an `audio_url`; same rule applied to `POST /api/assistant` | Done |
| Acceptance criteria pass | AT cases for invalid input executed; failure criteria (empty, whitespace, oversized) verified individually | Done |
| Frontend and backend integrated | `TextToSpeech.jsx` submits through `services/api.js`; a 422 body is surfaced as a `Toast` via `errorMessage()`, not a blank screen | Done |
| No major error | No traceback in the Uvicorn log; console shows no uncaught exception; no Critical/Major defect open for US-01 | Done |
| Tests pass | `tests/test_validation.py` (6 tests) and TTS failure cases in `tests/test_tts.py`; full suite `python -m pytest` → **38 passed** | Done |
| Code is readable | Rule lives once in `backend/app/utils/validators.py::validate_text()`; router reads `validate_text(request.text, field="text")`; PEP 8 naming, type hints, docstring | Done |
| Documentation updated | Validation rules and 422 response documented in README/API notes; `FDD.md` marks F-01 Done; validator limits recorded | Done |
| Responsive behaviour checked | Error `Toast` positioned correctly at 375 / 768 / 1440 px in both light and dark themes; message wraps without overflow | Done |
| Code committed | `refactor: extract shared text validators` and `test: add validation tests` committed on the feature branch; `.env` and `backend/data/*.db` not staged | Done |
| CI succeeds | GitHub Actions: `backend-tests` green (38 passed), `frontend-build` green (`npm run build`) on the PR into `develop` | Done |

**Outcome:** US-01 satisfies all ten DoD criteria and is recorded as Done in the backlog.

---

## 5. Summary

| Level | Question it answers | Artefact |
|-------|---------------------|----------|
| Definition of Done | "Is this story finished?" | Section 2 — 10 criteria with concrete sub-checks |
| Definition of Ready | "May we start this story?" | Section 3.2 — AC written, estimated, UI decided, no blockers |
| Definition of Ready for Release | "May we deliver the increment?" | Section 3.3 — full regression, AT suite, zero Critical/Major defects, tag |

The DoD is reviewed at each retrospective: if a defect escaped despite being "Done", the relevant sub-check is strengthened so the same escape cannot recur.
