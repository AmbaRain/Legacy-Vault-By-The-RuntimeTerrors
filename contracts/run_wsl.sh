#!/usr/bin/env bash
set -e
export PATH="/home/linuxbrew/.linuxbrew/bin:$HOME/.asdf/shims:$HOME/.local/bin:$HOME/.starkli/bin:$PATH"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
"$@"
