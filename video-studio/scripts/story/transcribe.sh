#!/usr/bin/env bash
# Runs the Whisper transcriber, creating its Python environment on first use.
# Usage: npm run story:transcribe -- <project> [options]   (see transcribe.py)
set -euo pipefail
cd "$(dirname "$0")/../.."
if [ ! -x .venv/bin/python ]; then
  echo "→ first run: setting up Python environment for Whisper (one-off, ~1 min)…"
  python3 -m venv .venv
  .venv/bin/pip install -q --upgrade pip
  .venv/bin/pip install -q faster-whisper
fi
export HF_HOME="$PWD/.models"
exec .venv/bin/python scripts/story/transcribe.py "$@"
