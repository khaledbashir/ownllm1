-- CreateTable
CREATE TABLE "crm_pipelines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "stages" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3b82f6',
    "userId" INTEGER,
    "workspaceId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_pipelines_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "crm_cards" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "pipelineId" INTEGER NOT NULL,
    "stage" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "title" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "embedSessionId" TEXT,
    "threadId" INTEGER,
    "notes" TEXT,
    "metadata" TEXT,
    "value" REAL,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_cards_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "crm_pipelines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "crm_pipelines_userId_idx" ON "crm_pipelines"("userId");

-- CreateIndex
CREATE INDEX "crm_pipelines_workspaceId_idx" ON "crm_pipelines"("workspaceId");

-- CreateIndex
CREATE INDEX "crm_cards_pipelineId_idx" ON "crm_cards"("pipelineId");

-- CreateIndex
CREATE INDEX "crm_cards_stage_idx" ON "crm_cards"("stage");

-- CreateIndex
CREATE INDEX "crm_cards_userId_idx" ON "crm_cards"("userId");
