-- Create public_proposals table first
CREATE TABLE "public_proposals" (
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
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "public_proposals_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes for public_proposals
CREATE INDEX "public_proposals_workspaceId_idx" ON "public_proposals"("workspaceId");
CREATE INDEX "public_proposals_status_idx" ON "public_proposals"("status");

-- Add crmCardId to public_proposals table
ALTER TABLE "public_proposals" ADD COLUMN "crmCardId" INTEGER;

-- Create index for crmCardId
CREATE INDEX "public_proposals_crmCardId_idx" ON "public_proposals"("crmCardId");

-- Add pipelineId index for public_proposals
CREATE INDEX "public_proposals_pipelineId_idx" ON "public_proposals"("pipelineId");