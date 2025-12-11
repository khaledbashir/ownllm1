-- Ensure smart plugin names are unique per workspace, not globally.

DROP INDEX IF EXISTS "smart_plugins_name_key";
CREATE UNIQUE INDEX IF NOT EXISTS "smart_plugins_workspaceId_name_key" ON "smart_plugins"("workspaceId", "name");
