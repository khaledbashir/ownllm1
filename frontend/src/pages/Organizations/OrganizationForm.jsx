import { useState, useEffect } from "react";
import { X } from "@phosphor-icons/react";
import Organization from "@/models/organization";

export default function OrganizationForm({ closeModal, onSubmit, initialData = null, mode = "create" }) {
  const [name, setName] = useState(initialData?.name || "");
  const [slug, setSlug] = useState(initialData?.slug || "");
  const [plan, setPlan] = useState(initialData?.plan || "free");
  const [seatLimit, setSeatLimit] = useState(initialData?.seatLimit || "");
  const [status, setStatus] = useState(initialData?.status || "active");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (name && !initialData?.slug) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const formData = {
      name,
      slug,
      plan,
      seatLimit: seatLimit ? Number(seatLimit) : null,
      status,
    };

    const response = await onSubmit(formData);
    
    if (response?.error) {
      alert(response.error);
    }
    
    setLoading(false);
  };

  return (
    <div
      className="bg-theme-bg-secondary w-full max-w-md rounded-lg shadow-2xl p-6"
    >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-theme-text-primary">
            {mode === "create" ? "Create Organization" : "Edit Organization"}
          </h2>
          <button
            onClick={closeModal}
            className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
          >
            <X className="h-6 w-6" weight="bold" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              minLength={2}
              maxLength={255}
              className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
              placeholder="Organization name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Slug <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              minLength={3}
              maxLength={100}
              pattern="[a-z0-9\-]+"
              className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
              placeholder="organization-name"
            />
            <p className="text-xs text-theme-text-secondary mt-1">
              URL-friendly identifier (lowercase letters, numbers, and hyphens)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Plan
            </label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
            >
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
              <option value="past_due">Past Due</option>
              <option value="canceled">Canceled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-theme-text-primary mb-2">
              Seat Limit (leave empty for unlimited)
            </label>
            <input
              type="number"
              value={seatLimit}
              onChange={(e) => setSeatLimit(e.target.value)}
              min={1}
              className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5 focus:outline-primary-button focus:outline-2 focus:ring-primary-button"
              placeholder="Maximum users"
            />
            <p className="text-xs text-theme-text-secondary mt-1">
              Maximum number of users allowed in this organization
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2.5 text-sm font-medium text-theme-text-secondary hover:text-theme-text-primary transition-colors rounded-lg border border-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover disabled:opacity-50 transition-colors rounded-lg"
            >
              {loading ? "Saving..." : mode === "create" ? "Create" : "Save"}
            </button>
          </div>
        </form>
      </div>
  );
}
