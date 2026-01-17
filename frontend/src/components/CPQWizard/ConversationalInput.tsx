import { useState } from "react";
import { MessageSquare, Send } from "lucide-react";

export default function ConversationalInput({
  value,
  onChange,
  isLoading = false,
}: {
  value: string;
  onChange: (value: string) => void;
  isLoading?: boolean;
}) {
  return (
    <div className="flex-1 h-full flex flex-col bg-slate-900 text-white p-4">
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
          <div className="mb-4">
            <h2 className="text-2xl font-bold tracking-tight mb-2 flex items-center gap-3">
              <MessageSquare size={24} className="text-blue-400" />
              Configure Your Proposal
            </h2>
            <p className="text-zinc-400 text-sm">
              Tell me about your LED display project in plain language. I'll extract the details and guide you through the configuration.
            </p>
          </div>

          <div className="flex-1 gap-2">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="e.g., I need a 40x20 outdoor scoreboard for Madison Square Garden, or paste your project brief here..."
              className="flex-1 min-h-[300px] w-full bg-slate-800 text-white border border-slate-700 rounded-lg p-4 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {isLoading && (
              <div className="absolute right-3 top-4">
                <div className="animate-spin rounded-full h-6 w-6 border-2 border-t-blue-500 border-t-transparent animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
