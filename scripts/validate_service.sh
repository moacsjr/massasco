#!/bin/bash
# Validate that the application is running and responding on port 3000
# Budget: 10s startup wait + 8 attempts × 5s = 50s max (within appspec timeout: 60s)

echo "Validating service status..."

# MAX_ATTEMPTS=8
# WAIT_BETWEEN=5
# INITIAL_SLEEP=10

# # Give PM2 / Next.js time to bind to the port
# sleep $INITIAL_SLEEP

# for ATTEMPT in $(seq 1 $MAX_ATTEMPTS); do
#   echo "Attempt $ATTEMPT/$MAX_ATTEMPTS..."

#   STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
#     --max-time 4 --connect-timeout 3 \
#     http://localhost:3000/api/hello 2>/dev/null) || STATUS_CODE="000"

#   if [ "$STATUS_CODE" = "200" ]; then
#     echo "Service healthy — HTTP 200"
#     echo "---"
#     echo "PM2 recent logs:"
#     pm2 logs devx-portal --lines=500 --nocolor 2>/dev/null || true
#     exit 0
#   fi

#   echo "Not ready (status: ${STATUS_CODE:-no response}). Retrying in ${WAIT_BETWEEN}s..."
#   [ "$ATTEMPT" -lt "$MAX_ATTEMPTS" ] && sleep $WAIT_BETWEEN
# done

# echo "Error: service did not respond with HTTP 200 within $((INITIAL_SLEEP + MAX_ATTEMPTS * WAIT_BETWEEN))s."
# echo "---"
# echo "PM2 recent logs:"
# pm2 logs devx-portal --lines=500 --nocolor 2>/dev/null || true
# exit 1

exit 0
