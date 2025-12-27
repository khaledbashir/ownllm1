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

# Detect Database Type
IS_POSTGRES=false
if [[ "$DATABASE_URL" == "postgres"* ]]; then
    IS_POSTGRES=true
    echo "🐘 PostgreSQL detected."

    # Robust host/port extraction from DATABASE_URL
    # Format: postgresql://user:password@host:port/db
    DB_HOST=$(echo $DATABASE_URL | sed -e 's|.*@||' -e 's|/.*||' -e 's|:.*||')
    DB_PORT=$(echo $DATABASE_URL | sed -ne 's|.*@.*:\([0-9]*\).*|\1|p')
    [ -z "$DB_PORT" ] && DB_PORT=5432

    echo "⏳ Waiting for database at $DB_HOST:$DB_PORT..."
    for i in {1..30}; do
        if nc -z "$DB_HOST" "$DB_PORT"; then
            echo "✅ Database is reachable."
            break
        fi
        echo "...waiting ($i/30)..."
        sleep 2
    done

    echo "🔄 Switching Prisma provider to PostgreSQL..."
    # Always reset to sqlite first to avoid multiple appends if script reruns
    sed -i 's/provider = "postgresql"/provider = "sqlite"/g' ./prisma/schema.prisma
    # Then set to postgresql
    sed -i 's/provider = "sqlite"/provider = "postgresql"/g' ./prisma/schema.prisma
fi

echo "Environment: $NODE_ENV"
echo "RESET_DB setting: '$RESET_DB'"

echo "📦 Generating Prisma Client..."
npx prisma generate --schema=./prisma/schema.prisma

if [ "$IS_POSTGRES" == "true" ]; then
    echo "🚀 Reconciling PostgreSQL schema (db push)..."
    if [ "$RESET_DB" == "true" ]; then
        echo "⚠️  WARNING: RESET_DB is set to true. Wiping and re-initializing database..."
        npx prisma db push --force-reset --accept-data-loss --schema=./prisma/schema.prisma
    else
        # For PG, we use db push to avoid using SQLite-specific migrations
        npx prisma db push --accept-data-loss --schema=./prisma/schema.prisma
    fi
else
    # Standard SQLite migration flow
    if [ "$RESET_DB" == "true" ]; then
        echo "⚠️  WARNING: RESET_DB is set to true. Attempting to reset SQLite database..."
        npx prisma migrate resolve --rolled-back "20230921191814_init" --schema=./prisma/schema.prisma || true
        npx prisma migrate reset --force --schema=./prisma/schema.prisma || echo "⚠️  Reset failed, but trying to continue..."
    fi

    echo "🚀 Running SQLite migrations (deploy)..."
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

