require("dotenv").config();

// Pre-hash AUTH_TOKEN at startup for password-based authentication
// This prevents the bcrypt error and ensures consistent comparisons
const bcrypt = require("bcrypt");
process.env.HASHED_AUTH_TOKEN = process.env.AUTH_TOKEN
  ? bcrypt.hashSync(process.env.AUTH_TOKEN, 10)
  : "";

require("./utils/logger")();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const { reqBody } = require("./utils/http");
const { systemEndpoints } = require("./endpoints/system");
const { workspaceEndpoints } = require("./endpoints/workspaces");
const { chatEndpoints } = require("./endpoints/chat");
const { dealCheckerEndpoints } = require("./endpoints/dealChecker");
const { embeddedEndpoints } = require("./endpoints/embed");
const { embedManagementEndpoints } = require("./endpoints/embedManagement");
const { getVectorDbClass } = require("./utils/helpers");
const { adminEndpoints } = require("./endpoints/admin");
const { inviteEndpoints } = require("./endpoints/invite");
const { utilEndpoints } = require("./endpoints/utils");
const { developerEndpoints } = require("./endpoints/api");
const { extensionEndpoints } = require("./endpoints/extensions");
const { bootHTTP, bootSSL } = require("./utils/boot");
const { workspaceThreadEndpoints } = require("./endpoints/workspaceThreads");
const { portalAuthEndpoints } = require("./endpoints/portalAuth");
const { documentEndpoints } = require("./endpoints/document");
const { agentWebsocket } = require("./endpoints/agentWebsocket");
const { experimentalEndpoints } = require("./endpoints/experimental");
const { browserExtensionEndpoints } = require("./endpoints/browserExtension");
const { communityHubEndpoints } = require("./endpoints/communityHub");
const { agentFlowEndpoints } = require("./endpoints/agentFlows");

const { crmEndpoints } = require("./endpoints/crm");
const { formsEndpoints } = require("./endpoints/forms");
const { organizationEndpoints } = require("./endpoints/organization");
const { mcpServersEndpoints } = require("./endpoints/mcpServers");
const { artifactsEndpoints } = require("./endpoints/artifacts");
const { billingEndpoints } = require("./endpoints/billing");

const { vaultEndpoints } = require("./endpoints/vault");
const { smartPluginsEndpoints } = require("./endpoints/smartPlugins");
const { flowGenerationEndpoints } = require("./endpoints/flowGeneration");
const { mobileEndpoints } = require("./endpoints/mobile");
const { agentTestLabEndpoints } = require("./endpoints/agentTestLab");
const { inlineAIEndpoints } = require("./endpoints/inlineAI");
const { templatesEndpoints } = require("./endpoints/templates");
const { labEndpoints } = require("./endpoints/lab");
const { blockTemplatesEndpoints } = require("./endpoints/blockTemplates");
const { publicProposalsEndpoints } = require("./endpoints/publicProposals");
const { clientPortalEndpoints } = require("./endpoints/clientPortal");
const { documentProcessorEndpoints } = require("./routes/documentProcessor");
const { httpLogger } = require("./middleware/httpLogger");
const app = express();
const apiRouter = express.Router();
const FILE_LIMIT = "3GB";

// Only log HTTP requests in development mode and if the ENABLE_HTTP_LOGGER environment variable is set to true
if (
  process.env.NODE_ENV === "development" &&
  !!process.env.ENABLE_HTTP_LOGGER
) {
  app.use(
    httpLogger({
      enableTimestamps: !!process.env.ENABLE_HTTP_LOGGER_TIMESTAMPS,
    })
  );
}
app.use(cors({ origin: true }));
app.use(bodyParser.text({ limit: FILE_LIMIT }));
app.use(bodyParser.json({ limit: FILE_LIMIT }));
app.use(
  bodyParser.urlencoded({
    limit: FILE_LIMIT,
    extended: true,
  })
);

if (!!process.env.ENABLE_HTTPS) {
  bootSSL(app, process.env.SERVER_PORT || 3001);
} else {
  require("@mintplex-labs/express-ws").default(app); // load WebSockets in non-SSL mode.
}

app.use("/api", apiRouter);

// Serve uploads statically
if (process.env.STORAGE_DIR) {
  apiRouter.use(
    "/assets",
    express.static(path.resolve(process.env.STORAGE_DIR, "assets"))
  );
} else {
  // Fallback for dev
  apiRouter.use(
    "/assets",
    express.static(path.resolve(__dirname, "storage/assets"))
  );
}

// PDF Export Endpoint using Playwright
const fsModule = require("fs").promises;
const { spawn } = require("child_process");

apiRouter.post("/export/pdf", async (req, res) => {
  try {
    const { content, filename } = req.body || {};

    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    const exportName = filename || 'export';
    const outputDir = path.join(__dirname, "storage/exports");
    const htmlFile = path.join(outputDir, exportName + '.html');
    const pdfFile = path.join(outputDir, exportName + '.pdf');

    // Ensure output directory exists
    await fsModule.mkdir(outputDir, { recursive: true });

    // Save HTML content
    await fsModule.writeFile(htmlFile, content, 'utf8');

    // Call Playwright MCP to generate PDF
    const playwrightOutput = await new Promise((resolve, reject) => {
      const playwrightScript = `
        const { chromium } = require('playwright');
        const browser = await chromium.launch();
        const page = await browser.newPage();
        await page.setContent(require('fs').readFileSync('/data/${exportName}.html', 'utf8'));
        await page.pdf({ path: '/data/${exportName}.pdf', format: 'A4', printBackground: true });
        await browser.close();
        console.log('PDF generated successfully');
      `;

      const playwrightProcess = spawn('docker', [
        'run',
        '--rm',
        '-v',
        outputDir + ':/data',
        '-e',
        'DISPLAY=:99',
        'mcp/mcp-playwright',
        'exec',
        'node', '-e', playwrightScript
      ]);

      playwrightProcess.stdout.on('data', (data) => {
        console.log('Playwright:', data.toString());
      });

      playwrightProcess.stderr.on('data', (data) => {
        console.log('Playwright stderr:', data.toString());
      });

      playwrightProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Playwright failed with code: ' + code));
        }
      });
    });

    // Check if PDF was created
    await new Promise(resolve => setTimeout(resolve, 5000));

    if (await fsModule.access(pdfFile).then(() => true).catch(() => false)) {
      const pdfBase64 = await fsModule.readFile(pdfFile);
      res.json({
        success: true,
        message: "PDF generated successfully",
        filename: exportName + '.pdf',
        pdfUrl: '/api/assets/exports/' + exportName + '.pdf',
        pdfData: pdfBase64.toString('base64')
      });
    } else {
      res.status(500).json({ error: "Failed to generate PDF" });
    }

  } catch (error) {
    console.error('PDF Export Error:', error);
    const errorMessage = error?.message || error?.toString() || "Unknown error occurred during PDF export";
    console.error('Error details:', errorMessage);
    res.status(500).json({ error: errorMessage });
  }
});

// Serve export files statically
apiRouter.use("/exports", express.static(path.join(__dirname, "storage/exports")));

systemEndpoints(apiRouter);
extensionEndpoints(apiRouter);
workspaceEndpoints(apiRouter);
workspaceThreadEndpoints(apiRouter);
chatEndpoints(apiRouter);
dealCheckerEndpoints(apiRouter);
dealCheckerEndpoints(apiRouter);
adminEndpoints(apiRouter);
organizationEndpoints(apiRouter);
billingEndpoints(apiRouter);
inviteEndpoints(apiRouter);
embedManagementEndpoints(apiRouter);
utilEndpoints(apiRouter);
documentEndpoints(apiRouter);
agentWebsocket(apiRouter);
experimentalEndpoints(apiRouter);
developerEndpoints(app, apiRouter);
communityHubEndpoints(apiRouter);
agentFlowEndpoints(apiRouter);
mcpServersEndpoints(apiRouter);
artifactsEndpoints(apiRouter);

smartPluginsEndpoints(apiRouter);
flowGenerationEndpoints(apiRouter);

crmEndpoints(apiRouter);
formsEndpoints(apiRouter);
vaultEndpoints(apiRouter);
mobileEndpoints(apiRouter);
agentTestLabEndpoints(apiRouter);
inlineAIEndpoints(apiRouter);
templatesEndpoints(apiRouter);
labEndpoints(apiRouter);
blockTemplatesEndpoints(apiRouter);
publicProposalsEndpoints(apiRouter);
portalAuthEndpoints(apiRouter);
clientPortalEndpoints(apiRouter);
documentProcessorEndpoints(apiRouter);

// Externally facing embedder endpoints
embeddedEndpoints(apiRouter);

// Externally facing browser extension endpoints
browserExtensionEndpoints(apiRouter);

if (process.env.NODE_ENV !== "development") {
  const { MetaGenerator } = require("./utils/boot/MetaGenerator");
  const IndexPage = new MetaGenerator();

  app.use(
    express.static(path.resolve(__dirname, "public"), {
      extensions: ["js"],
      setHeaders: (res) => {
        // Disable I-framing of entire site UI
        res.removeHeader("X-Powered-By");
        res.setHeader("X-Frame-Options", "DENY");
      },
    })
  );

  app.get("/robots.txt", function (_, response) {
    response.type("text/plain");
    response.send("User-agent: *\nDisallow: /").end();
  });

  app.get("/manifest.json", async function (_, response) {
    IndexPage.generateManifest(response);
    return;
  });

  app.use("/", function (_, response) {
    IndexPage.generate(response);
    return;
  });
} else {
  // Debug route for development connections to vectorDBs
  apiRouter.post("/v/:command", async (request, response) => {
    try {
      const VectorDb = getVectorDbClass();
      const { command } = request.params;
      if (!Object.getOwnPropertyNames(VectorDb).includes(command)) {
        response.status(500).json({
          message: "invalid interface command",
          commands: Object.getOwnPropertyNames(VectorDb),
        });
        return;
      }

      try {
        const body = reqBody(request);
        const resBody = await VectorDb[command](body);
        response.status(200).json({ ...resBody });
      } catch (e) {
        // console.error(e)
        console.error(JSON.stringify(e));
        response.status(500).json({ error: e.message });
      }
      return;
    } catch (e) {
      console.error(e.message, e);
      response.sendStatus(500).end();
    }
  });
}

app.all("*", function (request, response) {
  if (request.method === "GET" && !request.path.startsWith("/api/")) {
    const { MetaGenerator } = require("./utils/boot/MetaGenerator");
    const IndexPage = new MetaGenerator();
    IndexPage.generate(response);
    return;
  }
  response.sendStatus(404);
});

// Auto-seed public API registry on boot
async function seedPublicApis() {
  try {
    const { PublicApiRegistry } = require("./models/publicApiRegistry");
    const result = await PublicApiRegistry.seed();
    console.log(`[PublicApiRegistry] Seeded ${result.count} APIs`);
    console.log("!!! SERVER STARTUP CHECK - POST-FIX !!!");
    console.log("!!! IF YOU SEE THIS, SERVER CODE IS UPDATED !!!");
  } catch (e) {
    // Ignore if table doesn't exist yet (migration not run)
    console.log("[PublicApiRegistry] Seed skipped (migration may be pending)");
  }
}

// In non-https mode we need to boot at the end since the server has not yet
// started and is `.listen`ing.
if (!process.env.ENABLE_HTTPS) {
  // Seed APIs then start server
  seedPublicApis().then(() => {
    bootHTTP(app, process.env.SERVER_PORT || 3001);
  });
}
