#!/bin/bash

# Find and kill existing node server process
pkill -f "node server.js" || true

# Wait a moment
sleep 2

# Start the server again
node server.js &

echo "Backend server restarted"
