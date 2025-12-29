const prisma = require("../utils/prisma");

const ProposalComments = {
  writable: [],

  create: async (data) => {
    try {
      const comment = await prisma.proposal_comments.create({
        data,
      });
      return { comment, message: "Comment created successfully" };
    } catch (error) {
      console.error("[ProposalComments] Create error:", error);
      return { comment: null, message: error.message };
    }
  },

  get: async (proposalId, options = {}) => {
    try {
      const { limit = 50, offset = 0, includeReplies = true } = options;
      
      const comments = await prisma.proposal_comments.findMany({
        where: { proposalId, parentId: null }, // Only top-level comments
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      if (includeReplies) {
        // Fetch replies for each comment
        const commentIds = comments.map(c => c.id);
        const replies = await prisma.proposal_comments.findMany({
          where: { parentId: { in: commentIds } },
          orderBy: { createdAt: 'asc' },
        });

        // Group replies by parentId
        const repliesByParent = {};
        replies.forEach(reply => {
          if (!repliesByParent[reply.parentId]) {
            repliesByParent[reply.parentId] = [];
          }
          repliesByParent[reply.parentId].push(reply);
        });

        // Attach replies to comments
        return comments.map(comment => ({
          ...comment,
          replies: repliesByParent[comment.id] || [],
        }));
      }

      return comments;
    } catch (error) {
      console.error("[ProposalComments] Get error:", error);
      return [];
    }
  },

  updateReaction: async (commentId, emoji, userEmail) => {
    try {
      const comment = await prisma.proposal_comments.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        return { success: false, message: "Comment not found" };
      }

      let reactions = comment.reactions ? JSON.parse(comment.reactions) : [];
      
      // Check if user already reacted with this emoji
      const existingReaction = reactions.find(
        r => r.emoji === emoji && r.users.includes(userEmail)
      );

      if (existingReaction) {
        // Remove reaction (toggle off)
        existingReaction.users = existingReaction.users.filter(u => u !== userEmail);
        existingReaction.count--;
        if (existingReaction.count <= 0) {
          reactions = reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add reaction
        const reaction = reactions.find(r => r.emoji === emoji);
        if (reaction) {
          reaction.users.push(userEmail);
          reaction.count++;
        } else {
          reactions.push({
            emoji,
            count: 1,
            users: [userEmail],
          });
        }
      }

      await prisma.proposal_comments.update({
        where: { id: commentId },
        data: { reactions: JSON.stringify(reactions) },
      });

      return { success: true, reactions };
    } catch (error) {
      console.error("[ProposalComments] Update reaction error:", error);
      return { success: false, message: error.message };
    }
  },

  countUnread: async (proposalId, lastViewTime) => {
    try {
      if (!lastViewTime) {
        return await prisma.proposal_comments.count({
          where: { proposalId },
        });
      }

      const count = await prisma.proposal_comments.count({
        where: {
          proposalId,
          createdAt: { gt: new Date(lastViewTime) },
        },
      });

      return count;
    } catch (error) {
      console.error("[ProposalComments] Count unread error:", error);
      return 0;
    }
  },

  delete: async (commentId) => {
    try {
      // Delete comment and all replies (cascade in schema)
      await prisma.proposal_comments.delete({
        where: { id: commentId },
      });

      return { success: true, message: "Comment deleted" };
    } catch (error) {
      console.error("[ProposalComments] Delete error:", error);
      return { success: false, message: error.message };
    }
  },
};

module.exports = { ProposalComments };