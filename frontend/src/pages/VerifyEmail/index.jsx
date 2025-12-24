import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import showToast from "@/utils/toast";
import useLogo from "@/hooks/useLogo";
import illustration from "@/media/illustrations/login-illustration.svg";
import { useTranslation } from "react-i18next";

export default function VerifyEmail() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginLogo } = useLogo();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState(null);
  const [email, setEmail] = useState("");

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing");
      setLoading(false);
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await fetch(`/api/verify-email?token=${token}`);
      const data = await response.json();

      if (data.success) {
        setVerified(true);
        showToast.success("Email verified successfully!");
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        setError(data.message || "Failed to verify email");
      }
    } catch (err) {
      setError("An error occurred while verifying your email");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      showToast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("/api/resend-verification-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        showToast.success("Verification email sent successfully!");
      } else {
        showToast.error(data.message || "Failed to send verification email");
      }
    } catch (err) {
      showToast.error("An error occurred while sending email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-screen h-screen flex bg-theme-bg-primary overflow-hidden">
      <div className="flex-1/2 w-full max-w-[600px] m-auto px-4">
        <div className="flex flex-col justify-center h-full">
          <div className="w-full flex flex-col items-end justify-center mb-8">
            {loginLogo ? (
              <img
                src={loginLogo}
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            ) : (
              <div className="text-xl font-bold text-theme-text-primary">
                {t("common.app-name", "AnythingLLM")}
              </div>
            )}
          </div>

          <div className="w-full max-w-md mx-auto">
            <div className="bg-theme-bg-secondary rounded-lg shadow-lg p-8">
              <div className="mb-6 text-center">
                {loading ? (
                  <div className="text-theme-text-primary mb-4">
                    <svg
                      className="animate-spin h-12 w-12 mx-auto mb-4 text-theme-text-primary"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12c0-4.418 3.582-8 8-8V0h-2v12c0 4.418 3.582 8 8 8z"
                      ></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-theme-text-primary">
                      Verifying your email...
                    </h2>
                    <p className="text-theme-text-secondary mt-2">
                      Please wait while we verify your email address.
                    </p>
                  </div>
                ) : verified ? (
                  <div className="text-theme-text-primary mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
                      Email Verified!
                    </h2>
                    <p className="text-theme-text-secondary">
                      Your email has been verified successfully. You can now log in to
                      your account.
                    </p>
                    <p className="text-theme-text-secondary text-sm mt-4">
                      Redirecting to login page...
                    </p>
                  </div>
                ) : (
                  <div className="text-theme-text-primary mb-4">
                    <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-theme-text-primary mb-2">
                      Verification Failed
                    </h2>
                    <p className="text-theme-text-secondary mb-4">
                      {error || "Failed to verify your email"}
                    </p>
                  </div>
                )}
              </div>

              {!loading && !verified && (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-theme-text-primary mb-2"
                    >
                      Resend verification email
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 bg-theme-bg-primary border border-theme-border text-theme-text-primary rounded-md focus:outline-none focus:ring-2 focus:ring-accent"
                    />
                  </div>
                  <button
                    onClick={handleResendEmail}
                    disabled={loading}
                    className="w-full py-3 px-4 bg-accent text-white rounded-md hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? "Sending..." : "Resend Verification Email"}
                  </button>
                </div>
              )}

              {!loading && verified && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-accent hover:text-accent-hover font-medium transition-colors"
                  >
                    Go to Login Page
                  </button>
                </div>
              )}

              {!loading && !verified && (
                <div className="mt-6 text-center">
                  <button
                    onClick={() => navigate("/login")}
                    className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-theme-bg-secondary items-center justify-center p-12">
        <div className="max-w-lg">
          <img
            src={illustration}
            alt="Login Illustration"
            className="w-full h-auto"
          />
        </div>
      </div>
    </div>
  );
}
