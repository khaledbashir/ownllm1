#!/bin/bash

echo "🧹 Starting VPS Docker Build Cleanup..."
echo "======================================="

# Check current disk usage before cleanup
echo "📊 Current disk usage:"
df -h

echo ""
echo "🔍 Docker system info before cleanup:"
docker system df

echo ""
echo "🗑️  Step 1: Remove unused containers and networks..."
docker system prune -f

echo ""
echo "🗑️  Step 2: Remove unused images (dangling)..."
docker image prune -f

echo ""
echo "🗑️  Step 3: Remove build cache..."
docker builder prune -f

echo ""
echo "🗑️  Step 4: Remove all unused build cache, images, containers..."
docker system prune -af --volumes

echo ""
echo "📊 Disk usage after cleanup:"
df -h

echo ""
echo "🔍 Docker system info after cleanup:"
docker system df

echo ""
echo "✅ VPS cleanup completed!"
echo "💾 Saved space by removing unused Docker builds and artifacts"