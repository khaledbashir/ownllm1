import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Buildings, Users, SquaresFour, FileText, ChartLineUp, Plus, Gear, Trash, PencilSimple, Shield } from "@phosphor-icons/react";
import Organization from "@/models/organization";
import OrganizationDetails from "../Organizations/OrganizationDetails";
import OrganizationForm from "../Organizations/OrganizationForm";
import { useModal } from "@/hooks/useModal";
import ModalWrapper from "@/components/ModalWrapper";
import CTAButton from "@/components/lib/CTAButton";

export default function SuperAdmin() {
  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isDetailsOpen, openModal: openDetailsModal, closeModal: closeDetailsModal } = useModal();
  
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [stats, setStats] = useState(null);
  const [editingOrg, setEditingOrg] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      const [orgsData, orgStats] = await Promise.all([
        Organization.getAll(),
        fetchSystemStats()
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
      
      if (org.status === 'active') activeOrgs++;
      if (org.status === 'suspended') suspendedOrgs++;
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
    if (!confirm(`Are you sure you want to delete organization "${org.name}"? This will remove all users and workspaces associated with this organization.`)) {
      return;
    }
    
    const response = await Organization.delete(org.id);
    if (response?.success || response?.error === null) {
      setOrganizations(organizations.filter(o => o.id !== org.id));
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

  const handleToggleStatus = async (org) => {
    const newStatus = org.status === 'active' ? 'suspended' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'suspended' ? 'suspend' : 'activate'} organization "${org.name}"?`)) {
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
                <Shield className="h-6 w-6 text-theme-button-primary" weight="bold" />
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
                  <p className="text-xs text-theme-text-secondary uppercase">Total Organizations</p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">{stats.totalOrganizations}</p>
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
                  <p className="text-xs text-theme-text-secondary uppercase">Total Users</p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">{stats.totalUsers}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <SquaresFour className="h-5 w-5 text-purple-400" />
                  <p className="text-xs text-theme-text-secondary uppercase">Total Workspaces</p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">{stats.totalWorkspaces}</p>
              </div>
              
              <div className="bg-white/5 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  <p className="text-xs text-theme-text-secondary uppercase">Total Documents</p>
                </div>
                <p className="text-3xl font-bold text-theme-text-primary">{stats.totalDocuments}</p>
              </div>
            </div>
          )}

          {/* Organizations Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-theme-text-primary mb-4">
              Organizations
            </h3>
            <div className="overflow-x-auto">
              {organizations.length === 0 ? (
                <div className="text-center py-16 bg-white/5 rounded-lg">
                  <Buildings className="h-12 w-12 mx-auto mb-4 text-theme-text-secondary" />
                  <p className="text-theme-text-secondary">
                    No organizations found. Click "Create Organization" to create one.
                  </p>
                </div>
              ) : (
                <table className="w-full text-xs text-left rounded-lg min-w-[800px] border-spacing-0">
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
                        Seats
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Users
                      </th>
                      <th scope="col" className="px-4 py-3">
                        Workspaces
                      </th>
                      <th scope="col" className="px-4 py-3 rounded-tr-lg">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((org) => {
                      const orgStats = stats?.orgStats?.[org.id] || {};
                      return (
                        <tr key={org.id} className="row-hover">
                          <td className="px-4 py-3 border-white/5 text-theme-text-primary">
                            <button
                              onClick={() => handleViewDetails(org)}
                              className="text-theme-button-cta hover:underline cursor-pointer"
                            >
                              {org.name}
                            </button>
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            {org.slug}
                          </td>
                          <td className="px-4 py-3 border-white/5">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${PLAN_COLORS[org.plan] || PLAN_COLORS.free}`}>
                              {org.plan}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-white/5">
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[org.status] || STATUS_COLORS.canceled}`}>
                              {org.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            {org.seatLimit ? `${org.seatLimit}` : 'Unlimited'}
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            {orgStats?.userCount || '-'}
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            {orgStats?.workspaceCount || '-'}
                          </td>
                          <td className="px-4 py-3 border-white/5">
                            <div className="flex items-center gap-x-1">
                              <button
                                onClick={() => handleViewDetails(org)}
                                className="text-theme-text-secondary hover:text-theme-text-primary"
                                title="View details"
                              >
                                <PencilSimple className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(org)}
                                className={`${org.status === 'active' ? 'text-red-400 hover:text-red-300' : 'text-green-400 hover:text-green-300'}`}
                                title={org.status === 'active' ? 'Suspend organization' : 'Activate organization'}
                              >
                                <Gear className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(org)}
                                className="text-red-400 hover:text-red-300"
                                title="Delete organization"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
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
      </div>
    </div>
  );
}
