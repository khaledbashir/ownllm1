const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { getVectorDbClass } = require("../utils/helpers");
const prisma = require("../utils/prisma");
const { Telemetry } = require("../../models/telemetry");
const { EventLogs } = require("../../models/eventLogs");
const { getModelTag } = require("../../endpoints/utils");

const documentsPath =
  process.env.NODE_ENV === "development"
    ? path.resolve(__dirname, `../../storage/documents`)
    : path.resolve(process.env.STORAGE_DIR, `documents`);

/**
 * ProcessDocument class for handling document uploads and processing
 * Used primarily for form responses and other programmatic document creation
 */
class ProcessDocument {
  constructor({ workspaceId, userId = null }) {
    this.workspaceId = workspaceId;
    this.userId = userId;
    this.documentStoragePath = documentsPath;
  }

  log(text, ...args) {
    console.log(`\x1b[36m[ProcessDocument]\x1b[0m ${text}`, ...args);
  }

  /**
   * Upload and process a document
   * @param {Object} docData - Document data containing title, content, size, mime
   * @param {string} filename - Filename for the document
   * @param {Object} metadata - Additional metadata (from, formId, responseId, etc.)
   * @returns {Promise<{document: Object|null}>}
   */
  async uploadDocument(docData, filename, metadata = {}) {
    try {
      // Ensure storage directory exists
      if (!fs.existsSync(this.documentStoragePath)) {
        fs.mkdirSync(this.documentStoragePath, { recursive: true });
      }

      // Create a unique document ID
      const docId = uuidv4();

      // Create a subdirectory for this workspace's documents
      const workspaceDir = path.join(
        this.documentStoragePath,
        `workspace-${this.workspaceId}`
      );

      if (!fs.existsSync(workspaceDir)) {
        fs.mkdirSync(workspaceDir, { recursive: true });
      }

      // Prepare the file path
      const docPath = path.join(workspaceDir, filename);

      // Create the document data structure (LangDocument format)
      const langDocument = {
        pageContent: docData.content,
        metadata: {
          title: docData.title,
          size: docData.size,
          mime: docData.mime,
          source: "form",
          ...metadata,
          workspaceId: this.workspaceId,
          createdAt: new Date().toISOString(),
        },
      };

      // Write the document to storage
      fs.writeFileSync(docPath, JSON.stringify(langDocument), "utf8");

      // Get relative path for storage in database
      const relativeDocPath = path.relative(this.documentStoragePath, docPath);

      // Store in database
      const newDoc = {
        docId,
        filename: filename,
        docpath: relativeDocPath,
        workspaceId: this.workspaceId,
        metadata: JSON.stringify(langDocument.metadata),
      };

      // Optionally embed the document
      const workspace = await prisma.workspaces.findUnique({
        where: { id: this.workspaceId },
      });

      if (workspace) {
        const VectorDb = getVectorDbClass();
        const { vectorized, error } = await VectorDb.addDocumentToNamespace(
          workspace.slug,
          { ...langDocument, docId },
          relativeDocPath
        );

        if (!vectorized) {
          this.log(`Failed to vectorize document: ${docData.title}`, error);
        } else {
          this.log(`Document vectorized: ${docData.title}`);
        }

        // Create database record
        try {
          const createdDoc = await prisma.workspace_documents.create({
            data: newDoc,
          });

          // Send telemetry
          await Telemetry.sendTelemetry("documents_embedded_in_workspace", {
            LLMSelection: process.env.LLM_PROVIDER || "openai",
            Embedder: process.env.EMBEDDING_ENGINE || "inherit",
            VectorDbSelection: process.env.VECTOR_DB || "lancedb",
            TTSSelection: process.env.TTS_PROVIDER || "native",
            LLMModel: getModelTag(),
          });

          // Log event
          await EventLogs.logEvent(
            "workspace_documents_added",
            {
              workspaceName: workspace?.name || "Unknown Workspace",
              numberOfDocumentsAdded: 1,
            },
            this.userId
          );

          this.log(`Document created successfully: ${filename}`);
          return { document: createdDoc };
        } catch (dbError) {
          this.log(`Failed to create database record: ${dbError.message}`);
          // Clean up file if database insert failed
          if (fs.existsSync(docPath)) {
            fs.unlinkSync(docPath);
          }
          return { document: null };
        }
      }

      return { document: null };
    } catch (error) {
      this.log(`Error uploading document: ${error.message}`);
      return { document: null };
    }
  }

  /**
   * Delete a document by docId
   * @param {string} docId - Document ID to delete
   * @returns {Promise<boolean>}
   */
  async deleteDocument(docId) {
    try {
      const document = await prisma.workspace_documents.findFirst({
        where: {
          docId: String(docId),
          workspaceId: this.workspaceId,
        },
      });

      if (!document) {
        this.log(`Document not found: ${docId}`);
        return false;
      }

      const workspace = await prisma.workspaces.findUnique({
        where: { id: this.workspaceId },
      });

      if (workspace) {
        const VectorDb = getVectorDbClass();
        await VectorDb.deleteDocumentFromNamespace(
          workspace.slug,
          document.docId
        );
      }

      // Delete file from storage
      const filePath = path.join(this.documentStoragePath, document.docpath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      // Delete from database
      await prisma.workspace_documents.delete({
        where: { id: document.id },
      });

      await EventLogs.logEvent(
        "workspace_documents_removed",
        {
          workspaceName: workspace?.name || "Unknown Workspace",
          numberOfDocuments: 1,
        },
        this.userId
      );

      this.log(`Document deleted: ${docId}`);
      return true;
    } catch (error) {
      this.log(`Error deleting document: ${error.message}`);
      return false;
    }
  }
}

module.exports = { ProcessDocument };
