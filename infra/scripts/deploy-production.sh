#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.production.yml"
ENV_FILE="$ROOT/infra/env/.env.production"
INITIALIZE=false

if [ "${1:-}" = "--initialize" ]; then
  INITIALIZE=true
fi

[ -f "$ENV_FILE" ] || { echo "缺少 infra/env/.env.production" >&2; exit 1; }
[ -f "$ROOT/infra/certs/fullchain.pem" ] || { echo "缺少 fullchain.pem" >&2; exit 1; }
[ -f "$ROOT/infra/certs/privkey.pem" ] || { echo "缺少 privkey.pem" >&2; exit 1; }

if grep -Eq 'replace-with-|https://example\.com' "$ENV_FILE"; then
  echo "生产环境文件仍包含示例值，请先全部替换。" >&2
  exit 1
fi

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose config --quiet

if [ "$INITIALIZE" = true ]; then
  compose up -d mysql redis
  compose run --rm migrate
  compose --profile initialize run --rm seed
fi

compose up -d --build
echo "部署命令已完成。请运行 infra/scripts/verify-production.sh 检查服务。"
