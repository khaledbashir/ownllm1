import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  X,
  Send,
  Minimize2,
  Maximize2,
  FileText,
  Copy,
  Download,
  MessageSquare,
  AlertCircle
} from 'lucide-react';

/**
 * AIAssistantPanel Component
 * 
 * Premium AI assistant panel for proposal interactions:
 * - Collapsible side panel (right side)
 * - Chat input for questions
 * - AI summary of proposal
 * - Highlight relevant sections
 * - Export to markdown
 * - "Ask about this section" context-aware
 */

const AIAssistantPanel = ({
  isOpen: externalOpen,
  onToggle,
  proposalData,
  selectedSection,
  onAskQuestion,
  onHighlightSection,
  onExportMarkdown
}) => {
  const [isOpen, setIsOpen] = useState(externalOpen ?? false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' | 'summary' | 'highlights'
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Sync with external open state
  useEffect(() => {
    setIsOpen(externalOpen ?? false);
  }, [externalOpen]);

  // Focus input when chat tab opens
  useEffect(() => {
    if (activeTab === 'chat' && isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [activeTab, isOpen, isMinimized]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const togglePanel = () => {
    const newState = !isOpen;
    setIsOpen(newState);
    if (onToggle) {
      onToggle(newState);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Call the onAskQuestion callback with the user's message
      const response = await onAskQuestion?.(input.trim(), selectedSection);

      const aiMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response || 'I apologize, but I could not process your request. Please try again.',
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Sorry, I encountered an error while processing your request. Please try again later.',
        isError: true,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const exportAsMarkdown = () => {
    const markdown = messages
      .map(msg => `### ${msg.role === 'user' ? 'You' : 'AI Assistant'}\n\n${msg.content}\n\n---\n`)
      .join('\n');

    if (onExportMarkdown) {
      onExportMarkdown(markdown);
    }
  };

  const SummaryTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Sparkles className="w-4 h-4" />
        <span>AI-generated summary of your proposal</span>
      </div>

      {proposalData?.summary ? (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
            <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {proposalData.summary}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <FileText className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No summary available
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Start a conversation to generate a summary
          </p>
        </div>
      )}

      <button
        onClick={exportAsMarkdown}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
      >
        <Download className="w-4 h-4" />
        Export as Markdown
      </button>
    </div>
  );

  const HighlightsTab = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <FileText className="w-4 h-4" />
        <span>AI-identified important sections</span>
      </div>

      {proposalData?.highlights && proposalData.highlights.length > 0 ? (
        <div className="space-y-2">
          {proposalData.highlights.map((highlight, index) => (
            <button
              key={index}
              onClick={() => onHighlightSection?.(highlight)}
              className="
                w-full text-left p-3 bg-amber-50 dark:bg-amber-900/20
                border-2 border-amber-200 dark:border-amber-800
                rounded-lg hover:border-amber-400 dark:hover:border-amber-600
                transition-all duration-200
              "
            >
              <div className="flex items-start gap-3">
                <span className="flex-shrink-0 w-6 h-6 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center text-xs font-bold text-amber-800 dark:text-amber-200">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {highlight.title || 'Important Section'}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {highlight.description || 'Click to highlight this section'}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-2">
            No highlights yet
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Ask the AI to identify key sections
          </p>
        </div>
      )}
    </div>
  );

  const ChatTab = () => (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="p-4 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-full mb-4">
              <Sparkles className="w-10 h-10 text-purple-600 dark:text-purple-400" />
            </div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
              AI Assistant
            </h4>
            <p className="text-gray-500 dark:text-gray-400 mb-4 max-w-xs">
              Ask me anything about your proposal, and I'll help you analyze, summarize, and improve it.
            </p>
            {selectedSection && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full text-sm text-amber-700 dark:text-amber-400">
                <FileText className="w-4 h-4" />
                <span>Context: {selectedSection}</span>
              </div>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl px-4 py-3
                  ${message.role === 'user'
                    ? 'bg-purple-600 text-white'
                    : message.isError
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }
                `}
              >
                {message.isError && (
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4" />
                    <span className="font-semibold">Error</span>
                  </div>
                )}
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  {message.content}
                </div>
                <div className={`
                  flex items-center justify-end gap-2 mt-2
                  ${message.role === 'user' ? 'text-purple-200' : 'text-gray-500 dark:text-gray-400'}
                `}>
                  <span className="text-xs">{formatTime(message.timestamp)}</span>
                  {message.role === 'assistant' && (
                    <button
                      onClick={() => copyToClipboard(message.content)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  AI is thinking...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={
              selectedSection
                ? `Ask about "${selectedSection}"...`
                : 'Ask about your proposal...'
            }
            rows={1}
            className="
              flex-1 px-4 py-2 bg-white dark:bg-gray-800
              border border-gray-300 dark:border-gray-600
              rounded-xl resize-none focus:outline-none focus:ring-2
              focus:ring-purple-500 text-gray-900 dark:text-white
              placeholder-gray-400 dark:placeholder-gray-500
            "
            style={{
              minHeight: '42px',
              maxHeight: '120px'
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || isLoading}
            className="
              px-4 py-2 bg-purple-600 text-white rounded-xl
              hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-700
              disabled:cursor-not-allowed transition-colors flex items-center gap-2
            "
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Send</span>
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Press <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> to send, <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Shift</kbd> + <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">Enter</kbd> for new line
          </span>
        </div>
      </div>
    </div>
  );

  if (!isOpen) {
    // Collapsed button
    return (
      <button
        onClick={togglePanel}
        className="
          fixed right-4 top-1/2 -translate-y-1/2
          w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600
          hover:from-purple-700 hover:to-indigo-700
          flex items-center justify-center shadow-lg shadow-purple-500/30
          transform transition-all duration-300 hover:scale-110
          z-30
        "
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div
      className={`
        fixed right-4 top-4 bottom-4 w-96 max-w-[calc(100vw-2rem)]
        bg-white dark:bg-gray-800 rounded-2xl shadow-2xl
        flex flex-col border border-purple-200 dark:border-purple-800
        transition-all duration-300 ease-in-out z-30
        ${isMinimized ? 'h-16' : ''}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 rounded-lg">
            <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              AI Assistant
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Powered by your LLM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? (
              <Maximize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            ) : (
              <Minimize2 className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            )}
          </button>
          <button
            onClick={togglePanel}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('chat')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'chat'
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Chat
            </button>
            <button
              onClick={() => setActiveTab('summary')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'summary'
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <FileText className="w-4 h-4 inline mr-1" />
              Summary
            </button>
            <button
              onClick={() => setActiveTab('highlights')}
              className={`
                flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${activeTab === 'highlights'
                  ? 'text-purple-600 dark:text-purple-400 border-purple-600 dark:border-purple-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Sparkles className="w-4 h-4 inline mr-1" />
              Highlights
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeTab === 'chat' && <ChatTab />}
            {activeTab === 'summary' && <SummaryTab />}
            {activeTab === 'highlights' && <HighlightsTab />}
          </div>
        </>
      )}
    </div>
  );
};

export default AIAssistantPanel;