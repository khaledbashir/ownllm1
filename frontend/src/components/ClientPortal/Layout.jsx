import React from "react";
import { Outlet, Navigate, useLocation, Link } from "react-router-dom";
import { House, ListChecks, ChatCircleDots, SignOut } from "@phosphor-icons/react";

export default function ClientPortalLayout() {
    const location = useLocation();
    const isAuthenticated = !!localStorage.getItem("anythingllm_client_auth");

    if (!isAuthenticated) {
        return <Navigate to="/portal/login" state={{ from: location }} replace />;
    }

    const handleLogout = () => {
        localStorage.removeItem("anythingllm_client_auth");
        window.location.href = "/portal/login";
    };

    const navItems = [
        { path: "/portal/dashboard", label: "Dashboard", icon: House },
        { path: "/portal/projects", label: "Projects", icon: ListChecks },
        { path: "/portal/messages", label: "Messages", icon: ChatCircleDots },
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex text-base antialiased selection:bg-blue-500/30 selection:text-blue-200">
            {/* Sidebar */}
            <aside className="fixed left-0 top-0 bottom-0 w-64 bg-[#0a0a0a] border-r border-white/5 flex flex-col z-50">
                <div className="p-6 border-b border-white/5">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <span className="font-bold text-white text-lg">C</span>
                        </div>
                        <span className="font-bold text-lg tracking-tight">Client Portal</span>
                    </div>
                </div>

                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${isActive
                                        ? "bg-white/10 text-white shadow-inner"
                                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                                    }`}
                            >
                                <Icon size={18} weight={isActive ? "fill" : "regular"} className={isActive ? "text-blue-400" : "group-hover:text-gray-300"} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="p-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-3 py-2.5 text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                    >
                        <SignOut size={18} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 ml-64 min-h-screen bg-[#050505]">
                <Outlet />
            </main>
        </div>
    );
}
