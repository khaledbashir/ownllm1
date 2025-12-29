import React from "react";
import { ChatCircleDots } from "@phosphor-icons/react";

export default function ClientMessages() {
    return (
        <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-64px)] flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                <ChatCircleDots size={40} className="text-gray-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Message Center</h1>
            <p className="text-gray-400 max-w-md">
                This feature is currently under development. Soon you will be able to communicate directly with the project team here.
            </p>
        </div>
    );
}
