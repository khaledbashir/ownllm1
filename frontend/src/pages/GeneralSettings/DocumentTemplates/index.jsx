import React from "react";
import Sidebar from "@/components/SettingsSidebar";
import { isMobile } from "react-device-detect";
import LetterheadEditor from "@/components/BlockSuite/LetterheadEditor";

export default function DocumentTemplates() {
    return (
        <div className="w-screen h-screen overflow-hidden bg-theme-bg-container flex">
            <Sidebar />
            <div
                style={{ height: isMobile ? "100%" : "calc(100% - 32px)" }}
                className="relative md:ml-[2px] md:mr-[16px] md:my-[16px] md:rounded-[16px] bg-theme-bg-secondary w-full h-full overflow-y-scroll p-4 md:p-0"
            >
                <div className="flex flex-col w-full px-1 md:pl-6 md:pr-[50px] md:py-6 py-16 h-full">
                    {/* Header */}
                    <div className="w-full flex flex-col gap-y-1 pb-6 border-white/10 border-b-2 mb-6">
                        <div className="items-center flex gap-x-4">
                            <p className="text-lg leading-6 font-bold text-theme-text-primary">
                                Document Templates
                            </p>
                        </div>
                        <p className="text-xs leading-[18px] font-base text-theme-text-secondary mt-2">
                            Manage your business document templates.
                        </p>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 min-h-0 rounded-xl overflow-hidden shadow-lg border border-gray-700/50">
                        <LetterheadEditor />
                    </div>
                </div>
            </div>
        </div>
    );
}
