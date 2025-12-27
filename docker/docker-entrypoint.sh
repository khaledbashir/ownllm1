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

# --- Database Setup (Synchronous) ---
echo "--- Starting Database Setup ---"
cd /app/server/
export CHECKPOINT_DISABLE=1

# Dynamically update schema provider if using Postgres
if [[ "$DATABASE_URL" == "postgres"* ]]; then
    echo "🔄 Switching Prisma provider to PostgreSQL..."
    sed -i 's/provider = "sqlite"/provider = "postgresql"/g' ./prisma/schema.prisma
fi

echo "Environment: $NODE_ENV"
echo "RESET_DB setting: '$RESET_DB'"

# Allow forcing a DB reset via env var (useful for stuck migrations)
if [ "$RESET_DB" == "true" ]; then
    echo "⚠️  WARNING: RESET_DB is set to true. Attempting to reset database..."
    if npx prisma migrate resolve --rolled-back "20230921191814_init" --schema=./prisma/schema.prisma; then
        echo "✅ Marked failed migration as rolled back."
    fi
    npx prisma migrate reset --force --schema=./prisma/schema.prisma || echo "⚠️  Reset failed, but trying to continue..."
fi

echo "📦 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

echo "🚀 Running database migrations (deploy)..."
if ! npx prisma migrate deploy --schema=./prisma/schema.prisma; then
    echo "================================================================"
    echo "❌ CRITICAL ERROR: DATABASE MIGRATION FAILED!"
    echo "Prisma Error P3009 detected (failed migration state)."
    echo ""
    echo "FIX: In Easypanel, add the environment variable:"
    echo "RESET_DB=\"true\""
    echo "Then restart the service to wipe and re-initialize the database."
    echo "================================================================"
    sleep 60
    exit 1
fi
echo "✅ Database is ready."

# --- Start Services ---
{
    echo "Starting AnythingLLM Server..."
    node /app/server/index.js
} &
{
    # Set DATABASE_URL for collector to satisfy @langchain/community Prisma vector store validation
    export DATABASE_URL="file:/app/server/storage/anythingllm.db"
    echo "Starting Document Collector..."
    node /app/collector/index.js
} &
wait -n
exit $?

