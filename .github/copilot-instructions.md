## Copilot / AI Agent Instructions for EnglishWebAI

Purpose: help AI coding agents become productive quickly by highlighting the project's architecture, startup & test workflows, conventions, and examples of common edits.

- Stack & big-picture
  - Backend: FastAPI application in `backend/` (entry: `backend/main.py`). Uses SQLAlchemy + Alembic for DB migrations. Settings live in `backend/app/core/config.py` (reads `.env`).
  - Frontend: React + Vite app in `frontend/` (entry: `frontend/src/main.jsx`). `package.json` scripts: `dev`, `build`, `lint`, `preview`.
  - Data: `media/` contains uploaded media; `backend` seeds sample data on startup when DB empty (`app.utils.seed`).

- How the backend starts (developer/devflow)
  - Run locally: use `uvicorn` pointing at `backend/main.py` or `python backend/main.py` (the `if __name__ == '__main__'` section configures `uvicorn.Server`). Environment variables are loaded from `.env` via pydantic-settings + python-dotenv.
  - Key runtime settings are in `backend/app/core/config.py` (API prefix `API_PREFIX`, `OPENAI_API_KEY`, etc.). When making changes that affect environment names or API_PREFIX, update both backend and any frontend API calls.

- Tests & quick commands
  - Backend tests use pytest (see `backend/tests/` and top-level `tests/`). Install Python deps from `backend/requirements.txt` then run `pytest -q` from the `backend/` folder or repo root (prefixed with correct PYTHONPATH if needed).
  - Frontend development: `cd frontend && npm install` then `npm run dev`.

- Conventions and patterns to follow
  - API prefix: most routers are included with `settings.API_PREFIX` (`/api/v1` by default). Use `app.include_router(..., prefix=f"{settings.API_PREFIX}/...")` when adding new routers.
  - Models: SQLAlchemy models live under `backend/app/models/`. `backend/main.py` imports `*` from `app.models` to register metadata — don't remove that import unless you know the side-effects.
  - DB lifecycle: the app attempts lightweight schema ensure/auto-migration at startup (`app.utils.db_migrations.ensure_schema`) and may auto-seed data (`app.utils.seed.seed_users`, `seed_courses`). If adding/renaming fields, create Alembic migration under `backend/alembic/versions/`.
  - Environment: `backend/app/core/config.py` uses `pydantic-settings` and `.env`. New config keys should be added to Settings with sensible defaults.

- AI/Integration specifics
  - OpenAI: environment var `OPENAI_API_KEY` and `OPENAI_MODEL` used. Look at `backend/app/routers/ai_*` and `backend/app/services/` for usage patterns and request/response shapes.
  - Azure Speech: `AZURE_SPEECH_KEY` and `AZURE_SPEECH_REGION` are used for speech features (check `app/routers/ai_listening` and pronunciation-related services).

- Common developer tasks & examples
  - Add a new API route: create a new router under `backend/app/routers/`, export a `router` object, then include it in `backend/main.py` using the existing include_router pattern and `settings.API_PREFIX` if appropriate.
    - Example: `app.include_router(new_router.router, prefix=f"{settings.API_PREFIX}/myfeature", tags=["MyFeature"])`
  - Add a model + migration: add model to `backend/app/models/`, then run `alembic revision --autogenerate -m "msg"` and place it under `backend/alembic/versions/`. Keep model imports reachable so `Base.metadata` registers them.
  - Seed data: see `backend/app/utils/seed.py` for how seed functions are written. Use the `seed_*` functions pattern and call from scripts or startup.

- File references (good starting points)
  - Backend entry: `backend/main.py`
  - Config: `backend/app/core/config.py`
  - Database wiring: `backend/app/core/database.py`
  - Alembic migrations: `backend/alembic/versions/` (create version files here)
  - Seed / migrations helpers: `backend/app/utils/seed.py`, `backend/app/utils/db_migrations.py`
  - AI endpoints: `backend/app/routers/ai_*` and `backend/app/services/` for implementations

- Safety and ops notes
  - Database: production likely uses Postgres (`psycopg2-binary` present). Locally a SQLite fallback may be used; migrations are controlled by Alembic. Avoid dropping/recreating tables in migrations without a stated migration plan.
  - Secrets: do not hard-code `OPENAI_API_KEY`, `SECRET_KEY`, or SMTP credentials—use `.env` or CI secrets.

- What to ask the human developer if unsure
  - Which DB (local vs prod) and credentials to use for integration tests? Provide `.env.example` or instructions.
  - Any specific linting or formatting rules beyond the repo defaults (prettier/eslint/tailwind)?

If any section is unclear or you'd like me to expand examples (e.g., creating a new Alembic revision, adding a unit test for an AI route), tell me which area and I'll iterate.
