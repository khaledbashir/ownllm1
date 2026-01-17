import { useState, useEffect } from "react";
import {
  X,
  Users,
  SquaresFour,
  FileText,
  WarningCircle,
} from "@phosphor-icons/react";
import Organization from "@/models/organization";

export default function OrganizationDetails({
  organization,
  closeModal,
  onEdit,
}) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [workspaces, setWorkspaces] = useState([]);
  const [remainingSeats, setRemainingSeats] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchOrganizationData() {
      if (!organization) return;

      setLoading(true);

      const [statsData, usersData, workspacesData, seatsData] =
        await Promise.all([
          Organization.getStats(organization.id),
          Organization.getUsers(organization.id),
          Organization.getWorkspaces(organization.id),
          Organization.getRemainingSeats(organization.id),
        ]);

      setStats(statsData?.stats || null);
      setUsers(usersData?.users || []);
      setWorkspaces(workspacesData?.workspaces || []);
      setRemainingSeats(seatsData?.remainingSeats || null);

      setLoading(false);
    }

    fetchOrganizationData();
  }, [organization]);

  const PLAN_COLORS = {
    free: "bg-green-500/20 text-green-400",
    pro: "bg-blue-500/20 text-blue-400",
    enterprise: "bg-purple-500/20 text-purple-400",
  };

  const STATUS_COLORS = {
    active: "bg-green-500/20 text-green-400",
    trial: "bg-yellow-500/20 text-yellow-400",
    suspended: "bg-red-500/20 text-red-400",
    past_due: "bg-orange-500/20 text-orange-400",
    canceled: "bg-gray-500/20 text-gray-400",
  };

  if (loading || !organization) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 w-8 rounded bg-white/10 mb-4"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-theme-bg-secondary w-full max-w-2xl rounded-lg shadow-2xl max-h-[90vh] overflow-hidden">
      <div className="flex items-center justify-between p-6 border-white/10">
        <h2 className="text-xl font-bold text-theme-text-primary">
          Organization Details
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
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-theme-text-primary mb-2">
                {organization.name}
              </h3>
              <p className="text-sm text-theme-text-secondary mb-4">
                @{organization.slug}
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
                Plan
              </h4>
              <div
                className={`px-3 py-1.5 rounded inline-block ${PLAN_COLORS[organization.plan]}`}
              >
                {organization.plan}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
                Status
              </h4>
              <div
                className={`px-3 py-1.5 rounded inline-block ${STATUS_COLORS[organization.status]}`}
              >
                {organization.status}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
                Seat Limit
              </h4>
              <p className="text-sm text-theme-text-secondary">
                {organization.seatLimit
                  ? `${organization.seatLimit} users`
                  : "Unlimited"}
              </p>
            </div>

            {remainingSeats !== null && (
              <div>
                <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
                  Available Seats
                </h4>
                <p
                  className={`text-2xl font-bold ${remainingSeats > 0 ? "text-green-400" : "text-yellow-400"}`}
                >
                  {remainingSeats}
                </p>
                <p className="text-xs text-theme-text-secondary">
                  seats remaining
                </p>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold text-theme-text-primary mb-2">
                Created
              </h4>
              <p className="text-sm text-theme-text-secondary">
                {new Date(organization.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col border-l border-white/10">
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab("overview")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-theme-text-primary border-b-2 border-theme-button-cta"
                  : "text-theme-text-secondary border-b-transparent hover:text-theme-text-primary"
              }`}
            >
              <SquaresFour className="h-5 w-5" />
              <span className="ml-2">Overview</span>
            </button>
            <button
              onClick={() => setActiveTab("users")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "users"
                  ? "text-theme-text-primary border-b-2 border-theme-button-cta"
                  : "text-theme-text-secondary border-b-transparent hover:text-theme-text-primary"
              }`}
            >
              <Users className="h-5 w-5" />
              <span className="ml-2">Users ({users.length})</span>
            </button>
            <button
              onClick={() => setActiveTab("workspaces")}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === "workspaces"
                  ? "text-theme-text-primary border-b-2 border-theme-button-cta"
                  : "text-theme-text-secondary border-b-transparent hover:text-theme-text-primary"
              }`}
            >
              <DocumentText className="h-5 w-5" />
              <span className="ml-2">Workspaces ({workspaces.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "overview" && (
              <div className="space-y-6">
                {stats && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-xs text-theme-text-secondary uppercase mb-1">
                        Total Users
                      </p>
                      <p className="text-2xl font-bold text-theme-text-primary">
                        {stats.userCount}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-xs text-theme-text-secondary uppercase mb-1">
                        Total Workspaces
                      </p>
                      <p className="text-2xl font-bold text-theme-text-primary">
                        {stats.workspaceCount}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-xs text-theme-text-secondary uppercase mb-1">
                        Total Documents
                      </p>
                      <p className="text-2xl font-bold text-theme-text-primary">
                        {stats.documentCount}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-4">
                      <p className="text-xs text-theme-text-secondary uppercase mb-1">
                        Pending Invites
                      </p>
                      <p className="text-2xl font-bold text-theme-text-primary">
                        {stats.pendingInviteCount}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-end gap-3 mt-6">
                  <button
                    onClick={onEdit}
                    className="px-4 py-2.5 text-sm font-medium text-theme-text-primary border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    Edit Organization
                  </button>
                  <button
                    onClick={closeModal}
                    className="px-4 py-2.5 text-sm font-medium text-white bg-theme-button-primary hover:bg-theme-button-primary-hover rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div>
                {users.length === 0 ? (
                  <div className="text-center py-12">
                    <WarningCircle className="h-12 w-12 mx-auto mb-4 text-yellow-400" />
                    <p className="text-theme-text-secondary">
                      No users found in this organization.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left rounded-lg border-spacing-0">
                    <thead className="text-theme-text-secondary text-xs leading-[18px] font-bold uppercase border-white/10 border-b">
                      <tr>
                        <th scope="col" className="px-4 py-3 rounded-tl-lg">
                          Username
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Role
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="row-hover">
                          <td className="px-4 py-3 border-white/5 text-theme-text-primary">
                            {user.username}
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            <span
                              className={`px-2 py-1 rounded text-xs font-semibold ${
                                user.role === "admin"
                                  ? "bg-purple-500/20 text-purple-400"
                                  : user.role === "manager"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : "bg-gray-500/20 text-gray-400"
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {activeTab === "workspaces" && (
              <div>
                {workspaces.length === 0 ? (
                  <div className="text-center py-12">
                    <DocumentText className="h-12 w-12 mx-auto mb-4 text-blue-400" />
                    <p className="text-theme-text-secondary">
                      No workspaces found in this organization.
                    </p>
                  </div>
                ) : (
                  <table className="w-full text-xs text-left rounded-lg border-spacing-0">
                    <thead className="text-theme-text-secondary text-xs leading-[18px] font-bold uppercase border-white/10 border-b">
                      <tr>
                        <th scope="col" className="px-4 py-3 rounded-tl-lg">
                          Name
                        </th>
                        <th scope="col" className="px-4 py-3">
                          Slug
                        </th>
                        <th scope="col" className="px-4 py-3 rounded-tr-lg">
                          {" "}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {workspaces.map((ws) => (
                        <tr key={ws.id} className="row-hover">
                          <td className="px-4 py-3 border-white/5 text-theme-text-primary">
                            {ws.name}
                          </td>
                          <td className="px-4 py-3 border-white/5 text-theme-text-secondary">
                            {ws.slug}
                          </td>
                          <td className="px-4 py-3 border-white/5">
                            <a
                              href={`/workspace/${ws.slug}`}
                              className="text-theme-button-cta hover:underline"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              Open
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
