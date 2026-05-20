#!/bin/bash
# Validate that the application is running and responding on port 3000

echo "Validating service status..."

# Allow the server a moment to start up before checking
sleep 5

# Ping the health check / main page of the portal
URL="http://localhost:3000"
MAX_ATTEMPTS=12
ATTEMPT=1

while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
  echo "Checking service availability (Attempt $ATTEMPT/$MAX_ATTEMPTS)..."

  # Send an HTTP request and get the status code
  STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" $URL/api/hello || true)

  if [ "$STATUS_CODE" = "200" ]; then
    echo "Service is healthy! HTTP Status Code: 200"
    exit 0
  fi

  echo "Service not ready yet. Status code returned: $STATUS_CODE. Retrying in 5 seconds..."
  sleep 5
  ATTEMPT=$((ATTEMPT + 1))
done

echo "Error: Service failed to respond with HTTP 200 after $(($MAX_ATTEMPTS * 5)) seconds."
exit 1
