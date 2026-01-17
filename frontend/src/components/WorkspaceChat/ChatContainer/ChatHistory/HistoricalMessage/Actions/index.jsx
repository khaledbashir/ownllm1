import React, { memo, useState } from "react";
import useCopyText from "@/hooks/useCopyText";
import {
  Check,
  ThumbsUp,
  ArrowsClockwise,
  Copy,
  NotePencil,
  FileArrowDown,
} from "@phosphor-icons/react";
import Workspace from "@/models/workspace";
import { EditMessageAction } from "./EditMessage";
import RenderMetrics from "./RenderMetrics";
import ActionMenu from "./ActionMenu";
import { useTranslation } from "react-i18next";
import { NOTE_INSERT_EVENT } from "../../../index";

const Actions = ({
  message,
  feedbackScore,
  chatId,
  slug,
  isLastMessage,
  regenerateMessage,
  forkThread,
  isEditing,
  role,
  metrics = {},
  alignmentCls = "",
}) => {
  const { t } = useTranslation();
  const [selectedFeedback, setSelectedFeedback] = useState(feedbackScore);
  const handleFeedback = async (newFeedback) => {
    const updatedFeedback =
      selectedFeedback === newFeedback ? null : newFeedback;
    await Workspace.updateChatFeedback(chatId, slug, updatedFeedback);
    setSelectedFeedback(updatedFeedback);
  };

  return (
    <div className={`flex w-full justify-between items-center ${alignmentCls}`}>
      <div className="flex justify-start items-center gap-x-[8px]">
        <CopyMessage message={message} />
        <div className="md:group-hover:opacity-100 transition-all duration-300 md:opacity-0 flex justify-start items-center gap-x-[8px]">
          <EditMessageAction
            chatId={chatId}
            role={role}
            isEditing={isEditing}
          />
          {isLastMessage && !isEditing && (
            <RegenerateMessage
              regenerateMessage={regenerateMessage}
              slug={slug}
              chatId={chatId}
            />
          )}
          {chatId && role !== "user" && !isEditing && (
            <FeedbackButton
              isSelected={selectedFeedback === true}
              handleFeedback={() => handleFeedback(true)}
              tooltipId="feedback-button"
              tooltipContent={t("chat_window.good_response")}
              IconComponent={ThumbsUp}
            />
          )}
          {role !== "user" && !isEditing && <SaveToNotes message={message} />}
          {role !== "user" && !isEditing && (
            <DownloadExcel message={message} slug={slug} />
          )}
          <ActionMenu
            chatId={chatId}
            forkThread={forkThread}
            isEditing={isEditing}
            role={role}
          />
        </div>
      </div>
      <RenderMetrics metrics={metrics} />
    </div>
  );
};

function FeedbackButton({
  isSelected,
  handleFeedback,
  tooltipContent,
  IconComponent,
}) {
  return (
    <div className="mt-3 relative">
      <button
        onClick={handleFeedback}
        data-tooltip-id="feedback-button"
        data-tooltip-content={tooltipContent}
        className="text-zinc-300"
        aria-label={tooltipContent}
      >
        <IconComponent
          color="var(--theme-sidebar-footer-icon-fill)"
          size={20}
          className="mb-1"
          weight={isSelected ? "fill" : "regular"}
        />
      </button>
    </div>
  );
}

function CopyMessage({ message }) {
  const { copied, copyText } = useCopyText();
  const { t } = useTranslation();

  return (
    <>
      <div className="mt-3 relative">
        <button
          onClick={() => copyText(message)}
          data-tooltip-id="copy-assistant-text"
          data-tooltip-content={t("chat_window.copy")}
          className="text-zinc-300"
          aria-label={t("chat_window.copy")}
        >
          {copied ? (
            <Check
              color="var(--theme-sidebar-footer-icon-fill)"
              size={20}
              className="mb-1"
            />
          ) : (
            <Copy
              color="var(--theme-sidebar-footer-icon-fill)"
              size={20}
              className="mb-1"
            />
          )}
        </button>
      </div>
    </>
  );
}

function RegenerateMessage({ regenerateMessage, chatId }) {
  if (!chatId) return null;
  const { t } = useTranslation();
  return (
    <div className="mt-3 relative">
      <button
        onClick={() => regenerateMessage(chatId)}
        data-tooltip-id="regenerate-assistant-text"
        data-tooltip-content={t("chat_window.regenerate_response")}
        className="border-none text-zinc-300"
        aria-label={t("chat_window.regenerate")}
      >
        <ArrowsClockwise
          color="var(--theme-sidebar-footer-icon-fill)"
          size={20}
          className="mb-1"
          weight="fill"
        />
      </button>
    </div>
  );
}

function SaveToNotes({ message }) {
  const { t } = useTranslation();

  const handleSaveToNotes = () => {
    window.dispatchEvent(
      new CustomEvent(NOTE_INSERT_EVENT, {
        detail: { content: message },
      })
    );
  };

  return (
    <div className="mt-3 relative">
      <button
        onClick={handleSaveToNotes}
        data-tooltip-id="save-to-notes"
        data-tooltip-content="Save to Notes"
        className="text-theme-text-primary hover:text-theme-text-primary"
        aria-label="Save to Notes"
      >
        <NotePencil color="currentColor" size={20} className="mb-1" />
      </button>
    </div>
  );
}

function DownloadExcel({ message, slug }) {
  const { t } = useTranslation();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadExcel = async () => {
    try {
      setIsDownloading(true);

      // Extract quote data from message if it contains JSON
      let quoteData = null;
      try {
        // Try to find JSON in the message text
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          // Verify essential fields exist with valid values
          if (parsed.totalCost && parsed.totalCost > 0 && 
              parsed.screenWidth && parsed.screenWidth > 0 &&
              parsed.screenHeight && parsed.screenHeight > 0) {
            quoteData = parsed;
          }
        }
      } catch (e) {
        console.warn("Could not extract quote data from message:", e.message);
      }

      // If we couldn't get valid quote data from message, show helpful error
      if (!quoteData) {
        alert(
          "Unable to extract quote pricing data from this message. " +
          "The quote data may not have been fully calculated. " +
          "Please try:\n\n" +
          "1. Using the CPQ Wizard 'Generate Proposal' button\n" +
          "2. Regenerating the quote in chat\n" +
          "3. Checking that all pricing calculations are complete"
        );
        return;
      }

      if (!slug) {
        alert("Workspace slug not available");
        return;
      }

      const result = await Workspace.downloadAuditExcel(slug, quoteData);

      if (!result.success) {
        alert("Failed to download Excel: " + result.message);
      }
      // Success message handled by browser download
    } catch (error) {
      console.error("Error downloading Excel:", error);
      alert("Error downloading Excel file: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="mt-3 relative">
      <button
        onClick={handleDownloadExcel}
        disabled={isDownloading}
        data-tooltip-id="download-excel"
        data-tooltip-content="Download Excel Audit"
        className={`text-zinc-300 ${
          isDownloading ? "opacity-50 cursor-not-allowed" : ""
        }`}
        aria-label="Download Excel Audit"
      >
        <FileArrowDown
          color="var(--theme-sidebar-footer-icon-fill)"
          size={20}
          className="mb-1"
          weight={isDownloading ? "fill" : "regular"}
        />
      </button>
    </div>
  );
}

export default memo(Actions);
