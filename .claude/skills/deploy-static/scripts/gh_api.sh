#!/usr/bin/env bash
# Llama a la API REST de GitHub con el token que ya guarda Git Credential Manager.
# El token vive solo en memoria de este proceso: no se imprime ni se escribe en disco.
# Uso: gh_api.sh <METODO> <ruta-api> [cuerpo-json]
set -euo pipefail
method="${1:?METODO}"; route="${2:?ruta}"; body="${3:-}"

token="$(printf 'protocol=https\nhost=github.com\n\n' | git credential fill 2>/dev/null | sed -n 's/^password=//p')"
if [ -z "$token" ]; then
  echo "No hay credencial de github.com en Git Credential Manager." >&2
  exit 1
fi

curl_args=(-sS --ssl-no-revoke -X "$method"
  -H "Authorization: Bearer $token"
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
  -w '\nHTTP %{http_code}\n')
if [ -n "$body" ]; then curl_args+=(-H "Content-Type: application/json" -d "$body"); fi

curl "${curl_args[@]}" "https://api.github.com${route}"
