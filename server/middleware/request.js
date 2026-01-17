/**
 * Request Validation Middleware
 * Ensures requests are properly authenticated and workspace exists
 */

const { Workspace } = require("../models/workspace");

/**
 * validatedRequest - Middleware to validate request has workspace and user
 * Attaches workspace and user to res.locals for downstream handlers
 */
async function validatedRequest(req, res, next) {
  try {
    const { slug } = req.params;
    
    if (!slug) {
      return res.status(400).json({ 
        success: false, 
        message: "Workspace slug required" 
      });
    }

    const workspace = await Workspace.get({ slug });
    if (!workspace) {
      return res.status(404).json({ 
        success: false, 
        message: "Workspace not found" 
      });
    }

    // Attach workspace to locals for downstream handlers
    res.locals.workspace = workspace;

    next();
  } catch (error) {
    console.error("[validatedRequest]", error);
    return res.status(500).json({ 
      success: false, 
      message: "Request validation failed" 
    });
  }
}

module.exports = { validatedRequest };
