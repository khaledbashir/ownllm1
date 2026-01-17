#!/bin/bash

echo "=== ANC FORMULA BANK - RESTART SERVER ==="
echo ""

# Kill existing server
echo "1. Killing existing server..."
lsof -ti :3001 | xargs kill -9 2>/dev/null || true
sleep 2

# Start new server
echo "2. Starting AnythingLLM server..."
cd /root/everythingllm/ownllm1/server

# Start in background and redirect logs
yarn dev > /tmp/anythingllm.log 2>&1 &

# Wait for server to start
echo "3. Waiting for server to start..."
sleep 10

# Check if server is running
if curl -s http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Server started successfully!"
    echo ""
    echo "Open your browser to:"
    echo "   http://localhost:3001"
    echo ""
    echo "Or your VPS URL:"
    echo "   https://basheer-everythingllm.x0uyzh.easypanel.host"
    echo ""
    echo "Then follow the testing guide:"
    echo "   cat QUICK_TEST_CHEAT_SHEET.md"
else
    echo "❌ Server failed to start. Check logs:"
    echo "   tail -50 /tmp/anythingllm.log"
fi

echo ""
echo "=== DONE ==="
