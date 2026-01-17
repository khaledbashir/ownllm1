/**
 * ANC Quote Data Parser - JSON Block Extraction with Validation
 * Safely extracts, validates, and merges proposal parameters from AI responses
 * 
 * Key safety measures:
 * - Regex is defensive (optional whitespace handling)
 * - Payload size limits prevent DOS
 * - JSON Schema validation via Ajv (not just parse)
 * - Unknown keys rejected (additionalProperties: false)
 * - Type coercion explicitly prevented
 * - Validation failures logged for debugging
 */

import Ajv from 'ajv';
import { ANC_QUOTE_SCHEMA, VALIDATION_LIMITS, ALLOWED_FIELDS } from './ancQuoteSchema';

// Initialize Ajv validator
const ajv = new Ajv({
  strict: true,           // Enforce strict schema
  useDefaults: false,     // Don't auto-add defaults
  removeAdditional: false // Reject unknown keys instead of silently removing
});

// Compile the schema for fast repeated validation
const validateQuotePayload = ajv.compile(ANC_QUOTE_SCHEMA);

/**
 * Extract and validate JSON from code block in message
 * Looks for ```json { ... } ``` blocks with defensive regex
 * 
 * @param {string} message - Message from AI containing potential JSON block
 * @returns {{valid: boolean, data: object|null, error: string|null}}
 */
export function extractAndValidateJson(message = '') {
  if (!message || typeof message !== 'string') {
    return { valid: false, data: null, error: 'Invalid message type' };
  }

  // Defensive regex: handle optional whitespace/newlines, case insensitive for language
  // Pattern: ```json ... ``` (relaxed newlines and lang)
  // Matches ```json, ```JSON, or just ``` if it looks like start of block
  const jsonBlockRegex = /```\s*(?:json|JSON)?\s*([\s\S]*?)```/;
  const match = message.match(jsonBlockRegex);

  if (!match || !match[1]) {
    return { valid: false, data: null, error: 'No JSON code block found' };
  }

  const jsonStr = match[1].trim();

  // SAFETY CHECK 1: Payload size limit
  if (jsonStr.length > VALIDATION_LIMITS.MAX_JSON_BLOCK_LENGTH) {
    return {
      valid: false,
      data: null,
      error: `JSON block exceeds ${VALIDATION_LIMITS.MAX_JSON_BLOCK_LENGTH} bytes (got ${jsonStr.length})`
    };
  }

  // SAFETY CHECK 2: Try to parse
  let parsed;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      valid: false,
      data: null,
      error: `JSON parse failed: ${e.message}`
    };
  }

  // SAFETY CHECK 3: Must be object
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      valid: false,
      data: null,
      error: 'JSON must be an object (not array or primitive)'
    };
  }

  // SAFETY CHECK 4: Validate schema (strict mode)
  const isValid = validateQuotePayload(parsed);
  if (!isValid) {
    const errors = validateQuotePayload.errors
      .map(err => `${err.instancePath || 'root'}: ${err.message}`)
      .join('; ');
    
    // Log validation failure for debugging
    console.warn('[ANC Quote Parser] Schema validation failed:', {
      errors,
      received: parsed
    });

    return {
      valid: false,
      data: null,
      error: `Schema validation failed: ${errors}`
    };
  }

  return {
    valid: true,
    data: parsed,
    error: null
  };
}

/**
 * Merge new JSON data with existing quote data safely
 * Only updates allowed fields, validates types
 * 
 * @param {object} existing - Current quote data
 * @param {object} newData - New fields from JSON block
 * @returns {object} Merged data
 */
export function mergeQuoteData(existing = {}, newData = {}) {
  if (!newData || typeof newData !== 'object' || !newData.fields) {
    return existing;
  }

  const merged = { ...existing };
  const fieldsToMerge = newData.fields || {};

  for (const field of ALLOWED_FIELDS) {
    if (field in fieldsToMerge) {
      const value = fieldsToMerge[field];
      // Only update if value is not null/undefined
      if (value !== null && value !== undefined) {
        merged[field] = value;
      }
    }
  }

  return merged;
}

/**
 * Check if quote is complete enough to generate files
 * Requires core fields to be present and valid
 * 
 * @param {object} quoteData - Quote data to validate
 * @returns {boolean} True if minimum data is present
 */
export function hasMinimumQuoteData(quoteData = {}) {
  return !!(
    typeof quoteData.width === 'number' &&
    quoteData.width > 0 &&
    typeof quoteData.height === 'number' &&
    quoteData.height > 0 &&
    quoteData.environment &&
    ['Indoor', 'Outdoor', 'Mixed'].includes(quoteData.environment) &&
    typeof quoteData.pixelPitch === 'number' &&
    typeof quoteData.finalPrice === 'number' &&
    quoteData.finalPrice > 0
  );
}

/**
 * Remove JSON code block from message text (for UI display)
 * Returns message without the JSON block
 * 
 * @param {string} message - Message potentially containing JSON block
 * @returns {string} Message with JSON block removed
 */
export function removeJsonBlockFromText(message = '') {
  if (!message) return message;
  return message
    .replace(/```\s*json\s*\n[\s\S]*?\n\s*```\n?/g, '')
    .trim();
}

/**
 * Log quote update for debugging/audit (safe to store)
 * Removes sensitive data before logging
 * 
 * @param {object} quoteData - Quote data that was updated
 * @param {object} validationResult - Result from extractAndValidateJson
 */
export function logQuoteUpdate(quoteData, validationResult) {
  const sanitized = { ...quoteData };
  // Remove any potentially sensitive fields before logging
  delete sanitized.clientName;
  
  console.log('[ANC Quote Update]', {
    timestamp: new Date().toISOString(),
    fieldsUpdated: Object.keys(quoteData || {}),
    hasMinimumData: hasMinimumQuoteData(quoteData),
    validationPassed: validationResult?.valid
  });
}
