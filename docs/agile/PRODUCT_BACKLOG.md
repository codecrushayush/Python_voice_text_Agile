# Product Backlog

**Project:** Python Text-to-Speech, Speech-to-Text and Virtual Assistant
**Scrum Master:** Student developer (self-managed team of two)
**Status:** Final — all 30 backlog items are Done

The backlog holds the refined work items that were pulled into the four sprints of the
project. Items are ordered by sprint and then by delivery sequence. Every item carries a
priority (High, Medium or Low), a story point estimate on the scale {1, 2, 3, 5, 8} and the
sprint in which it was completed.

| ID | User Story | Feature | Priority | Story Points | Sprint | Status |
|----|------------|---------|----------|--------------|--------|--------|
| PB-01 | — (technical enabler) | Requirements baseline and `docs/agile/` artefacts (USER_STORIES, PRODUCT_BACKLOG, SPRINT_PLAN, KANBAN_BOARD) | High | 1 | Sprint 0 | Done |
| PB-02 | — (technical enabler) | Git repository, branch strategy (`main` / `develop` / `feature/*`) and backend/frontend/docs folder structure | High | 2 | Sprint 0 | Done |
| PB-03 | — (technical enabler) | SQLite `conversion_history` schema with SQLAlchemy model (`backend/app/database.py`, `backend/app/models/history.py`) | High | 2 | Sprint 0 | Done |
| PB-04 | — (technical enabler) | UI wireframes for Dashboard, TextToSpeech, SpeechToText, Assistant, History and Settings | Low | 1 | Sprint 0 | Done |
| PB-05 | — (technical enabler) | React 18 + Vite + Axios scaffold (`frontend/src/App.jsx`, `frontend/src/index.css`, `frontend/src/services/api.js`) | High | 1 | Sprint 0 | Done |
| PB-06 | — (technical enabler) | FastAPI skeleton with `GET /` and `GET /health` (`backend/app/main.py`) | High | 1 | Sprint 0 | Done |
| PB-07 | US-01 | TTS request/response schemas with 5000-character limit, language, engine and 80–300 wpm rate (`backend/app/schemas/tts.py`) | High | 2 | Sprint 1 | Done |
| PB-08 | US-01 | `POST /api/tts` implementation with the gTTS engine (`routers/tts.py`, `services/tts_service.py`) | High | 3 | Sprint 1 | Done |
| PB-09 | US-02 | pyttsx3 offline engine with speech-rate control | Low | 2 | Sprint 1 | Done |
| PB-10 | US-02 | `GET /api/tts/languages` language catalogue endpoint | Medium | 1 | Sprint 1 | Done |
| PB-11 | US-03 | Static audio storage in `backend/app/static/audio` with naming and cleanup helpers (`utils/audio_utils.py`) | High | 2 | Sprint 1 | Done |
| PB-12 | US-01 | TextToSpeech page: text area, character counter, language and engine selects, rate slider (`frontend/src/pages/TextToSpeech.jsx`) | High | 3 | Sprint 1 | Done |
| PB-13 | US-03 | Audio player component with play, pause and replay (`frontend/src/components/AudioPlayer.jsx`) | Medium | 2 | Sprint 1 | Done |
| PB-14 | US-03 | Download button for the generated speech file | Medium | 1 | Sprint 1 | Done |
| PB-15 | US-10 | Persistence of TTS output into `conversion_history` through `services/history_service.py` | Medium | 2 | Sprint 1 | Done |
| PB-16 | US-04 | Browser WAV recorder with elapsed-time and recording indicators (`frontend/src/utils/recorder.js`) | High | 3 | Sprint 2 | Done |
| PB-17 | US-04 | Microphone button with MediaDevices permission handling (`frontend/src/components/MicrophoneButton.jsx`) | High | 2 | Sprint 2 | Done |
| PB-18 | US-05 | `POST /api/stt` multipart endpoint using SpeechRecognition and pydub conversion (`routers/stt.py`, `services/stt_service.py`) | High | 3 | Sprint 2 | Done |
| PB-19 | US-05 | Upload validation: WAV/MP3/OGG/WebM/FLAC/M4A and 10 MB limit (`backend/app/utils/audio_utils.py`) | High | 2 | Sprint 2 | Done |
| PB-20 | US-06 | SpeechToText page with recognised text, copy, download `.txt` and reset (`frontend/src/pages/SpeechToText.jsx`) | Medium | 2 | Sprint 2 | Done |
| PB-21 | US-07 | Rule engine for the ten assistant commands plus `POST /api/assistant` and `GET /api/assistant/commands` | High | 3 | Sprint 2 | Done |
| PB-22 | US-07 | Assistant chat interface with timestamps, command chips, microphone input and spoken responses (`frontend/src/pages/Assistant.jsx`) | High | 2 | Sprint 2 | Done |
| PB-23 | US-10 | History API (`GET /api/history` with type/search/limit/offset, `DELETE /api/history/{id}`, `DELETE /api/history`) and History page with search, filter, clear all and `ConfirmationModal` | High | 3 | Sprint 2 | Done |
| PB-24 | US-13 | `GET /api/stats` statistics endpoint and Dashboard page with `StatCard`, quick actions and recent activity | Medium | 2 | Sprint 2 | Done |
| PB-25 | US-15 | Backend pytest suite of 38 tests (`conftest.py`, `test_health`, `test_tts`, `test_stt`, `test_assistant`, `test_history`, `test_validation`) | High | 5 | Sprint 3 | Done |
| PB-26 | US-15 | Refactoring of business logic into `services/` and `utils/` (`validators.py`, `audio_utils.py`, `exceptions.py`) | Medium | 3 | Sprint 3 | Done |
| PB-27 | US-14 | Dark mode, `SettingsContext.jsx` and the Settings page with `localStorage` persistence | Medium | 3 | Sprint 3 | Done |
| PB-28 | US-15 | Responsive collapsing `Sidebar`, `Topbar`, `Toast`, `EmptyState` and `ConfirmationModal` polish | Medium | 2 | Sprint 3 | Done |
| PB-29 | US-15 | GitHub Actions workflow running pytest and the frontend build (`.github/workflows/ci.yml`) | Medium | 2 | Sprint 3 | Done |
| PB-30 | US-14 | `README.md` with screenshots, API reference and final documentation review | Medium | 1 | Sprint 3 | Done |

---

## Backlog Refinement Notes

Refinement was performed in a weekly session held before each sprint planning meeting. The
Product Owner (the student developer acting for the end user) proposed items from the
stakeholder requirements; both developers then split, re-ordered and estimated them. The
following practices were applied:

- **Slicing.** Large items were split until each could be completed inside a sprint. For
  example, "Speech-to-Text" was sliced into the recorder (`PB-16`), the microphone button
  (`PB-17`), the multipart endpoint (`PB-18`), upload validation (`PB-19`) and the result
  page (`PB-20`), which is why no backlog item exceeds five points even though the
  corresponding user stories US-01 and US-04 are eight points.
- **INVEST criteria.** Every item was tested against the six qualities before it was
  accepted into a sprint:

  | Criterion | How it was applied in this project |
  |-----------|------------------------------------|
  | Independent | `PB-10` (`GET /api/tts/languages`) was kept separate from `PB-08` so the language catalogue could be delivered and demonstrated without the generation endpoint |
  | Negotiable | Items state the outcome (for example "upload validation for six formats and 10 MB") and leave the implementation detail of `backend/app/utils/audio_utils.py` open |
  | Valuable | Each item delivers observable user value; pure infrastructure items (`PB-03`, `PB-06`) are justified as enablers for the first valuable increment |
  | Estimable | All items were estimated with the team's shared reference stories, so no item remained unestimated |
  | Small | No item is larger than five points, guaranteeing completion inside a two-week sprint |
  | Testable | Each item carries acceptance criteria that were converted into the 38 pytest tests and into the manual checklist of the Sprint Review |

- **Definition of Ready.** An item was ready for sprint planning only when it had a
  priority, an estimate, at least two acceptance criteria and no dependency on an item
  still in the backlog.
- **Definition of Done.** An item was Done only when the code was merged, the affected
  pytest tests passed, the UI was verified in the browser, and the item appeared in the
  `README.md` or API documentation where relevant.
- **Prioritisation.** A MoSCoW-style ranking was used: core speech functionality and data
  integrity are High, supporting usability features are Medium, and optional refinements
  (`PB-04` wireframes, `PB-09` offline engine) are Low.

## Story Point Estimation

Estimation used planning poker with a Fibonacci-like scale of 1, 2, 3, 5 and 8. The gaps
between consecutive values deliberately widen, which stops the team from debating whether
an item is "four or five points" and forces agreement on the order of magnitude of the
effort. Effort covers analysis, backend code, frontend code, tests and documentation.

| Story Points | Meaning | Example in this project |
|--------------|---------|-------------------------|
| 1 | Trivial; a few hours, no design uncertainty | `GET /api/tts/languages` endpoint returning the supported language list (`PB-10`) |
| 2 | Small; roughly half a day to one day, one developer | Download button that saves the generated speech file (`PB-14`) |
| 3 | Medium; one to two days, touches both layers | TextToSpeech page with counter, selects and rate slider (`PB-12`) |
| 5 | Large; two to three days, several files and tests | Backend pytest suite covering all seven routers, 38 tests (`PB-25`) |
| 8 | Extra-large; three to five days, high uncertainty | Only used at user-story level: US-01 text-to-speech conversion and US-04 microphone transcription; refinement decomposed these into items of five points or fewer |

## Backlog Size Summary

| Sprint | Items | Story Points |
|--------|-------|--------------|
| Sprint 0 — Project Setup and Planning | 6 | 8 |
| Sprint 1 — Text-to-Speech | 9 | 18 |
| Sprint 2 — Speech-to-Text and Virtual Assistant | 9 | 22 |
| Sprint 3 — Testing and Finalization | 6 | 16 |
| **Total** | **30** | **64** |
