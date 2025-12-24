-- Add proposal CRM settings to workspaces table
ALTER TABLE "workspaces" ADD COLUMN "defaultProposalPipelineId" INTEGER;
ALTER TABLE "workspaces" ADD COLUMN "enableProposalCrmIntegration" BOOLEAN DEFAULT 1;

-- Create index for better query performance
CREATE INDEX "workspaces_defaultProposalPipelineId_idx" ON "workspaces"("defaultProposalPipelineId");
