import { useState, useEffect } from "react";
import { X, Gear, Bell, PaintBrush, CreditCard, Check, Users } from "@phosphor-icons/react";
import Organization from "@/models/organization";

export default function OrganizationSettings({ organization, closeModal, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [saveMessage, setSaveMessage] = useState(null);

  // General settings
  const [name, setName] = useState(organization?.name || "");
  const [slug, setSlug] = useState(organization?.slug || "");
  
  // Seat limit
  const [seatLimit, setSeatLimit] = useState(organization?.seatLimit || "");

  // Customization settings (placeholder)
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#3b82f6");

  // Notification settings (placeholder)
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [alertNotifications, setAlertNotifications] = useState(true);

  useEffect(() => {
    setName(organization?.name || "");
    setSlug(organization?.slug || "");
    setSeatLimit(organization?.seatLimit || "");
  }, [organization]);

  const handleSaveGeneral = async () => {
    setLoading(true);
    setSaveMessage(null);

    const updates = {
      name,
      slug,
    };

    const response = await Organization.update(organization.id, updates);
    
    if (response?.error) {
      alert(response.error);
    } else {
      setSaveMessage("Settings saved successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
      if (onUpdate) onUpdate();
    }
    
    setLoading(false);
  };

  const handleSaveSeatLimit = async () => {
    setLoading(true);
    setSaveMessage(null);

    const updates = {
      seatLimit: seatLimit ? Number(seatLimit) : null,
    };

    const response = await Organization.update(organization.id, updates);
    
    if (response?.error) {
      alert(response.error);
    } else {
      setSaveMessage("Seat limit updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
      if (onUpdate) onUpdate();
    }
    
    setLoading(false);
  };

  const TABS = [
    { id: "general", label: "General Settings", icon: Gear },
    { id: "billing", label: "Plan & Billing", icon: CreditCard },
    { id: "seats", label: "Seat Management", icon: Users },
    { id: "customization", label: "Customization", icon: PaintBrush },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div
      className="bg-theme-bg-secondary w-full max-w-3xl rounded-lg shadow-2xl max-h-[90vh] overflow-hidden"
    >
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-theme-text-primary">
            Organization Settings - {organization?.name}
          </h2>
          <button
            onClick={closeModal}
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        <div className="flex overflow-hidden max-h-[calc(90vh-80px)]">
          <div className="w-64 border-r border-white/10 p-4 overflow-y-auto">
            <div className="space-y-2">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? "bg-theme-button-primary text-white"
                        : "text-theme-text-secondary hover:text-theme-text-primary hover:bg-white/5"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
              {saveMessage && (
                <div className="flex items-center gap-2 mb-4 bg-green-500/20 text-green-400 px-4 py-3 rounded-lg">
                  <Check className="h-5 w-5" weight="bold" />
                  <span>{saveMessage}</span>
                </div>
              )}

              {activeTab === "general" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                      General Information
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-theme-text-primary mb-2">
                          Organization Name <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          required
                          minLength={2}
                          maxLength={255}
                          className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-theme-text-primary mb-2">
                          Organization Slug <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          required
                          minLength={3}
                          maxLength={100}
                          pattern="[a-z0-9-]+"
                          className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
                        />
                        <p className="text-xs text-theme-text-secondary mt-1">
                          URL-friendly identifier (lowercase letters, numbers, and hyphens)
                        </p>
                      </div>

                      <div className="pt-4">
                        <button
                          onClick={handleSaveGeneral}
                          disabled={loading}
                          className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover disabled:opacity-50 transition-colors rounded-lg"
                        >
                          {loading ? "Saving..." : "Save Changes"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "billing" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                      Plan & Billing
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-sm text-theme-text-secondary">Current Plan</p>
                          <p className="text-2xl font-bold text-theme-text-primary capitalize">
                            {organization?.plan}
                          </p>
                        </div>
                        <div className={`px-4 py-2 rounded-lg font-semibold ${
                          organization?.plan === 'free' ? 'bg-green-500/20 text-green-400' :
                          organization?.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-purple-500/20 text-purple-400'
                        }`}>
                          {organization?.plan?.toUpperCase()}
                        </div>
                      </div>

                      <div className="border-t border-white/10 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-text-secondary">Status</span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            organization?.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            organization?.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                            organization?.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {organization?.status?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-text-secondary">Seats</span>
                          <span className="text-sm text-theme-text-primary">
                            {organization?.seatLimit ? organization.seatLimit : "Unlimited"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-theme-text-secondary">Created</span>
                          <span className="text-sm text-theme-text-primary">
                            {organization?.createdAt ? new Date(organization.createdAt).toLocaleDateString() : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                      <p className="text-sm text-blue-400">
                        Billing management and plan upgrades will be available soon. Contact support for plan changes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "seats" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                      Seat Management
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6">
                      <div className="mb-4">
                        <p className="text-sm text-theme-text-secondary mb-2">
                          Set the maximum number of users allowed in this organization.
                          Leave empty for unlimited seats.
                        </p>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-theme-text-primary mb-2">
                            Seat Limit
                          </label>
                          <input
                            type="number"
                            value={seatLimit}
                            onChange={(e) => setSeatLimit(e.target.value)}
                            min={1}
                            className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
                            placeholder="Leave empty for unlimited"
                          />
                        </div>

                        <button
                          onClick={handleSaveSeatLimit}
                          disabled={loading}
                          className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover disabled:opacity-50 transition-colors rounded-lg"
                        >
                          {loading ? "Updating..." : "Update Seat Limit"}
                        </button>
                      </div>
                    </div>

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-400">
                        <strong>Note:</strong> Reducing the seat limit below the current number of users 
                        will prevent new user additions until seats become available.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "customization" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                      Customization
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6">
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-theme-text-primary mb-2">
                          Organization Logo
                        </label>
                        <input
                          type="url"
                          value={logoUrl}
                          onChange={(e) => setLogoUrl(e.target.value)}
                          className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
                          placeholder="https://example.com/logo.png"
                        />
                        <p className="text-xs text-theme-text-secondary mt-1">
                          Enter the URL of your organization logo
                        </p>
                      </div>

                      <div className="mb-4">
                        <label className="block text-sm font-medium text-theme-text-primary mb-2">
                          Primary Color
                        </label>
                        <div className="flex items-center gap-3">
                          <input
                            type="color"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="h-10 w-20 rounded border border-white/10"
                          />
                          <input
                            type="text"
                            value={primaryColor}
                            onChange={(e) => setPrimaryColor(e.target.value)}
                            className="flex-1 bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
                            placeholder="#3b82f6"
                          />
                        </div>
                      </div>

                      <div className="pt-4">
                        <p className="text-sm text-gray-400">
                          Customization features will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notifications" && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                      Notification Settings
                    </h3>
                    <div className="bg-white/5 rounded-lg p-6 space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-theme-text-primary">Email Notifications</p>
                          <p className="text-xs text-theme-text-secondary">
                            Receive email updates about your organization
                          </p>
                        </div>
                        <button
                          onClick={() => setEmailNotifications(!emailNotifications)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            emailNotifications ? "bg-theme-button-primary" : "bg-white/10"
                          }`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${
                              emailNotifications ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-theme-text-primary">Alert Notifications</p>
                          <p className="text-xs text-theme-text-secondary">
                            Receive alerts for important events
                          </p>
                        </div>
                        <button
                          onClick={() => setAlertNotifications(!alertNotifications)}
                          className={`w-12 h-6 rounded-full transition-colors ${
                            alertNotifications ? "bg-theme-button-primary" : "bg-white/10"
                          }`}
                        >
                          <span
                            className={`block w-5 h-5 rounded-full bg-white transform transition-transform ${
                              alertNotifications ? "translate-x-6" : "translate-x-0.5"
                            }`}
                          />
                        </button>
                      </div>

                      <div className="pt-4">
                        <p className="text-sm text-gray-400">
                          Notification features will be available in a future update.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-white/10 p-4">
              <button
                onClick={closeModal}
                className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
  );
}
