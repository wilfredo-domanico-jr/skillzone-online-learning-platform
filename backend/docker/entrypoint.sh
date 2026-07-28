#!/bin/sh
set -e

# Belt-and-suspenders wait for the DB even outside docker-compose's own
# healthcheck-based `depends_on` — harmless no-op if DB_HOST isn't mysql.
if [ "$DB_CONNECTION" = "mysql" ] && [ -n "$DB_HOST" ]; then
    echo "Waiting for database at ${DB_HOST}:${DB_PORT:-3306}..."
    i=0
    until php -r "new PDO('mysql:host=${DB_HOST};port=${DB_PORT:-3306}', getenv('DB_USERNAME'), getenv('DB_PASSWORD'));" 2>/dev/null; do
        i=$((i + 1))
        if [ "$i" -ge 30 ]; then
            echo "Database never became reachable, continuing anyway."
            break
        fi
        sleep 2
    done
fi

# Only one container should run migrations on boot — the queue service sets
# SKIP_MIGRATIONS=true so it doesn't race the backend container over the
# same schema changes.
if [ "$SKIP_MIGRATIONS" != "true" ]; then
    php artisan migrate --force
    php artisan storage:link 2>/dev/null || true
fi

exec "$@"
