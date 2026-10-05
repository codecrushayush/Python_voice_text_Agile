# Risk-Based Testing

## 1. Introduction

Risk-based testing (RBT) allocates testing effort according to risk rather than equally across the system. It starts from the premise that testing resources are finite and that not every defect has the same consequence: a bug that stops audio playback entirely matters more than a one-pixel alignment issue, so it deserves more test cases, earlier execution and stronger evidence.

This document records the risk register for *Python Text-to-Speech, Speech-to-Text and Virtual Assistant*, the matrix used to rank risks, and the specific testing approach chosen for each.

---

## 2. Risk = Probability × Impact

```text
Risk  =  Probability (how likely is the failure?)
       × Impact      (how badly does it hurt the user?)
```

- **Probability** — how likely the triggering condition is during normal use, given the technology (browsers, network, file formats, SQLite) and the user population.
- **Impact** — the consequence if it occurs: from negligible inconvenience, through loss of a feature, to a completely unusable application or lost data.

### 2.1 Risk matrix

| | **Impact Low** | **Impact Medium** | **Impact High** |
|---|---|---|---|
| **Probability High** | Low severity | Medium severity | **High severity** |
| **Probability Medium** | Low severity | Medium severity | **High severity** |
| **Probability Low** | Low severity | Low severity | Medium severity |

### 2.2 Risk severity

Severity is read directly from the matrix cell:

| Combination | Severity | Rationale |
|-------------|----------|-----------|
| High × High | **High** | Likely and damaging — must be tested first, with automation where possible |
| Medium × High | **High** | Infrequent but catastrophic — test explicitly, and mitigate in code |
| High × Medium | **High** | Frequent with real user cost — automate a regression test |
| Medium × Medium | **Medium** | Worth a dedicated test case; not a release blocker |
| High × Low / Low × High | **Medium** | One axis is serious but the other is rare or trivial |
| Low × Low, Low × Medium | **Low** | Cover opportunistically; document and accept |

Only **High** severity risks block a release; **Medium** risks must have a documented test or mitigation; **Low** risks are accepted with a note.

---

## 3. Risk Register

| Risk ID | Risk | Probability (H/M/L) | Impact (H/M/L) | Severity | Owner |
|---------|------|---------------------|----------------|----------|-------|
| R-01 | Microphone permission denied by the browser | M | H | High | Frontend |
| R-02 | Unsupported audio file uploaded | H | M | High | Backend |
| R-03 | Speech not recognised (poor audio / wrong sample rate) | H | H | High | Backend |
| R-04 | Backend unavailable (server not running / port busy) | M | H | High | Full-stack |
| R-05 | Invalid input submitted (empty, oversized, wrong type) | H | M | High | Backend |
| R-06 | Database issue (locked file, corrupt `conversion_history`) | L | H | Medium | Backend |
| R-07 | Very large text input (memory / timeout) | M | M | Medium | Backend |
| R-08 | Network unavailable for gTTS | M | H | High | Backend |
| R-09 | Browser blocks autoplay of generated audio | H | M | High | Frontend |
| R-10 | Oversized upload greater than 10 MB | M | M | Medium | Backend |
| R-11 | ffmpeg missing, so MP3 conversion fails | L | M | Low | Backend |
| R-12 | Stale static audio files accumulate in `app/static/audio/` | H | L | Medium | Backend |
| R-13 | CORS error blocking browser calls to the API | L | H | Medium | Full-stack |
| R-14 | Slow TTS response on a poor connection | M | M | Medium | Backend |
| R-15 | Assistant command not recognised (typo / unknown phrasing) | H | L | Medium | Backend |
| R-16 | Concurrent edits clobber history rows | L | L | Low | Backend |

---

## 4. Risk Register (main table)

| Risk | Probability | Impact | Testing Approach |
|------|-------------|--------|------------------|
| Microphone permission denied | Medium | High | Manual test in Chrome and Firefox: deny permission and assert `MicrophoneButton.jsx` shows the error state instead of hanging; automated test of the rejection branch by stubbing `getUserMedia` to reject; acceptance case AT-xx records the expected message |
| Unsupported audio file | High | Medium | Automated: `tests/test_stt.py` posts a `.pdf` and a `.txt` and asserts 415 with a clear detail; content-type/extension mismatch case; unit test of `audio_utils.validate_upload()` against the allow-list |
| Speech not recognized | High | High | Unit test of `blobToWav` sample-rate handling (16 kHz target); integration test using `build_wav` with `fake_recognizer` asserting the transcript reaches the response; manual test with a real microphone in a quiet room; failure path test asserting a clean error rather than a 500 |
| Backend unavailable | Medium | High | Integration test that the frontend maps connection refusal to a user message via `errorMessage()` in `services/api.js`; manual test with uvicorn stopped; check that every page shows a retry-able error rather than a blank screen |
| Invalid input | High | Medium | Automated: empty text, whitespace-only text, text over 5000 characters, missing fields, wrong JSON types — asserted as 422 from `POST /api/tts` and `POST /api/assistant`; unit tests in `tests/test_validation.py` |
| Database issue | Low | High | Integration tests run on in-memory SQLite with schema created/dropped per test, proving the schema is reproducible; manual test of a locked DB file (second process) asserting a clean error; backup of `backend/data/*.db` documented in `.gitignore` policy |
| Large text input | Medium | Medium | Automated boundary test: 5000-character limit accepted, 5001 rejected; manual test with 4999 characters measuring response time; assert no truncation in the stored `input_text` |
| Network unavailable for gTTS | Medium | High | Automated: `fake_speech_engine.fail_on("gtts")` forces the primary engine to raise and asserts `pyttsx3` fallback returns 200; manual test with the network disconnected |
| Browser blocks autoplay | High | Medium | Manual test in Chrome/Safari: generate audio and confirm playback starts only after a user gesture; verify `AudioPlayer.jsx` exposes a visible play button as the fallback path |
| Oversized upload >10 MB | Medium | Medium | Automated: `oversized_wav` fixture posts a payload over `MAX_UPLOAD_BYTES` and asserts a 400 naming the 10 MB limit; boundary test just under the limit must pass |
| ffmpeg missing for MP3 conversion | Low | Low/Medium | Manual test on a clean machine without ffmpeg; assert the service reports an actionable error and falls back to WAV rather than crashing; documented as an environment prerequisite |
| Stale static audio files | High | Low/Medium | Automated: delete a history record and assert the corresponding file is gone (`tests/test_history.py`); manual inspection of `app/static/audio/` after a session of create/delete cycles |
| CORS error | Low | High | Manual test calling the API from the Vite dev origin; the dev proxy configuration is verified by running the frontend and backend together; automated contract tests avoid the browser entirely |
| Slow TTS response | Medium | Medium | Manual test with throttled network; assert a loading state (`LoadingSpinner`) appears and the submit button is disabled; no UI freeze during a long synthesis |

---

## 5. Test Prioritisation

| Priority | Risk IDs | Rationale |
|----------|----------|-----------|
| **P1 — Test first, block release** | R-03, R-04, R-01, R-08 | High severity: these break the core promise of the application (speak, listen, or reach the server). Each has an automated test where feasible and a scripted manual check otherwise |
| **P2 — Test before sprint review** | R-02, R-05, R-09, R-10 | High severity or high probability: frequent user-visible failures. Fully automated in `test_stt.py` / `test_validation.py`, plus manual autoplay verification |
| **P3 — Test in regression pass** | R-07, R-12, R-13, R-14, R-15 | Medium severity: annoying but recoverable. Covered by existing suite assertions and the manual checklist |
| **P4 — Monitor and accept** | R-06, R-11, R-16 | Low severity or low probability: documented, checked opportunistically, accepted as residual risk for a single-user desktop application |

P1 and P2 risks are executed on **every** change (they are in the automated suite or the mandatory manual checklist). P3 is executed before each sprint review. P4 is executed at release candidate time only.

---

## 6. Mitigations Implemented in the Code

Each high-priority risk has a corresponding defensive measure in the source, so the risk is reduced *and* tested:

| Risk | Mitigation in code | Location |
|------|--------------------|----------|
| R-02 / R-10 unsupported or oversized upload | `validate_upload(filename, content_type, size)` enforces an extension/content-type allow-list and `MAX_UPLOAD_BYTES = 10 * 1024 * 1024` (10 MB) before any bytes reach the recogniser | `backend/app/utils/audio_utils.py` |
| R-04 / R-13 / any service failure | The `DomainError` handler registered with `@app.exception_handler(DomainError)` maps `ValidationError → 422`, `NotFoundError → 404`, `UnsupportedMediaError → 415`, so every failure returns structured JSON the client can parse | `backend/app/main.py` |
| R-04 backend unavailable from the UI | `errorMessage()` in `frontend/src/services/api.js` normalises Axios failures (no response, network error, non-2xx body) into a single human-readable message used by every page | `frontend/src/services/api.js` |
| R-08 / R-14 network-dependent gTTS | Fallback engine chain in `tts_service.py`: requested engine → gTTS → pyttsx3, returning the engine actually used in the response so the UI can explain it | `backend/app/services/tts_service.py` |
| R-01 microphone permission | `MicrophoneButton.jsx` catches `getUserMedia` rejection and renders a permission-denied state with guidance instead of failing silently | `frontend/src/components/MicrophoneButton.jsx` |
| R-03 speech not recognised | `recorder.js` resamples captured audio to the sample rate the recogniser expects before upload; recogniser failure maps to a clean error, not a 500 | `frontend/src/utils/recorder.js`, `backend/app/services/stt_service.py` |
| R-05 invalid input | Shared `validate_text()` / `validate_language()` applied at both the router and the service boundary | `backend/app/utils/validators.py` |
| R-09 autoplay blocked | `AudioPlayer.jsx` renders an explicit play control so playback can always be triggered by a user gesture | `frontend/src/components/AudioPlayer.jsx` |
| R-12 stale audio files | `delete_audio()` invoked from `history_service.delete_record()` when a row is removed | `backend/app/utils/audio_utils.py`, `backend/app/services/history_service.py` |
| R-06 database failure | All access goes through the `get_db` dependency with a `try/finally` close, and `PRAGMA journal_mode=WAL` is not required because the app is single-user | `backend/app/database.py` |

---

## 7. Residual Risk

After mitigation and testing, the following risk remains and is accepted:

- **Real speech quality** (accuracy of recognition and naturalness of synthesis) depends on third-party services and on the user's microphone; it cannot be automated in CI and is verified only during acceptance testing.
- **pyttsx3 on non-Windows platforms** behaves differently (and may be unavailable); CI exercises the fallback with a patched engine rather than the real driver.
- **Frontend regressions** beyond compilation are caught only by the manual checklist, because the project has no frontend test framework. Adding Playwright coverage is recorded under Future Scope.

---

## 8. Summary

Risk-based testing in this project meant that the 38 automated tests and the manual checklist were not written in the order the features were built, but in the order of **severity** (probability × impact): recognition failure, backend unavailability, upload validation and microphone permission were covered first, and low-severity risks such as stale audio files or a missing ffmpeg binary were covered with a single opportunistic check. The register, matrix, severity rules and prioritisation table above are the working artefacts, and each P1/P2 risk is tied to a named mitigation in the source code.
