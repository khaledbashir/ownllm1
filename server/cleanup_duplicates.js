const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log('🔍 Checking for duplicate docIds...');
    
    // Find all docId/workspaceId combinations with duplicates
    const duplicates = await prisma.$queryRaw`
      SELECT docId, workspaceId, COUNT(*) as count 
      FROM workspace_documents 
      GROUP BY docId, workspaceId 
      HAVING COUNT(*) > 1
    `;
    
    if (duplicates.length === 0) {
      console.log('✅ No duplicates found!');
    } else {
      console.log(`⚠️ Found ${duplicates.length} duplicate groups:`);
      duplicates.forEach(dup => {
        console.log(`   - docId: ${dup.docId}, workspaceId: ${dup.workspaceId}, count: ${dup.count}`);
      });
      
      // Delete duplicates keeping only the first
      const result = await prisma.$executeRaw`
        DELETE FROM workspace_documents
        WHERE id NOT IN (
          SELECT DISTINCT ON (docId, workspaceId) id 
          FROM workspace_documents 
          ORDER BY docId, workspaceId, id ASC
        )
      `;
      
      console.log(`🗑️ Deleted ${result} duplicate records`);
    }
    
    // Final count
    const count = await prisma.workspace_documents.count();
    console.log(`📊 Total documents remaining: ${count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
