#!/bin/bash

# Check if STORAGE_DIR is set
if [ -z "$STORAGE_DIR" ]; then
    echo "================================================================"
    echo "⚠️  ⚠️  ⚠️  WARNING: STORAGE_DIR environment variable is not set! ⚠️  ⚠️  ⚠️"
    echo ""
    echo "Not setting this will result in data loss on container restart since"
    echo "the application will not have a persistent storage location."
    echo "It can also result in weird errors in various parts of the application."
    echo ""
    echo "Please run the container with the official docker command at"
    echo "https://docs.anythingllm.com/installation-docker/quickstart"
    echo ""
    echo "⚠️  ⚠️  ⚠️  WARNING: STORAGE_DIR environment variable is not set! ⚠️  ⚠️  ⚠️"
    echo "================================================================"
fi

# Setup MCP servers from environment variable if provided
if [ -n "$MCP_SERVERS_JSON" ]; then
    echo "📦 Setting up MCP servers from MCP_SERVERS_JSON environment variable..."
    MCP_DIR="${STORAGE_DIR:-/app/server/storage}/plugins"
    mkdir -p "$MCP_DIR"
    echo "$MCP_SERVERS_JSON" > "$MCP_DIR/anythingllm_mcp_servers.json"
    echo "✅ MCP servers config written to $MCP_DIR/anythingllm_mcp_servers.json"
fi

{
  cd /app/server/ &&
    # Disable Prisma CLI telemetry (https://www.prisma.io/docs/orm/tools/prisma-cli#how-to-opt-out-of-data-collection)
    export CHECKPOINT_DISABLE=1 &&
    npx prisma generate --schema=./prisma/schema.prisma >/dev/null &&
    npx prisma migrate deploy --schema=./prisma/schema.prisma >/dev/null &&
    node /app/server/index.js
} &
{ node /app/collector/index.js; } &
wait -n
exit $?
