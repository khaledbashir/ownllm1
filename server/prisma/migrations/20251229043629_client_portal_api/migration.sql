-- CreateTable
CREATE TABLE "proposal_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "parentId" TEXT,
    "authorName" TEXT NOT NULL,
    "authorEmail" TEXT,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "reactions" TEXT,
    "mentions" TEXT,
    CONSTRAINT "proposal_comments_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public_proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "proposal_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "proposal_comments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proposal_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "changes" TEXT NOT NULL,
    "notes" TEXT,
    "authorName" TEXT NOT NULL,
    "htmlContent" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "proposal_versions_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public_proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "proposal_approvals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "proposalId" TEXT NOT NULL,
    "approverName" TEXT NOT NULL,
    "approverEmail" TEXT,
    "signatureData" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "declineReason" TEXT,
    "changeNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "proposal_approvals_proposalId_fkey" FOREIGN KEY ("proposalId") REFERENCES "public_proposals" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_organizations" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'free',
    "subscriptionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "seatLimit" INTEGER,
    "settings" TEXT,
    "role" TEXT NOT NULL DEFAULT 'default',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_organizations" ("createdAt", "id", "name", "plan", "seatLimit", "settings", "slug", "status", "subscriptionId", "updatedAt") SELECT "createdAt", "id", "name", "plan", "seatLimit", "settings", "slug", "status", "subscriptionId", "updatedAt" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_slug_key" ON "organizations"("slug");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

-- CreateIndex
CREATE INDEX "proposal_comments_proposalId_idx" ON "proposal_comments"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_comments_parentId_idx" ON "proposal_comments"("parentId");

-- CreateIndex
CREATE INDEX "proposal_comments_createdAt_idx" ON "proposal_comments"("createdAt");

-- CreateIndex
CREATE INDEX "proposal_versions_proposalId_idx" ON "proposal_versions"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_versions_versionNumber_idx" ON "proposal_versions"("versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "proposal_versions_proposalId_versionNumber_key" ON "proposal_versions"("proposalId", "versionNumber");

-- CreateIndex
CREATE INDEX "proposal_approvals_proposalId_idx" ON "proposal_approvals"("proposalId");

-- CreateIndex
CREATE INDEX "proposal_approvals_status_idx" ON "proposal_approvals"("status");

-- CreateIndex
CREATE INDEX "proposal_approvals_approverEmail_idx" ON "proposal_approvals"("approverEmail");
