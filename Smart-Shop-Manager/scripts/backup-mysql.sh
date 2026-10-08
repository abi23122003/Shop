#!/bin/sh
set -eu

: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_DATABASE:?MYSQL_DATABASE is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
export MYSQL_PWD="$MYSQL_PASSWORD"

BACKUP_DIR="${BACKUP_DIR:-/backups}"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-14}"
mkdir -p "$BACKUP_DIR"

create_backup() {
    timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
    output="$BACKUP_DIR/${MYSQL_DATABASE}_${timestamp}.sql.gz"
    temporary="${output}.tmp"

    mysqldump \
        --host="$MYSQL_HOST" \
        --user="$MYSQL_USER" \
        --single-transaction \
        --quick \
        --routines \
        --events \
        --triggers \
        --hex-blob \
        "$MYSQL_DATABASE" \
        users categories products customers sales sale_items credits credit_transactions \
        | gzip > "$temporary"

    test -s "$temporary"
    mv "$temporary" "$output"
    find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime "+$RETENTION_DAYS" -delete
    printf '%s\n' "$output"
}

if [ "${1:-}" = "--loop" ]; then
    while :; do
        create_backup
        sleep "${BACKUP_INTERVAL_SECONDS:-86400}"
    done
else
    create_backup
fi
