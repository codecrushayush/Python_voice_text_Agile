# Version Control

## 1. Introduction

Version control is the practice of recording changes to files in a way that permits recovering any previous state, understanding who changed what and why, and allowing multiple lines of work to proceed in parallel without overwriting each other. This project uses **Git**, with **GitHub** as the remote host, and runs CI from the repository (`.github/workflows/ci.yml`).

---

## 2. Core Concepts

### 2.1 Repository

**Definition.** A repository (repo) is the complete store of a project's files together with the entire history of changes: every commit, every branch and every tag.

**In this project.** One monorepo contains both applications and all documentation:

```text
python-voice-project/
├── backend/            # FastAPI app, services, routers, models, schemas, utils, tests
├── frontend/           # React 18 + Vite app: pages, components, services, context, utils
├── docs/agile/         # 22 agile/practice documents
├── .github/workflows/  # ci.yml
├── README.md
└── requirements notes
```

A single repository was chosen deliberately: the backend and frontend change together in every story, and CI must be able to run both jobs from one checkout.

### 2.2 Commit

**Definition.** A commit is an immutable snapshot of the tracked files at a point in time, identified by a SHA hash, carrying a message, an author and a timestamp. Commits form a linked history: each commit records its parent, so the repository is a directed graph of states.

**In this project.** Commits are small and single-purpose — one per logical change (a feature, a fix, a test, a documentation update) — so that any commit can be reverted or inspected in isolation. Commits are never pushed with unrelated work bundled together.

### 2.3 Branch

**Definition.** A branch is a movable pointer to a commit, creating an independent line of development. Work can proceed on a branch without affecting the main line; the branch is merged when complete.

**In this project.** Seven branches were used: `main`, `develop`, and five (later six) `feature/*` branches — `feature/text-to-speech`, `feature/speech-to-text`, `feature/virtual-assistant`, `feature/history`, `feature/dashboard-ui`, `feature/testing-ci`. Each branch carries exactly one story-sized line of work.

### 2.4 Merge

**Definition.** A merge combines the histories of two branches, producing a commit that contains the changes from both. Conflicts arise when the same lines were changed on both sides and must be resolved by a person.

**In this project.** `feature/*` branches are merged into `develop`; at the end of each sprint `develop` is merged into `main`. Because branches are short-lived and scoped to one story, conflicts were rare; the only recurring conflict was in `frontend/src/services/api.js` when two feature branches both added a request helper, resolved by keeping the helpers in `api.js` and the page code separate.

### 2.5 Pull Request (PR)

**Definition.** A pull request is a request to merge one branch into another, accompanied by the proposed diff, discussion, review approval and automated check results. It is the unit of code review in GitHub-flow workflows.

**In this project.** Every feature branch opened a PR into `develop`. The PR body followed a fixed checklist (Section 6) and could not be merged until CI was green. Review was performed by a classmate for the branches noted in `XP.md`.

### 2.6 Main Branch

**Definition.** `main` represents the production state of the application — code that is releasable. It is protected: history is never rewritten and work is never committed directly to it.

**In this project.** `main` only ever receives merges from `develop`, and only after CI has passed. Every merge into `main` corresponds to a completed sprint increment (R0 → R3), and tags mark those points.

### 2.7 Feature Branch

**Definition.** A feature branch is a short-lived branch created from the integration branch for a single story or fix. It is isolated while work proceeds and merged promptly when the work is verified.

**In this project.** Pattern used:

```text
develop ──► feature/history ──► (commits, tests, green CI) ──► PR ──► develop
```

Naming convention: `feature/<kebab-case-scope>` — for example `feature/virtual-assistant`. Bug fixes use `fix/<scope>` where a branch is needed at all.

---

## 3. Branch Strategy

```text
main ─────────●────────●────────●────────●────────  (sprint releases, tags)
               \        \        \        \
                \        \        \        \
develop ──●──────●────────●────────●────────●──────  (integration line)
            \     \        \        \        \
             \     \        \        \        \
feature/text-to-speech ●●●●
feature/speech-to-text        ●●●●●●
feature/virtual-assistant            ●●●●●●
feature/history                             ●●●●
feature/dashboard-ui                             ●●●●●
feature/testing-ci                                     ●●●●●
```

### 3.1 Branch table

| Branch | Purpose | Merged Into | Status |
|--------|---------|-------------|--------|
| `main` | Production / releasable state; sprint releases R0–R3 | — (protected, never merged into) | Active — current release |
| `develop` | Integration line where completed stories accumulate between sprints | `main` (end of each sprint) | Active — default working target |
| `feature/text-to-speech` | Sprint 1: `POST /api/tts`, `GET /api/tts/languages`, `tts_service.py`, `TextToSpeech.jsx` | `develop` | Merged |
| `feature/speech-to-text` | Sprint 2: `POST /api/stt`, `stt_service.py`, `audio_utils.py`, `SpeechToText.jsx`, recorder | `develop` | Merged |
| `feature/virtual-assistant` | Sprint 2: `POST /api/assistant`, `GET /api/assistant/commands`, `assistant_service.py`, `Assistant.jsx` | `develop` | Merged |
| `feature/history` | Sprint 2: `GET /api/history`, `DELETE /api/history/{id}`, `DELETE /api/history`, `history_service.py`, `History.jsx` | `develop` | Merged |
| `feature/dashboard-ui` | Sprint 3: `GET /api/stats`, `Dashboard.jsx`, `Settings.jsx`, theme context, shared components | `develop` | Merged |
| `feature/testing-ci` | Sprint 3: `backend/tests/*`, `conftest.py`, `.github/workflows/ci.yml`, documentation | `develop` | Merged |

**Rules enforced**

1. No direct commits to `main`.
2. Feature branches branch from the latest `develop` and are merged back into `develop`.
3. A branch is merged only when `python -m pytest` and `npm run build` are green locally and CI is green on the PR.
4. Branches are deleted after merging, so the branch list reflects only live work.

---

## 4. Commit Message Convention

Commits follow **Conventional Commits**: `<type>: <lowercase imperative summary>`.

| Type | Meaning | Used in this project for |
|------|---------|--------------------------|
| `feat` | A new user-visible capability | New endpoints, new pages, new components |
| `fix` | A defect correction | Validation bugs, wrong status codes, UI errors |
| `test` | Adding or correcting tests | New pytest cases, fixture changes |
| `docs` | Documentation only | `docs/agile/*`, README updates |
| `refactor` | Structural change with no behaviour change | Service extraction, component extraction, renames |
| `chore` | Maintenance with no user impact | Dependency pinning, `.gitignore`, CI tweaks |

An optional scope in parentheses may follow the type (`feat(tts): …`). The body, where present, explains *why* rather than *what*.

**Exact example commits used in this project:**

```text
feat: add text to speech conversion
feat: add speech recognition
feat: add virtual assistant commands
fix: validate unsupported audio files
test: add history API test
docs: add sprint plan
refactor: move speech logic to service
```

### 4.1 Example commit log

| Commit | Type | Files touched | Sprint |
|--------|------|---------------|--------|
| `feat: add text to speech conversion` | feat | `routers/tts.py`, `services/tts_service.py`, `schemas/`, `pages/TextToSpeech.jsx` | Sprint 1 |
| `feat: add speech recognition` | feat | `routers/stt.py`, `services/stt_service.py`, `pages/SpeechToText.jsx` | Sprint 2 |
| `feat: add virtual assistant commands` | feat | `routers/assistant.py`, `services/assistant_service.py`, `pages/Assistant.jsx` | Sprint 2 |
| `fix: validate unsupported audio files` | fix | `utils/audio_utils.py`, `routers/stt.py` | Sprint 2 |
| `test: add history API test` | test | `tests/test_history.py` | Sprint 3 |
| `docs: add sprint plan` | docs | `docs/agile/SPRINT_PLAN.md` | Sprint 0 |
| `refactor: move speech logic to service` | refactor | `routers/tts.py`, `routers/stt.py`, `services/tts_service.py`, `services/stt_service.py` | Sprint 3 |
| `feat: store conversion history` | feat | `models/history.py`, `services/history_service.py`, `database.py` | Sprint 1 |
| `feat: add dashboard statistics endpoint` | feat | `routers/history.py`, `services/history_service.py`, `pages/Dashboard.jsx` | Sprint 3 |
| `fix: return 404 for missing history record` | fix | `services/history_service.py`, `tests/test_history.py` | Sprint 3 |
| `refactor: extract shared text validators` | refactor | `utils/validators.py`, `routers/tts.py`, `routers/stt.py`, `routers/assistant.py` | Sprint 3 |
| `chore: add GitHub Actions CI workflow` | chore | `.github/workflows/ci.yml` | Sprint 3 |
| `feat: switch light and dark theme` | feat | `context/SettingsContext.jsx`, `pages/Settings.jsx`, `components/Sidebar.jsx` | Sprint 3 |
| `test: add assistant command tests` | test | `tests/test_assistant.py`, `tests/conftest.py` | Sprint 3 |
| `docs: add acceptance test suite` | docs | `docs/agile/ACCEPTANCE_TESTS.md` | Sprint 3 |

---

## 5. Pull Request Checklist

Every PR into `develop` (and each promotion into `main`) was required to satisfy:

- [ ] **Title** follows the commit convention — e.g. `feat: add virtual assistant commands`.
- [ ] **Description** states what changed and why, in prose; includes the motivating problem for `fix:`/`refactor:` PRs.
- [ ] **Linked user story** — the PR references `US-xx` and/or the feature ID (`F-xx`) from `docs/agile/`.
- [ ] **Tests added** — new behaviour has new tests; a bug fix has a regression test that fails without the fix.
- [ ] **CI green** — both jobs (`backend-tests`, `frontend-build`) pass on the PR head commit.
- [ ] **Local checks run** — `python -m pytest` reports 38 passed and `npm run build` succeeds on the author's machine.
- [ ] **Reviewer** assigned; at least one approval for shared modules (`services/`, `utils/validators.py`).
- [ ] **Scope contained** — no unrelated files, no formatting-only changes mixed with logic changes.
- [ ] **Documentation updated** where behaviour, endpoints or setup changed.

---

## 6. What `.gitignore` Excludes

Version control tracks *source*, not *artefacts*, *environments* or *secrets*. The following are excluded:

| Ignored path | Why |
|--------------|-----|
| `node_modules/` | Third-party JavaScript packages; fully recoverable from `package-lock.json` via `npm ci` |
| `dist/` | Vite production build output — a build artefact regenerated by `npm run build` |
| `.venv/` | Python virtual environment; platform-specific binaries, recoverable from `requirements.txt` |
| `backend/data/*.db` | The SQLite database — user data, not source. Committing it would produce constant merge conflicts |
| `backend/app/static/audio/*` | Generated MP3/WAV files — runtime output, potentially large, regenerated on demand |
| `__pycache__/`, `*.pyc` | Python bytecode cache — regenerated automatically |
| `.env` | Environment variables and any secrets — must never be committed (see Section 7) |

Also excluded, by convention: `.pytest_cache/`, `.vite/`, editor metadata (`.vscode/`, `.idea/`), and OS files (`Thumbs.db`, `.DS_Store`).

**Why this matters.** Committing `node_modules/` or `dist/` would bloat the repository, slow every clone and create pointless conflicts. Committing `backend/data/*.db` would leak whatever a tester typed into the application and would conflict whenever two branches added rows. Committing `.env` would leak secrets permanently — even a later deletion leaves the value in history.

---

## 7. Why Secrets Are Never Committed

**Principle.** Credentials, API keys and tokens belong in the environment (or a secret manager), never in source control.

**Why it is irreversible once committed.** Git history is append-only in normal use. A secret committed on one branch and "removed" in the next still exists in the earlier commit, reachable by anyone who clones the repository; removing it requires rewriting history (`git filter-repo`) and force-pushing, invalidating every fork and clone. GitHub also scans pushed history for known token formats and will revoke exposed credentials automatically — which is disruptive precisely when it happens.

**How this project complies**

1. `.env` is listed in `.gitignore`, so it cannot be staged accidentally.
2. No secret was required: the application uses no paid API keys. gTTS needs no key; pyttsx3, SpeechRecognition, FastAPI, SQLAlchemy and SQLite are all keyless for this use case. That absence was a deliberate design choice — using a keyless stack removed an entire class of secret-management risk.
3. Configuration that *is* environment-dependent (engine choice, ports, paths) is read through configuration variables with safe defaults, not hard-coded credentials.
4. GitHub Actions runs only the supplied commands (`pip install`, `pytest`, `npm ci`, `npm run build`) and requires **no repository secrets** — the pipeline cannot leak what it never holds.
5. The pull request checklist includes an explicit check that no credential, token or personal path has been introduced.

**If a secret were ever needed** (for example a hosted deployment token in Future Scope): it would be stored as a GitHub Actions *repository secret* referenced as `${{ secrets.NAME }}`, never written into `ci.yml`, never echoed in logs, and rotated immediately if exposed.

---

## 8. Summary

| Concept | Realisation in this project |
|---------|----------------------------|
| Repository | Single monorepo: `backend/`, `frontend/`, `docs/agile/`, `.github/workflows/` |
| Commit | Small, single-purpose, Conventional Commits messages |
| Branch | `main`, `develop`, and six `feature/*` branches |
| Merge | Feature → `develop` per story; `develop` → `main` per sprint |
| Pull request | Checklist-gated, CI-green requirement, reviewer approval |
| Main branch | Protected, only receives sprint merges |
| Feature branch | `feature/<scope>`, one story per branch, deleted after merge |
| Ignore rules | `node_modules`, `dist`, `.venv`, `backend/data/*.db`, `backend/app/static/audio/*`, `__pycache__`, `.env` |
| Secrets | Never committed; keyless stack means none are required today |
