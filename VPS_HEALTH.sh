#!/bin/bash

# ==========================================
# 🏥 VPS Health Check & Auto-Cleanup
# ==========================================
# Run this on your DigitalOcean/Easypanel Server
# Command: bash VPS_HEALTH.sh

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}==========================================${NC}"
echo -e "${GREEN}   🤖 SYSTEM HEALTH CHECK & CLEANUP TOOL   ${NC}"
echo -e "${GREEN}==========================================${NC}"

# 1. SYSTEM VITAL SIGNS
echo -e "\n${YELLOW}[1/4] Checking System Vitals...${NC}"
echo "-----------------------------------"
uptime_info=$(uptime)
echo -e "⏱️  Uptime: $uptime_info"

# Memory Usage
free -h | awk '/^Mem:/ {print "🧠 Memory: Used: "$3 " / Total: "$2 " (Free: "$4")"}'

# Load Average
load_avg=$(cat /proc/loadavg | awk '{print $1" "$2" "$3}')
echo -e "⚡ Load Average: $load_avg"

# Disk Usage
echo -e "\n💿 Disk Usage (Top Levels):"
df -h | grep -v "overlay" | grep -v "tmpfs" | head -n 5

# 2. DOCKER HEALTH
echo -e "\n${YELLOW}[2/4] Analyzing Docker Footprint...${NC}"
echo "-----------------------------------"
docker system df

# 3. CLEANUP ACTIONS
echo -e "\n${YELLOW}[3/4] Performing Cleanup Operations...${NC}"
echo "-----------------------------------"

# Truncate large docker logs (common space eater)
echo "🧹 Truncating oversized Docker logs..."
sh -c 'truncate -s 0 /var/lib/docker/containers/*/*-json.log' 2>/dev/null && echo "   -> Logs truncated." || echo "   -> No logs accessible (run with sudo?)"

# Remove unused containers
echo "🧹 Pruning stopped containers..."
docker container prune -f > /dev/null

# Remove dangling images
echo "🧹 Pruning dangling images..."
docker image prune -f > /dev/null

# Remove builder cache (Safe to remove, just triggers rebuilds)
echo "🧹 Pruning build cache..."
docker builder prune -a -f > /dev/null

# 4. FINAL REPORT
echo -e "\n${YELLOW}[4/4] Post-Cleanup Status...${NC}"
echo "-----------------------------------"
df -h /

echo -e "\n${GREEN}✅ Health Check & Cleanup Complete!${NC}"
echo -e "Your VPS should now be breathing easier."
