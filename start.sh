#!/bin/bash
cd "$(dirname "$0")"

# Check if dist exists, if not build it
if [ ! -d "dist" ]; then
    npm install
    npm run build
fi

# Run a local server in the background
npx serve -s dist -l 54321 &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Try to open in a standalone app window if chrome/chromium is available
if command -v google-chrome &> /dev/null; then
    google-chrome --app=http://localhost:54321
elif command -v chromium &> /dev/null; then
    chromium --app=http://localhost:54321
elif command -v brave-browser &> /dev/null; then
    brave-browser --app=http://localhost:54321
else
    xdg-open "http://localhost:54321"
fi

# When browser closes or script stops, kill server
trap "kill $SERVER_PID" EXIT
wait $SERVER_PID
