import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import System from "@/models/system";
import showToast from "@/utils/toast";
import useLogo from "@/hooks/useLogo";
import illustration from "@/media/illustrations/login-illustration.svg";
import { useTranslation } from "react-i18next";

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginLogo } = useLogo();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);

  // Account information
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Organization information
  const [orgName, setOrgName] = useState("");
  const [orgSlug, setOrgSlug] = useState("");
  const [plan, setPlan] = useState("free");

  const PLANS = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for personal use and small teams",
      features: ["1 workspace", "500 documents", "5 team members"],
      price: "$0/month",
    },
    {
      id: "pro",
      name: "Pro",
      description: "For growing teams and organizations",
      features: ["Unlimited workspaces", "10,000 documents", "25 team members"],
      price: "$29/month",
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations with custom needs",
      features: [
        "Everything in Pro",
        "Custom integrations",
        "Priority support",
      ],
      price: "Contact us",
    },
  ];

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  const handleOrgNameChange = (e) => {
    const name = e.target.value;
    setOrgName(name);
    setOrgSlug(generateSlug(name));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      // First check if multi-user mode is enabled
      const settings = await System.keys();
      if (!settings?.MultiUserMode) {
        setError(
          "Multi-user mode is not enabled. Please contact administrator."
        );
        setLoading(false);
        return;
      }

      // Create organization and user in one go
      const response = await fetch("/api/public-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          email,
          orgName,
          orgSlug,
          plan,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.success === false) {
        setError(data.message || "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      showToast(data.message, "success");

      if (data.requiresEmailVerification) {
        navigate("/login", { state: { message: data.message } });
      } else {
        navigate("/login");
      }
    } catch (err) {
      setError(err.message || "An error occurred during registration");
      setLoading(false);
    }
  };

  const nextStep = () => {
    // Validate current step before proceeding
    if (step === 1) {
      if (!username || !email || !password || !confirmPassword) {
        setError("Please fill in all required fields");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }
    setError(null);
    setStep(step + 1);
  };

  const prevStep = () => {
    setError(null);
    setStep(step - 1);
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full overflow-x-hidden overflow-y-auto md:inset-0 h-[calc(100%-1rem)] h-full bg-theme-bg-primary flex flex-col md:flex-row items-center justify-center">
      <div
        style={{
          background: `
    radial-gradient(circle at center, transparent 40%, black 100%),
    linear-gradient(180deg, #85F8FF 0%, #65A6F2 100%)
  `,
          width: "575px",
          filter: "blur(150px)",
          opacity: "0.4",
        }}
        className="absolute left-0 top-0 z-0 h-full w-full"
      />
      <div className="hidden md:flex md:w-1/2 md:h-full md:items-center md:justify-center">
        <img
          className="w-full h-full object-contain z-50"
          src={illustration}
          alt="login illustration"
        />
      </div>
      <div className="flex flex-col items-center justify-center h-full w-full md:w-1/2 z-50 relative md:-mt-20 mt-0 !border-none bg-theme-bg-secondary md:bg-transparent">
        <img
          src={loginLogo}
          alt="Logo"
          className="hidden relative md:flex rounded-2xl w-fit m-4 z-30 md:top-12 absolute max-h-[65px]"
          style={{ objectFit: "contain" }}
        />

        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              nextStep();
            }}
            className="flex flex-col justify-center items-center relative rounded-2xl bg-theme-bg-secondary md:shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:px-12 py-12 -mt-4 md:mt-0"
          >
            <div className="flex items-start justify-between pt-11 pb-9 rounded-t">
              <div className="flex items-center flex-col gap-y-4">
                <h3 className="text-4xl md:text-2xl font-bold text-white text-center white-space-nowrap hidden md:block">
                  Create Account
                </h3>
                <p className="text-sm text-theme-text-secondary text-center">
                  Start your journey with us
                </p>
              </div>
            </div>

            <div className="w-full px-4 md:px-12">
              <div className="w-full flex flex-col gap-y-4">
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    placeholder="Choose a username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]"
                    required
                    autoComplete="off"
                  />
                </div>
                {error && (
                  <p className="text-red-400 text-sm px-6">Error: {error}</p>
                )}
              </div>
            </div>

            <div className="flex items-center md:p-12 md:px-0 px-6 mt-12 md:mt-0 space-x-2 border-gray-600 w-full flex-col gap-y-8">
              <button
                type="button"
                disabled={loading}
                className="md:text-primary-button md:bg-transparent text-dark-text text-sm font-bold focus:ring-4 focus:outline-none rounded-md border-[1.5px] border-primary-button md:h-[34px] h-[48px] md:hover:text-white md:hover:bg-primary-button bg-primary-button focus:z-10 w-full"
                onClick={nextStep}
              >
                {loading ? "Loading..." : "Continue"}
              </button>
              <button
                type="button"
                className="text-white text-sm flex gap-x-1 hover:text-primary-button hover:underline"
                onClick={() => navigate("/login")}
              >
                Already have an account? <b>Login</b>
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form
            onSubmit={handleRegister}
            className="flex flex-col justify-center items-center relative rounded-2xl bg-theme-bg-secondary md:shadow-[0_4px_14px_rgba(0,0,0,0.25)] md:px-12 py-12 -mt-4 md:mt-0"
          >
            <div className="flex items-start justify-between pt-11 pb-9 rounded-t">
              <div className="flex items-center flex-col gap-y-4">
                <h3 className="text-4xl md:text-2xl font-bold text-white text-center white-space-nowrap hidden md:block">
                  Create Your Organization
                </h3>
                <p className="text-sm text-theme-text-secondary text-center">
                  Set up your workspace
                </p>
              </div>
            </div>

            <div className="w-full px-4 md:px-12">
              <div className="w-full flex flex-col gap-y-4">
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Organization Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Acme Inc."
                    value={orgName}
                    onChange={handleOrgNameChange}
                    className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px]"
                    required
                    autoComplete="off"
                  />
                </div>
                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-2">
                    Organization Slug (URL)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary text-sm">
                      /org/
                    </span>
                    <input
                      type="text"
                      placeholder="acme-inc"
                      value={orgSlug}
                      onChange={(e) => setOrgSlug(e.target.value)}
                      className="border-none bg-theme-settings-input-bg text-theme-text-primary placeholder:text-theme-settings-input-placeholder focus:outline-primary-button active:outline-primary-button outline-none text-sm rounded-md p-2.5 w-full h-[48px] md:w-[300px] md:h-[34px] pl-16"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>

                <div className="w-full md:w-full md:px-0 px-6">
                  <label className="text-white text-sm font-bold block mb-3">
                    Select Your Plan
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {PLANS.map((planOption) => (
                      <div
                        key={planOption.id}
                        onClick={() => setPlan(planOption.id)}
                        className={`p-4 rounded-lg cursor-pointer border-2 transition-all ${
                          plan === planOption.id
                            ? "border-primary-button bg-primary-button/10"
                            : "border-theme-settings-input-bg hover:border-primary-button/50"
                        }`}
                      >
                        <h4 className="text-white font-bold mb-2">
                          {planOption.name}
                        </h4>
                        <p className="text-theme-text-secondary text-sm mb-3">
                          {planOption.description}
                        </p>
                        <p className="text-primary-button font-bold mb-3">
                          {planOption.price}
                        </p>
                        <ul className="text-theme-text-secondary text-xs space-y-1">
                          {planOption.features.map((feature, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span>✓</span> {feature}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-red-400 text-sm px-6">Error: {error}</p>
                )}
              </div>
            </div>

            <div className="flex items-center md:p-12 md:px-0 px-6 mt-12 md:mt-0 space-x-2 border-gray-600 w-full flex-col gap-y-4">
              <div className="flex gap-4 w-full">
                <button
                  type="button"
                  disabled={loading}
                  className="md:text-primary-button md:bg-transparent text-dark-text text-sm font-bold focus:ring-4 focus:outline-none rounded-md border-[1.5px] border-primary-button md:h-[34px] h-[48px] md:hover:text-white md:hover:bg-primary-button bg-primary-button focus:z-10 flex-1"
                  onClick={prevStep}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="md:text-primary-button md:bg-transparent text-dark-text text-sm font-bold focus:ring-4 focus:outline-none rounded-md border-[1.5px] border-primary-button md:h-[34px] h-[48px] md:hover:text-white md:hover:bg-primary-button bg-primary-button focus:z-10 flex-1"
                >
                  {loading ? "Creating Account..." : "Complete Registration"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
