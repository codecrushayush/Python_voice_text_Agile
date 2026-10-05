# Quality Assurance (QA)

## 1. Introduction

Quality Assurance is the systematic, planned set of activities that ensures a product satisfies its stated requirements and is fit for use. It is *process*-oriented — it asks "are we building the product the right way?" — in contrast to Quality Control, which is *product*-oriented and asks "is this build correct?". In this project QA spans both: the process artefacts (Definition of Done, code review, CI gates, refactoring discipline) and the product evidence (38 automated tests, acceptance tests, manual checklists).

**QA objectives for this project**

1. Every one of the ten API endpoints behaves per its contract, on success and on failure.
2. Every user story's acceptance criteria are demonstrably satisfied.
3. No Critical or Major defect reaches the reviewed increment.
4. Quality is verified automatically on every change, not only before a deadline.

---

## 2. Automated Testing

**Definition.** Automated testing executes scripted checks by machine, with no human intervention, producing a repeatable pass/fail verdict. It is the cheapest way to buy confidence because its marginal cost approaches zero after the first run.

**Applied in this project**

- **38 pytest tests** across seven files in `backend/tests/`, covering `GET /health`, TTS validation and synthesis, STT upload handling, all assistant commands, history CRUD and statistics aggregation.
- Tests are **hermetic**: `backend/tests/conftest.py` patches the TTS engines (`fake_speech_engine`) and the recogniser (`fake_recognizer`), substitutes in-memory SQLite, and synthesises audio bytes (`build_wav`) — so the suite passes without network access, a microphone, or native TTS drivers.
- Execution: `python -m pytest` locally; automatically in CI by `.github/workflows/ci.yml` (job `backend-tests`, Python 3.13) on every push and pull request to `main` and `develop`.
- The frontend safety net is **`npm run build`** (job `frontend-build`, Node 20) — a compile-time gate over all `src/pages/*.jsx`, `src/components/*` and `services/api.js`.
- Tests follow TDD where the behaviour was risky or boundary-critical (see `TDD.md`): validation, 404 handling and upload rejection were all written test-first.

---

## 3. Manual Testing

**Definition.** Manual testing is human execution of scripted or exploratory checks against a running application, used where automation cannot express the assertion — physical devices, visual design, browser policies and third-party services.

**Applied in this project**

- All six pages are exercised against a live stack (`uvicorn app.main:app --reload` + `npm run dev`) before each sprint review.
- Microphone capture and the browser permission prompt are tested with a real device in Chrome and Firefox.
- Audio playback, including the autoplay policy, is verified by ear on real speakers.
- Visual checks: light/dark theme contrast, layout at 375 / 768 / 1440 px, empty states, loading spinners, error toasts.
- Upload of real `.wav` and `.mp3` files, download of a generated `.mp3`, and clipboard copy are verified by hand.
- The full checklist with expected results is in Section 7 of this document; acceptance-level cases are in `docs/agile/ACCEPTANCE_TESTS.md`.
- Exploratory sessions use deliberately hostile input: 5000-character text, a PDF renamed to `.wav`, a 12 MB file, deleting a record twice, using the app with the backend stopped.

---

## 4. Acceptance Criteria

**Definition.** Acceptance criteria are the pre-agreed, testable conditions a user story must satisfy for the stakeholder to accept it. They are written before implementation and are the basis of acceptance testing.

**Applied in this project**

- Every story `US-01` … `US-15` carries acceptance criteria in Given/When/Then form, each traceable to an `AT-xx` identifier in `docs/agile/ACCEPTANCE_TESTS.md`.
- Example — **US-02 Convert text to speech**:
  - *Given* the Text-to-Speech page is open with language English selected, *when* the user types "hello world" and presses Convert, *then* an audio player appears and speech is audible.
  - *Given* empty text, *when* Convert is pressed, *then* a 422 is returned and a visible error message appears — no audio request reaches the engine.
  - *Given* a successful conversion, *when* the History page is opened, *then* the conversion is listed with type `tts`.
- Criteria are split into **positive** (what must work), **negative** (what must be rejected) and **boundary** (limits such as 5000 characters and 10 MB) so that both directions of every rule are accepted.
- A story cannot reach Done with any criterion unverified; the DoD requires the AT evidence (see `DEFINITION_OF_DONE.md`).

---

## 5. Regression Testing

**Definition.** Regression testing re-runs existing tests after a change to confirm that previously working behaviour still works, catching unintended side effects.

**Applied in this project**

- **Trigger:** every code change on a `feature/*` branch, before opening a pull request.
- **Procedure:** `python -m pytest` (must report 38 passed) → `npm run build` (must exit 0) → push → GitHub Actions repeats both → merge only when green.
- **Documented regression caught:** refactoring the `DomainError` handler to return 415 for unsupported media inadvertently changed the oversized-upload case (a *validation* failure) from 400 to 415, failing `tests/test_stt.py`. The full-suite run exposed it before merge; the mapping was split by exception type and the suite returned to green.
- **Scope:** all seven test files run on every execution — no selective subsets — because the suite takes only seconds and partial runs defeat the purpose.
- **Manual regression:** the Section 7 checklist is re-executed in full before each sprint review and before any release candidate.

---

## 6. Continuous Integration

**Definition.** Continuous Integration is the practice of merging work frequently with every merge verified automatically by an automated build and test run.

**Applied in this project**

- `.github/workflows/ci.yml` defines two parallel jobs on push/pull request to `main` and `develop`:

| Job | Steps | Gate |
|-----|-------|------|
| `backend-tests` | checkout → setup Python 3.13 → `pip install -r requirements.txt` → `python -m pytest` | All 38 tests pass |
| `frontend-build` | checkout → setup Node 20 → `npm ci` → `npm run build` | Production build succeeds |

- CI is the enforcement mechanism for QA: without it, "tests pass" is a claim; with it, tests pass is a **status check on the commit**.
- It also validates environment reproducibility on `ubuntu-latest` independent of the developer's Windows machine.
- Detail, diagram and the workflow file are in `docs/agile/CONTINUOUS_INTEGRATION.md`.

---

## 7. Refactoring

**Definition.** Refactoring changes internal structure without changing external behaviour, improving readability, reducing duplication and lowering the cost of future change (Fowler, 1999).

**Applied in this project**

- Twelve refactorings were logged in `docs/agile/REFACTORING.md`, including moving speech logic from routers into `services/tts_service.py` and `services/stt_service.py`, extracting `utils/validators.py`, adding the `DomainError` handler in `main.py`, extracting nine React components, consolidating history and stats into `history_service.py`, and moving WAV encoding into `frontend/src/utils/recorder.js`.
- Every refactoring was performed **under the safety net**: the 38-test suite plus `npm run build`, before and after each structural change.
- Refactoring is included in story estimates rather than deferred to a separate phase, so quality work is not the first thing cut under pressure.
- Technical debt is tracked explicitly; both the debt repaid and the debt deliberately never incurred are recorded in `REFACTORING.md` Section 6.

---

## 8. Code Review

**Definition.** Code review is inspection of a change by someone other than its author, before integration, to detect defects, design problems, style violations and missing tests.

**Applied in this project**

- Every feature branch opened a pull request into `develop` with the mandatory checklist (title, description, linked story, tests added, CI green, reviewer).
- Peer review with a classmate covered `routers/stt.py` + `utils/audio_utils.py` (which produced the explicit upload allow-list) and a group walkthrough of `services/assistant_service.py` (which confirmed the rule-based design scope). Remaining PRs were reviewed by the supervisor at sprint reviews.
- Review focuses on behaviour and structure rather than formatting — formatting is the linter's job and naming/style is defined by the conventions in `XP.md` Section 2.5.
- Review comments are resolved by follow-up commits; force-pushes that erase discussion are not used.
- Shared modules (`app/services/*`, `app/utils/validators.py`) require explicit reviewer approval because multiple stories depend on them.

---

## 9. Validation

**Definition.** Validation is checking that the *right product* has been built — that what exists matches user needs and stated requirements — as distinct from verification, which checks that the product was built *right*.

**Applied in this project**

- **Boundary validation** in code: `utils/validators.py` (`validate_text`, `validate_choice`) and `utils/audio_utils.py::validate_upload()` (extension/content-type allow-list, 10 MB `MAX_UPLOAD_BYTES`) reject malformed data before it reaches services or the database.
- **Schema validation** via Pydantic models in `backend/app/schemas/` — wrong types, missing fields and unknown payloads are rejected at the HTTP boundary with 422.
- **Requirement validation** — each sprint review demonstrates the increment against the original requirements and user stories; features not required by the specification were not built (no auth layer, no unused endpoints).
- **Feedback validation** — retrospective findings and reviewer comments are converted into backlog items so external feedback demonstrably changes the product.
- **Input normalisation** — `validate_text()` returns a stripped value that is the value actually processed, so stored history is consistent with what the user sees.

---

## 10. Quality Metrics

| Metric | Value | How measured |
|--------|-------|--------------|
| Automated tests | **38** | `python -m pytest` in `backend/` → `38 passed` |
| API endpoint coverage | **100% of the 10 API routes** | Each of `GET /health`, `POST /api/tts`, `GET /api/tts/languages`, `POST /api/stt`, `POST /api/assistant`, `GET /api/assistant/commands`, `GET /api/history`, `DELETE /api/history/{id}`, `DELETE /api/history`, `GET /api/stats` has ≥1 success and ≥1 failure test in `backend/tests/` |
| Open critical defects | **0** | Defect log at Sprint 3 close; no Critical/Major entry open |
| Frontend build | **`npm run build` passes** | Vite production build exits 0; CI job `frontend-build` green |
| Pages delivered | **6** | `Dashboard.jsx`, `TextToSpeech.jsx`, `SpeechToText.jsx`, `Assistant.jsx`, `History.jsx`, `Settings.jsx` in `frontend/src/pages/` |
| User stories | **15** | `US-01` … `US-15` in the product backlog |
| Story points delivered | **64** | Sprint 0: 8 + Sprint 1: 18 + Sprint 2: 22 + Sprint 3: 16 |
| Sprints completed | 4 | Sprint 0 Setup, Sprint 1 TTS, Sprint 2 STT & Assistant, Sprint 3 Testing/Finalization |
| CI jobs green | 2 per run | `backend-tests`, `frontend-build` in `.github/workflows/ci.yml` |
| Shared React components | 9 | `Sidebar`, `StatCard`, `AudioPlayer`, `MicrophoneButton`, `HistoryTable`, `ConfirmationModal`, `Toast`, `LoadingSpinner`, `EmptyState` |
| Logged refactorings | 12 | `REFACTORING.md` Refactoring Log |
| Agile documentation files | 22 | `docs/agile/` |

---

## 11. Manual Test Checklist

Executed against a running stack before each sprint review. `PASS` = behaved as expected.

| # | Check | Result |
|---|-------|--------|
| 1 | **Dashboard** loads; `GET /api/stats` values render in `StatCard` tiles | PASS |
| 2 | **Text-to-Speech** page converts "hello world" (English) and audio plays | PASS |
| 3 | TTS download button saves a playable `.mp3` | PASS |
| 4 | TTS copy-to-clipboard button copies the input text | PASS |
| 5 | **SpeechToText** page records from the microphone after granting permission | PASS |
| 6 | Microphone permission **denied** shows an error state, not a hang | PASS |
| 7 | STT uploads a real `.wav` file and returns a transcript | PASS |
| 8 | STT rejects a `.pdf` / oversized file with a clear message | PASS |
| 9 | **Assistant** answers *hello/hi*, *what time is it*, *what is today's date* | PASS |
| 10 | Assistant opens Google / YouTube and performs *search Google for …* | PASS |
| 11 | Assistant *help* and *about application* list the available commands | PASS |
| 12 | Assistant *clear* clears the conversation view | PASS |
| 13 | **History** lists conversions newest-first with type, input and timestamp | PASS |
| 14 | History search/filter narrows the list correctly | PASS |
| 15 | History delete single record → row and audio file removed; confirm modal shown first | PASS |
| 16 | History clear-all → table empty, stats return to zero | PASS |
| 17 | **Settings** change persists across page reload (`SettingsContext`) | PASS |
| 18 | **Dark mode** toggles on every page; text remains legible; no white flash | PASS |
| 19 | **Mobile layout** correct at 375 px (sidebar collapses, no horizontal scroll) | PASS |
| 20 | Tablet 768 px and desktop 1440 px layouts render correctly | PASS |
| 21 | Empty states shown when history is empty (`EmptyState` component) | PASS |
| 22 | Backend stopped → pages show a readable error via `errorMessage()`, no blank screen | PASS |
| 23 | Loading spinner appears during a slow TTS request; button disabled | PASS |
| 24 | Browser console free of uncaught exceptions during normal navigation | PASS |

---

## 12. Code Review Checklist

| Check | Applied |
|-------|---------|
| Change matches the linked user story and contains no unrelated work | Yes — PR description references `US-xx`; out-of-scope files rejected |
| Follows layering rules (router → service → utils; no business logic in routes) | Yes — violations returned for correction before merge |
| Naming is intent-revealing; no prototype identifiers remain | Yes — `d`, `res`, `tmp_f`, `btn1` renamed during Sprint 3 review |
| No duplicated block a third time; shared helpers extracted | Yes — drove `validators.py` and the nine React components |
| New behaviour has new tests; bug fixes have regression tests | Yes — enforced by the PR checklist |
| Error handling uses `DomainError` and returns the correct status code | Yes — no ad-hoc `try/except` accepted in routes |
| No secrets, `.env`, database files or generated audio staged | Yes — `.gitignore` verified on every PR |
| Security review: upload size/type limits, no path traversal from filenames, no injection-prone string-built SQL | Yes — `validate_upload()`, generated filenames, SQLAlchemy ORM only |
| Performance sanity: no N+1 queries, no per-request engine re-initialisation where avoidable | Yes — `history_service` uses a single grouped query for stats |
| Readable without narration — reviewer understands the diff unaided | Yes — otherwise a walkthrough is arranged |
| Documentation updated where the contract changed | Yes — README/API notes and `docs/agile/` artefacts |
| CI green on the PR head commit | Yes — merge blocked otherwise |
| UI reviewed against the responsive and both-theme checks | Yes — manual checklist items 18–20 |
| Accessibility basics: labels on controls, visible focus, sufficient contrast in dark mode | Yes — reviewed at sprint review; full a11y audit noted as Future Scope |

---

## 13. Summary

| QA element | Evidence in this project |
|------------|--------------------------|
| Automated testing | 38 pytest tests, hermetic fixtures, run locally and in CI |
| Manual testing | 24-point checklist across all six pages, both themes, three viewports, mic and upload |
| Acceptance criteria | `US-01…US-15` with Given/When/Then criteria traced to `AT-xx` cases |
| Regression testing | Full suite + `npm run build` on every change; documented 415-mapping catch |
| Continuous integration | Two GitHub Actions jobs gating `main` and `develop` |
| Refactoring | 12 logged refactorings under the test safety net |
| Code review | PR checklist + peer/supervisor review of shared modules |
| Validation | Pydantic schemas, `validators.py`, `audio_utils.validate_upload()`, sprint-review requirement checks |

Quality in this project is not a phase appended to the end: it is the combination of a test-first boundary discipline, an automated merge gate, a written review checklist and a manual checklist for everything a machine cannot judge.
