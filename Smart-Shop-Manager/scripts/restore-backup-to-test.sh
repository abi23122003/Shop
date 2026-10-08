#!/bin/sh
set -eu

: "${BACKUP_FILE:?BACKUP_FILE must point to a .sql.gz backup}"
: "${MYSQL_HOST:?MYSQL_HOST is required}"
: "${MYSQL_USER:?MYSQL_USER is required}"
: "${MYSQL_PASSWORD:?MYSQL_PASSWORD is required}"
: "${TEST_DATABASE:?TEST_DATABASE is required}"
export MYSQL_PWD="$MYSQL_PASSWORD"

if [ "$TEST_DATABASE" = "shop_manager" ]; then
    echo "Refusing to restore into the application database." >&2
    exit 1
fi

case "$TEST_DATABASE" in
    ''|*[!A-Za-z0-9_]*)
        echo "TEST_DATABASE must contain only letters, numbers, and underscores." >&2
        exit 1
        ;;
esac

if [ "${CONFIRM_RESTORE:-}" != "YES" ]; then
    echo "Set CONFIRM_RESTORE=YES to restore into the separate test database." >&2
    exit 1
fi

test -s "$BACKUP_FILE"
gzip -t "$BACKUP_FILE"

mysql \
    --host="$MYSQL_HOST" \
    --user="$MYSQL_USER" \
    -e "CREATE DATABASE IF NOT EXISTS \`$TEST_DATABASE\`"

gzip -dc "$BACKUP_FILE" | mysql \
    --host="$MYSQL_HOST" \
    --user="$MYSQL_USER" \
    "$TEST_DATABASE"

mysql \
    --host="$MYSQL_HOST" \
    --user="$MYSQL_USER" \
    "$TEST_DATABASE" \
    -e "SHOW TABLES"
