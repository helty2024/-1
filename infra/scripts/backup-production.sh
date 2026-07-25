#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
COMPOSE_FILE="$ROOT/infra/docker/docker-compose.production.yml"
ENV_FILE="$ROOT/infra/env/.env.production"
BACKUP_DIR="$ROOT/infra/backups"
STAMP=$(date +%Y%m%d-%H%M%S)

mkdir -p "$BACKUP_DIR"

compose() {
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" "$@"
}

compose exec -T mysql sh -c 'exec mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --single-transaction --routines --triggers "$MYSQL_DATABASE"' | gzip > "$BACKUP_DIR/database-$STAMP.sql.gz"
compose exec -T api-server tar -czf - -C /app/storage media > "$BACKUP_DIR/local-media-$STAMP.tar.gz"

echo "备份完成：$BACKUP_DIR"
