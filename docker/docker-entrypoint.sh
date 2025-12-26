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
    chown -R anythingllm:anythingllm "$MCP_DIR"
fi

{
  cd /app/server/ &&
    # Disable Prisma CLI telemetry (https://www.prisma.io/docs/orm/tools/prisma-cli#how-to-opt-out-of-data-collection)
    export CHECKPOINT_DISABLE=1 &&
    # Dynamically update schema provider if using Postgres
    if [[ "$DATABASE_URL" == "postgres"* ]]; then
        echo "Switching Prisma provider to PostgreSQL..."
        sed -i 's/provider = "sqlite"/provider = "postgresql"/g' ./prisma/schema.prisma
    fi &&
    # Allow forcing a DB reset via env var (useful for stuck migrations)
    if [ "$RESET_DB" == "true" ]; then
        echo "⚠️ RESET_DB is set to true. Resetting database..."
        npx prisma migrate reset --force --schema=./prisma/schema.prisma
    fi &&
    npx prisma generate --schema=./prisma/schema.prisma >/dev/null &&
    npx prisma migrate deploy --schema=./prisma/schema.prisma >/dev/null &&
    node /app/server/index.js
} &
{
  # Set DATABASE_URL for collector to satisfy @langchain/community Prisma vector store validation
  # The collector doesn't use a database directly, but @langchain/community includes
  # a Prisma vector store that validates a schema requiring this variable.
  export DATABASE_URL="file:/app/server/storage/anythingllm.db"
  node /app/collector/index.js
} &
wait -n
exit $?
