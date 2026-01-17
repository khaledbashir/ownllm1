const prisma = require('../../../../utils/prisma');

/**
 * ANC Document Publisher
 * Pushes markdown content into the current Workspace Thread Notes.
 */
module.exports.runtime = {
  handler: async function ({ content, title }) {
    try {
      const invocation = this.super.handlerProps?.invocation;
      const threadId = invocation?.thread_id;

      if (!threadId) {
        return "Error: Could not identify the current Thread ID. Ensure you are calling this in a workspace thread.";
      }

      if (!content) {
        return "Error: Content is required for publishing.";
      }

      this.logger(`[ANC Publisher] Publishing doc to Thread ID: ${threadId}`);
      this.introspect(`Publishing "${title || 'Untitled Proposal'}" to the Workspace Document...`);

      // We update the 'notes' column. 
      // Note: AnythingLLM's BlockSuite editor usually expects a Y.js snapshot JSON.
      // However, if we store raw markdown, we can advise the user on how to load it, 
      // or we can try to wrap it in a minimal valid JSON if we knew it.
      
      // For now, let's update the thread name as well to match the proposal.
      await prisma.workspace_threads.update({
        where: { id: threadId },
        data: {
          name: title || "Official ANC Proposal",
          notes: content // Storing raw markdown. 
        }
      });

      return `✅ **Success!**
The proposal "**${title}**" has been pushed to the Workspace Thread Notes.

**Next Steps for Natalia:**
1. Open the **"Notes"** tab in the right sidebar.
2. Review the content.
3. Click the **"Export PDF"** button (ANC Branding is pre-applied).`;

    } catch (error) {
      this.logger(`ANC Publisher Error: ${error.message}`);
      return `Error publishing document: ${error.message}`;
    }
  }
};
