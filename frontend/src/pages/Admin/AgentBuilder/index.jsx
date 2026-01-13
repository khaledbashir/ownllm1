import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Tooltip } from "react-tooltip";

import BlockList, { BLOCK_TYPES, BLOCK_INFO } from "./BlockList";
import AddBlockMenu from "./AddBlockMenu";
import showToast from "@/utils/toast";
import AgentFlows from "@/models/agentFlows";
import { useTheme } from "@/hooks/useTheme";
import HeaderMenu from "./HeaderMenu";
import paths from "@/utils/paths";
import PublishEntityModal from "@/components/CommunityHub/PublishEntityModal";
import FlowBuilderChat from "@/components/FlowBuilderChat";

function normalizeKeyValueRows(input) {
  // Always return an array - defensive check
  if (input === null || input === undefined) return [];
  if (typeof input !== 'object' && typeof input !== 'string') return [];

  if (Array.isArray(input)) {
    return input
      .map((item) => {
        if (!item) return null;

        if (typeof item === "string") {
          const parts = item.split(":");
          if (parts.length < 2) return null;
          const key = parts.shift()?.trim();
          const value = parts.join(":").trim();
          if (!key) return null;
          return { key, value };
        }

        if (Array.isArray(item) && item.length >= 2) {
          const [key, value] = item;
          if (!key) return null;
          return {
            key: String(key),
            value: value == null ? "" : String(value),
          };
        }

        if (typeof item === "object") {
          const key = item.key ?? item.name ?? item.header ?? item[0];
          const value = item.value ?? item.val ?? item[1];
          if (!key) return null;
          return {
            key: String(key),
            value: value == null ? "" : String(value),
          };
        }

        return null;
      })
      .filter(Boolean);
  }

  if (typeof input === "object" && !Array.isArray(input)) {
    return Object.entries(input)
      .map(([key, value]) => ({
        key: String(key),
        value: value == null ? "" : String(value),
      }))
      .filter((h) => h.key);
  }

  if (typeof input === "string") {
    return input
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const idx = line.indexOf(":");
        if (idx === -1) return null;
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim();
        if (!key) return null;
        return { key, value };
      })
      .filter(Boolean);
  }

  return [];
}

function normalizeVariables(input) {
  if (!input) return [{ name: "", value: "" }];

  if (Array.isArray(input)) {
    const cleaned = input
      .map((v) => {
        if (!v) return null;
        if (typeof v === "object") {
          const name = v.name ?? v.key ?? "";
          const value = v.value ?? "";
          return { name: String(name || ""), value: String(value || "") };
        }
        return null;
      })
      .filter(Boolean);
    return cleaned.length ? cleaned : [{ name: "", value: "" }];
  }

  if (typeof input === "object") {
    const rows = Object.entries(input).map(([name, value]) => ({
      name: String(name),
      value: value == null ? "" : String(value),
    }));
    return rows.length ? rows : [{ name: "", value: "" }];
  }

  return [{ name: "", value: "" }];
}

function normalizeStepConfig(stepType, config, blockInfo) {
  // Defensive checks
  if (!stepType || typeof stepType !== 'string') {
    return {};
  }

  const defaults = (blockInfo && blockInfo[stepType] && blockInfo[stepType].defaultConfig) ? blockInfo[stepType].defaultConfig : {};
  const merged = { ...defaults, ...(config || {}) };

  if (stepType === "apiCall") {
    merged.headers = normalizeKeyValueRows(merged.headers);
    merged.formData = normalizeKeyValueRows(merged.formData);
  }

  if (stepType === "start") {
    merged.variables = normalizeVariables(merged.variables);
  }

  return merged;
}

const DEFAULT_BLOCKS = [
  {
    id: "flow_info",
    type: BLOCK_TYPES.FLOW_INFO,
    config: {
      name: "",
      description: "",
    },
    isExpanded: true,
  },
  {
    id: "start",
    type: BLOCK_TYPES.START,
    config: {
      variables: [{ name: "", value: "" }],
    },
    isExpanded: true,
  },
  {
    id: "finish",
    type: BLOCK_TYPES.FINISH,
    config: {},
    isExpanded: false,
  },
];

export default function AgentBuilder() {
  const { flowId } = useParams();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [agentName, setAgentName] = useState("");
  const [_, setAgentDescription] = useState("");
  const [currentFlowUuid, setCurrentFlowUuid] = useState(null);
  const [active, setActive] = useState(true);
  const [blocks, setBlocks] = useState(DEFAULT_BLOCKS);
  const [selectedBlock, setSelectedBlock] = useState("start");
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [availableFlows, setAvailableFlows] = useState([]);
  const [selectedFlowForDetails, setSelectedFlowForDetails] = useState(null);
  const nameRef = useRef(null);
  const descriptionRef = useRef(null);
  const [showPublishModal, setShowPublishModal] = useState(false);

  useEffect(() => {
    loadAvailableFlows();
  }, []);

  useEffect(() => {
    if (flowId) {
      loadFlow(flowId);
    }
  }, [flowId]);

  useEffect(() => {
    const flowInfoBlock = blocks.find(
      (block) => block.type === BLOCK_TYPES.FLOW_INFO
    );
    setAgentName(flowInfoBlock?.config?.name || "");
  }, [blocks]);

  const loadAvailableFlows = async () => {
    try {
      const { success, error, flows } = await AgentFlows.listFlows();
      if (!success) throw new Error(error);
      setAvailableFlows(flows);
    } catch (error) {
      console.error(error);
      showToast("Failed to load available flows", "error", { clear: true });
    }
  };

  const loadFlow = async (uuid) => {
    try {
      const { success, error, flow } = await AgentFlows.getFlow(uuid);
      if (!success) throw new Error(error);

      // Defensive check for flow structure
      if (!flow || !flow.config) {
        throw new Error("Invalid flow data");
      }

      // Convert steps to blocks with IDs, ensuring finish block is at the end
      const flowBlocks = [
        {
          id: "flow_info",
          type: BLOCK_TYPES.FLOW_INFO,
          config: {
            name: flow.config.name || "",
            description: flow.config.description || "",
          },
          isExpanded: true,
        },
        ...(flow.config.steps || []).map((step, index) => ({
          id: index === 0 ? "start" : `block_${index}`,
          type: step?.type || "unknown",
          config: normalizeStepConfig(step?.type, step?.config, BLOCK_INFO),
          isExpanded: true,
        })),
      ];

      // Add finish block if not present
      if (flowBlocks[flowBlocks.length - 1]?.type !== BLOCK_TYPES.FINISH) {
        flowBlocks.push({
          id: "finish",
          type: BLOCK_TYPES.FINISH,
          config: {},
          isExpanded: false,
        });
      }

      setAgentName(flow.config.name);
      setAgentDescription(flow.config.description);
      setActive(flow.config.active ?? true);
      setCurrentFlowUuid(flow.uuid);
      setBlocks(flowBlocks);
      setShowLoadMenu(false);
    } catch (error) {
      console.error(error);
      showToast("Failed to load flow", "error", { clear: true });
    }
  };

  const addBlock = (type) => {
    const newBlock = {
      id: `block_${blocks.length}`,
      type,
      config: { ...BLOCK_INFO[type].defaultConfig },
      isExpanded: true,
    };
    // Insert the new block before the finish block
    const newBlocks = [...blocks];
    newBlocks.splice(newBlocks.length - 1, 0, newBlock);
    setBlocks(newBlocks);
    setShowBlockMenu(false);
  };

  const updateBlockConfig = (blockId, config) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, config: { ...block.config, ...config } }
          : block
      )
    );
  };

  const removeBlock = (blockId) => {
    if (blockId === "start") return;
    setBlocks(blocks.filter((block) => block.id !== blockId));
    if (selectedBlock === blockId) {
      setSelectedBlock("start");
    }
  };

  const saveFlow = async () => {
    const flowInfoBlock = blocks.find(
      (block) => block.type === BLOCK_TYPES.FLOW_INFO
    );
    const name = flowInfoBlock?.config?.name;
    const description = flowInfoBlock?.config?.description;

    if (!name?.trim() || !description?.trim()) {
      // Make sure the flow info block is expanded first
      if (!flowInfoBlock.isExpanded) {
        setBlocks(
          blocks.map((block) =>
            block.type === BLOCK_TYPES.FLOW_INFO
              ? { ...block, isExpanded: true }
              : block
          )
        );
        // Small delay to allow expansion animation to complete
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      if (!name?.trim()) {
        nameRef.current?.focus();
      } else if (!description?.trim()) {
        descriptionRef.current?.focus();
      }
      showToast(
        "Please provide both a name and description for your flow",
        "error",
        {
          clear: true,
        }
      );
      return;
    }

    const flowConfig = {
      name,
      description,
      active,
      steps: blocks
        .filter(
          (block) =>
            block.type !== BLOCK_TYPES.FINISH &&
            block.type !== BLOCK_TYPES.FLOW_INFO
        )
        .map((block) => ({
          type: block.type,
          config: block.config,
        })),
    };

    try {
      const { success, error, flow } = await AgentFlows.saveFlow(
        name,
        flowConfig,
        currentFlowUuid
      );
      if (!success) throw new Error(error);

      setCurrentFlowUuid(flow.uuid);
      showToast("Agent flow saved successfully!", "success", { clear: true });
      await loadAvailableFlows();
    } catch (error) {
      console.error("Save error details:", error);
      showToast(`Failed to save agent flow. ${error.message}`, "error", {
        clear: true,
      });
    }
  };

  const toggleBlockExpansion = (blockId) => {
    setBlocks(
      blocks.map((block) =>
        block.id === blockId
          ? { ...block, isExpanded: !block.isExpanded }
          : block
      )
    );
  };

  // Get all available variables from the start block
  const getAvailableVariables = () => {
    const startBlock = blocks.find((b) => b.type === BLOCK_TYPES.START);
    return startBlock?.config?.variables?.filter((v) => v.name) || [];
  };

  const renderVariableSelect = (
    value,
    onChange,
    placeholder = "Select variable"
  ) => (
    <select
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border-none bg-theme-settings-input-bg text-theme-text-primary text-sm rounded-lg focus:outline-primary-button active:outline-primary-button outline-none p-2.5"
    >
      <option value="" className="bg-theme-bg-primary">
        {placeholder}
      </option>
      {getAvailableVariables().map((v) => (
        <option key={v.name} value={v.name} className="bg-theme-bg-primary">
          {v.name}
        </option>
      ))}
    </select>
  );

  const deleteVariable = (variableName) => {
    // Clean up references in other blocks
    blocks.forEach((block) => {
      if (block.type === BLOCK_TYPES.START) return;

      let configUpdated = false;
      const newConfig = { ...block.config };

      // Check and clean responseVariable/resultVariable
      if (newConfig.responseVariable === variableName) {
        newConfig.responseVariable = "";
        configUpdated = true;
      }
      if (newConfig.resultVariable === variableName) {
        newConfig.resultVariable = "";
        configUpdated = true;
      }

      if (configUpdated) {
        updateBlockConfig(block.id, newConfig);
      }
    });
  };

  const clearFlow = () => {
    if (!!flowId) navigate(paths.agents.builder());
    setAgentName("");
    setAgentDescription("");
    setCurrentFlowUuid(null);
    setActive(true);
    setBlocks(DEFAULT_BLOCKS);
  };

  const moveBlock = (fromIndex, toIndex) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
  };

  const handlePublishFlow = () => {
    setShowPublishModal(true);
  };

  const flowInfoBlock = blocks.find(
    (block) => block.type === BLOCK_TYPES.FLOW_INFO
  );
  const flowEntity = {
    name: flowInfoBlock?.config?.name || "",
    description: flowInfoBlock?.config?.description || "",
    steps: blocks
      .filter(
        (block) =>
          block.type !== BLOCK_TYPES.FINISH &&
          block.type !== BLOCK_TYPES.FLOW_INFO
      )
      .map((block) => ({ type: block.type, config: block.config })),
  };

  return (
    <div
      style={{
        backgroundImage:
          theme === "light"
            ? "radial-gradient(rgba(0, 0, 0, 0.1) 1px, transparent 0)"
            : "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 0)",
        backgroundSize: "15px 15px",
        backgroundPosition: "-7.5px -7.5px",
      }}
      className="w-full h-screen flex bg-theme-bg-primary"
    >
      <PublishEntityModal
        show={showPublishModal}
        onClose={() => setShowPublishModal(false)}
        entityType="agent-flow"
        entity={flowEntity}
      />
      <div className="w-full flex flex-col">
        <HeaderMenu
          agentName={agentName}
          availableFlows={availableFlows}
          onNewFlow={clearFlow}
          onSaveFlow={saveFlow}
          onPublishFlow={handlePublishFlow}
        />
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto mt-14">
            <BlockList
              blocks={blocks}
              updateBlockConfig={updateBlockConfig}
              removeBlock={removeBlock}
              toggleBlockExpansion={toggleBlockExpansion}
              renderVariableSelect={renderVariableSelect}
              onDeleteVariable={deleteVariable}
              moveBlock={moveBlock}
              refs={{ nameRef, descriptionRef }}
            />

            <AddBlockMenu
              blocks={blocks}
              showBlockMenu={showBlockMenu}
              setShowBlockMenu={setShowBlockMenu}
              addBlock={addBlock}
            />
          </div>
        </div>
      </div>
      <Tooltip
        id="content-summarization-tooltip"
        place="top"
        delayShow={300}
        className="tooltip !text-xs z-99"
      >
        <p className="text-sm">
          When enabled, long webpage content will be automatically summarized to
          reduce token usage.
          <br />
          <br />
          Note: This may affect data quality and remove specific details from
          the original content.
        </p>
      </Tooltip>

      {/* AI Flow Builder Chat */}
      <FlowBuilderChat
        onFlowGenerated={(generatedFlow) => {
          // Convert AI-generated flow to builder blocks
          if (!generatedFlow) return;

          const newBlocks = [
            {
              id: "flow_info",
              type: BLOCK_TYPES.FLOW_INFO,
              config: {
                name: generatedFlow.name || "AI Generated Flow",
                description: generatedFlow.description || "",
              },
              isExpanded: true,
            },
            {
              id: "start",
              type: BLOCK_TYPES.START,
              config: {
                variables: normalizeVariables(generatedFlow.variables),
              },
              isExpanded: true,
            },
          ];

          // Add generated blocks
          if (generatedFlow.blocks && Array.isArray(generatedFlow.blocks)) {
            generatedFlow.blocks.forEach((block, idx) => {
              if (!block || !block.type) return; // Skip invalid blocks

              const blockType = block.type?.toUpperCase().replace(/-/g, "_");
              if (BLOCK_TYPES[blockType]) {
                const stepType = BLOCK_TYPES[blockType];
                newBlocks.push({
                  id: `block_${idx + 1}`,
                  type: stepType,
                  config: normalizeStepConfig(
                    stepType,
                    block?.config || {},
                    BLOCK_INFO
                  ),
                  isExpanded: true,
                });
              }
            });
          }

          // Add finish block
          newBlocks.push({
            id: "finish",
            type: BLOCK_TYPES.FINISH,
            config: {},
            isExpanded: false,
          });

          setBlocks(newBlocks);
          setAgentName(generatedFlow.name || "AI Generated Flow");
          setCurrentFlowUuid(null); // New flow, no UUID yet
        }}
      />
    </div>
  );
}
