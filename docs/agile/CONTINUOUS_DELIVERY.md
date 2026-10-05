# Continuous Delivery (CD)

## 1. Introduction

Continuous Delivery is the practice of keeping the software in a permanently releasable state, so that any commit that passes the automated pipeline can be delivered to production safely, quickly and sustainably. It extends Continuous Integration: CI proves that the code *works*, CD proves that it can be *shipped* — with a repeatable, automated path from source control to a deployable artefact.

The distinction that matters for this document is between three often-confused terms:

| Attribute | CI | Continuous Delivery | Continuous Deployment |
|-----------|----|---------------------|----------------------|
| **Definition** | Merge frequently and verify every merge automatically | Every green build produces a releasable artefact; a human decides when to release | Every green build is released automatically, with no human decision |
| **What runs automatically** | Build + tests | Build + tests + packaging of a deployable artefact | Build + tests + packaging + deployment to production |
| **Human gate** | Merge approval | **Release approval** (deliberate, one click / one command) | None |
| **Artefact produced** | Status check (pass/fail) | Deployable artefact (e.g. `frontend/dist/`, installed backend) | Live production environment |
| **State of `main`** | Green, mergeable | Green, **releasable at any moment** | Green and already live |
| **Risk profile** | Low — nothing leaves the repository | Low — release timing is still a human choice | Higher — requires strong automated rollback |
| **Adopted here** | **Yes** | **Yes** | **No — listed under Future Scope** |

---

## 2. What Continuous Delivery Means for This Project

For *Python Text-to-Speech, Speech-to-Text and Virtual Assistant*, "releasable" has a concrete, checkable meaning:

1. The backend dependency set installs cleanly from `backend/requirements.txt` on a fresh interpreter (Python 3.13).
2. All **38 pytest tests pass** — health, TTS validation, STT uploads, assistant commands, history CRUD and statistics.
3. The frontend installs reproducibly with `npm ci` and compiles with `npm run build` into `frontend/dist/`.
4. No Critical or Major defect is open against the increment.
5. The run instructions in the README are accurate for a clean clone.

When `.github/workflows/ci.yml` reports both jobs green, conditions 1–3 are satisfied automatically for that exact commit. Conditions 4–5 are human checks performed at the sprint review. Together they mean that at any point the team could cut a release without additional preparation work — which is precisely the definition of continuous delivery.

It does **not** mean the application is continuously deployed to a server. Nobody pushes to a hosting provider automatically; no deployment webhook, container registry or cloud target is configured. The release decision remains with a human.

---

## 3. The Delivery Pipeline Stages

| # | Stage | Trigger | Activity | Artefact / evidence | Failure action |
|---|-------|---------|----------|---------------------|----------------|
| 1 | **Source** | Push or PR to `main` / `develop` | Code enters version control on a feature branch, then a PR into `develop` | Branch, commit history, PR with checklist | PR not opened until local checks pass |
| 2 | **Commit verification (CI)** | Push / PR | Job `backend-tests`: checkout, setup Python 3.13, `pip install -r requirements.txt`, `python -m pytest` | Green check on the commit; 38 tests passed | Merge blocked; fix pushed to the branch |
| 3 | **Build validation (CI)** | Push / PR | Job `frontend-build`: checkout, setup Node 20, `npm ci`, `npm run build` | Green check; `dist/` produced on the runner | Merge blocked; fix pushed to the branch |
| 4 | **Code review** | PR opened | Reviewer checks design, naming, tests, scope against the pull-request checklist | Approved PR, review comments resolved | Changes requested, new commits, CI re-runs |
| 5 | **Integration** | PR approved + CI green | Merge feature branch into `develop` | `develop` contains the increment | Revert commit if a defect is found later |
| 6 | **Release candidate** | End of sprint | Full regression (`python -m pytest`), manual AT scripts, README verification, `npm run build` to produce `dist/` | Signed-off Definition of Done, AT results, `dist/` | Sprint exit criteria not met; fix before review |
| 7 | **Release / delivery** | Human decision | Deploy: run backend with Uvicorn, serve `frontend/dist/` (or run the dev servers locally) | Working application available to the user | Roll back to the previous `dist/` and `main` commit |
| 8 | **Feedback** | Post-release | Sprint retrospective, defect log, risk register update | Updated `docs/agile/` documents | Fed into the next sprint plan |

Stages 2 and 3 are fully automated. Stages 4–6 are semi-automated (human decisions gated by automated evidence). Stages 7–8 are manual.

---

## 4. Release Readiness Checklist for this Project

| Item | Status | Evidence |
|------|--------|----------|
| Backend dependencies install cleanly | Done | `pip install -r requirements.txt` succeeds on Python 3.13; same command in CI step "Install backend dependencies" |
| All automated tests pass | Done | `python -m pytest` → **38 passed**; CI job `backend-tests` green |
| Frontend dependencies install reproducibly | Done | `npm ci` resolves exactly from `frontend/package-lock.json`; CI job `frontend-build` |
| Frontend production build succeeds | Done | `npm run build` → `frontend/dist/` emitted; CI step "Build frontend" green |
| All 10 API endpoints behave as documented | Done | `GET /health`, `POST /api/tts`, `GET /api/tts/languages`, `POST /api/stt`, `POST /api/assistant`, `GET /api/assistant/commands`, `GET /api/history`, `DELETE /api/history/{id}`, `DELETE /api/history`, `GET /api/stats` — covered by `backend/tests/` |
| Acceptance tests executed | Done | `docs/agile/ACCEPTANCE_TESTS.md` AT cases re-run at sprint review |
| No open Critical or Major defects | Done | Defect log empty of Critical/Major at Sprint 3 close |
| Definition of Done satisfied | Done | `docs/agile/DEFINITION_OF_DONE.md` checklist and US-01 evidence table |
| Run instructions verified from a clean clone | Done | README followed step by step on a fresh environment |
| Database schema created automatically on first run | Done | `backend/app/database.py` creates `conversion_history` if absent; no manual migration required |
| Configuration not hard-coded / no secrets in source | Done | `.env` ignored by `.gitignore`; no API keys committed |
| Version tagged in version control | Done | Tag applied on `main` at sprint end (e.g. `v1.0.0`) |
| Automatic deployment to a server | **Not configured** | Deliberate; see section 7 below and Future Scope |

---

## 5. Deployment Options

There is no single mandated hosting target for this project; three supported options exist, in increasing order of formality.

### 5.1 Option A — Local run (development / demonstration)

```bash
# terminal 1 — backend
cd backend
python -m venv .venv
.venv\Scripts\activate          # Windows; on macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload

# terminal 2 — frontend
cd frontend
npm ci
npm run dev
```

The Vite development server proxies `/api` and `/static` to the backend, so the application behaves as one system. This is the mode used for development and for sprint-review demonstrations.

### 5.2 Option B — Uvicorn production note

For a real deployment the development reloader should be disabled and a production-grade server configuration used:

```bash
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 1
```

Considerations recorded honestly for this codebase:

- `--reload` is a development feature (extra watcher process, higher memory, not safe for production).
- SQLite files (`backend/data/*.db`) do not tolerate multiple concurrent writers; the application is therefore architected for a **single worker**. Scaling to `--workers N` would require moving to PostgreSQL or another multi-writer database — a change isolated behind `history_service.py`, but a change nonetheless.
- Static audio under `backend/app/static/audio/` must be served and backed up alongside the database.
- A reverse proxy (nginx/Caddy) would handle TLS, compression and static caching in front of Uvicorn.

### 5.3 Option C — Static build served from `dist/`

```bash
cd frontend
npm run build        # produces frontend/dist/
```

`dist/` contains the compiled React application (HTML, JS, CSS assets). It can be served by any static file server — `npx serve dist`, nginx, GitHub Pages — provided the API base URL is configured to reach the backend. The backend remains a separate process exposing the 10 endpoints.

**Recommended demonstration path:** build `dist/` from a green CI commit, run Uvicorn for the API, and serve `dist/` — this exercises exactly the artefacts the delivery pipeline produced.

---

## 6. The Pipeline in Diagram Form

```text
  developer push
        │
        ▼
  ┌──────────────┐     ┌─────────────────────┐
  │  CI workflow │────▶│  backend-tests       │──▶ pytest (38)
  │  (auto)      │     │  frontend-build      │──▶ npm run build → dist/
  └──────────────┘     └──────────┬──────────┘
                                  │ both green
                                  ▼
                       ┌─────────────────────┐
                       │ Releasable artefact │
                       │ • source @ green SHA│
                       │ • dist/ build       │
                       │ • installed backend │
                       └──────────┬──────────┘
                                  │ HUMAN DECISION  ← the "delivery" gate
                                  ▼
                       ┌─────────────────────┐
                       │ Deploy / run        │
                       │ uvicorn + dist/     │
                       └──────────┬──────────┘
                                  ▼
                          user feedback ──▶ retro / backlog
```

---

## 7. Honest Statement

> **This project uses Continuous Delivery: every green CI run leaves a releasable build artifact (pytest suite green + frontend `dist/`). Automatic deployment to a server is NOT configured and is listed under Future Scope.**

Supporting detail:

- **What is automated:** dependency installation, the 38-test pytest suite, and the Vite production build — on every push and pull request to `main` and `develop`.
- **What is not automated:** pushing the built application to any host. There is no deployment job, no cloud credentials, no container registry, no release webhook.
- **What "delivery" therefore means here:** the *capability* to release exists and is verified continuously; the *act* of releasing is a deliberate human step taken after the Definition of Done is satisfied.
- **What would be needed for Continuous Deployment:** an additional CI/CD job gated on `main` only, deployment credentials stored as repository secrets, a hosting target (e.g. a container registry plus a platform such as Fly.io, Railway, AWS or Azure), health checks against `GET /health`, and an automated rollback path. This is scoped as Future Scope and was out of bounds for a locally demonstrated university submission.

---

## 8. Summary

| Question | Answer for this project |
|----------|-------------------------|
| Is every merge verified automatically? | Yes — pytest + Vite build on `main`/`develop` |
| Is the artefact of every green run releasable? | Yes — installed backend + `frontend/dist/` |
| Is the release decision automated? | No — human gate at the sprint review |
| Is deployment automated? | No — Future Scope |
| Classification | **Continuous Delivery** |
