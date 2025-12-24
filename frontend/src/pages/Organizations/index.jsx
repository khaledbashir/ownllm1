import { useEffect, useState } from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import * as Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { Buildings } from "@phosphor-icons/react";
import Organization from "@/models/organization";
import OrganizationForm from "./OrganizationForm";
import OrganizationDetails from "./OrganizationDetails";
import OrganizationSettings from "./OrganizationSettings";
import { useModal } from "@/hooks/useModal";
import ModalWrapper from "@/components/ModalWrapper";
import CTAButton from "@/components/lib/CTAButton";
import { Trash, PencilSimple, Gear } from "@phosphor-icons/react";

export default function Organizations() {
  const { isOpen: isFormOpen, openModal: openFormModal, closeModal: closeFormModal } = useModal();
  const { isOpen: isDetailsOpen, openModal: openDetailsModal, closeModal: closeDetailsModal } = useModal();
  const { isOpen: isSettingsOpen, openModal: openSettingsModal, closeModal: closeSettingsModal } = useModal();

  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [viewMode, setViewMode] = useState("list");
  const [editingOrg, setEditingOrg] = useState(null);

  useEffect(() => {
    async function fetchOrganizations() {
      setLoading(true);
      const _organizations = await Organization.getAll();
      setOrganizations(_organizations?.organizations || []);
      setLoading(false);
    }
    fetchOrganizations();
  }, []);

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

  const handleSettings = (org) => {
    setSelectedOrg(org);
    openSettingsModal();
  };

  const handleSettingsClose = () => {
    closeSettingsModal();
    setSelectedOrg(null);
  };

  const handleSettingsUpdate = async () => {
    const _organizations = await Organization.getAll();
    setOrganizations(_organizations?.organizations || []);
  };

  const handleDelete = async (org) => {
    if (!confirm(`Are you sure you want to delete the organization "${org.name}"? This will remove all users and workspaces associated with this organization.`)) {
      return;
    }
    
    const response = await Organization.delete(org.id);
    if (response?.success || response?.error === null) {
      setOrganizations(organizations.filter(o => o.id !== org.id));
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

  return (
    <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
      <Sidebar />
      <div
        style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
        className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
      >
        <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16">
          <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2">
            <div className="items-center flex gap-x-4">
              <p className="text-lg leading-6 font-bold text-theme-text-primary">
                Organizations
              </p>
            </div>
            <p className="text-xs leading-[18px] font-base text-theme-text-secondary">
              Manage organizations and their plans, seat limits, and users.
            </p>
          </div>
          <div className="w-full justify-end flex">
            <CTAButton
              onClick={handleCreate}
              className="mt-3 mr-0 mb-4 md:-mb-6 z-10"
            >
              <Buildings className="h-4 w-4" weight="bold" /> Add organization
            </CTAButton>
          </div>
          <div className="overflow-x-auto">
            {organizations.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-theme-text-secondary">
                  No organizations found. Click "Add organization" to create one.
                </p>
              </div>
            ) : (
              <table className="w-full text-xs text-left rounded-lg min-w-[640px] border-spacing-0">
                <thead className="text-theme-text-secondary text-xs leading-[18px] font-bold uppercase border-white/10 border-b">
                  <tr>
                    <th scope="col" className="px-6 py-3 rounded-tl-lg">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Slug
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Plan
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3">
                      Seats
                    </th>
                    <th scope="col" className="px-6 py-3 rounded-tr-lg">
                      {" "}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {organizations.map((org) => (
                    <tr key={org.id} className="row-hover">
                      <td className="px-6 py-3 border-white/5 text-theme-text-primary">
                        <button
                          onClick={() => handleViewDetails(org)}
                          className="text-theme-button-cta hover:underline cursor-pointer"
                        >
                          {org.name}
                        </button>
                      </td>
                      <td className="px-6 py-3 border-white/5 text-theme-text-secondary">
                        {org.slug}
                      </td>
                      <td className="px-6 py-3 border-white/5">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          org.plan === 'free' ? 'bg-green-500/20 text-green-400' :
                          org.plan === 'pro' ? 'bg-blue-500/20 text-blue-400' :
                          org.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-6 py-3 border-white/5">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          org.status === 'active' ? 'bg-green-500/20 text-green-400' :
                          org.status === 'trial' ? 'bg-yellow-500/20 text-yellow-400' :
                          org.status === 'past_due' ? 'bg-orange-500/20 text-orange-400' :
                          org.status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                          org.status === 'canceled' ? 'bg-gray-500/20 text-gray-400' :
                          'bg-gray-500/20 text-gray-400'
                        }`}>
                          {org.status}
                        </span>
                      </td>
                      <td className="px-6 py-3 border-white/5 text-theme-text-secondary">
                        {org.seatLimit ? `${org.seatLimit}` : 'Unlimited'}
                      </td>
                      <td className="px-6 py-3 border-white/5">
                        <div className="flex items-center gap-x-2">
                          <button
                            onClick={() => handleViewDetails(org)}
                            className="text-theme-text-secondary hover:text-theme-text-primary"
                            title="View details"
                          >
                            <PencilSimple className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSettings(org)}
                            className="text-theme-text-secondary hover:text-theme-text-primary"
                            title="Settings"
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
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <ModalWrapper isOpen={isFormOpen}>
          <OrganizationForm
            closeModal={handleFormClose}
            onSubmit={handleFormSubmit}
            initialData={editingOrg}
            mode={viewMode}
          />
        </ModalWrapper>

        <ModalWrapper isOpen={isDetailsOpen}>
          <OrganizationDetails
            organization={selectedOrg}
            closeModal={closeDetailsModal}
            onEdit={handleEdit}
          />
        </ModalWrapper>

        <ModalWrapper isOpen={isSettingsOpen}>
          <OrganizationSettings
            organization={selectedOrg}
            closeModal={handleSettingsClose}
            onUpdate={handleSettingsUpdate}
          />
        </ModalWrapper>
      </div>
    </div>
  );
}
