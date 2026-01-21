import { memo, useRef, useEffect } from "react";
import { Warning, Lightning } from "@phosphor-icons/react";
import UserIcon from "../../../../UserIcon";
import renderMarkdown from "@/utils/chat/markdown";
import Citations from "../Citation";
import {
  THOUGHT_REGEX_CLOSE,
  THOUGHT_REGEX_COMPLETE,
  THOUGHT_REGEX_OPEN,
  ThoughtChainComponent,
} from "../ThoughtContainer";
import { removeJsonBlockFromText } from "@/utils/quoteDataParser";

const PromptReply = ({
  uuid,
  reply,
  pending,
  error,
  workspace,
  sources = [],
  closed = true,
  onOpenQuoteSlider = () => {}, // Callback for manual quote extraction
}) => {
  // DEBUG: Log the reply to catch React Error #31
  if (reply && typeof reply !== "string") {
    console.error("[PromptReply] ERROR: reply is not a string!", {
      type: typeof reply,
      value: reply,
      keys: typeof reply === "object" ? Object.keys(reply) : null,
    });
    // Auto-fix: extract textResponse if it exists
    if (reply.textResponse) {
      reply = reply.textResponse;
    }
  }

  const assistantBackgroundColor = "bg-theme-bg-chat";

  if (!reply && sources.length === 0 && !pending && !error) return null;

  if (pending) {
    return (
      <div
        className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}
      >
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <div className="mt-3 ml-5 dot-falling light:invert"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}
      >
        <div className="py-6 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
          <div className="flex gap-x-5">
            <WorkspaceProfileImage workspace={workspace} />
            <span
              className={`inline-block p-2 rounded-lg bg-red-50 text-red-500`}
            >
              <Warning className="h-4 w-4 mb-1 inline-block" /> Could not
              respond to message.
              <span className="text-xs">Reason: {error || "unknown"}</span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={uuid}
      className={`flex justify-center items-end w-full ${assistantBackgroundColor}`}
    >
      <div className="py-8 px-4 w-full flex gap-x-5 md:max-w-[80%] flex-col">
            <div className="flex gap-x-5">
          <WorkspaceProfileImage workspace={workspace} />
          <div className="flex-1">
            <RenderAssistantChatContent
              key={`${uuid}-prompt-reply-content`}
              message={reply}
              onOpenQuoteSlider={onOpenQuoteSlider}
            />
          </div>
        </div>
        <Citations sources={sources} />
      </div>
    </div>
  );
};

export function WorkspaceProfileImage({ workspace }) {
  if (!!workspace.pfpUrl) {
    return (
      <div className="relative w-[35px] h-[35px] rounded-full flex-shrink-0 overflow-hidden">
        <img
          src={workspace.pfpUrl}
          alt="Workspace profile picture"
          className="absolute top-0 left-0 w-full h-full object-cover rounded-full bg-white"
        />
      </div>
    );
  }

  return <UserIcon user={{ uid: workspace.slug }} role="assistant" />;
}

function RenderAssistantChatContent({ message, onOpenQuoteSlider }) {
  const contentRef = useRef("");
  const thoughtChainRef = useRef(null);

  useEffect(() => {
    const thinking =
      message.match(THOUGHT_REGEX_OPEN) && !message.match(THOUGHT_REGEX_CLOSE);

    if (thinking && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(message);
      return;
    }

    const completeThoughtChain = message.match(THOUGHT_REGEX_COMPLETE)?.[0];
    const msgToRender = message.replace(THOUGHT_REGEX_COMPLETE, "");

    // Remove anc_quote_update JSON blocks from display (they're hidden system data)
    const msgToDisplay = removeJsonBlockFromText(msgToRender);

    if (completeThoughtChain && thoughtChainRef.current) {
      thoughtChainRef.current.updateContent(completeThoughtChain);
    }

    contentRef.current = msgToDisplay;
  }, [message]);

  const thinking =
    message.match(THOUGHT_REGEX_OPEN) && !message.match(THOUGHT_REGEX_CLOSE);
  if (thinking)
    return (
      <ThoughtChainComponent ref={thoughtChainRef} content="" expanded={true} />
    );

  return (
    <div className="flex flex-col gap-y-1">
      {message.match(THOUGHT_REGEX_COMPLETE) && (
        <ThoughtChainComponent
          ref={thoughtChainRef}
          content=""
          expanded={true}
        />
      )}
      <span
        className="break-words"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(contentRef.current) }}
      />
      {/* ANC Quote Action Button - Manual trigger for JSON extraction */}
      {message && message.includes('anc_quote_update') && (
        <button
          onClick={() => onOpenQuoteSlider(message)}
          className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 rounded-md transition-all"
          title="Extract quote data and open Proposal Engine"
        >
          <Lightning size={14} weight="fill" />
          Open in Estimator
        </button>
      )}
    </div>
  );
}

export default memo(PromptReply);
