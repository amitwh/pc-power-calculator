#!/usr/bin/env bash
# Container entrypoint: the mail API and nginx in one process tree.
set -u

node /app/server/mail.mjs &
MAIL_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

shutdown() {
  kill -TERM "$MAIL_PID" "$NGINX_PID" 2>/dev/null
}

trap shutdown TERM INT

# Exit with the first child's status so a crash restarts the container.
wait -n
STATUS=$?

shutdown
wait 2>/dev/null

exit "$STATUS"
