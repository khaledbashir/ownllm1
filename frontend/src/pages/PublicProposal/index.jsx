import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FilePdf, CircleNotch, Warning, Check, PencilSimple } from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";

export default function PublicProposalView() {
    const { id } = useParams();
    const [proposal, setProposal] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showSignModal, setShowSignModal] = useState(false);

    useEffect(() => {
        fetchProposal();
    }, [id]);

    const fetchProposal = async () => {
        try {
            const response = await fetch(`${API_BASE}/proposal/${id}`);
            const data = await response.json();

            if (!data.success) {
                setError(data.error || "Proposal not found");
            } else {
                setProposal(data.proposal);
            }
        } catch (e) {
            setError("Failed to load proposal");
        } finally {
            setLoading(false);
        }
    };

    const handleDownloadPdf = async () => {
        // For now, just print - full PDF export would need backend endpoint
        window.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <CircleNotch className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                    <p className="text-gray-600">Loading proposal...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-md mx-auto p-8">
                    <Warning className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">
                        {error === "This proposal has expired." ? "Proposal Expired" : "Proposal Not Found"}
                    </h1>
                    <p className="text-gray-600">
                        {error}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Header Bar */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
                <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {proposal?.workspace?.pfpFilename && (
                            <img
                                src={`${API_BASE}/assets/${proposal.workspace.pfpFilename}`}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        )}
                        <div>
                            <p className="text-sm font-medium text-gray-800">
                                {proposal?.workspace?.name || "Proposal"}
                            </p>
                            <p className="text-xs text-gray-500">
                                Shared document
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleDownloadPdf}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <FilePdf className="w-4 h-4" />
                            Download PDF
                        </button>

                        {proposal?.status === "active" && (
                            <button
                                onClick={() => setShowSignModal(true)}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors"
                            >
                                <PencilSimple className="w-4 h-4" />
                                Sign & Accept
                            </button>
                        )}

                        {proposal?.status === "signed" && (
                            <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-700 bg-emerald-100 rounded-lg">
                                <Check className="w-4 h-4" />
                                Signed
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Proposal Content */}
            <main className="max-w-4xl mx-auto py-8 px-4">
                <div
                    className="bg-white rounded-xl shadow-lg p-8 md:p-12 prose prose-lg max-w-none"
                    dangerouslySetInnerHTML={{ __html: proposal?.htmlContent || "" }}
                />
            </main>

            {/* Sign Modal */}
            {showSignModal && (
                <SignatureModal
                    proposalId={id}
                    onClose={() => setShowSignModal(false)}
                    onSuccess={() => {
                        setShowSignModal(false);
                        fetchProposal(); // Refresh to show signed status
                    }}
                />
            )}
        </div>
    );
}

function SignatureModal({ proposalId, onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSign = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        setLoading(true);
        try {
            const response = await fetch(`${API_BASE}/proposal/${proposalId}/sign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    signatureData: {
                        name: name.trim(),
                        date: new Date().toISOString(),
                        ip: "client", // Server will capture real IP
                    },
                }),
            });

            const data = await response.json();
            if (data.success) {
                onSuccess();
            } else {
                alert(data.error || "Failed to sign");
            }
        } catch (e) {
            alert("Failed to sign proposal");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800">Sign & Accept</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        By signing, you accept the terms of this proposal.
                    </p>
                </div>

                <form onSubmit={handleSign} className="p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Your Full Name
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />

                    <p className="text-xs text-gray-500 mt-3">
                        Your signature will be recorded with timestamp and IP address.
                    </p>

                    <div className="flex gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !name.trim()}
                            className="flex-1 px-4 py-3 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <CircleNotch className="w-4 h-4 animate-spin" />
                                    Signing...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Sign & Accept
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
