import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CircleNotch, Warning, CheckCircle } from "@phosphor-icons/react";
import { API_BASE } from "@/utils/constants";

export default function ClientPortalVerify() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setError("No verification token found.");
            return;
        }

        verifyToken();
    }, [token]);

    const verifyToken = async () => {
        try {
            const response = await fetch(`${API_BASE}/v1/auth/verify-magic-link`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token }),
            });

            const data = await response.json();

            if (data.success && data.token) {
                // Store session token
                localStorage.setItem("anythingllm_client_auth", data.token);
                setStatus("success");
                // Redirect to dashboard after delay
                setTimeout(() => {
                    navigate("/portal/dashboard");
                }, 1500);
            } else {
                setStatus("error");
                setError(data.error || "Invalid or expired token.");
            }
        } catch (err) {
            setStatus("error");
            setError("Failed to verify token. Please try logging in again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 text-center">
                {status === "verifying" && (
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 text-blue-400">
                            <CircleNotch size={32} weight="bold" className="animate-spin" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Verifying your link...</h2>
                        <p className="text-gray-500 text-sm">Please wait while we log you in.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col items-center animate-fade-in-up">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 text-emerald-400">
                            <CheckCircle size={32} weight="fill" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Successfully Verified!</h2>
                        <p className="text-gray-500 text-sm">Redirecting to your dashboard...</p>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col items-center animate-shake">
                        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 text-red-400">
                            <Warning size={32} weight="bold" />
                        </div>
                        <h2 className="text-xl font-semibold text-white mb-2">Verification Failed</h2>
                        <p className="text-gray-400 text-sm mb-6">{error}</p>
                        <button
                            onClick={() => navigate("/portal/login")}
                            className="px-6 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors text-sm font-medium border border-white/10"
                        >
                            Back to Login
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
