import React, { useRef, useState } from "react";
import { Paperclip, X, File, Image, FileText } from "@phosphor-icons/react";
import { Tooltip } from "react-tooltip";

/**
 * Get icon and color for file type
 */
function getFileIcon(file) {
    const type = file.type || "";
    if (type.startsWith("image/")) {
        return { Icon: Image, color: "text-green-400" };
    }
    if (type.includes("pdf") || type.includes("document")) {
        return { Icon: FileText, color: "text-red-400" };
    }
    return { Icon: File, color: "text-blue-400" };
}

/**
 * File attachment button and display for Flow Builder Chat
 * @param {Object} props
 * @param {Array} props.attachments - Current attachments
 * @param {function} props.onAttach - Callback when files are attached
 * @param {function} props.onRemove - Callback to remove attachment
 */
export default function AttachmentButton({ attachments = [], onAttach, onRemove }) {
    const fileInputRef = useRef(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            processFiles(files);
        }
        // Reset input so same file can be selected again
        e.target.value = "";
    };

    const processFiles = async (files) => {
        const processed = await Promise.all(
            files.map(async (file) => {
                // Read file as base64 for images, or just store file reference
                const isImage = file.type.startsWith("image/");
                let preview = null;

                if (isImage) {
                    preview = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result);
                        reader.readAsDataURL(file);
                    });
                }

                return {
                    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    preview,
                };
            })
        );
        onAttach?.(processed);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        const files = Array.from(e.dataTransfer.files || []);
        if (files.length > 0) {
            processFiles(files);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div
            className={`relative ${isDragOver ? "ring-2 ring-blue-500 ring-opacity-50 rounded-lg" : ""}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.md,.json,.csv,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
            />

            {/* Attachment chips */}
            {attachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                    {attachments.map((attachment) => {
                        const { Icon, color } = getFileIcon(attachment.file);
                        return (
                            <div
                                key={attachment.id}
                                className="flex items-center gap-1.5 px-2 py-1 bg-white/10 rounded-md text-xs text-white/80 group"
                            >
                                {attachment.preview ? (
                                    <img
                                        src={attachment.preview}
                                        alt={attachment.name}
                                        className="w-4 h-4 rounded object-cover"
                                    />
                                ) : (
                                    <Icon size={14} className={color} weight="fill" />
                                )}
                                <span className="max-w-[100px] truncate">{attachment.name}</span>
                                <span className="text-white/40">{formatSize(attachment.size)}</span>
                                <button
                                    onClick={() => onRemove?.(attachment.id)}
                                    className="p-0.5 hover:bg-white/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X size={12} className="text-white/60 hover:text-red-400" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Attach button */}
            <button
                type="button"
                onClick={handleClick}
                data-tooltip-id="attach-file-tooltip"
                data-tooltip-content="Attach files (images, documents)"
                className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white/80 transition-colors"
            >
                <Paperclip size={20} />
            </button>
            <Tooltip
                id="attach-file-tooltip"
                place="top"
                delayShow={300}
                className="tooltip !text-xs z-99"
            />
        </div>
    );
}
