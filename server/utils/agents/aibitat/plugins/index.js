const { webBrowsing } = require("./web-browsing.js");
const { webScraping } = require("./web-scraping.js");
const { websocket } = require("./websocket.js");
const { docSummarizer } = require("./summarize.js");
const { saveFileInBrowser } = require("./save-file-browser.js");
const { chatHistory } = require("./chat-history.js");
const { memory } = require("./memory.js");
const { rechart } = require("./rechart.js");
const { sqlAgent } = require("./sql-agent/index.js");
const { productExtraction } = require("./product-extraction.js");
const { apiTester } = require("./api-tester.js");
const { browserQA } = require("./browser-qa.js");
const { crmManager } = require("./crm-manager.js");
const { ancPricing } = require("./anc-pricing.js");

module.exports = {
  webScraping,
  webBrowsing,
  websocket,
  docSummarizer,
  saveFileInBrowser,
  chatHistory,
  memory,
  rechart,
  sqlAgent,
  productExtraction,
  apiTester,
  browserQA,
  crmManager,
  ancPricing,

  // Plugin name aliases so they can be pulled by slug as well.
  [webScraping.name]: webScraping,
  [webBrowsing.name]: webBrowsing,
  [websocket.name]: websocket,
  [docSummarizer.name]: docSummarizer,
  [saveFileInBrowser.name]: saveFileInBrowser,
  [chatHistory.name]: chatHistory,
  [memory.name]: memory,
  [rechart.name]: rechart,
  [sqlAgent.name]: sqlAgent,
  [productExtraction.name]: productExtraction,
  [apiTester.name]: apiTester,
  [browserQA.name]: browserQA,
  [crmManager.name]: crmManager,
  [ancPricing.name]: ancPricing,
};

