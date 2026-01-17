/**
 * ANC Quote Data Schema
 * Validates incoming JSON from AI responses before trusting them
 * Enforces strict types, allowed keys, and versioning for safety
 */

// JSON Schema for quote updates (with versioning and safeguards)
export const ANC_QUOTE_SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "ANC Quote Update",
  description: "Versioned, validated quote data from AI responses",
  type: "object",
  required: ["type", "schemaVersion"],
  additionalProperties: false,
  properties: {
    type: {
      type: "string",
      enum: ["anc_quote_update"],
      description: "Message type identifier for routing"
    },
    schemaVersion: {
      type: "integer",
      const: 1,
      description: "Versioning for backwards compatibility"
    },
    quoteId: {
      type: "string",
      description: "Unique ID for this quote session (UUID or turn ID)"
    },
    fields: {
      type: "object",
      additionalProperties: false,
      description: "Proposal fields (include only known values)",
      properties: {
        width: {
          type: "number",
          minimum: 5,
          maximum: 500,
          description: "Display width in feet"
        },
        height: {
          type: "number",
          minimum: 5,
          maximum: 500,
          description: "Display height in feet"
        },
        environment: {
          type: "string",
          enum: ["Indoor", "Outdoor", "Mixed"],
          description: "Installation environment"
        },
        pixelPitch: {
          type: "number",
          enum: [1.5, 2, 3, 4, 6, 8, 10, 12],
          description: "LED pixel pitch in millimeters"
        },
        screenArea: {
          type: "number",
          minimum: 0,
          description: "Calculated screen area in square feet (auto-computed: width × height)"
        },
        clientName: {
          type: "string",
          minLength: 2,
          maxLength: 100,
          description: "Client/venue name"
        },
        projectName: {
          type: "string",
          minLength: 2,
          maxLength: 100,
          description: "Project name or description"
        },
        productCategory: {
          type: "string",
          enum: ["LED Display", "Scoreboard", "Ribbon Board", "Custom"],
          description: "Product category"
        },
        serviceLevel: {
          type: "string",
          enum: ["Self-Install", "Partial Service", "Full Service"],
          description: "Installation service level"
        },
        steelType: {
          type: "string",
          enum: ["New", "Existing"],
          description: "Steel structural condition"
        },
        powerDistanceFeet: {
          type: "number",
          minimum: 0,
          maximum: 1000,
          description: "Distance to power source in feet"
        },
        budget: {
          type: "number",
          minimum: 0,
          description: "Client budget in dollars"
        },
        hardwareCost: {
          type: "number",
          minimum: 0,
          description: "Base hardware cost (panels, drivers, etc)"
        },
        structuralCost: {
          type: "number",
          minimum: 0,
          description: "Structural materials cost"
        },
        laborCost: {
          type: "number",
          minimum: 0,
          description: "Installation labor cost"
        },
        pmFee: {
          type: "number",
          minimum: 0,
          description: "Project management fee"
        },
        contingency: {
          type: "number",
          minimum: 0,
          description: "Contingency amount"
        },
        totalCost: {
          type: "number",
          minimum: 0,
          description: "Total cost before markup"
        },
        finalPrice: {
          type: "number",
          minimum: 0,
          description: "Final client-facing price"
        },
        grossProfit: {
          type: "number",
          description: "Gross profit (finalPrice - totalCost)"
        },
        marginPercent: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Profit margin percentage"
        },
        status: {
          type: "string",
          enum: ["partial", "complete", "revision"],
          description: "Proposal status"
        }
      }
    },
    metadata: {
      type: "object",
      additionalProperties: false,
      description: "Internal metadata (not shown to user)",
      properties: {
        timestamp: {
          type: "string",
          format: "date-time",
          description: "When this update was generated"
        },
        turnNumber: {
          type: "integer",
          description: "Which turn in conversation"
        },
        changedFields: {
          type: "array",
          items: { type: "string" },
          description: "Which fields were updated in this turn"
        }
      }
    }
  }
};

// Validation constraints
export const VALIDATION_LIMITS = {
  MAX_JSON_BLOCK_LENGTH: 5000,      // Max bytes for JSON block
  MAX_FIELD_STRING_LENGTH: 500,     // Max string field length
  MAX_NESTING_DEPTH: 5,             // Max JSON nesting
  ALLOWED_FIELDS_COUNT: 25,         // Max allowed top-level fields
};

// Allowed field names (whitelist)
export const ALLOWED_FIELDS = [
  "width", "height", "environment", "pixelPitch", "screenArea",
  "clientName", "projectName", "productCategory", "serviceLevel",
  "steelType", "powerDistanceFeet", "budget",
  "hardwareCost", "structuralCost", "laborCost", "pmFee",
  "contingency", "totalCost", "finalPrice", "grossProfit", "marginPercent",
  "status"
];

// Schema version history (for migrations)
export const SCHEMA_VERSIONS = {
  1: {
    description: "Initial version with core fields",
    releaseDate: "2024-01-01",
    migration: null
  },
  // Future versions would go here with migration functions
};
