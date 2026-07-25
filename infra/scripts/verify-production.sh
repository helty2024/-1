#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.production.yml"
ENV_FILE="$ROOT/infra/env/.env.production"
DOMAIN=${1:-$(grep '^ADMIN_WEB_ORIGIN=' "$ENV_FILE" | head -n 1 | cut -d= -f2-)}

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose ps
curl --fail --silent --show-error "$DOMAIN/api/v1" >/dev/null
curl --fail --silent --show-error "$DOMAIN/" >/dev/null
echo "部署验收通过：$DOMAIN"
