import React, { useState, useRef, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  PencilSimple,
  Pen,
  Signature,
  Trash,
  Warning,
} from "@phosphor-icons/react";

/**
 * ApprovalPanel - Signature workflow for proposal approval
 * Supports digital signature (draw), typed signature, approve/decline/request changes
 */

export default function ApprovalPanel({
  proposalId = null,
  onApprove,
  onDecline,
  onRequestChanges,
  existingSignature = null,
  canApprove = true,
  requireCommentsOnDecline = true,
}) {
  const [mode, setMode] = useState("draw"); // "draw" | "type"
  const [signature, setSignature] = useState(existingSignature || "");
  const [isDrawing, setIsDrawing] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [changesRequested, setChangesRequested] = useState("");
  const [showReasonInput, setShowReasonInput] = useState(null); // "decline" | "changes" | null
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas setup
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    ctxRef.current = ctx;

    // Set canvas resolution for crisp drawing
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = 150 * dpr;
    ctx.scale(dpr, dpr);

    // Set default drawing style
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // If existing signature, render it
    if (existingSignature && mode === "draw") {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = existingSignature;
    }
  }, [existingSignature, mode]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const startDrawing = (e) => {
    if (!canApprove) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctxRef.current.beginPath();
    ctxRef.current.moveTo(x, y);
    setHasDrawn(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    ctxRef.current.lineTo(x, y);
    ctxRef.current.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    saveSignature();
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (mode === "draw") {
      const dataUrl = canvas.toDataURL("image/png");
      setSignature(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
    setSignature("");
  };

  const handleApprove = () => {
    if (!signature && !hasDrawn) {
      alert("Please provide a signature before approving");
      return;
    }
    onApprove?.({
      signature,
      timestamp: new Date().toISOString(),
    });
  };

  const handleDecline = () => {
    if (requireCommentsOnDecline && !declineReason.trim()) {
      alert("Please provide a reason for declining");
      return;
    }
    onDecline?.({
      reason: declineReason,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRequestChanges = () => {
    if (!changesRequested.trim()) {
      alert("Please describe the changes requested");
      return;
    }
    onRequestChanges?.({
      requestedChanges: changesRequested,
      timestamp: new Date().toISOString(),
    });
  };

  const getCurrentTime = () => {
    return new Date().toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
            <Signature size={24} weight="bold" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">
              Proposal Approval
            </h3>
            <p className="text-sm text-slate-600">
              Please review and sign to finalize this proposal
            </p>
          </div>
        </div>

        {!canApprove && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <Warning
              size={20}
              className="text-amber-600 flex-shrink-0 mt-0.5"
            />
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Read-Only Mode
              </p>
              <p className="text-xs text-amber-700">
                You do not have permission to approve this proposal
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Signature Mode Selection */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setMode("draw")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all ${
              mode === "draw"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Pen size={18} weight="bold" />
            Draw Signature
          </button>
          <button
            onClick={() => setMode("type")}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-all ${
              mode === "type"
                ? "bg-white text-indigo-600 border-b-2 border-indigo-600"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <PencilSimple size={18} weight="bold" />
            Type Signature
          </button>
        </div>

        {/* Draw Mode Canvas */}
        {mode === "draw" && (
          <div className="p-6">
            <div className="relative">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  startDrawing(touch);
                }}
                onTouchMove={(e) => {
                  e.preventDefault();
                  const touch = e.touches[0];
                  draw(touch);
                }}
                onTouchEnd={stopDrawing}
                className="w-full h-[150px] border-2 border-dashed border-slate-300 rounded-lg bg-white cursor-crosshair"
              />
              <button
                onClick={clearCanvas}
                className="absolute top-2 right-2 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Clear signature"
              >
                <Trash size={16} weight="bold" />
              </button>
            </div>
            <p className="text-xs text-slate-500 text-center mt-2">
              Sign above using your mouse or finger
            </p>
          </div>
        )}

        {/* Type Mode Input */}
        {mode === "type" && (
          <div className="p-6">
            <input
              type="text"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full name here..."
              className="w-full px-4 py-4 text-2xl font-semibold text-slate-900 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={!canApprove}
            />
            <p className="text-xs text-slate-500 text-center mt-2">
              Type your legal name to sign electronically
            </p>
          </div>
        )}
      </div>

      {/* Approval Timestamp */}
      {existingSignature && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle size={24} weight="fill" className="text-emerald-600" />
            <div>
              <p className="text-sm font-semibold text-emerald-900">
                Previously signed on{" "}
                {new Date(existingSignature.timestamp).toLocaleDateString()}
              </p>
              <p className="text-xs text-emerald-700">
                This proposal has been approved
              </p>
            </div>
          </div>
          {canApprove && (
            <button
              onClick={() => setSignature("")}
              className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
            >
              Resign
            </button>
          )}
        </div>
      )}

      {/* Action Buttons */}
      {canApprove && (
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Approve Button */}
          <button
            onClick={handleApprove}
            disabled={!signature && !hasDrawn}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-lg font-bold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle size={24} weight="fill" />
            Approve Proposal
          </button>

          {/* Decline Button */}
          <button
            onClick={() => setShowReasonInput("decline")}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-red-300 text-red-600 text-lg font-semibold rounded-xl hover:bg-red-50 hover:border-red-400 transition-all"
          >
            <XCircle size={24} weight="fill" />
            Decline
          </button>

          {/* Request Changes Button */}
          <button
            onClick={() => setShowReasonInput("changes")}
            className="flex-1 flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-amber-300 text-amber-600 text-lg font-semibold rounded-xl hover:bg-amber-50 hover:border-amber-400 transition-all"
          >
            <PencilSimple size={24} weight="bold" />
            Request Changes
          </button>
        </div>
      )}

      {/* Decline Reason Input */}
      {showReasonInput === "decline" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-red-900 mb-3">
            Reason for Declining
          </h4>
          <textarea
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            placeholder="Please explain why you're declining this proposal..."
            className="w-full px-4 py-3 text-sm text-slate-900 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
            rows={4}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowReasonInput(null)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleDecline}
              disabled={!declineReason.trim()}
              className="px-6 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirm Decline
            </button>
          </div>
        </div>
      )}

      {/* Request Changes Input */}
      {showReasonInput === "changes" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h4 className="text-lg font-bold text-amber-900 mb-3">
            Changes Requested
          </h4>
          <textarea
            value={changesRequested}
            onChange={(e) => setChangesRequested(e.target.value)}
            placeholder="Describe the changes you'd like to see in this proposal..."
            className="w-full px-4 py-3 text-sm text-slate-900 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            rows={4}
          />
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setShowReasonInput(null)}
              className="px-6 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              onClick={handleRequestChanges}
              disabled={!changesRequested.trim()}
              className="px-6 py-2 bg-amber-600 text-white text-sm font-semibold rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Submit Request
            </button>
          </div>
        </div>
      )}

      {/* Current Time Display */}
      <div className="bg-slate-100 rounded-lg px-4 py-2 text-center">
        <p className="text-xs font-medium text-slate-600">
          Your signature will be timestamped: {getCurrentTime()}
        </p>
      </div>

      {/* Legal Notice */}
      <div className="text-xs text-slate-500 text-center px-4">
        <p>
          By signing this proposal, you acknowledge that you have reviewed and
          agreed to the terms and pricing outlined above.
        </p>
        <p className="mt-1">
          This electronic signature has the same legal validity as a handwritten
          signature.
        </p>
      </div>
    </div>
  );
}
