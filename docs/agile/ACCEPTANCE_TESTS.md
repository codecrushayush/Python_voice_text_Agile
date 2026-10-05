# Acceptance Tests

## Introduction

Acceptance testing is the final verification activity in which the increment is exercised as a *user* would use it, rather than as a developer inspects it. Each test is written in **Given/When/Then** form: *Given* the starting state of the system and the actor's context, *When* the actor performs a single user-visible action, *Then* the observable outcome must match the agreed acceptance criterion of the user story it belongs to. A test passes only when the behaviour is observed in the running application (FastAPI backend on `http://127.0.0.1:8000` plus the React frontend on `http://localhost:5173`) — not by reading the source.

These tests were executed by the Product Owner accountability at each Sprint Review and re-executed as a full regression pass in Sprint 3. They are complementary to, not a replacement for, the 38 automated pytest tests in `backend/tests/`: the automated suite proves the code is correct, while acceptance tests prove the *product* satisfies the customer.

## Test Environment

| Item | Configuration |
|---|---|
| Operating system | Windows 11 (x64) |
| Backend runtime | Python 3.13, FastAPI, Uvicorn dev server (`uvicorn app.main:app --reload`, port 8000) |
| Database | SQLite via SQLAlchemy, table `conversion_history` |
| Frontend runtime | Node 22, React 18, Vite dev server (port 5173), Axios |
| Browser | Google Chrome (latest), using the Web Speech / MediaRecorder APIs for microphone tests |
| Automated tests | pytest — 7 test files, 38 tests, all passing |
| Audio tooling | gTTS, pyttsx3, SpeechRecognition, pydub (ffmpeg required for MP3 decode) |
| CI | `.github/workflows/ci.yml` — runs pytest and `npm run build` on every push |
| Test data | Short English/Chinese/Hindi strings for TTS; WAV and MP3 samples for upload; a file > 10 MB for the limit test |

## Acceptance Test Register

| Test ID | User Story | Steps | Expected Result | Status |
|---|---|---|---|---|
| AT-01 | US-03 TTS synthesis | 1. Open the TextToSpeech page.<br>2. Enter `Hello, this is a voice test.`<br>3. Click **Convert to Speech**.<br>4. Wait for the response. | `POST /api/tts` returns 200; an `AudioPlayer` appears with a playable MP3; the request is stored in `conversion_history` with `type = tts`. | Pass |
| AT-02 | US-03 TTS synthesis | 1. Open the TextToSpeech page.<br>2. Leave the text area empty.<br>3. Click **Convert to Speech**. | The request is rejected with HTTP 422 `ValidationError` from `backend/app/utils/validators.py`; the UI shows an inline "text is required" error; no audio is produced and no history row is created. | Pass |
| AT-03 | US-03 TTS synthesis | 1. Paste a string of 5001 characters into the text area.<br>2. Click **Convert to Speech**. | HTTP 422 `ValidationError` (text exceeds the 5000-character limit); the error message names the limit; no history row is created. | Pass |
| AT-04 | US-04 Language selection | 1. Open the TextToSpeech page.<br>2. Select **Hindi (hi)** from the language dropdown populated by `GET /api/tts/languages`.<br>3. Enter `नमस्ते दुनिया` and convert. | The dropdown lists at least the languages exposed by `GET /api/tts/languages`; the returned audio is synthesised in the selected language and plays back with the correct pronunciation. | Pass |
| AT-05 | US-05 Speech rate | 1. Open the TextToSpeech page.<br>2. Move the rate slider from 1.0 to 1.5.<br>3. Convert a sample sentence.<br>4. Repeat with rate 0.75. | The rate parameter is forwarded to the engine; the 1.5 sample is audibly faster and the 0.75 sample audibly slower than the 1.0 baseline; no error is raised. | Pass |
| AT-06 | US-05 Replay and download | 1. After AT-01 completes, press **Play** on the `AudioPlayer`.<br>2. Pause, then play again.<br>3. Click the **Download** button. | Audio replays from the start without a second API call; pause/resume works; the browser downloads a valid `.mp3` file that opens in a media player. | Pass |
| AT-07 | US-06 Microphone recording | 1. Open the SpeechToText page.<br>2. Allow microphone access.<br>3. Press the `MicrophoneButton`, speak `turn on the lights` for about three seconds, and press stop.<br>4. Click **Convert to Text**. | The browser records a WAV/WEBM stream via `frontend/src/utils/recorder.js`, `POST /api/stt` receives the multipart file, and the recognised transcript appears in the transcript box; a row with `type = stt` is written to `conversion_history`. | Pass |
| AT-08 | US-06 Microphone recording | 1. Open the SpeechToText page.<br>2. Start a recording.<br>3. Observe the record indicator and the elapsed-time counter for 5 seconds. | A pulsing recording indicator is visible while capture is active and disappears on stop; the timer counts up in seconds from `00:00` and matches the actual elapsed time within one second. | Pass |
| AT-09 | US-06 Microphone recording | 1. Block the microphone for the site (Chrome site settings → Microphone → Block).<br>2. Open the SpeechToText page and press record. | `recorder.js` catches the `NotAllowedError` from `getUserMedia` and the UI shows a friendly permission message instead of a raw exception; the page does not crash and no upload is attempted. | Pass |
| AT-10 | US-07 File upload | 1. Open the SpeechToText page.<br>2. Choose **Upload audio file** and select a valid `.wav` sample under 10 MB.<br>3. Submit the file. | `POST /api/stt` accepts the multipart upload, the transcript is returned and displayed, and a `stt` history row is created. | Pass |
| AT-11 | US-07 Upload validation | 1. Upload a file with an unsupported extension (e.g. `notes.txt` or `image.png`).<br>2. Submit. | `validate_upload` in `backend/app/utils/audio_utils.py` rejects the request with HTTP 400/422 naming the allowed extensions; no transcript is returned and no history row is created. | Pass |
| AT-12 | US-07 Upload validation | 1. Upload a zero-byte audio file (`empty.wav`).<br>2. Submit. | The upload is rejected with a clear "file is empty" validation error; no recognition is attempted. | Pass |
| AT-13 | US-07 Upload validation | 1. Upload an audio file of approximately 12 MB.<br>2. Submit. | `backend/app/utils/audio_utils.py` enforces the 10 MB limit and rejects the request with an explicit "file too large (max 10 MB)" error; the UI surfaces the same message via `errorMessage()`. | Pass |
| AT-14 | US-08 Transcript export | 1. After a successful conversion, click **Copy text**.<br>2. Paste into Notepad to verify.<br>3. Click **Download .txt**. | The transcript is copied to the clipboard and a `.txt` file containing exactly the transcript is downloaded. | Pass |
| AT-15 | US-08 Reset transcript | 1. With a transcript present, click **Reset**. | The transcript box, timer and selected file are cleared; the page returns to its initial empty state; previously saved history rows are unaffected. | Pass |
| AT-16 | US-09 Assistant commands | 1. Open the Assistant page.<br>2. Type `hello` and send. | `POST /api/assistant` returns a greeting response from the `hello/hi` handler in `backend/app/services/assistant_service.py`; the reply is shown in the chat pane and logged with `type = assistant`. | Pass |
| AT-17 | US-09 Assistant commands | 1. Type `what time is it` and send. | The response contains the current system time in `HH:MM` format, matching the machine clock. | Pass |
| AT-18 | US-09 Assistant commands | 1. Type `what is today's date` and send. | The response contains today's date in a readable format and matches the system date. | Pass |
| AT-19 | US-09 Assistant commands | 1. Type `open Google` and send. | The assistant returns a confirmation and the frontend opens `https://www.google.com` in a new browser tab; no error toast is raised. | Pass |
| AT-20 | US-09 Assistant commands | 1. Type `search Google for python fastapi` and send. | The assistant extracts the query and the browser opens `https://www.google.com/search?q=python+fastapi` in a new tab; the full spoken command is stored in `conversion_history.input_text`. | Pass |
| AT-21 | US-10 Assistant utility commands | 1. Type `help` and send.<br>2. Type `about application` and send.<br>3. Type `clear` and send. | `help` lists all supported commands (matching `GET /api/assistant/commands`); `about application` describes the Python TTS/STT/virtual-assistant system; `clear` empties the chat pane. All three are handled by their dedicated handlers, none falls through to the fallback. | Pass |
| AT-22 | US-10 Assistant fallback | 1. Type `do something random` (an unrecognised phrase) and send. | The rule engine finds no match and returns the friendly unknown-command response that lists examples; HTTP 200 is still returned; an `assistant` history row records the raw input. | Pass |
| AT-23 | US-11 Voice input for assistant | 1. Press the microphone button in the chat input.<br>2. Say `what time is it`.<br>3. Send the captured text. | The speech is transcribed and placed into the input box; submitting it yields the same time response as AT-17. | Pass |
| AT-24 | US-11 Spoken responses | 1. Enable **Speak response** in the Assistant settings.<br>2. Send `hello`. | The text response is also synthesised through the TTS engine and played aloud; the text response still appears in the chat pane. | Pass |
| AT-25 | US-12 History listing | 1. Generate at least one TTS, one STT and one assistant entry.<br>2. Open the History page.<br>3. Scroll / page with the `limit` and `offset` controls. | `GET /api/history` returns the records ordered newest first with their `type`, `input_text`, `output_text` and `created_at`; pagination respects `limit`/`offset`. | Pass |
| AT-26 | US-13 History search and filter | 1. On the History page, type `google` into the search box and submit.<br>2. Clear the search, then select **tts** in the type filter.<br>3. Select **assistant**, then **stt**. | `GET /api/history?search=google` matches `input_text` and `output_text` and returns only matching rows; `GET /api/history?type=tts` (and `stt`, `assistant`) returns only rows of that type; the `EmptyState` component appears when no row matches. | Pass |
| AT-27 | US-13 History deletion | 1. On the History page, click the delete icon on one row and confirm in the `ConfirmationModal`.<br>2. Call `DELETE /api/history/99999` for an id that does not exist.<br>3. Click **Clear all**, confirm, and reload the page. | Step 1 removes exactly that row and it disappears from the list after refresh; step 2 returns HTTP 404 `NotFoundError`; step 3 empties the table and `GET /api/history` returns an empty array while `GET /api/stats` counters drop to zero. | Pass |
| AT-28 | US-14 Dashboard and settings persistence | 1. Open the Dashboard and read the `StatCard` values.<br>2. Click a quick-action card.<br>3. Toggle dark mode in Settings, then reload the page.<br>4. Change the default language/rate in Settings and reload. | The stat cards match `GET /api/stats` (total conversions and counts per `type`); the quick-action card navigates to the correct page (TextToSpeech / SpeechToText / Assistant); the dark-mode theme and audio defaults survive a refresh because they are stored under the `localStorage` key `voicesuite.settings.v1` by `SettingsContext.jsx`. | Pass |
| AT-29 | US-15 Responsive layout | 1. Resize the browser window to 400 px wide (or open Chrome DevTools device mode).<br>2. Observe the `Sidebar`.<br>3. Open and close the navigation. | The sidebar collapses under the 860 px breakpoint into a hamburger-triggered drawer; the Topbar, forms and tables reflow without horizontal scrolling; navigating to each of the six pages renders correctly at mobile width. | Pass |
| AT-30 | US-15 Error handling | 1. Stop the Uvicorn backend.<br>2. Keep the frontend running and perform any action (e.g. load the Dashboard or convert text).<br>3. Restart the backend and retry the action. | `errorMessage()` in `frontend/src/services/api.js` produces the message *"Cannot reach the backend server..."* in a `Toast`; the UI does not white-screen or throw an unhandled promise rejection; after the backend restarts, the same action succeeds without a page reload. | Pass |

## Coverage Summary

| Area | Test IDs | Count | User stories covered |
|---|---|---|---|
| Text-to-Speech | AT-01 – AT-06 | 6 | US-03, US-04, US-05 |
| Speech-to-Text | AT-07 – AT-15 | 9 | US-06, US-07, US-08 |
| Rule-based Virtual Assistant | AT-16 – AT-24 | 9 | US-09, US-10, US-11 |
| History | AT-25 – AT-27 | 3 | US-12, US-13 |
| Dashboard, Settings and UX | AT-28 – AT-30 | 3 | US-14, US-15 |
| **Total** | **AT-01 – AT-30** | **30** | **US-01 – US-15 (setup and API rows verified through their dependent stories)** |

## Acceptance Sign-off

| Sprint | Tests executed | Result |
|---|---|---|
| Sprint 1 Review | AT-01 – AT-06 | All Pass; feedback created the Settings backlog item |
| Sprint 2 Review | AT-07 – AT-27 (partial) | All Pass; feedback created the history type-filter item |
| Sprint 3 Regression | AT-01 – AT-30 | All Pass; `pytest` 38 passed, `npm run build` succeeded |

**Sign-off statement:** the Product Owner accountability accepts the Sprint 3 increment as meeting every acceptance criterion listed above. Total: **30 acceptance tests executed, 30 Pass, 0 Fail, 0 Blocked.**
