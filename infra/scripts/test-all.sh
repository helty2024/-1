#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
LOCAL_COMPOSE="$ROOT/infra/docker/docker-compose.local.yml"
PRODUCTION_COMPOSE="$ROOT/infra/docker/docker-compose.production.yml"
PRODUCTION_EXAMPLE="$ROOT/infra/env/.env.production.example"
ADMIN_CREATED=false

cleanup() {
  if [ "$ADMIN_CREATED" = true ]; then
    npm --prefix "$ROOT/api-server" run test:admin:delete || true
  fi
}
trap cleanup EXIT

docker compose -f "$LOCAL_COMPOSE" up -d --wait --wait-timeout 120
npm --prefix "$ROOT" test
npm --prefix "$ROOT/packages/contracts" run build
npm --prefix "$ROOT/api-server" run prisma:generate
npm --prefix "$ROOT/api-server" run build
npm --prefix "$ROOT/api-server" test -- --runInBand
npm --prefix "$ROOT/api-server" run test:e2e -- --runInBand
npm --prefix "$ROOT/admin-web" run build
npm --prefix "$ROOT/api-server" run test:admin:create
ADMIN_CREATED=true
npm --prefix "$ROOT/admin-web" run test:e2e:install
npm --prefix "$ROOT/admin-web" run test:e2e
APP_ENV_FILE=../env/.env.production.example docker compose --env-file "$PRODUCTION_EXAMPLE" -f "$PRODUCTION_COMPOSE" config --quiet

echo "All automated tests passed."
