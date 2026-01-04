const { User } = require("../models/user");
const { TemporaryAuthToken } = require("../models/temporaryAuthToken");
const { EmailService } = require("../utils/emailService");
const { reqBody } = require("../utils/http");

function portalAuthEndpoints(app) {
    if (!app) return;

    // Generate Magic Link
    app.post("/v1/auth/magic-login", async (request, response) => {
        try {
            const { email } = reqBody(request);

            if (!email) {
                return response.status(400).json({ success: false, error: "Email is required" });
            }

            // Find user
            const user = await User.get({ email });
            if (!user) {
                // Security: Don't reveal if user exists.
                // But for this internal tool, maybe we should?
                // Let's mimic standard practice: return 200 but do nothing.
                // OR for now, if it's a client portal, maybe we want to be helpful.
                // User asked for "Client login".
                // Let's return 200.
                return response.status(200).json({ success: true, message: "If an account exists, a magic link has been sent." });
            }

            // Issue Token
            const { token, error } = await TemporaryAuthToken.issue(user.id);
            if (error) throw new Error(error);

            // Send Email
            const appUrl = process.env.APP_URL || `${request.protocol}://${request.get("host")}`;
            // Frontend route to handle verification
            // Assuming frontend route: /portal/verify?token=...
            const magicLink = `${appUrl}/portal/verify?token=${token}`;

            await EmailService.sendMagicLink({
                to: user.email,
                magicLink,
                appUrl
            });

            return response.status(200).json({ success: true, message: "Magic link sent." });

        } catch (e) {
            console.error("Magic Login Error:", e);
            return response.status(500).json({ success: false, error: "Internal server error" });
        }
    });

    // Verify Magic Link
    // This is similar to system.js /request-token/sso/simple but specific for portal
    app.post("/v1/auth/verify-magic-link", async (request, response) => {
        try {
            const { token } = reqBody(request);
            if (!token) return response.status(400).json({ success: false, error: "Token required" });

            const { sessionToken, error } = await TemporaryAuthToken.validate(token);

            if (error) {
                return response.status(401).json({ success: false, error: "Invalid or expired token" });
            }

            return response.status(200).json({ success: true, token: sessionToken });

        } catch (e) {
            console.error("Verify Magic Link Error:", e);
            return response.status(500).json({ success: false, error: "Internal server error" });
        }
    });
}

module.exports = { portalAuthEndpoints };
