# Backend Code Quality Tools

## Quick Start

### Install linting tools:
```bash
cd backend
pip install ruff black mypy
```

Or install all dependencies:
```bash
pip install -r requirements.txt
```

## Available Commands

### Using Makefile (Recommended):
```bash
make lint      # Check code quality
make format    # Auto-format code
make fix       # Auto-fix linting issues
make check     # Run all checks (lint + type)
make test      # Run tests
```

### Manual Commands:

#### Ruff (Linter - like ESLint for Python)
```bash
# Check all files
ruff check .

# Auto-fix issues
ruff check --fix .

# Check specific file
ruff check app/main.py

# Format code (alternative to Black)
ruff format .
```

#### Black (Code Formatter - like Prettier)
```bash
# Format all files
black .

# Check without modifying
black --check .

# Format specific file
black app/main.py
```

#### MyPy (Type Checker)
```bash
# Check types
mypy app --ignore-missing-imports
```

## VS Code Integration

Add to `.vscode/settings.json`:
```json
{
  "[python]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.codeActionsOnSave": {
      "source.fixAll": "explicit",
      "source.organizeImports": "explicit"
    }
  },
  "python.linting.enabled": true,
  "python.linting.ruffEnabled": true,
  "ruff.lint.args": ["--config=pyproject.toml"]
}
```

## Configuration

Configuration is in `pyproject.toml`. Key settings:

- **Line length**: 120 characters (matching Black)
- **Target Python**: 3.11+
- **Rules enabled**: 
  - E/W: pycodestyle (style issues)
  - F: Pyflakes (logical errors)
  - I: isort (import sorting)
  - N: pep8-naming (naming conventions)
  - UP: pyupgrade (modern Python syntax)
  - B: flake8-bugbear (common bugs)
  - And more...

## Pre-commit Hook

The pre-commit hook automatically runs:
1. Frontend ESLint check
2. Backend Ruff check

To bypass (not recommended):
```bash
git commit --no-verify
```

## Common Issues

### Import order
Ruff will automatically fix import order with:
```bash
ruff check --select I --fix .
```

### Line too long
Black will handle this automatically:
```bash
black .
```

### Unused imports/variables
Ruff can auto-remove:
```bash
ruff check --fix .
```
