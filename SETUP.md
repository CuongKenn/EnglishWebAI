# 🚀 Setup EnglishWebAI Development Environment

## Quick Start (1 command)

```bash
cd frontend && npm install
```

**That's it!** 🎉 Git hooks will be automatically configured.

---

## What happens automatically:

✅ `npm install` runs → `prepare` script → `husky` sets up hooks  
✅ `postinstall` script → Sets `git config core.hooksPath .husky`  
✅ Pre-commit hooks activated → Checks lint on every commit  

---

## Manual verification (optional)

```bash
# Verify hooks are configured
git config core.hooksPath
# Should output: .husky

# Test hooks work
git commit -m "test: verify hooks"
# Should run ESLint (frontend) + Ruff (backend)
```

---

## For Backend Development Only

```bash
cd backend
pip install -r requirements.txt
```

---

## Pre-commit Checks

When you commit (without `--no-verify`):

1. **Frontend ESLint** - Checks JavaScript/JSX code quality
2. **Backend Ruff** - Checks Python code quality  
3. **Commitlint** - Validates commit message format

### Commit Message Format

```
type(scope): description

Examples:
✅ feat: add user authentication
✅ fix: resolve login bug
✅ chore: update dependencies
✅ docs: update README
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

---

## Troubleshooting

### Hooks not running?
```bash
cd frontend && npm run prepare
git config core.hooksPath .husky
```

### Skip hooks temporarily (NOT recommended)
```bash
git commit --no-verify -m "message"
```

---

## Full Development Setup

### Prerequisites
- **Node.js** 20+ 
- **Python** 3.11+
- **PostgreSQL** (or use Docker)

### Using Docker (Recommended)
```bash
docker compose up -d
```

### Manual Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend
cd backend
pip install -r requirements.txt
python main.py
```

---

## Docker Services

- **Backend:** http://localhost:8000
- **Frontend:** http://localhost
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

---

**Need help?** Check the project documentation or ask the team! 💬
