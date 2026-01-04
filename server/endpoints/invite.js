const { EventLogs } = require("../models/eventLogs");
const { Invite } = require("../models/invite");
const User = require("../models/user");
const { Organization } = require("../models/organization");
const { reqBody } = require("../utils/http");
const {
  simpleSSOLoginDisabledMiddleware,
} = require("../utils/middleware/simpleSSOEnabled");
const { checkSeatLimit } = require("../services/billing");

function inviteEndpoints(app) {
  if (!app) return;

  app.get("/invite/:code", async (request, response) => {
    try {
      const { code } = request.params;
      const invite = await Invite.get({ code });
      if (!invite) {
        response.status(200).json({ invite: null, error: "Invite not found." });
        return;
      }

      if (invite.status !== "pending") {
        response
          .status(200)
          .json({ invite: null, error: "Invite is no longer valid." });
        return;
      }

      response
        .status(200)
        .json({ invite: { code, status: invite.status }, error: null });
    } catch (e) {
      console.error(e);
      response.sendStatus(500).end();
    }
  });

  app.post(
    "/invite/:code",
    [simpleSSOLoginDisabledMiddleware],
    async (request, response) => {
      try {
        const { code } = request.params;
        const { username, password } = reqBody(request);
        const invite = await Invite.get({ code });
        if (!invite || invite.status !== "pending") {
          response
            .status(200)
            .json({ success: false, error: "Invite not found or is invalid." });
          return;
        }
  
        // Check seat limit if invite has organization
        if (invite.organizationId) {
          const seatLimitCheck = await checkSeatLimit(invite.organizationId);
          if (seatLimitCheck.exceeded) {
            response
              .status(200)
              .json({
                success: false,
                error: `Organization has reached its seat limit (${seatLimitCheck.limit}). Please upgrade your plan to add more users.`
              });
            return;
          }
        }
  
        const { user, error } = await User.create({
          username,
          password,
          role: "default",
          organizationId: invite.organizationId,
        });
        if (!user) {
          console.error("Accepting invite:", error);
          response.status(200).json({ success: false, error });
          return;
        }

        await Invite.markClaimed(invite.id, user);
        await EventLogs.logEvent(
          "invite_accepted",
          {
            username: user.username,
          },
          user.id
        );

        response.status(200).json({ success: true, error: null });
      } catch (e) {
        console.error(e);
        response.sendStatus(500).end();
      }
    }
  );
}

module.exports = { inviteEndpoints };
