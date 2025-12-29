import AgentWebSearchSelection from "./WebSearchSelection";
import AgentSQLConnectorSelection from "./SQLConnectorSelection";
import GenericSkillPanel from "./GenericSkillPanel";
import DefaultSkillPanel from "./DefaultSkillPanel";
import {
  Brain,
  File,
  Browser,
  ChartBar,
  FileMagnifyingGlass,
  Lightning,
  Detective,
  Users,
} from "@phosphor-icons/react";
import RAGImage from "@/media/agents/rag-memory.png";
import SummarizeImage from "@/media/agents/view-summarize.png";
import ScrapeWebsitesImage from "@/media/agents/scrape-websites.png";
import GenerateChartsImage from "@/media/agents/generate-charts.png";
import GenerateSaveImages from "@/media/agents/generate-save-files.png";

export const defaultSkills = {
  "rag-memory": {
    title: "RAG & long-term memory",
    description:
      'Allow the agent to leverage your local documents to answer a query or ask the agent to "remember" pieces of content for long-term memory retrieval.',
    component: DefaultSkillPanel,
    icon: Brain,
    image: RAGImage,
    skill: "rag-memory",
  },
  "document-summarizer": {
    title: "View & summarize documents",
    description:
      "Allow the agent to list and summarize the content of workspace files currently embedded.",
    component: DefaultSkillPanel,
    icon: File,
    image: SummarizeImage,
    skill: "document-summarizer",
  },
  "web-scraping": {
    title: "Scrape websites",
    description: "Allow the agent to visit and scrape the content of websites.",
    component: DefaultSkillPanel,
    icon: Browser,
    image: ScrapeWebsitesImage,
    skill: "web-scraping",
  },
};

export const configurableSkills = {
  "save-file-to-browser": {
    title: "Generate & save files",
    description:
      "Enable the default agent to generate and write to files that can be saved to your computer.",
    component: GenericSkillPanel,
    skill: "save-file-to-browser",
    icon: FileMagnifyingGlass,
    image: GenerateSaveImages,
  },
  "create-chart": {
    title: "Generate charts",
    description:
      "Enable the default agent to generate various types of charts from data provided or given in chat.",
    component: GenericSkillPanel,
    skill: "create-chart",
    icon: ChartBar,
    image: GenerateChartsImage,
  },
  "web-browsing": {
    title: "Web Search",
    component: AgentWebSearchSelection,
    skill: "web-browsing",
  },
  "sql-agent": {
    title: "SQL Connector",
    component: AgentSQLConnectorSelection,
    skill: "sql-agent",
  },
  "api-tester": {
    title: "API Tester",
    description:
      "Test API endpoints before using them. Verifies status, response time, and returns sample response data.",
    component: GenericSkillPanel,
    skill: "api-tester",
    icon: Lightning,
  },
  "browser-qa": {
    title: "Browser QA Tester",
    description:
      "Controls a real browser via Browserless to perform UI testing. Can click, type, verify content, and take screenshots. Requires BROWSER_WS_URL env var.",
    component: GenericSkillPanel,
    skill: "browser-qa",
    icon: Detective,
  },
  "crm-manager": {
    title: "CRM Manager",
    description:
      "Manage your CRM from chat. Create, update, move, and delete leads. List pipelines and filter opportunities by stage.",
    component: GenericSkillPanel,
    skill: "crm-manager",
    icon: Users,
  },
};
