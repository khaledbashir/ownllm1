-- Remove the global unique constraint on docId
-- Add a composite unique constraint on (docId, workspaceId) to allow same docId in different workspaces

-- First, drop the existing unique index on docId
DROP INDEX IF EXISTS "workspace_documents_docId_key";

-- Add composite unique constraint on docId and workspaceId
ALTER TABLE "workspace_documents" ADD CONSTRAINT "workspace_documents_docId_workspaceId_key" UNIQUE ("docId", "workspaceId");
