#!/usr/bin/env bash
# Container entrypoint: the mail API and nginx in one process tree.
set -u

node /app/server/mail.mjs &
MAIL_PID=$!

# Open the public port only after the API is listening, so an early POST cannot
# race the module load and see a 502. Give up after 5 s and serve static anyway.
node -e "const start=Date.now();(async()=>{while(Date.now()-start<5000){try{const r=await fetch('http://127.0.0.1:3001/health');if(r.ok)process.exit(0)}catch{}await new Promise(r=>setTimeout(r,100))}process.exit(1)})()" || true

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
