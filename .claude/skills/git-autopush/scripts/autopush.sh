#!/usr/bin/env bash
# Commit + push en un paso. Cada argumento es un párrafo del mensaje de commit.
# Uso: bash autopush.sh "tipo(ámbito): resumen" ["cuerpo"] ["Co-Authored-By: ..."]
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Uso: autopush.sh \"tipo(ámbito): resumen\" [párrafos...]" >&2
  exit 2
fi

cd "$(git rev-parse --show-toplevel)"
# symbolic-ref funciona también en un repo recién creado (rama sin commits)
branch="$(git symbolic-ref --short HEAD 2>/dev/null || git rev-parse --abbrev-ref HEAD)"

git add -A

if git diff --cached --quiet; then
  echo "Sin cambios nuevos para commitear."
else
  sensitive="$(git diff --cached --name-only | grep -Ei '(^|/)(\.env(\..*)?|.*\.pem|.*\.key|id_rsa.*|credentials.*)$' || true)"
  if [ -n "$sensitive" ]; then
    echo "ABORTADO: archivos sensibles en el stage:" >&2
    echo "$sensitive" >&2
    git reset -q
    exit 1
  fi
  args=()
  for p in "$@"; do args+=(-m "$p"); done
  git commit -q "${args[@]}"
fi

push() {
  if git rev-parse --abbrev-ref --symbolic-full-name '@{u}' >/dev/null 2>&1; then
    git push -q origin "$branch"
  else
    git push -q -u origin "$branch"
  fi
}

if ! push 2>/dev/null; then
  echo "Push rechazado; integrando cambios remotos (pull --rebase)..."
  git pull -q --rebase origin "$branch"
  push
fi

git log -1 --format='✔ %h %s'
echo "→ $(git remote get-url origin) [$branch]"
