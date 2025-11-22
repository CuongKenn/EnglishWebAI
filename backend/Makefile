.PHONY: help lint format check test install

help:
	@echo "Available commands:"
	@echo "  make install    - Install all dependencies"
	@echo "  make lint       - Run ruff linter"
	@echo "  make format     - Format code with black and ruff"
	@echo "  make check      - Run all checks (lint + type check)"
	@echo "  make test       - Run pytest"
	@echo "  make fix        - Auto-fix linting issues"

install:
	pip install -r requirements.txt

lint:
	@echo "Running ruff linter..."
	ruff check .

format:
	@echo "Formatting with black..."
	black .
	@echo "Sorting imports with ruff..."
	ruff check --select I --fix .

check: lint
	@echo "Running type checks with mypy..."
	mypy app --ignore-missing-imports

test:
	@echo "Running tests..."
	pytest

fix:
	@echo "Auto-fixing linting issues..."
	ruff check --fix .
	black .
