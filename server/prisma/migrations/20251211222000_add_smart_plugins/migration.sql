-- CreateTable
CREATE TABLE "smart_plugins" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "schema" TEXT NOT NULL,
    "uiConfig" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "workspaceId" INTEGER NOT NULL,
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "smart_plugins_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "smart_plugins_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "smart_plugins_name_key" ON "smart_plugins"("name");

-- CreateIndex
CREATE INDEX "smart_plugins_workspaceId_idx" ON "smart_plugins"("workspaceId");

-- CreateIndex
CREATE INDEX "smart_plugins_createdBy_idx" ON "smart_plugins"("createdBy");
