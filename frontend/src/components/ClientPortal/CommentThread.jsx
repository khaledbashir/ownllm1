import React, { useState, useRef, useEffect } from "react";
import {
  ChatCircle,
  Paperclip,
  At,
  ThumbsUp,
  Clock,
  Send,
  Plus,
  X,
} from "@phosphor-icons/react";

/**
 * CommentThread - Discussion system with threaded replies
 * Supports rich text, mentions, attachments, markdown
 */

export default function CommentThread({
  comments = [],
  currentUser = null,
  onAddComment,
  onReply,
  onReaction,
  unreadCount = 0,
  loading = false,
}) {
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState(new Set());
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [newComment]);

  const handleSubmit = () => {
    if (!newComment.trim()) return;

    if (replyTo) {
      // Submit reply
      onReply?.(replyTo.id, replyText);
      setReplyText("");
      setReplyTo(null);
    } else {
      // Submit new comment
      onAddComment?.(newComment);
      setNewComment("");
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleReply = (comment) => {
    setReplyTo(comment);
    setReplyText("");
    setTimeout(() => textareaRef.current?.focus(), 100);
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
  };

  const formatTimestamp = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const getAvatarColor = (name) => {
    const colors = [
      "from-pink-400 to-pink-600",
      "from-purple-400 to-purple-600",
      "from-blue-400 to-blue-600",
      "from-green-400 to-green-600",
      "from-orange-400 to-orange-600",
      "from-teal-400 to-teal-600",
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="w-full space-y-6">
      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
          <div className="flex items-center gap-2">
            <ChatCircle size={20} weight="bold" className="text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-900">
              {unreadCount} unread {unreadCount === 1 ? "comment" : "comments"}
            </span>
          </div>
          <button className="text-sm font-medium text-indigo-600 hover:text-indigo-700">
            Mark as read
          </button>
        </div>
      )}

      {/* Reply Mode Indicator */}
      {replyTo && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-blue-700">Replying to</span>
            <span className="text-sm font-semibold text-blue-900">
              {replyTo.author}
            </span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="p-1 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-100"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Comment Input */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-200 bg-slate-50">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Attach file"
          >
            <Paperclip size={20} weight="bold" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />

          <button
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="Mention user"
          >
            <At size={20} weight="bold" />
          </button>

          <div className="flex-1" />

          <span className="text-xs text-slate-500">Markdown supported</span>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={replyTo ? replyText : newComment}
          onChange={(e) =>
            replyTo
              ? setReplyText(e.target.value)
              : setNewComment(e.target.value)
          }
          placeholder={
            replyTo
              ? `Write a reply to ${replyTo.author}...`
              : "Add a comment... (Markdown supported)"
          }
          className="w-full px-4 py-3 text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={3}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
          {loading ? (
            <div className="text-sm text-slate-500">Sending...</div>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={replyTo ? !replyText.trim() : !newComment.trim()}
              className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} weight="bold" />
              {replyTo ? "Reply" : "Post Comment"}
            </button>
          )}

          <span className="text-xs text-slate-500">
            {replyTo ? "Ctrl+Enter to reply" : "Ctrl+Enter to post"}
          </span>
        </div>
      </div>

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="text-center py-12">
            <ChatCircle
              size={48}
              weight="light"
              className="mx-auto mb-4 text-slate-300"
            />
            <p className="text-lg font-medium text-slate-600">
              No comments yet
            </p>
            <p className="text-sm text-slate-500">
              Be the first to start the discussion
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden"
            >
              {/* Comment Header */}
              <div className="flex items-start gap-3 px-4 py-3 bg-slate-50 border-b border-slate-200">
                {/* Avatar */}
                <div
                  className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getAvatarColor(
                    comment.author
                  )} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}
                >
                  {getInitials(comment.author)}
                </div>

                {/* Author + Time */}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {comment.author}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-slate-500">
                        <Clock size={14} weight="bold" />
                        <span className="text-xs">
                          {formatTimestamp(comment.createdAt)}
                        </span>
                      </div>
                      {comment.isUnread && (
                        <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {comment.role || "Contributor"}
                  </p>
                </div>
              </div>

              {/* Comment Body */}
              <div className="px-4 py-3">
                <div
                  className="prose prose-sm max-w-none text-slate-700"
                  dangerouslySetInnerHTML={{ __html: comment.content }}
                />
              </div>

              {/* Attachments */}
              {comment.attachments && comment.attachments.length > 0 && (
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                  <div className="flex flex-wrap gap-2">
                    {comment.attachments.map((attachment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all cursor-pointer"
                      >
                        <Paperclip size={16} className="text-slate-500" />
                        <span className="text-sm font-medium text-slate-700">
                          {attachment.name}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({(attachment.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between px-4 py-2 bg-slate-50 border-t border-slate-200">
                <div className="flex items-center gap-4">
                  {/* Like */}
                  <button
                    onClick={() => onReaction?.(comment.id, "like")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                      comment.likedBy?.includes(currentUser?.id)
                        ? "bg-pink-100 text-pink-600"
                        : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
                    }`}
                  >
                    <ThumbsUp
                      size={16}
                      weight={
                        comment.likedBy?.includes(currentUser?.id)
                          ? "fill"
                          : "bold"
                      }
                    />
                    <span className="text-sm font-medium">
                      {comment.likeCount || 0}
                    </span>
                  </button>

                  {/* Reply */}
                  <button
                    onClick={() => handleReply(comment)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    <ChatCircle size={16} weight="bold" />
                    <span className="text-sm font-medium">Reply</span>
                  </button>
                </div>
              </div>

              {/* Replies */}
              {comment.replies && comment.replies.length > 0 && (
                <div className="border-t border-slate-200 bg-slate-50">
                  <button
                    onClick={() => toggleReplies(comment.id)}
                    className="w-full px-4 py-2 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <span>
                      {expandedReplies.has(comment.id) ? "Hide" : "Show"}{" "}
                      {comment.replies.length}{" "}
                      {comment.replies.length === 1 ? "reply" : "replies"}
                    </span>
                  </button>

                  {expandedReplies.has(comment.id) && (
                    <div className="space-y-3 px-4 py-2">
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          className="bg-white border border-slate-200 rounded-lg p-3"
                        >
                          {/* Reply Header */}
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-8 h-8 rounded bg-gradient-to-br ${getAvatarColor(
                                reply.author
                              )} flex items-center justify-center text-white font-bold text-xs`}
                            >
                              {getInitials(reply.author)}
                            </div>
                            <div className="flex-1">
                              <span className="text-sm font-semibold text-slate-900">
                                {reply.author}
                              </span>
                              <div className="flex items-center gap-2 text-slate-500">
                                <Clock size={12} weight="bold" />
                                <span className="text-xs">
                                  {formatTimestamp(reply.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Reply Body */}
                          <div className="mt-2 text-sm text-slate-700">
                            {reply.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
