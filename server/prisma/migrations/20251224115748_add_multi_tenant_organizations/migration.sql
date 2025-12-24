/*
  Warnings:

  - You are about to drop the column `crmCardId` on the `public_proposals` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "seatLimit" INTEGER,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_crm_cards" (
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
    "proposalId" TEXT,
    "notes" TEXT,
    "metadata" TEXT,
    "value" REAL,
    "userId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_cards_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "crm_pipelines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "crm_cards_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public_proposals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_crm_cards" ("company", "createdAt", "email", "embedSessionId", "id", "metadata", "name", "notes", "phone", "pipelineId", "position", "stage", "threadId", "title", "updatedAt", "userId", "value") SELECT "company", "createdAt", "email", "embedSessionId", "id", "metadata", "name", "notes", "phone", "pipelineId", "position", "stage", "threadId", "title", "updatedAt", "userId", "value" FROM "crm_cards";
DROP TABLE "crm_cards";
ALTER TABLE "new_crm_cards" RENAME TO "crm_cards";
CREATE UNIQUE INDEX "crm_cards_proposalId_key" ON "crm_cards"("proposalId");
CREATE INDEX "crm_cards_pipelineId_idx" ON "crm_cards"("pipelineId");
CREATE INDEX "crm_cards_stage_idx" ON "crm_cards"("stage");
CREATE INDEX "crm_cards_userId_idx" ON "crm_cards"("userId");
CREATE INDEX "crm_cards_proposalId_idx" ON "crm_cards"("proposalId");
CREATE TABLE "new_api_keys" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "secret" TEXT,
    "createdBy" INTEGER,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "api_keys_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_api_keys" ("createdAt", "createdBy", "id", "lastUpdatedAt", "secret") SELECT "createdAt", "createdBy", "id", "lastUpdatedAt", "secret" FROM "api_keys";
DROP TABLE "api_keys";
ALTER TABLE "new_api_keys" RENAME TO "api_keys";
CREATE UNIQUE INDEX "api_keys_secret_key" ON "api_keys"("secret");
CREATE TABLE "new_users" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "username" TEXT,
    "password" TEXT NOT NULL,
    "pfpFilename" TEXT,
    "role" TEXT NOT NULL DEFAULT 'default',
    "suspended" INTEGER NOT NULL DEFAULT 0,
    "seen_recovery_codes" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dailyMessageLimit" INTEGER,
    "bio" TEXT DEFAULT '',
    "organizationId" INTEGER,
    CONSTRAINT "users_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_users" ("bio", "createdAt", "dailyMessageLimit", "id", "lastUpdatedAt", "password", "pfpFilename", "role", "seen_recovery_codes", "suspended", "username") SELECT "bio", "createdAt", "dailyMessageLimit", "id", "lastUpdatedAt", "password", "pfpFilename", "role", "seen_recovery_codes", "suspended", "username" FROM "users";
DROP TABLE "users";
ALTER TABLE "new_users" RENAME TO "users";
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE INDEX "users_organizationId_idx" ON "users"("organizationId");
CREATE TABLE "new_workspaces" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "organizationId" INTEGER,
    "vectorTag" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiTemp" REAL,
    "openAiHistory" INTEGER NOT NULL DEFAULT 20,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "openAiPrompt" TEXT,
    "similarityThreshold" REAL DEFAULT 0.25,
    "chatProvider" TEXT,
    "chatModel" TEXT,
    "topN" INTEGER DEFAULT 4,
    "chatMode" TEXT DEFAULT 'chat',
    "pfpFilename" TEXT,
    "agentProvider" TEXT,
    "agentModel" TEXT,
    "queryRefusalResponse" TEXT,
    "vectorSearchMode" TEXT DEFAULT 'default',
    "products" TEXT,
    "rateCard" TEXT,
    "enableProposalMode" BOOLEAN NOT NULL DEFAULT false,
    "inlineAiSystemPrompt" TEXT,
    "inlineAiActions" TEXT,
    "defaultProposalPipelineId" INTEGER,
    "enableProposalCrmIntegration" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "workspaces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "workspaces_defaultProposalPipelineId_fkey" FOREIGN KEY ("defaultProposalPipelineId") REFERENCES "crm_pipelines" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_workspaces" ("agentModel", "agentProvider", "chatMode", "chatModel", "chatProvider", "createdAt", "defaultProposalPipelineId", "enableProposalCrmIntegration", "enableProposalMode", "id", "lastUpdatedAt", "name", "openAiHistory", "openAiPrompt", "openAiTemp", "pfpFilename", "products", "queryRefusalResponse", "rateCard", "similarityThreshold", "slug", "topN", "vectorSearchMode", "vectorTag") SELECT "agentModel", "agentProvider", "chatMode", "chatModel", "chatProvider", "createdAt", "defaultProposalPipelineId", coalesce("enableProposalCrmIntegration", true) AS "enableProposalCrmIntegration", "enableProposalMode", "id", "lastUpdatedAt", "name", "openAiHistory", "openAiPrompt", "openAiTemp", "pfpFilename", "products", "queryRefusalResponse", "rateCard", "similarityThreshold", "slug", "topN", "vectorSearchMode", "vectorTag" FROM "workspaces";
DROP TABLE "workspaces";
ALTER TABLE "new_workspaces" RENAME TO "workspaces";
CREATE UNIQUE INDEX "workspaces_slug_key" ON "workspaces"("slug");
CREATE INDEX "workspaces_defaultProposalPipelineId_idx" ON "workspaces"("defaultProposalPipelineId");
CREATE INDEX "workspaces_organizationId_idx" ON "workspaces"("organizationId");
CREATE TABLE "new_workspace_documents" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "docId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "docpath" TEXT NOT NULL,
    "workspaceId" INTEGER NOT NULL,
    "organizationId" INTEGER,
    "metadata" TEXT,
    "pinned" BOOLEAN DEFAULT false,
    "watched" BOOLEAN DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "workspace_documents_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "workspace_documents_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_workspace_documents" ("createdAt", "docId", "docpath", "filename", "id", "lastUpdatedAt", "metadata", "pinned", "watched", "workspaceId") SELECT "createdAt", "docId", "docpath", "filename", "id", "lastUpdatedAt", "metadata", "pinned", "watched", "workspaceId" FROM "workspace_documents";
DROP TABLE "workspace_documents";
ALTER TABLE "new_workspace_documents" RENAME TO "workspace_documents";
CREATE UNIQUE INDEX "workspace_documents_docId_key" ON "workspace_documents"("docId");
CREATE INDEX "workspace_documents_organizationId_idx" ON "workspace_documents"("organizationId");
CREATE TABLE "new_crm_pipelines" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'custom',
    "stages" TEXT NOT NULL,
    "color" TEXT DEFAULT '#3b82f6',
    "userId" INTEGER,
    "workspaceId" INTEGER,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "crm_pipelines_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_pipelines_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "crm_pipelines_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_crm_pipelines" ("color", "createdAt", "description", "id", "name", "stages", "type", "updatedAt", "userId", "workspaceId") SELECT "color", "createdAt", "description", "id", "name", "stages", "type", "updatedAt", "userId", "workspaceId" FROM "crm_pipelines";
DROP TABLE "crm_pipelines";
ALTER TABLE "new_crm_pipelines" RENAME TO "crm_pipelines";
CREATE INDEX "crm_pipelines_userId_idx" ON "crm_pipelines"("userId");
CREATE INDEX "crm_pipelines_workspaceId_idx" ON "crm_pipelines"("workspaceId");
CREATE INDEX "crm_pipelines_organizationId_idx" ON "crm_pipelines"("organizationId");
CREATE TABLE "new_public_proposals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "workspaceId" INTEGER NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "password" TEXT,
    "expiresAt" DATETIME,
    "signatures" TEXT,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "pipelineId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "public_proposals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "public_proposals_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "crm_pipelines" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_public_proposals" ("createdAt", "expiresAt", "htmlContent", "id", "password", "pipelineId", "signatures", "status", "updatedAt", "viewCount", "workspaceId") SELECT "createdAt", "expiresAt", "htmlContent", "id", "password", "pipelineId", "signatures", "status", "updatedAt", "viewCount", "workspaceId" FROM "public_proposals";
DROP TABLE "public_proposals";
ALTER TABLE "new_public_proposals" RENAME TO "public_proposals";
CREATE INDEX "public_proposals_workspaceId_idx" ON "public_proposals"("workspaceId");
CREATE INDEX "public_proposals_status_idx" ON "public_proposals"("status");
CREATE INDEX "public_proposals_pipelineId_idx" ON "public_proposals"("pipelineId");
CREATE TABLE "new_invites" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "claimedBy" INTEGER,
    "workspaceIds" TEXT,
    "organizationId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "invites_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_invites" ("claimedBy", "code", "createdAt", "createdBy", "id", "lastUpdatedAt", "status", "workspaceIds") SELECT "claimedBy", "code", "createdAt", "createdBy", "id", "lastUpdatedAt", "status", "workspaceIds" FROM "invites";
DROP TABLE "invites";
ALTER TABLE "new_invites" RENAME TO "invites";
CREATE UNIQUE INDEX "invites_code_key" ON "invites"("code");
CREATE INDEX "invites_organizationId_idx" ON "invites"("organizationId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
