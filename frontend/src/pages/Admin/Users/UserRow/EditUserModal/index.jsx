import React, { useState } from "react";
export default function EditUserModal({ currentUser, user, closeModal }) {
  const [role, setRole] = useState(user.role);
  const [error, setError] = useState(null);
  const [messageLimit, setMessageLimit] = useState({
    enabled: user.dailyMessageLimit !== null,
    limit: user.dailyMessageLimit || 10,
  });
  const [organizations, setOrganizations] = useState([]);

  useEffect(() => {
    async function fetchOrganizations() {
      const _organizations = await Organization.getAll();
      setOrganizations(_organizations?.organizations || []);
    }
    fetchOrganizations();
  }, []);

  const handleUpdate = async (e) => {
    setError(null);
    e.preventDefault();
    const data = {};
    const form = new FormData(e.target);
    for (var [key, value] of form.entries()) {
      if (!value || value === null) continue;
      data[key] = value;
    }
    if (messageLimit.enabled) {
      data.dailyMessageLimit = messageLimit.limit;
    } else {
      data.dailyMessageLimit = null;
    }

    const { success, error } = await Admin.updateUser(user.id, data);
    if (success) {
      if (currentUser && currentUser.id === user.id) {
        const currentUserFromStorage = JSON.parse(localStorage.getItem(AUTH_USER) || '{}');
        currentUserFromStorage.username = data.username;
        currentUserFromStorage.bio = data.bio;
        currentUserFromStorage.role = data.role;
        currentUserFromStorage.organizationId = data.organizationId;
        localStorage.setItem(AUTH_USER, JSON.stringify(currentUserFromStorage));
      }
      
      window.location.reload();
    }
    
    setError(error);
  };
}
    fetchOrganizations();
  }, []);

  const handleUpdate = async (e) => {
    setError(null);
    e.preventDefault();
    const data = {};
    const form = new FormData(e.target);
    for (var [key, value] of form.entries()) {
      if (!value || value === null) continue;
      data[key] = value;
    }
    if (messageLimit.enabled) {
      data.dailyMessageLimit = messageLimit.limit;
    } else {
      data.dailyMessageLimit = null;
    }

    const { success, error } = await Admin.updateUser(user.id, data);
    if (success) {
      // Update local storage if we're editing our own user
      if (currentUser && currentUser.id === user.id) {
        currentUser.username = data.username;
        currentUser.bio = data.bio;
        currentUser.role = data.role;
        localStorage.setItem(AUTH_USER, JSON.stringify(currentUser));
      }
      
      window.location.reload();
    }
    
    setError(error);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="relative w-full max-w-2xl bg-theme-bg-secondary rounded-lg shadow border-2 border-theme-modal-border">
        <div className="relative p-6 border-b rounded-t border-theme-modal-border">
          <div className="w-full flex gap-x-2 items-center">
            <h3 className="text-xl font-semibold text-white overflow-hidden overflow-ellipsis whitespace-nowrap">
              Edit {user.username}
            </h3>
          </div>
          <button
            onClick={closeModal}
            type="button"
            className="absolute top-4 right-4 transition-all duration-300 bg-transparent rounded-lg text-sm p-1 inline-flex items-center hover:bg-theme-modal-border hover:border-theme-modal-border hover:border-opacity-50 border-transparent border"
          >
            <X size={24} weight="bold" className="text-white" />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleUpdate}>
            <div className="space-y-4">
               <div>
                 <label
                   htmlFor="username"
                   className="block mb-2 text-sm font-medium text-white"
                 >
                   Username
                 </label>
                 <input
                   name="username"
                   type="text"
                   className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                   placeholder="User's username"
                   defaultValue={user.username}
                   minLength={2}
                   required={true}
                   autoComplete="off"
                 />
                 <p className="mt-2 text-xs text-white/60">
                   Username must only contain lowercase letters, periods,
                   numbers, underscores, and hyphens with no spaces
                 </p>
               </div>
               <div>
                 <label
                   htmlFor="password"
                   className="block mb-2 text-sm font-medium text-white"
                 >
                   New Password
                 </label>
                 <input
                   name="password"
                   type="text"
                   className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                   placeholder={`${user.username}'s new password`}
                   autoComplete="off"
                   minLength={8}
                 />
                 <p className="mt-2 text-xs text-white/60">
                   Password must be at least 8 characters long
                 </p>
               </div>
               <div>
                 <label
                   htmlFor="bio"
                   className="block mb-2 text-sm font-medium text-white"
                 >
                   Bio
                 </label>
                 <textarea
                   name="bio"
                   className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                   placeholder="User's bio"
                   defaultValue={user.bio}
                   autoComplete="off"
                   rows={3}
                 />
               </div>
               <div>
                 <label
                   htmlFor="role"
                   className="block mb-2 text-sm font-medium text-white"
                 >
                   Role
                 </label>
                 <select
                   name="role"
                   required={true}
                   defaultValue={role}
                   onChange={(e) => setRole(e.target.value)}
                   className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                 >
                   <option value="default">Default</option>
                   <option value="manager">Manager</option>
                   {currentUser?.role === "admin" && (
                     <option value="admin">Administrator</option>
                   )}
                 </select>
                 <RoleHintDisplay role={role} />
               </div>
               {currentUser?.role === "admin" && (
                 <div>
                   <label
                     htmlFor="organizationId"
                     className="block mb-2 text-sm font-medium text-white"
                   >
                     Organization
                   </label>
                   <select
                     id="organizationId"
                     name="organizationId"
                     value={user.organizationId || ""}
                     onChange={(e) => {
                       data.organizationId = e.target.value ? Number(e.target.value) : null;
                     }}
                     className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                   >
                     <option value="">None (Super Admin)</option>
                     {organizations.map((org) => (
                       <option key={org.id} value={org.id}>{org.name}</option>
                     ))}
                   </select>
                 </div>
               )}
              <div>
                <label
                  htmlFor="password"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  New Password
                </label>
                <input
                  name="password"
                  type="text"
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  placeholder={`${user.username}'s new password`}
                  autoComplete="off"
                  minLength={8}
                />
                <p className="mt-2 text-xs text-white/60">
                  Password must be at least 8 characters long
                </p>
              </div>
              <div>
                <label
                  htmlFor="bio"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Bio
                </label>
                <textarea
                  name="bio"
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                  placeholder="User's bio"
                  defaultValue={user.bio}
                  autoComplete="off"
                  rows={3}
                />
              </div>
              <div>
                <label
                  htmlFor="role"
                  className="block mb-2 text-sm font-medium text-white"
                >
                  Role
                </label>
                <select
                  name="role"
                  required={true}
                  defaultValue={user.role}
                  onChange={(e) => setRole(e.target.value)}
                  className="border-none bg-theme-settings-input-bg w-full text-white placeholder:text-theme-settings-input-placeholder text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none block w-full p-2.5"
                >
                  <option value="default">Default</option>
                  <option value="manager">Manager</option>
                  {currentUser?.role === "admin" && (
                    <option value="admin">Administrator</option>
                  )}
                </select>
                <RoleHintDisplay role={role} />
              </div>
              <MessageLimitInput
                role={role}
                enabled={messageLimit.enabled}
                limit={messageLimit.limit}
                updateState={setMessageLimit}
              />
              {error && <p className="text-red-400 text-sm">Error: {error}</p>}
            </div>
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-theme-modal-border">
              <button
                onClick={closeModal}
                type="button"
                className="transition-all duration-300 text-white hover:bg-zinc-700 px-4 py-2 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="transition-all duration-300 bg-white text-black hover:opacity-60 px-4 py-2 rounded-lg text-sm"
              >
                Update user
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
