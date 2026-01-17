import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import {
  Buildings,
  Users,
  SquaresFour,
  FileText,
  ChartLineUp,
  Plus,
  Gear,
  Trash,
  PencilSimple,
  Shield,
  UserPlus,
  CheckCircle,
  WarningCircle,
  XCircle,
  DotsThreeVertical,
} from "@phosphor-icons/react";
import Organization from "@/models/organization";
import OrganizationDetails from "../Organizations/OrganizationDetails";
import OrganizationForm from "../Organizations/OrganizationForm";
import { useModal } from "@/hooks/useModal";
import ModalWrapper from "@/components/ModalWrapper";
import CTAButton from "@/components/lib/CTAButton";

export default function SuperAdmin() {
  const {
    isOpen: isFormOpen,
    openModal: openFormModal,
    closeModal: closeFormModal,
  } = useModal();
  const {
    isOpen: isDetailsOpen,
    openModal: openDetailsModal,
    closeModal: closeDetailsModal,
  } = useModal();
  const {
    isOpen: isSettingsOpen,
    openModal: openSettingsModal,
    closeModal: closeSettingsModal,
  } = useModal();
  const {
    isOpen: isUsersOpen,
    openModal: openUsersModal,
    closeModal: closeUsersModal,
  } = useModal();
  const {
    isOpen: isWorkspacesOpen,
    openModal: openWorkspacesModal,
    closeModal: closeWorkspacesModal,
  } = useModal();

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [stats, setStats] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [activeDashboardTab, setActiveDashboardTab] = useState("overview");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlan, setFilterPlan] = useState("all");

  useEffect(() => {
    async function fetchData() {
      setLoading(true);

      const [orgsData, orgStats] = await Promise.all([
        Organization.getAll(),
        fetchSystemStats(),
      ]);

      setOrganizations(orgsData?.organizations || []);
      setStats(orgStats);
      setLoading(false);
    }

    fetchData();
  }, []);

  const fetchSystemStats = async () => {
    // Get stats across all organizations
    const orgs = await Organization.getAll();
    const organizations = orgs?.organizations || [];

    let totalUsers = 0;
    let totalWorkspaces = 0;
    let totalDocuments = 0;
    let activeOrgs = 0;
    let suspendedOrgs = 0;

    for (const org of organizations) {
      const stats = await Organization.getStats(org.id);
      totalUsers += stats?.stats?.userCount || 0;
      totalWorkspaces += stats?.stats?.workspaceCount || 0;
      totalDocuments += stats?.stats?.documentCount || 0;

      if (org.status === "active") activeOrgs++;
      if (org.status === "suspended") suspendedOrgs++;
    }

    return {
      totalOrganizations: organizations.length,
      totalUsers,
      totalWorkspaces,
      totalDocuments,
      activeOrgs,
      suspendedOrgs,
    };
  };

  const handleCreate = () => {
    setEditingOrg(null);
    setViewMode("create");
    openFormModal();
  };

  const handleEdit = (org) => {
    setEditingOrg(org);
    setViewMode("edit");
    openFormModal();
  };

  const handleViewDetails = (org) => {
    setSelectedOrg(org);
    openDetailsModal();
  };

  const handleDelete = async (org) => {
    if (
      !confirm(
        `Are you sure you want to delete organization "${org.name}"? This will remove all users and workspaces associated with this organization.`
      )
    ) {
      return;
    }

    const response = await Organization.delete(org.id);
    if (response?.success || response?.error === null) {
      setOrganizations(organizations.filter((o) => o.id !== org.id));
      // Refresh stats
      const orgStats = await fetchSystemStats();
      setStats(orgStats);
    }
  };

  const handleFormClose = () => {
    closeFormModal();
    setEditingOrg(null);
    setViewMode("list");
  };

  const handleFormSubmit = async (formData) => {
    let response;
    if (viewMode === "create") {
      response = await Organization.create(formData);
    } else {
      response = await Organization.update(editingOrg.id, formData);
    }

    if (response?.organization || response?.success) {
      handleFormClose();
      const _organizations = await Organization.getAll();
      setOrganizations(_organizations?.organizations || []);
      // Refresh stats
      const orgStats = await fetchSystemStats();
      setStats(orgStats);
    }
  };

  const handleSettings = (org) => {
    setSelectedOrg(org);
    openSettingsModal();
  };

  const handleSettingsClose = () => {
    closeSettingsModal();
    setSelectedOrg(null);
  };

  const handleUsers = (org) => {
    setSelectedOrg(org);
    openUsersModal();
  };

  const handleUsersClose = () => {
    closeUsersModal();
    setSelectedOrg(null);
  };

  const handleWorkspaces = (org) => {
    setSelectedOrg(org);
    openWorkspacesModal();
  };

  const handleWorkspacesClose = () => {
    closeWorkspacesModal();
    setSelectedOrg(null);
  };

  const handleToggleStatus = async (org) => {
    const newStatus = org.status === "active" ? "suspended" : "active";
    if (
      !confirm(
        `Are you sure you want to ${newStatus === "suspended" ? "suspend" : "activate"} organization "${org.name}"?`
      )
    ) {
      return;
    }

    const response = await Organization.update(org.id, { status: newStatus });
    if (response?.success) {
      const _organizations = await Organization.getAll();
      setOrganizations(_organizations?.organizations || []);
      const orgStats = await fetchSystemStats();
      setStats(orgStats);
    }
  };

  const handleUpdateOrgRole = async (orgId, newRole) => {
    const response = await Organization.update(orgId, { role: newRole });
    if (response?.success) {
      const _organizations = await Organization.getAll();
      setOrganizations(_organizations?.organizations || []);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
        <Sidebar />
        <div
          style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
          className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
        >
          <Skeleton.default
            height="80vh"
            width="100%"
            highlightColor="var(--theme-bg-primary)"
            baseColor="var(--theme-bg-secondary)"
            count={1}
            className="w-full p-4 rounded-b-2xl rounded-tr-2xl rounded-tl-sm mt-8"
            containerClassName="flex w-full"
          />
        </div>
      </div>
    );
  }

  const STATUS_COLORS = {
    active: "bg-green-500/20 text-green-400",
    trial: "bg-yellow-500/20 text-yellow-400",
    suspended: "bg-red-500/20 text-red-400",
    past_due: "bg-orange-500/20 text-orange-400",
    canceled: "bg-gray-500/20 text-gray-400",
  };

  const PLAN_COLORS = {
    free: "bg-green-500/20 text-green-400",
    pro: "bg-blue-500/20 text-blue-400",
    enterprise: "bg-purple-500/20 text-purple-400",
  };

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-white/10 border-b-2 mb-6">
            <div className="flex flex-col">
              <div className="flex items-center gap-x-4">
                <Shield
                  className="h-6 w-6 text-theme-button-primary"
                  weight="bold"
                />
                <p className="text-lg leading-6 font-bold text-theme-text-primary">
                  Super Admin Dashboard
                </p>
              </div>
              <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-1">
                Manage all organizations and system-wide settings
              </p>
            </div>
            <CTAButton
              onClick={handleCreate}
              className="mt-3 mr-0 mb-4 md:-mb-6 z-10"
            >
              <Plus className="h-4 w-4" weight="bold" /> Create Organization
            </CTAButton>
          </div>

          {/* System Statistics */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Buildings className="h-5 w-5 text-theme-button-cta" />
                  <p className="text-xs text-theme-text-secondary uppercase">
                    Total Organizations
                  </p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">
                  {stats.totalOrganizations}
                </p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="flex items-center gap-1 text-xs text-green-400">
                    <span className="w-2 h-2 rounded-full bg-green-400" />
                    {stats.activeOrgs} Active
                  </span>
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <span className="w-2 h-2 rounded-full bg-red-400" />
                    {stats.suspendedOrgs} Suspended
                  </span>
                </div>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-blue-400" />
                  <p className="text-xs text-theme-text-secondary uppercase">
                    Total Users
                  </p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">
                  {stats.totalUsers}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <SquaresFour className="h-5 w-5 text-purple-400" />
                  <p className="text-xs text-theme-text-secondary uppercase">
                    Total Workspaces
                  </p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">
                  {stats.totalWorkspaces}
                </p>
              </div>

              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  <p className="text-xs text-theme-text-secondary uppercase">
                    Total Documents
                  </p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          )}

          {/* Organizations Table */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-theme-text-primary">
                Organizations ({organizations.length})
              </h3>
              <div className="flex items-center gap-3">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search organizations..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-4 py-2 pl-10 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-theme-button-primary"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-secondary">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Status Filter */}
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                  <option value="past_due">Past Due</option>
                  <option value="canceled">Canceled</option>
                </select>

                {/* Plan Filter */}
                <select
                  value={filterPlan}
                  onChange={(e) => setFilterPlan(e.target.value)}
                  className="bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="all">All Plans</option>
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              {organizations.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-lg">
                  <Buildings className="h-12 w-12 mx-auto mb-4 text-theme-text-secondary" />
                  <p className="text-theme-text-secondary">
                    No organizations found. Click "Create Organization" to
                    create one.
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs text-left rounded-lg min-w-[1000px] border-spacing-0">
                  <thead className="text-theme-text-secondary text-xs leading-[18px] font-bold uppercase border-white/10 border-b">
                    <tr>
                      <th scope="col" className="px-4 py-3 rounded-tl-lg">
                        Name
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Slug
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Plan
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Status
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Seat Limit
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Created
                      </th>
                      <th scope="col" className="px-4 py-3 rounded-tr-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations
                      .filter((org) => {
                        const matchesSearch =
                          org.name
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase()) ||
                          org.slug
                            .toLowerCase()
                            .includes(searchTerm.toLowerCase());
                        const matchesStatus =
                          filterStatus === "all" || org.status === filterStatus;
                        const matchesPlan =
                          filterPlan === "all" || org.plan === filterPlan;
                        return matchesSearch && matchesStatus && matchesPlan;
                      })
                      .map((org) => (
                        <tr
                          key={org.id}
                          className="row-hover border-t border-white/5"
                        >
                          <td className="px-4 py-3 text-theme-text-primary font-medium">
                            <button
                              onClick={() => handleViewDetails(org)}
                              className="text-theme-button-cta hover:underline cursor-pointer flex items-center gap-2"
                            >
                              {org.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-theme-text-secondary">
                            <code className="bg-white/5 px-2 py-1 rounded text-xs">
                              @{org.slug}
                            </code>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${PLAN_COLORS[org.plan] || PLAN_COLORS.free}`}
                            >
                              {org.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[org.status] || STATUS_COLORS.canceled}`}
                            >
                              {org.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-theme-text-secondary">
                            {org.seatLimit ? `${org.seatLimit}` : "Unlimited"}
                          </td>
                          <td className="px-4 py-3 text-theme-text-secondary">
                            {new Date(org.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleUsers(org)}
                                className="p-1.5 rounded hover:bg-white/10 text-blue-400 hover:text-blue-300 transition-colors"
                                title="View Users"
                              >
                                <Users className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleWorkspaces(org)}
                                className="p-1.5 rounded hover:bg-white/10 text-purple-400 hover:text-purple-300 transition-colors"
                                title="View Workspaces"
                              >
                                <SquaresFour className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleSettings(org)}
                                className="p-1.5 rounded hover:bg-white/10 text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                                title="Settings"
                              >
                                <Gear className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(org)}
                                className={`p-1.5 rounded hover:bg-white/10 transition-colors ${
                                  org.status === "active"
                                    ? "text-red-400 hover:text-red-300"
                                    : "text-green-400 hover:text-green-300"
                                }`}
                                title={
                                  org.status === "active"
                                    ? "Suspend organization"
                                    : "Activate organization"
                                }
                              >
                                {org.status === "active" ? (
                                  <XCircle className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </button>
                              <button
                                onClick={() => handleDelete(org)}
                                className="p-1.5 rounded hover:bg-white/10 text-red-400 hover:text-red-300 transition-colors"
                                title="Delete organization"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Form Modal */}
        <ModalWrapper isOpen={isFormOpen}>
          <OrganizationForm
            closeModal={handleFormClose}
            onSubmit={handleFormSubmit}
            initialData={editingOrg}
            mode={viewMode}
          />
        </ModalWrapper>

        {/* Details Modal */}
        <ModalWrapper isOpen={isDetailsOpen}>
          <OrganizationDetails
            organization={selectedOrg}
            closeModal={closeDetailsModal}
            onEdit={handleEdit}
          />
        </ModalWrapper>

        {/* Settings Modal */}
        {selectedOrg && (
          <ModalWrapper isOpen={isSettingsOpen}>
            <div className="bg-theme-bg-secondary w-full max-w-3xl rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-theme-text-primary">
                  Organization Settings - {selectedOrg.name}
                </h2>
                <button
                  onClick={handleSettingsClose}
                  className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
                >
                  <X className="h-6 w-6" weight="bold" />
                </button>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                    General Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-text-primary mb-2">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedOrg.name}
                        id="settings-name"
                        className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-theme-text-primary mb-2">
                        Slug
                      </label>
                      <input
                        type="text"
                        defaultValue={selectedOrg.slug}
                        id="settings-slug"
                        className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                    Plan & Status
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-theme-text-primary mb-2">
                        Plan
                      </label>
                      <select
                        id="settings-plan"
                        defaultValue={selectedOrg.plan}
                        className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
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
                        id="settings-status"
                        defaultValue={selectedOrg.status}
                        className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
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
                        Admin Role
                      </label>
                      <select
                        id="settings-role"
                        defaultValue={selectedOrg.role || "default"}
                        className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
                      >
                        <option value="default">Default</option>
                        <option value="admin">Admin</option>
                      </select>
                      <p className="text-xs text-theme-text-secondary mt-1">
                        Admin organizations get special privileges
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
                    Seat Limit
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-theme-text-primary mb-2">
                      Maximum Users
                    </label>
                    <input
                      type="number"
                      defaultValue={selectedOrg.seatLimit || ""}
                      id="settings-seats"
                      placeholder="Unlimited"
                      className="w-full bg-theme-settings-input-bg text-theme-settings-input-text border border-white/10 rounded-lg px-3 py-2.5"
                    />
                    <p className="text-xs text-theme-text-secondary mt-1">
                      Leave empty for unlimited users
                    </p>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                  <button
                    onClick={handleSettingsClose}
                    className="px-4 py-2.5 text-sm font-medium text-theme-text-primary border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={async () => {
                      const name =
                        document.getElementById("settings-name").value;
                      const slug =
                        document.getElementById("settings-slug").value;
                      const plan =
                        document.getElementById("settings-plan").value;
                      const status =
                        document.getElementById("settings-status").value;
                      const role =
                        document.getElementById("settings-role").value;
                      const seatLimit =
                        document.getElementById("settings-seats").value;

                      const response = await Organization.update(
                        selectedOrg.id,
                        {
                          name,
                          slug,
                          plan,
                          status,
                          role,
                          seatLimit: seatLimit ? Number(seatLimit) : null,
                        }
                      );

                      if (response?.success) {
                        const _organizations = await Organization.getAll();
                        setOrganizations(_organizations?.organizations || []);
                        const orgStats = await fetchSystemStats();
                        setStats(orgStats);
                        handleSettingsClose();
                      } else {
                        alert(
                          response?.error || "Failed to update organization"
                        );
                      }
                    }}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover rounded-lg transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </ModalWrapper>
        )}

        {/* Users Modal */}
        {selectedOrg && (
          <ModalWrapper isOpen={isUsersOpen}>
            <OrganizationUsersModal
              organization={selectedOrg}
              closeModal={handleUsersClose}
            />
          </ModalWrapper>
        )}

        {/* Workspaces Modal */}
        {selectedOrg && (
          <ModalWrapper isOpen={isWorkspacesOpen}>
            <OrganizationWorkspacesModal
              organization={selectedOrg}
              closeModal={handleWorkspacesClose}
            />
          </ModalWrapper>
        )}
      </div>
    </div>
  );
}

// Sub-component: Organization Users Modal
function OrganizationUsersModal({ organization, closeModal }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const data = await Organization.getUsers(organization.id);
      setUsers(data?.users || []);
      setLoading(false);
    }
    fetchUsers();
  }, [organization.id]);

  return (
    <div className="bg-theme-bg-secondary w-full max-w-2xl rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-theme-text-primary">
            Users - {organization.name}
          </h2>
          <p className="text-sm text-theme-text-secondary">
            {users.length} user(s)
          </p>
        </div>
        <button
          onClick={closeModal}
          className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          <X className="h-6 w-6" weight="bold" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[70vh]">
        {loading ? (
          <div className="p-8 text-center text-theme-text-secondary">
            Loading...
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-theme-text-secondary" />
            <p className="text-theme-text-secondary">
              No users found in this organization.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-theme-text-secondary text-xs font-bold uppercase bg-white/5">
              <tr>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-white/5">
                  <td className="px-6 py-3 text-theme-text-primary font-medium">
                    {user.username}
                  </td>
                  <td className="px-6 py-3 text-theme-text-secondary">
                    {user.email || "-"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.role === "admin"
                          ? "bg-purple-500/20 text-purple-400"
                          : user.role === "manager"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-gray-500/20 text-gray-400"
                      }`}
                    >
                      {user.role || "default"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        user.suspended
                          ? "bg-red-500/20 text-red-400"
                          : "bg-green-500/20 text-green-400"
                      }`}
                    >
                      {user.suspended ? "Suspended" : "Active"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// Sub-component: Organization Workspaces Modal
function OrganizationWorkspacesModal({ organization, closeModal }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWorkspaces() {
      setLoading(true);
      const data = await Organization.getWorkspaces(organization.id);
      setWorkspaces(data?.workspaces || []);
      setLoading(false);
    }
    fetchWorkspaces();
  }, [organization.id]);

  return (
    <div className="bg-theme-bg-secondary w-full max-w-2xl rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-b border-white/10">
        <div>
          <h2 className="text-xl font-bold text-theme-text-primary">
            Workspaces - {organization.name}
          </h2>
          <p className="text-sm text-theme-text-secondary">
            {workspaces.length} workspace(s)
          </p>
        </div>
        <button
          onClick={closeModal}
          className="text-theme-text-secondary hover:text-theme-text-primary transition-colors"
        >
          <X className="h-6 w-6" weight="bold" />
        </button>
      </div>
      <div className="overflow-y-auto max-h-[70vh]">
        {loading ? (
          <div className="p-8 text-center text-theme-text-secondary">
            Loading...
          </div>
        ) : workspaces.length === 0 ? (
          <div className="p-8 text-center">
            <SquaresFour className="h-12 w-12 mx-auto mb-4 text-theme-text-secondary" />
            <p className="text-theme-text-secondary">
              No workspaces found in this organization.
            </p>
          </div>
        ) : (
          <table className="w-full text-xs text-left">
            <thead className="text-theme-text-secondary text-xs font-bold uppercase bg-white/5">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Slug</th>
                <th className="px-6 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => (
                <tr key={ws.id} className="border-t border-white/5">
                  <td className="px-6 py-3 text-theme-text-primary font-medium">
                    {ws.name}
                  </td>
                  <td className="px-6 py-3 text-theme-text-secondary">
                    {ws.slug}
                  </td>
                  <td className="px-6 py-3 text-theme-text-secondary">
                    {new Date(ws.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
