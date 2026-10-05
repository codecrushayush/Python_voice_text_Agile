# Test Driven Development (TDD)

## 1. Introduction

Test Driven Development (TDD) is a discipline, first popularised by Kent Beck within Extreme Programming, in which a test is written **before** the production code it will verify. TDD is not primarily a testing technique — its immediate purpose is *design*: writing the test first forces the developer to decide the interface, the inputs and the expected outcome of a unit before committing to an implementation.

The unit of work is a single, small cycle.

### 1.1 The Red–Green–Refactor cycle

```text
        ┌─────────────────────────────────────────────┐
        │                                             │
        ▼                                             │
  ┌───────────────┐                                   │
  │     RED       │  Write a test that describes the  │
  │               │  behaviour you want. Run it.      │
  │  test FAILS   │  It must fail — either with a     │
  │  (compile or  │  failing assertion or because the │
  │   assertion)  │  code does not exist yet.         │
  └───────┬───────┘                                   │
          │                                           │
          ▼                                           │
  ┌───────────────┐                                   │
  │    GREEN      │  Write the MINIMUM production     │
  │               │  code that makes the test pass.   │
  │  test PASSES  │  Do not design ahead; do not      │
  │               │  add unrequested features.        │
  └───────┬───────┘                                   │
          │                                           │
          ▼                                           │
  ┌───────────────┐                                   │
  │   REFACTOR    │  Remove duplication, improve      │
  │               │  names, extract helpers — with    │
  │  test still   │  the test as a safety net.        │
  │  PASSES       │                                   │
  └───────┬───────┘                                   │
          │                                           │
          └───────────────────────────────────────────┘
                     next behaviour

  Constraint: at every point the suite must be GREEN
  except for the single deliberate RED step.
```

The three rules, as stated by Beck:

1. Before you add production code, write one failing unit test.
2. Write no more unit test code than is sufficient to fail; compilation failure counts as failure.
3. Write no more production code than is sufficient to pass the one failing unit test.

---

## 2. Worked Example 1 — Empty TTS text rejection

**Behaviour wanted:** posting `POST /api/tts` with an empty or whitespace-only `text` must be rejected with a 422 and a human-readable message, before any engine is invoked.

### 2.1 Test written

```python
# backend/tests/test_validation.py
import pytest
from app.utils.exceptions import ValidationError
from app.utils.validators import validate_text


class TestValidateText:
    def test_empty_text_is_rejected(self):
        with pytest.raises(ValidationError) as exc:
            validate_text("", field="text")
        assert "text cannot be empty" in str(exc.value)

    def test_whitespace_only_text_is_rejected(self):
        with pytest.raises(ValidationError):
            validate_text("   \n\t  ", field="text")

    def test_valid_text_is_returned_stripped(self):
        assert validate_text("  hello world  ") == "hello world"


class TestTTSRejectsEmptyText:
    def test_post_tts_with_empty_text_returns_422(self, client):
        response = client.post("/api/tts", json={"text": "", "lang": "en"})
        assert response.status_code == 422
        assert "empty" in response.json()["detail"].lower()

    def test_post_tts_with_whitespace_text_returns_422(self, client):
        response = client.post("/api/tts", json={"text": "   ", "lang": "en"})
        assert response.status_code == 422
```

### 2.2 Red — why it failed

The first run failed at **collection** time with `ModuleNotFoundError: No module named 'app.utils.validators'` — the module did not exist, so no test could import it. Creating a stub `validators.py` containing only `def validate_text(value, field="text"): pass` turned the failure into an assertion failure: `pytest.raises(ValidationError)` raised nothing because no exception was raised. Both are legitimate RED states; the important property is that the failure is caused by the *absence of the behaviour*, not by a mistake in the test.

### 2.3 Green — production code added

```python
# backend/app/utils/validators.py
from app.utils.exceptions import ValidationError

MAX_TEXT_LENGTH = 5000


def validate_text(value: str, field: str = "text") -> str:
    if value is None or not str(value).strip():
        raise ValidationError(f"{field} cannot be empty")
    if len(value) > MAX_TEXT_LENGTH:
        raise ValidationError(f"{field} exceeds {MAX_TEXT_LENGTH} characters")
    return str(value).strip()
```

plus a `DomainError` → 422 mapping in `backend/app/main.py` so that the HTTP test observes `422` rather than `500`. No length rule was added until its own test existed (the next RED step), keeping the Green step minimal.

### 2.4 Refactor

The router originally inlined a second copy of the emptiness check:

```python
# before refactor, routers/tts.py
if not request.text.strip():
    raise HTTPException(422, detail="Text cannot be empty")
validate_text(request.text)
```

The inline check was removed so that `validate_text()` is the single authority, and the returned stripped value became the value passed to `tts_service.synthesize()`. Tests still green; duplication between router and validator eliminated.

---

## 3. Worked Example 2 — Missing history record returns 404

**Behaviour wanted:** `GET`/`DELETE /api/history/{id}` for an id that does not exist must return `404` with `{detail: ...}` — not `500`, and not a silent `200`.

### 3.1 Test written

```python
# backend/tests/test_history.py
def test_get_missing_record_returns_404(client):
    response = client.get("/api/history/9999")
    assert response.status_code == 404
    assert "not found" in response.json()["detail"].lower()


def test_delete_missing_record_returns_404(client, seeded_db):
    response = client.delete("/api/history/9999")
    assert response.status_code == 404
    body = response.json()
    assert body["detail"]
    # existing records must be untouched
    remaining = client.get("/api/history").json()
    assert len(remaining) == len(seeded_db)
```

### 3.2 Red — why it failed

The route previously did `row = db.query(History).get(record_id)` followed immediately by `db.delete(row)`. With `record_id=9999` the query returned `None`, and `db.delete(None)` produced an internal SQLAlchemy error that FastAPI converted to `500`. The test failed on `assert response.status_code == 404` with the actual value `500` — a genuine production bug the test exposed before any manual clicking.

### 3.3 Green — production code added

```python
# backend/app/services/history_service.py
from app.utils.exceptions import NotFoundError


def get_record(db, record_id: int) -> History:
    record = db.get(History, record_id)
    if record is None:
        raise NotFoundError(f"History record {record_id} not found")
    return record


def delete_record(db, record_id: int) -> dict:
    record = get_record(db, record_id)          # raises NotFoundError
    db.delete(record)
    db.commit()
    audio_utils.delete_audio(record.audio_path) # also cleans the file
    return {"deleted": record_id}
```

with the `DomainError → 404` mapping in `main.py` established in Example 1. The router stays a one-liner: `return history_service.delete_record(db, record_id)`.

### 3.4 Refactor

`get_record()` was extracted because the same existence check was needed by three call sites (retrieve, delete one, and the stats/detail paths) — the *rule of three* had been reached. After extraction, the second and third call sites call `get_record()` instead of repeating the `if record is None` test, and the error message is defined once. The 404 test, plus the "other records untouched" assertion, continued to pass.

---

## 4. Worked Example 3 — Unsupported audio file rejected

**Behaviour wanted:** uploading a file whose type is not one of the accepted audio formats must be rejected with a clear message, and the file must never reach the recogniser.

### 4.1 Test written

```python
# backend/tests/test_stt.py
import io

ALLOWED = b"RIFF....WAVEfmt "


def test_unsupported_file_type_is_rejected(client, no_browser):
    payload = {"file": ("notes.pdf", io.BytesIO(b"%PDF-1.4 not audio"), "application/pdf")}
    response = client.post("/api/stt", files=payload)
    assert response.status_code in (400, 415)
    assert "unsupported" in response.json()["detail"].lower() or \
           "not supported" in response.json()["detail"].lower()


def test_supported_wav_upload_is_accepted(client, build_wav, fake_recognizer):
    payload = {"file": ("speech.wav", io.BytesIO(build_wav()), "audio/wav")}
    response = client.post("/api/stt", files=payload)
    assert response.status_code == 200
    assert response.json()["text"] == "hello world"


def test_oversized_upload_is_rejected(client, oversized_wav):
    payload = {"file": ("big.wav", io.BytesIO(oversized_wav), "audio/wav")}
    response = client.post("/api/stt", files=payload)
    assert response.status_code == 400
    assert "10" in response.json()["detail"]   # the 10 MB limit
```

### 4.2 Red — why it failed

The router accepted whatever `UploadFile` produced and passed the bytes straight to `stt_service.transcribe()`. With a PDF payload the recogniser raised a generic exception that the route did not catch, so FastAPI returned `500`; the assertion `status_code in (400, 415)` failed with `500`. The oversized-upload test failed identically — the size limit was nowhere in the code.

### 4.3 Green — production code added

```python
# backend/app/utils/audio_utils.py
from app.utils.exceptions import UnsupportedMediaError, ValidationError

ALLOWED_EXTENSIONS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}
ALLOWED_CONTENT_TYPES = {"audio/wav", "audio/x-wav", "audio/mpeg", "audio/mp3",
                         "audio/mp4", "audio/x-m4a", "audio/flac", "audio/ogg"}
MAX_UPLOAD_BYTES = 10 * 1024 * 1024   # 10 MB


def validate_upload(filename: str, content_type: str, size: int) -> str:
    ext = os.path.splitext(filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS or content_type not in ALLOWED_CONTENT_TYPES:
        raise UnsupportedMediaError(
            f"Unsupported file type '{ext or content_type}'. "
            f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )
    if size > MAX_UPLOAD_BYTES:
        raise ValidationError(f"File exceeds the {MAX_UPLOAD_BYTES // (1024*1024)} MB limit")
    return ext
```

`routers/stt.py` now calls `validate_upload(...)` before any bytes are handed to the service, and `UnsupportedMediaError → 415`, `ValidationError → 400/422` are handled by the `DomainError` handler.

### 4.4 Refactor

The initial Green version checked only the file *extension*. A second RED test (`test_content_type_mismatch_is_rejected`) drove the addition of the content-type check, after which the two checks were folded into a single `validate_upload()` predicate instead of two inline `if`s. `stt_service.transcribe()` was then simplified: it can now assume the payload is a supported, size-limited audio file, and its own error handling shrank. All tests green.

---

## 5. Test Suite at the End

| Test File | Tests | What it covers |
|-----------|------:|----------------|
| `backend/tests/test_health.py` | 2 | `GET /health` returns 200 with `status` and `version`; `GET /` lists the API routes |
| `backend/tests/test_validation.py` | 7 | `validate_text()` rejects blank input and strips whitespace; `validate_choice()` rejects unknown values; invalid JSON body returns 422; unknown route returns 404; unknown assistant command falls back to the help text; engine auto-fallback to pyttsx3; oversized STT payload rejected |
| `backend/tests/test_tts.py` | 5 | Empty TTS input rejected (Red/Green example); missing `text` field 422; text over 5000 characters 422; successful conversion returns `audio_url` and writes a history row; `GET /api/tts/languages` contract |
| `backend/tests/test_stt.py` | 5 | WAV transcription success with the patched recogniser; unsupported extension 422; empty file 422; recogniser failure mapped to a friendly 422 message; STT record persisted in history |
| `backend/tests/test_assistant.py` | 10 | Greeting, time, date, open Google, search, help, about, empty input 422, unknown-command fallback, `GET /api/assistant/commands`; plus the `speak: true` audio path |
| `backend/tests/test_history.py` | 9 | List all types; filter by type; text search; invalid filter 422; delete single record; delete missing record 404; clear all; `GET /api/stats` counters and recent list |
| **Total** | **38** | All passing under `python -m pytest` |

---

## 6. What Is Unit Tested, What Is Integration Tested, What Is Manual

### 6.1 Unit tested

Pure functions are tested directly, without HTTP or a database:

- `app/utils/validators.py` — `validate_text()`, `validate_language()` (`tests/test_validation.py`)
- `app/utils/audio_utils.py` — `validate_upload()`, `save_audio()`, `delete_audio()`
- `app/services/assistant_service.py` — handler dispatch from the `COMMANDS` dict (`tests/test_assistant.py`)
- `app/services/history_service.py` — `get_record()` raising `NotFoundError` in isolation

### 6.2 Integration tested

End-to-end through the FastAPI application using `TestClient` with an in-memory SQLite database and patched collaborators:

- Every route contract (status code + response body shape)
- The `DomainError` → HTTP status mapping registered in `main.py`
- History persistence: service writes → model → subsequent `GET /api/history` read
- Engine fallback in `tts_service.py`, exercised against the fake engine installed by `conftest.py`

### 6.3 Tested manually — honestly

The following cannot be meaningfully automated in this environment and were verified by hand against the checklist in `docs/agile/QUALITY_ASSURANCE.md`:

| Manual area | Why automation was not used |
|-------------|-----------------------------|
| Real microphone capture and browser permission prompt | Requires a physical device and a real browser permission dialog |
| Speech recognition accuracy on live audio | Depends on microphone hardware and ambient noise |
| Real gTTS network synthesis and MP3 playback | Requires network access; tests patch the engine instead |
| Dark / light theme rendering | Visual output; no snapshot tooling in the frontend stack |
| Responsive layout at 375 px / 768 px / 1440 px | Visual and interactive layout verification |
| Audio autoplay behaviour in the browser | Subject to browser autoplay policies |
| `npm run build` output served from `dist/` | Deployment smoke test, not a unit concern |

Honest limitation to record: the frontend has **no automated component or end-to-end tests**. Its safety net is the Vite compile in CI plus the manual checklist. Adding Playwright coverage of the six pages is listed in Future Scope.

---

## 7. Summary

TDD was applied where it pays most: at the boundaries (validation, file upload limits, error codes) and in the domain logic (history lookup, assistant dispatch). The three worked examples show the discipline producing real defects early — a `500` instead of a `404`, an unvalidated PDF reaching the recogniser — rather than merely confirming code that already worked. The finished suite contains 38 tests across 7 files, all green locally and in CI.
