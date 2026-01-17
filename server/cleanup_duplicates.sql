-- Delete duplicate documents, keeping only the first of each docId/workspaceId pair
DELETE FROM workspace_documents
WHERE id NOT IN (
  SELECT DISTINCT ON (docId, workspaceId) id 
  FROM workspace_documents 
  ORDER BY docId, workspaceId, id ASC
);

-- Verify no more duplicates exist
SELECT 
  docId, 
  workspaceId, 
  COUNT(*) as count 
FROM workspace_documents 
GROUP BY docId, workspaceId 
HAVING COUNT(*) > 1;

SELECT COUNT(*) as total_documents FROM workspace_documents;
