-- CreateTable
CREATE TABLE "block_templates" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "snapshot" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "isGlobal" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "block_templates_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "block_templates_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "block_templates_workspaceId_idx" ON "block_templates"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "block_templates_workspaceId_name_key" ON "block_templates"("workspaceId", "name");
