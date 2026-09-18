#!/usr/bin/env bash
set -e
export PATH="/home/linuxbrew/.linuxbrew/bin:/home/ambareign/.asdf/shims:/home/ambareign/.local/bin:/home/ambareign/.starkli/bin:$PATH"
cd "$(dirname "$0")"
echo "=== Directory: $(pwd) ==="
echo "=== Scarb Version ==="
scarb -V
echo "=== Building Contracts ==="
scarb build
