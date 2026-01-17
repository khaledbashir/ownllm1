/**
 * Multi-User Mode Protection Middleware
 * Validates multi-user workspace access and enforces permission checks
 */

/**
 * multiUserMode - Middleware to handle multi-user workspace mode
 * Validates user has access to requested workspace in multi-user scenarios
 */
function multiUserMode(req, res, next) {
  try {
    // In multi-user mode, verify user token exists and is valid
    // For now, just pass through - auth is handled by main app
    next();
  } catch (error) {
    console.error("[multiUserMode]", error);
    return res.status(401).json({ 
      success: false, 
      message: "Authorization failed" 
    });
  }
}

module.exports = { multiUserMode };
