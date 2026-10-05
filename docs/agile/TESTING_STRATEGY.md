# Testing Strategy

## 1. Introduction

This document defines the testing strategy for *Python Text-to-Speech, Speech-to-Text and Virtual Assistant*. It states what is tested, at which level, with which tooling, by whom, and under what entry and exit criteria a change may be considered complete. The strategy is risk-driven but structurally organised as a test pyramid: many fast unit tests, fewer integration tests through the HTTP layer, and acceptance testing carried out manually in a real browser.

**Tooling summary**

| Layer | Tool | Location | Count |
|-------|------|----------|------:|
| Unit + integration (backend) | pytest | `backend/tests/` | 38 |
| Build validation (frontend) | Vite / npm | `frontend/` | 1 build |
| Acceptance | Manual, scripted | `docs/agile/ACCEPTANCE_TESTS.md` | AT-01 … AT-nn |
| CI execution | GitHub Actions | `.github/workflows/ci.yml` | 2 jobs |

---

## 2. Unit Testing

**Definition.** A unit test verifies the smallest testable piece of behaviour — a function or method — in isolation, with all collaborators replaced by fakes or stubs. Unit tests are fast, deterministic and precise: when one fails, the failing unit is obvious.

pytest was chosen because it is the standard Python test framework, requires no test-class boilerplate, supports fixtures and `parametrize`, and integrates with FastAPI's `TestClient`.

### 2.1 Validation units — `backend/tests/test_validation.py`

```python
# backend/tests/test_validation.py
import pytest
from app.utils.exceptions import ValidationError
from app.utils.validators import validate_text, validate_language


@pytest.mark.parametrize("bad_value", ["", "   ", "\n\t", None])
def test_invalid_text_is_rejected(bad_value):
    with pytest.raises(ValidationError):
        validate_text(bad_value, field="text")


def test_valid_text_is_stripped_and_returned():
    assert validate_text("  hello  ") == "hello"


def test_text_over_5000_characters_is_rejected():
    with pytest.raises(ValidationError) as exc:
        validate_text("a" * 5001, field="text")
    assert "5000" in str(exc.value)


def test_unsupported_language_is_rejected():
    with pytest.raises(ValidationError):
        validate_language("kl")          # Klingon is not on the gTTS list
```

Because `validators.py` imports nothing from FastAPI or SQLAlchemy, these tests exercise the rule directly with no HTTP layer in the way.

### 2.2 TTS engine fallback — `backend/tests/test_tts.py`

The production code in `backend/app/services/tts_service.py` walks an engine chain: the requested engine, then `gTTS` (online, many languages), then `pyttsx3` (offline fallback). The test verifies the *fallback decision*, not the engines themselves, by installing a fake engine through the `fake_speech_engine` fixture from `conftest.py`.

```python
# backend/tests/test_tts.py
def test_falls_back_when_primary_engine_fails(client, fake_speech_engine):
    fake_speech_engine.fail_on("gtts")           # primary raises on call
    response = client.post(
        "/api/tts",
        json={"text": "hello", "lang": "en", "engine": "gtts"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["engine"] == "pyttsx3"            # fallback selected
    assert body["audio_url"].endswith(".mp3")


def test_returns_audio_url_and_persists_history(client, fake_speech_engine):
    before = len(client.get("/api/history").json())
    response = client.post("/api/tts", json={"text": "persist me", "lang": "en"})
    assert response.status_code == 200
    assert response.json()["audio_url"].startswith("/static/audio/")
    assert len(client.get("/api/history").json()) == before + 1
```

**Unit-level coverage map**

| Unit under test | Test file |
|-----------------|-----------|
| `validators.validate_text` / `validate_language` | `tests/test_validation.py` |
| `audio_utils.validate_upload` / `save_audio` / `delete_audio` | `tests/test_stt.py`, `tests/test_history.py` |
| `assistant_service` command dispatch | `tests/test_assistant.py` |
| `history_service.get_record` / `delete_record` | `tests/test_history.py` |
| `tts_service` engine selection | `tests/test_tts.py` |

---

## 3. Integration Testing

**Definition.** Integration tests verify that modules work together — here, the router → service → database → response chain — by calling the application through its real HTTP interface.

**Mechanics used in this project**

- `fastapi.testclient.TestClient` instantiated from `backend/app/main.py` with the application's real dependency-injection graph.
- An **in-memory SQLite database** (`sqlite:///:memory:`) substituted for the file database by a fixture, so each test starts from an empty, isolated schema.
- **Collaborators patched** in `backend/tests/conftest.py`: `fake_speech_engine` replaces gTTS/pyttsx3, `fake_recognizer` replaces the SpeechRecognition recogniser, `no_browser` suppresses side effects, and `build_wav` synthesises a valid WAV payload in memory.

### 3.1 Example from `backend/tests/test_history.py`

```python
# backend/tests/test_history.py
import io


def test_full_history_lifecycle(client, fake_speech_engine):
    # 1. create a TTS record through the API
    create = client.post("/api/tts", json={"text": "lifecycle", "lang": "en"})
    assert create.status_code == 200

    # 2. it appears in the list
    listing = client.get("/api/history").json()
    assert len(listing) == 1
    record_id = listing[0]["id"]
    assert listing[0]["type"] == "tts"

    # 3. it can be fetched individually
    single = client.get(f"/api/history/{record_id}")
    assert single.status_code == 200
    assert single.json()["input_text"] == "lifecycle"

    # 4. it can be deleted, removing the row and the audio file
    deleted = client.delete(f"/api/history/{record_id}")
    assert deleted.status_code == 200
    assert client.get("/api/history").json() == []
    assert client.get(f"/api/history/{record_id}").status_code == 404

    # 5. statistics reflect the deletion
    stats = client.get("/api/stats").json()
    assert stats["total"] == 0


def test_clear_all_records(client, seeded_db):
    response = client.delete("/api/history")
    assert response.status_code == 200
    assert client.get("/api/history").json() == []


def test_stats_aggregate_by_type(client, fake_speech_engine):
    client.post("/api/tts", json={"text": "one", "lang": "en"})
    client.post("/api/tts", json={"text": "two", "lang": "en"})
    client.post("/api/assistant", json={"command": "what time is it"})
    stats = client.get("/api/stats").json()
    assert stats["tts"] == 2
    assert stats["assistant"] == 1
    assert stats["total"] == 3
```

These tests cross the FastAPI dependency boundary (`get_db`), the service layer, the ORM and the exception handler — the definition of integration-level coverage here.

---

## 4. Acceptance Testing

**Definition.** Acceptance testing determines whether the system satisfies the agreed business requirements and user stories, and is the evidence used to accept the increment at the sprint review. It is specified in terms of user-visible outcomes, not internal functions.

- The scripted suite lives in **`docs/agile/ACCEPTANCE_TESTS.md`** and is referenced from every user story.
- Each test carries a stable identifier `AT-01`, `AT-02`, … which is quoted in the story's acceptance criteria and in the pull request that implemented it.
- Acceptance tests are executed **manually in a real browser** at the end of each sprint, because they assert user-visible behaviour (audio actually plays, the theme actually switches, the microphone permission prompt behaves).
- A failed AT blocks the story from "Done" — see `docs/agile/DEFINITION_OF_DONE.md`.

Example mapping:

| Story | Acceptance Test IDs | Verified by |
|-------|---------------------|-------------|
| US-02 Convert text to speech | AT-01, AT-02, AT-03 | Manual browser run + `test_tts.py` |
| US-05 Transcribe uploaded audio | AT-08, AT-09 | Manual upload of WAV/MP3 + `test_stt.py` |
| US-06 Execute assistant command | AT-11 … AT-14 | Manual typing + `test_assistant.py` |
| US-12 Light/dark theme | AT-19 | Manual only (no frontend test framework) |

---

## 5. Regression Testing

**Definition.** Regression testing is the re-execution of existing tests after a change, to confirm that previously working behaviour still works. Its purpose is to catch unintended side effects.

**The procedure applied to every change in this project**

1. Implement the change on a `feature/*` branch.
2. Run the full backend suite: `python -m pytest` → must report **38 passed**.
3. Run the frontend build: `npm run build` → must complete with no compile error.
4. Push; GitHub Actions repeats both (`.github/workflows/ci.yml`, jobs `backend-tests` and `frontend-build`).
5. Only after CI is green is the branch merged into `develop`.

**Worked regression example.** During Sprint 3 the shared `DomainError` handler was refactored to map `UnsupportedMediaError` to **415** instead of the previous generic **400**. The change was intended for `POST /api/stt`, but `test_stt.py::test_oversized_upload_is_rejected` — a *validation* failure, not a media failure — also began failing because both exceptions had been routed through one branch of the mapping. The full-suite run caught it in seconds, the mapping was split by exception type in `main.py`, and all 38 tests returned to green. A change tested only against its own new assertion would have shipped a broken upload path.

Regression coverage is deliberately broad rather than clever: every endpoint has at least one happy-path test and at least one failure-path test, so a refactor of any route is checked from both directions.

---

## 6. Risk-Based Testing

**Definition.** Risk-based testing prioritises testing effort by the product of the likelihood that a defect exists and the impact it would have if it reached a user. It is the answer to "we cannot test everything equally well — what do we test first?".

- The full register, matrix, severity rules and prioritisation are in **`docs/agile/RISK_BASED_TESTING.md`**.
- In this project the highest-severity risks were: speech not recognised (H×H), backend unavailable (M×H), unsupported audio file (H×M), and microphone permission denied (M×H).
- Each high-severity risk maps to at least one automated test where automation is possible, and to a scripted manual check where it is not (for example microphone permission, which requires a real browser dialog).

---

## 7. Automated Testing

**Definition.** Automated tests are executed by a machine without human intervention, on demand or on an event such as a commit. Manual testing remains necessary where the assertion concerns the physical world, visual design, or third-party services.

| Aspect | Automated | Manual |
|--------|-----------|--------|
| Executed by | `python -m pytest` locally; GitHub Actions on push/PR | Tester in a browser |
| Coverage | 38 backend tests across 7 files; `npm run build` compile check | Six pages, theme, responsive layout, microphone, playback |
| Feedback time | Seconds | Minutes |
| Runs on | Every commit and pull request to `main` / `develop` | Before each sprint review |
| Blocking | CI must be green to merge | AT failure blocks "Done" |

**CI runs it automatically.** The workflow checks out the code, sets up Python 3.13, installs `backend/requirements.txt`, runs `python -m pytest`, then sets up Node 20, runs `npm ci` and `npm run build`. Full detail in `docs/agile/CONTINUOUS_INTEGRATION.md`.

---

## 8. Test Pyramid

```text
            /  acceptance  \          Manual, browser, AT-xx scripts
           /  (6 pages, AT) \         — smallest count, highest cost
          /───────────────────\
         /   integration       \      TestClient + FastAPI + in-memory SQLite
        /  (route → DB → JSON)  \     — the bulk of the 38 tests
       /─────────────────────────\
      /         unit               \  validators, audio_utils, assistant handlers
     / (pure functions, no I/O)     \ — fastest, most numerous per file
    /───────────────────────────────\
```

| Level | Count | Examples |
|-------|------:|----------|
| Unit | ~16 of 38 | `validate_text()` cases, `validate_upload()` cases, `assistant_service` dispatch, `get_record()` raising `NotFoundError` |
| Integration | ~22 of 38 | `POST /api/tts` full chain, history lifecycle, `GET /api/stats` aggregation, error-handler status mapping, `GET /api/assistant/commands` |
| System / acceptance | 15+ AT cases | Audio actually plays, theme switches, mic permission prompt, responsive layout at 375 px |
| (None yet) | 0 | Frontend component and end-to-end tests — listed under Future Scope |

---

## 9. Test Data Management

All test data is **generated in memory by fixtures** declared in `backend/tests/conftest.py`. No production database, no checked-in audio binaries, no network calls.

| Fixture | Purpose | What it provides |
|---------|---------|------------------|
| `fake_speech_engine` | Replaces gTTS and pyttsx3 | A stub object with `synth(text, lang) -> bytes` and a `fail_on(name)` switch used by the fallback test; prevents network access and local TTS dependencies in CI |
| `fake_recognizer` | Replaces SpeechRecognition | Returns a fixed transcript `"hello world"` so `POST /api/stt` is deterministic regardless of machine audio support |
| `no_browser` | Suppresses side effects | Prevents tests from attempting to open Google/YouTube via `webbrowser` when an *open …* assistant command is executed |
| `build_wav` | Generates valid audio | Produces a standards-compliant WAV byte stream (correct `RIFF`/`WAVE` header and PCM data) of a chosen sample rate and duration — used for success-path upload tests |
| `oversized_wav` | Generates invalid-size audio | Returns bytes exceeding `MAX_UPLOAD_BYTES` (10 MB) to exercise the size limit |
| `client` | HTTP interface | `TestClient(app)` bound to a fresh in-memory SQLite schema per test |
| `seeded_db` | Known starting state | Pre-populates a small, fixed set of history rows so list/stat assertions are exact |
| `session` / `db` | Database isolation | Creates and drops tables around each test; guarantees no test observes another's rows |

**Principles**

1. **No shared mutable state** — each test receives a fresh database.
2. **No external services** — engines and recognisers are always patched; tests are deterministic offline.
3. **Data is built close to its use** — fixtures construct only what the test needs, so a test remains readable.
4. **No real user audio in the repository** — `build_wav` synthesises it, keeping the repo free of binaries and avoiding licensing questions.

---

## 10. Entry and Exit Criteria

| Phase | Criteria |
|-------|----------|
| **Entry — begin testing a story** | Acceptance criteria written for the story; story estimated and in the sprint; branch created from `develop`; `python -m pytest` green on the branch before work starts; fixtures needed for the story exist in `conftest.py` |
| **Entry — begin a test session (manual)** | Backend running (`uvicorn app.main:app --reload`) and frontend running (`npm run dev`); seed data present; at least one real microphone and one sample audio file available |
| **Exit — story ready for review** | New tests written (TDD order) and passing; full suite reports **38 passed**; `npm run build` succeeds; no new warning in the console; no known defect of severity Critical or Major |
| **Exit — sprint increment accepted** | CI green on GitHub Actions (both jobs); all AT cases for the sprint's stories pass manually; Definition of Done checklist complete (`DEFINITION_OF_DONE.md`); retrospective notes recorded |
| **Exit — release candidate** | Full regression suite green; README run instructions verified from a clean clone; `dist/` build produced; no open Critical/Major defect; sign-off recorded in the sprint review |

---

## 11. Defect Management

**Identification.** A defect is any deviation from expected behaviour found by a test, a code review, CI, or manual/acceptance testing.

**Logging.** Defects are recorded in the sprint backlog (and, for coursework, in the sprint retrospective file under `docs/agile/`) with: unique ID (`DEF-nn`), description, steps to reproduce, expected vs actual result, severity, priority, status and the fixing commit.

**Severity vs priority**

| Severity | Meaning | Example in this project | Response |
|----------|---------|-------------------------|----------|
| Critical | Data loss, application unusable, security exposure | Every `POST /api/tts` returns 500; history table wiped by a normal delete | Fix immediately, block merge |
| Major | Core function broken with no workaround | `POST /api/stt` accepts a PDF and crashes the recogniser; delete leaves orphan audio files | Fix within the same sprint |
| Minor | Function works but poorly | Error message says "Error" with no detail; filter resets unexpectedly | Fix if time allows, else log |
| Cosmetic | Appearance only | Misaligned card on the dashboard in dark mode | Backlog, non-blocking |

**Priority** is independent of severity: a cosmetic fix may be High priority if it appears in the sprint review demo, while a Minor defect affecting a rarely used path may be Low.

**Workflow.** `Open → In progress → Fixed (commit linked) → Verified (test added or AT re-run) → Closed`. A defect may only be Closed if either a regression test was added or the manual AT case that caught it was re-executed and passed.

**Metrics tracked:** defects found per sprint, defects open at sprint end (target: zero Critical/Major), and whether the defect was caught by automation or by manual testing — used to decide where more tests are worth writing.

---

## 12. Test Environment

| Environment | Backend | Frontend | Database | Audio | Used for |
|-------------|---------|----------|----------|-------|----------|
| Developer machine | Python 3.13, `uvicorn app.main:app --reload` | Vite dev server (`npm run dev`) | `backend/data/*.db` file, SQLite | Real microphone, real gTTS (network required) | Feature development, manual checks |
| Automated test run | pytest + `TestClient`, in-memory SQLite | n/a | `sqlite:///:memory:` | Faked: `fake_speech_engine`, `fake_recognizer`, `build_wav` | Unit and integration testing |
| CI (GitHub Actions) | `ubuntu-latest`, Python 3.13, `pip install -r requirements.txt`, `python -m pytest` | `ubuntu-latest`, Node 20, `npm ci`, `npm run build` | In-memory SQLite | Faked (no network audio, no audio device) | Merge gate on `main` / `develop` |
| Acceptance / demo | Production-like local run on Windows, Python 3.13 | `npm run build` output served, or dev server | File-based SQLite | Real microphone and speakers, real browser permission prompts | AT-xx scripts, sprint review |
| Clean-clone verification | Fresh clone, `.venv` created from `requirements.txt` | Fresh `npm ci` | New empty database | Real devices | README run instructions, release readiness |

**Environment constraints recorded honestly:** CI has no microphone and no audio output, and the gTTS service requires outbound network access that a CI runner should not depend on — which is precisely why `conftest.py` patches the engines and the recogniser. Consequently, *real* speech synthesis and *real* recognition are validated only in the developer/acceptance environment.

---

## 13. Summary

| Strategy element | Realisation |
|------------------|-------------|
| Unit testing | pytest on validators, upload checks, assistant handlers, service lookups |
| Integration testing | `TestClient` + FastAPI + in-memory SQLite across all 10 endpoints |
| Acceptance testing | `ACCEPTANCE_TESTS.md`, AT IDs linked to user stories, manual in-browser |
| Regression testing | Full `python -m pytest` + `npm run build` before every merge; caught the 415-mapping regression |
| Risk-based testing | `RISK_BASED_TESTING.md` register drives ordering of manual checks |
| Automated testing | 38 tests + frontend build executed by GitHub Actions on every push/PR |
