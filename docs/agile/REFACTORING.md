# Refactoring

## 1. Definition

Martin Fowler defines refactoring as *"the process of changing a software system in such a way that it does not change the external behaviour of the code, yet improves its internal structure"* (*Refactoring: Improving the Design of Existing Code*, 1st ed. 1999, p. 4).

Three consequences of that definition matter in practice:

- **Behaviour is preserved.** The application still answers the same requests with the same responses; users notice nothing.
- **Structure improves.** Duplication falls, coupling decreases, names become honest, responsibilities become single.
- **It is a series of small steps.** Refactoring is not a rewrite. Each step is small enough to be reversed and is verified immediately.

Refactoring is not "cleaning up at the end". It is a continuous activity performed *while* adding features, because the cost of restructuring grows with the distance from the code's original writing.

---

## 2. When to Refactor

Martin Fowler's rule of thumb, applied throughout this project:

| Situation | Refactor? | In this project |
|-----------|-----------|-----------------|
| Before adding a feature | Yes — first make the change easy, then make the easy change | Extracting `validators.py` before adding the assistant's text rules |
| While fixing a bug | Yes — if the bug was hard to find because of structure | A wrong 404 body led to extracting `NotFoundError` handling |
| On encountering the three strikes rule (duplication seen three times, or similar code twice) | Yes | `HistoryTable` markup seen a second time → React component extraction |
| During code review / pair review | Yes — address review comments that are structural, not cosmetic | Service-layer extraction suggested in peer review of `tts.py` |
| Only when there is time and no deadline | No — refactoring is part of the work, not a reward for finishing | Each sprint's stories include their refactoring in the point estimate |
| When tests are absent and risk is high | Write the test (characterisation test) first | `audio_utils.validate_upload()` gained tests before its allow-list change |

**Never refactor without a safety net.** Two conditions were required before any structural change was made: (a) an automated test suite covering the affected behaviour, and (b) a CI pipeline that would detect a regression.

---

## 3. The Safety Net — Tests and CI

Before refactoring begins, three things must be true:

1. **Characterisation tests exist.** If a code path has no tests, the first task is to write tests that pin down *current* behaviour — even behaviour that is imperfect — so that "no change in behaviour" is verifiable rather than assumed.
2. **The suite runs fast.** `python -m pytest` in `backend/tests/` executes all 38 tests in seconds because `conftest.py` patches the TTS engines and the recogniser — no real gTTS network call and no real microphone are needed. A fast suite is a suite that will actually be run after every small step.
3. **CI repeats the gate.** `.github/workflows/ci.yml` runs `python -m pytest` (Python 3.13) and `npm run build` (Node 20) on every push and pull request to `main` and `develop`. A refactor that breaks a test cannot be merged.

The local loop before every refactor commit was:

```bash
python -m pytest      # backend safety net
npm run build         # frontend compile-time safety net
```

---

## 4. Refactoring Examples in this Project

### 4.1 Move speech logic from the API route into the service layer

**Problem (before)**

`backend/app/routers/tts.py` performed validation, called the engine, wrote the file and touched the database — the HTTP layer, business logic and persistence were fused:

```python
# backend/app/routers/tts.py  (before)
@router.post("/api/tts")
def synthesize(request: TTSRequest):
    if not request.text or not request.text.strip():
        raise HTTPException(status_code=422, detail="Text cannot be empty")
    if request.lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=422, detail="Unsupported language")
    if request.engine == "gtts":
        from gtts import gTTS
        import io
        buf = io.BytesIO()
        gTTS(text=request.text, lang=request.lang).write_to_fp(buf)
        audio = buf.getvalue()
    else:
        import pyttsx3
        engine = pyttsx3.init()
        engine.save_to_file(request.text, filename)
        engine.runAndWait()
        with open(filename, "rb") as f:
            audio = f.read()
    path = save_audio(audio, filename)
    db.add(History(type="tts", input_text=request.text, audio_path=path))
    db.commit()
    return {"audio_url": f"/static/audio/{filename}"}
```

**Solution (after)**

The router only validates and shapes HTTP; `tts_service.synthesize()` owns engine choice and synthesis; `history_service.add_record()` owns persistence:

```python
# backend/app/routers/tts.py  (after)
@router.post("/api/tts", response_model=TTSResponse)
def synthesize(request: TTSRequest, db: Session = Depends(get_db)):
    validate_text(request.text, field="text")
    validate_language(request.lang)
    result = tts_service.synthesize(request.text, request.lang, request.engine, db)
    return TTSResponse(audio_url=result.audio_url, engine=result.engine, lang=request.lang)
```

```python
# backend/app/services/tts_service.py
def synthesize(text, lang, engine_name, db) -> SynthesisResult:
    validate_text(text, field="text")
    audio = _run_engine(engine_name or settings.tts_default_engine, text, lang)
    path = save_audio(audio, filename(text, lang))
    history_service.add_record(db, type="tts", input_text=text, audio_path=path)
    return SynthesisResult(audio_url=public_url(path), engine=engine_name)
```

**Why it improves maintainability**

- The router is now readable in a screenful; a reviewer can see the HTTP contract without reading engine code.
- The engine chain can be tested by calling `tts_service.synthesize()` directly, with no `TestClient` and no HTTP layer.
- The same service method is reusable by a future CLI or batch job; the HTTP route is not.
- The STT side received the identical treatment (`stt_service.transcribe()`), so both speech flows are structurally symmetric.

---

### 4.2 Extract shared text validation into `app/utils/validators.py`

**Problem (before)**

The same rules were written three times, and the copies began to diverge (the assistant allowed longer input than TTS):

```python
# routers/tts.py (before)
if not request.text or not request.text.strip():
    raise HTTPException(422, detail="Text cannot be empty")
if len(request.text) > 5000:
    raise HTTPException(422, detail="Text too long")

# routers/assistant.py (before)
if not payload.command or not payload.command.strip():
    raise HTTPException(422, detail="Command cannot be empty")
if len(payload.command) > 5000:
    raise HTTPException(422, detail="Too long")
```

**Solution (after)**

```python
# backend/app/utils/validators.py
from app.utils.exceptions import ValidationError

MAX_TEXT_LENGTH = 5000

def validate_text(value: str, field: str = "text") -> str:
    if value is None or not str(value).strip():
        raise ValidationError(f"{field} cannot be empty")
    if len(value) > MAX_TEXT_LENGTH:
        raise ValidationError(f"{field} exceeds {MAX_TEXT_LENGTH} characters")
    return value.strip()
```

Called by `tts.py`, `stt.py` (transcript handling), `assistant.py` and by the services themselves.

**Why it improves maintainability**

- One rule, one place: changing the maximum length is a one-line edit that takes effect on every endpoint.
- The rule is unit-testable in isolation (`tests/test_validation.py`) rather than only through HTTP.
- The message format becomes consistent, which is what the frontend `errorMessage()` in `frontend/src/services/api.js` parses.

---

### 4.3 Reuse React components instead of duplicating buttons and cards

**Problem (before)**

The dashboard, history and settings pages each carried their own copy of card markup, delete buttons and loading states:

```jsx
// Dashboard.jsx (before)
<div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
  <h3 className="text-sm text-slate-500">TTS conversions</h3>
  <p className="text-3xl font-bold">{stats.tts}</p>
</div>
// ... repeated with different labels on History.jsx and Settings.jsx
<button onClick={handleDelete} className="text-red-600 hover:text-red-800 ...">Delete</button>
```

**Solution (after)**

Extracted to `frontend/src/components/` and reused:

```jsx
// components/StatCard.jsx
export default function StatCard({ title, value, icon: Icon, trend }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-slate-500">{title}</h3>
        {Icon && <Icon className="w-5 h-5 text-slate-400" />}
      </div>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
```

Nine components resulted: `Sidebar`, `StatCard`, `AudioPlayer`, `MicrophoneButton`, `HistoryTable`, `ConfirmationModal`, `Toast`, `LoadingSpinner`, `EmptyState`.

**Why it improves maintainability**

- A visual fix (contrast in dark mode, rounded corner, focus ring) is made once and appears on all six pages.
- Behaviour concentrated in one place: `MicrophoneButton` owns the permission-denied branch that previously existed only on the STT page, while the Assistant page's microphone needed it too.
- Pages shrink to composition logic, which makes them easier to read and to test manually.

---

### 4.4 Remove duplicate error handling by adding the `DomainError` handler in `main.py`

**Problem (before)**

Every route wrapped its body in its own `try/except`, producing inconsistent shapes — some JSON, some plain text, one leaking a stack trace:

```python
# routers/history.py (before)
@router.delete("/api/history/{record_id}")
def delete_one(record_id: int, db = Depends(get_db)):
    try:
        row = db.query(History).filter(History.id == record_id).first()
        if row is None:
            raise HTTPException(status_code=404, detail=f"Record {record_id} not found")
        db.delete(row)
        db.commit()
        return {"deleted": record_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Solution (after)**

Services raise domain exceptions; one handler translates them:

```python
# backend/app/utils/exceptions.py
class DomainError(Exception): ...
class ValidationError(DomainError): ...
class NotFoundError(DomainError): ...
class UnsupportedMediaError(DomainError): ...

# backend/app/main.py
@app.exception_handler(DomainError)
def domain_error_handler(request, exc):
    status = {ValidationError: 422, NotFoundError: 404,
              UnsupportedMediaError: 415}.get(type(exc), 400)
    return JSONResponse(status_code=status, content={"detail": str(exc)})
```

```python
# routers/history.py (after)
@router.delete("/api/history/{record_id}")
def delete_one(record_id: int, db = Depends(get_db)):
    return history_service.delete_record(db, record_id)   # raises NotFoundError
```

**Why it improves maintainability**

- One mapping of exception type → HTTP status, so the frontend's error handling is uniform on every endpoint.
- Services become framework-independent: they raise `NotFoundError`, not `HTTPException`, so they could be reused outside FastAPI.
- Fourteen lines of repeated `try/except` disappeared across four routers, removing a place for bugs to hide.

---

### 4.5 Rename unclear variables and identifiers

**Problem (before)**

Prototype names survived into the first working version; identifiers such as `d`, `res`, `tmp_f`, `r2` and DOM ids like `btn1` / `out` required reading the surrounding code to decode:

```javascript
// frontend: old code
async function go() {
  const d = document.getElementById('txt').value;
  const res = await axios.post('/api/tts', { text: d });
  document.getElementById('out').src = res.data.url;
}
```

```html
<button id="btn1">Convert</button>
<div id="out"></div>
```

**Solution (after)**

Names now state intent, in both the backend and the frontend:

```javascript
// frontend/src/pages/TextToSpeech.jsx (after)
const [inputText, setInputText] = useState("");
const [isSynthesizing, setIsSynthesizing] = useState(false);

async function handleSynthesize() {
  const response = await ttsApi.convertToSpeech({ text: inputText, lang: selectedLanguage });
  setAudioUrl(response.audio_url);
}
```

Backend equivalents: `tmp_f` → `wav_file`, `res` → `transcript`, `d` → `cleaned_text`, `rows` → `records`, `h` → `history_entry`, DOM ids replaced by React state and component names (`MicrophoneButton`, `AudioPlayer`).

**Why it improves maintainability**

- The code reads as a specification of the domain: *synthesize*, *transcript*, *history record*.
- Search and review become reliable — searching for `transcript` finds the real code, not an incidental variable.
- Bugs in the assistant handlers (for example a handler returning the wrong string) were found *because* the rename made the handler bodies readable side by side.

---

### 4.6 Separate database logic into `history_service.py`

**Problem (before)**

SQLAlchemy queries were spread across three routers, so the persistence model existed in four places:

```python
# routers/history.py (before)
records = db.query(History).order_by(History.created_at.desc()).all()
# routers/dashboard-like route (before)
total = db.query(func.count(History.id)).filter(History.type == "tts").scalar()
# routers/tts.py (before)
db.add(History(type="tts", input_text=text, audio_path=path)); db.commit()
```

**Solution (after)**

`backend/app/services/history_service.py` is the only module that issues queries:

```python
# backend/app/services/history_service.py
def list_records(db, *, type=None, query=None, limit=50):
    stmt = select(History).order_by(History.created_at.desc())
    if type:
        stmt = stmt.where(History.type == type)
    if query:
        stmt = stmt.where(History.input_text.ilike(f"%{query}%"))
    return db.scalars(stmt.limit(limit)).all()

def add_record(db, *, type, input_text, output_text=None, audio_path=None): ...
def delete_record(db, record_id): ...
def clear_records(db): ...
def get_stats(db): ...
```

**Why it improves maintainability**

- A schema change (for example adding an index on `created_at`) is now a single-file edit.
- The routers contain no ORM imports, which makes them trivial to test with a stubbed service.
- Search/filter semantics for `GET /api/history` live beside the delete logic, so filtering behaves consistently everywhere.

---

### 4.7 Consolidate history and statistics queries

**Problem (before)**

`GET /api/stats` had been added in a separate file with its own session handling and its own field names, so two modules disagreed about what a "TTS count" meant:

```python
# routers/stats.py (before)
tts_count = db.query(History).filter(History.type == "tts").count()
total = db.query(History).count()
return {"tts": tts_count, "total": total, "stt": stt_count}
```

while the history list counted `type == "speech"` elsewhere — two spellings for one concept.

**Solution (after)**

Both endpoints are served from `history_service.py`, which defines the canonical type constants:

```python
# backend/app/services/history_service.py
TYPE_TTS = "tts"
TYPE_STT = "stt"
TYPE_ASSISTANT = "assistant"

def get_stats(db) -> dict:
    rows = db.execute(select(History.type, func.count()).group_by(History.type)).all()
    counts = {t: c for t, c in rows}
    return {
        "total": sum(counts.values()),
        "tts": counts.get(TYPE_TTS, 0),
        "stt": counts.get(TYPE_STT, 0),
        "assistant": counts.get(TYPE_ASSISTANT, 0),
    }
```

**Why it improves maintainability**

- One `GROUP BY` replaces several count queries — one round trip to SQLite instead of four.
- The dashboard figures and the history filters can no longer drift apart, because both read the same constants.
- Adding a new conversion type is one constant plus a UI label; the stats endpoint adapts automatically.

---

### 4.8 Extract browser WAV encoding into `frontend/src/utils/recorder.js`

**Problem (before)**

The `MediaRecorder` hook, blob concatenation, `AudioContext` resampling and WAV header writing were embedded inside the page component, mixing browser plumbing with presentation logic:

```jsx
// pages/SpeechToText.jsx (before)
function SpeechToText() {
  const [chunks, setChunks] = useState([]);
  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const rec = new MediaRecorder(stream);
    rec.ondataavailable = (e) => setChunks((c) => [...c, e.data]);
    // ... 60 lines of AudioContext, setSampleRate, DataView header writing ...
    const wav = encodeWav(merged, sampleRate);   // nested inside the component
    setAudioBlob(wav);
  }
  return (/* markup */);
}
```

**Solution (after)**

```jsx
// frontend/src/utils/recorder.js
export function createRecorder({ onLevel } = {}) { /* getUserMedia + MediaRecorder */ }
export function blobToWav(blob, targetSampleRate = 16000) { /* AudioContext + resample */ }
export function encodeWav(float32, sampleRate) { /* RIFF header + PCM bytes */ }

// pages/SpeechToText.jsx (after)
import { createRecorder, blobToWav } from "../utils/recorder";
const recorder = createRecorder({ onLevel: setLevel });
const wav = await blobToWav(rawBlob, 16000);
```

**Why it improves maintainability**

- The page renders UI; the utility handles audio. Either can change without touching the other.
- `recorder.js` is reusable — the Assistant page can record a voice command by importing the same module instead of copying 60 lines.
- The sample-rate constant (16 kHz, which the recogniser expects) is defined once, removing a class of "speech not recognized" defects caused by mismatched rates.

---

## 5. Refactoring Log

| Date/Sprint | Refactoring | Files | Benefit |
|-------------|-------------|-------|---------|
| Sprint 1, week 1 | Extract TTS engine call into a service function | `routers/tts.py`, `services/tts_service.py` | Testable without HTTP; router reduced to ~20 lines |
| Sprint 1, week 2 | Extract shared text validation | `utils/validators.py` (new), `routers/tts.py`, `routers/stt.py` | One rule set, unit-testable, consistent messages |
| Sprint 1, week 3 | Move file writing into `audio_utils.save_audio()` / `delete_audio()` | `utils/audio_utils.py`, `routers/tts.py` | Deletes clean up disk files; no orphan MP3s |
| Sprint 2, week 1 | Move STT logic out of the route | `routers/stt.py`, `services/stt_service.py` | Symmetry with TTS; recogniser patchable in tests |
| Sprint 2, week 2 | Add `DomainError` handler, remove per-route `try/except` | `main.py`, `utils/exceptions.py`, all routers | Uniform error contract for the frontend |
| Sprint 2, week 3 | Extract React components (9) | `components/*.jsx`, `pages/*.jsx` | Single source of UI behaviour; less copy-paste |
| Sprint 2, week 4 | Rename prototype identifiers | `pages/TextToSpeech.jsx`, `services/assistant_service.py` | Readable intent; easier review and search |
| Sprint 3, week 1 | Consolidate history CRUD + stats into one service | `services/history_service.py`, `routers/history.py` | One query path; no duplicate counts |
| Sprint 3, week 1 | Extract WAV encoding from the page | `utils/recorder.js` (new), `pages/SpeechToText.jsx` | Reusable recorder; page reduced to state + markup |
| Sprint 3, week 2 | Group DB access behind `get_db` dependency only | `database.py`, `routers/*.py` | Session lifecycle managed in one place |
| Sprint 3, week 2 | Consolidate Pydantic schemas per domain | `schemas/*.py` | Contract documented next to the code that validates it |
| Sprint 3, week 3 | Rename inconsistent history type values to constants | `history_service.py`, `models/history.py` | Dashboard and filters can no longer disagree |

---

## 6. Technical Debt Reduced

The refactorings above are the *repayment* of debt deliberately incurred while delivering working increments. The debt register, and its disposition:

| Technical debt | Where it came from | Status |
|----------------|--------------------|--------|
| Business logic inside HTTP routes | Fastest route to a Sprint 1 demo | **Repaid** — services own all speech and persistence logic |
| Triplicated validation rules | Each route needed rules immediately | **Repaid** — `utils/validators.py` |
| Inconsistent error responses | Independent `try/except` per route | **Repaid** — single `DomainError` handler in `main.py` |
| Duplicated UI markup across pages | Pages built independently | **Repaid** — 9 shared components |
| Two query paths for history and stats | Stats added later without inspection | **Repaid** — consolidated in `history_service.py` |
| Audio encoding embedded in a page component | Microphone spike prototype | **Repaid** — `utils/recorder.js` |
| Unclear prototype variable names | Initial spike code | **Repaid** — domain-oriented renames |
| No automated tests before Sprint 2 | Tests deferred to Sprint 3 originally | **Repaid** — 38 tests plus CI gate |
| Auth layer, feature flags, unused endpoints | — | **Never taken on** — deliberately out of scope |
| Premature ORM relationships / caching layer | — | **Never taken on** — deferred under *defer commitment* (see `LEAN.md`) |

Remaining, consciously accepted debt:

- `pyttsx3` fallback is exercised only on machines with a working SAPI driver, so its behaviour in CI relies on the patched fake engine rather than the real one.
- Frontend pages have no automated unit tests; verification is `npm run build` plus the manual checklist in `QUALITY_ASSURANCE.md`.
- Audio files are stored on local disk rather than in object storage — acceptable for a single-user application, and noted under Future Scope.

---

## 7. Summary

Refactoring in this project was continuous rather than deferred: every feature slice ended with a structure check, and the 38-test suite plus the GitHub Actions pipeline made each step verifiable. The twelve logged refactorings removed duplication across routers, services, schemas and React pages, while the debt register records both what was repaid and what was consciously never incurred.
