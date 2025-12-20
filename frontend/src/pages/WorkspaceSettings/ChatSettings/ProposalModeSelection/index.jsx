import { useState } from "react";

export default function ProposalModeSelection({ workspace, setHasChanges }) {
  const [enabled, setEnabled] = useState(
    workspace?.enableProposalMode || false
  );

  return (
    <div>
      <div className="flex flex-col">
        <label htmlFor="enableProposalMode" className="block input-label">
          Proprietary Context Injection
        </label>
      </div>

      <div className="flex flex-col gap-y-1 mt-2">
        <div className="w-fit flex gap-x-1 items-center p-1 rounded-lg bg-theme-settings-input-bg ">
          <input type="hidden" name="enableProposalMode" value={enabled} />
          <button
            type="button"
            disabled={enabled === false}
            onClick={() => {
              setEnabled(false);
              setHasChanges(true);
            }}
            className="transition-bg duration-200 px-6 py-1 text-md text-white/60 disabled:text-white bg-transparent disabled:bg-[#687280] rounded-md"
          >
            Disabled
          </button>
          <button
            type="button"
            disabled={enabled === true}
            onClick={() => {
              setEnabled(true);
              setHasChanges(true);
            }}
            className="transition-bg duration-200 px-6 py-1 text-md text-white/60 disabled:text-white bg-transparent disabled:bg-[#687280] rounded-md"
          >
            Enabled
          </button>
        </div>
        <p className="text-sm text-white/60">
          {enabled ? (
            <>
              <b>Enabled:</b> The AI will automatically receive your{" "}
              <i className="font-semibold">Rate Card</i>,{" "}
              <i className="font-semibold">Products</i>, and{" "}
              <i className="font-semibold">Proposal Instructions</i> in its
              context window.
            </>
          ) : (
            <>
              <b>Disabled:</b> The AI will ignore Rate Card and Product data
              unless manually instructed.
            </>
          )}
        </p>
      </div>
    </div>
  );
}
