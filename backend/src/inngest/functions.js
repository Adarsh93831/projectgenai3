import fs from "fs/promises";
import path from "path";

import { Document as LangChainDocument } from "@langchain/core/documents";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import mongoose from "mongoose";

import { Document } from "../models/document.model.js";
import { inngestClient } from "./client.js";

const processPdfWorkflow = inngestClient.createFunction(
  {
    id: "process-pdf-workflow",
    triggers: [{ event: "pdf/process.started" }],
  },
  async ({ event, step }) => {
    const { documentId, filePath, userId } = event.data;

    if (!documentId || !filePath || !userId) {
      throw new Error("Missing required event data for PDF workflow");
    }

    const normalizedFilePath = path.normalize(filePath);

    // Safety: only allow reading/deleting files from our temp upload directory.
    const resolvedUploadDirectory = path.resolve("public/temp");
    const resolvedFilePath = path.resolve(normalizedFilePath);

    const uploadPrefix = resolvedUploadDirectory.toLowerCase() + path.sep;
    const targetPath = resolvedFilePath.toLowerCase();

    if (!targetPath.startsWith(uploadPrefix)) {
      throw new Error("Invalid filePath; expected a file inside public/temp");
    }

    try {
      await step.run("step-1-db-update-processing", async () => {
        await Document.findByIdAndUpdate(documentId, {
          status: "processing",
        });
      });

      const chunkPayloads = await step.run("step-2-load-and-split", async () => {
        const loader = new PDFLoader(normalizedFilePath);
        const loadedDocs = await loader.load();

        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 1000,
          chunkOverlap: 150,
        });

        const chunks = await splitter.splitDocuments(loadedDocs);

        return chunks.map((chunk) => ({
          pageContent: chunk.pageContent,
          metadata: {
            ...chunk.metadata,
            documentId,
            userId,
          },
        }));
      });

      await step.run("step-3-vectorization", async () => {
        if (!process.env.GEMINI_API_KEY) {
          throw new Error("GEMINI_API_KEY is not configured");
        }

        if (!mongoose.connection.db) {
          throw new Error("MongoDB connection is not ready");
        }

        const collection = mongoose.connection.db.collection(
          process.env.VECTOR_COLLECTION_NAME || "document_chunks"
        );

        const embeddings = new GoogleGenerativeAIEmbeddings({
          apiKey: process.env.GEMINI_API_KEY,
          model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
        });

        const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
          collection,
          indexName: process.env.VECTOR_INDEX_NAME || "default",
          textKey: "text",
          embeddingKey: "embedding",
        });

        const documentsForEmbedding = chunkPayloads.map(
          (chunk) => new LangChainDocument(chunk)
        );

        await vectorStore.addDocuments(documentsForEmbedding);
      });

      await step.run("step-4-finalize", async () => {
        await Document.findByIdAndUpdate(documentId, {
          status: "ready",
        });

        try {
          await fs.unlink(normalizedFilePath);
        } catch (error) {
          if (error?.code !== "ENOENT") {
            console.warn("Failed to cleanup temp PDF after processing", {
              documentId,
              userId,
              filePath: normalizedFilePath,
              error: error?.message,
            });
          }
        }
      });

      return { processed: true, documentId };
    } catch (error) {
      await step.run("mark-document-failed", async () => {
        await Document.findByIdAndUpdate(documentId, {
          status: "failed",
        });
      });

      console.error("processPdfWorkflow failed", {
        documentId,
        userId,
        filePath: normalizedFilePath,
        error: error?.message,
      });

      await step.run("cleanup-temp-file-after-failure", async () => {
        try {
          await fs.unlink(normalizedFilePath);
        } catch (cleanupError) {
          if (cleanupError?.code !== "ENOENT") {
            console.warn("Failed to cleanup temp PDF after workflow failure", {
              documentId,
              userId,
              filePath: normalizedFilePath,
              error: cleanupError?.message,
            });
          }
        }
      });

      throw error;
    }
  }
);

export { processPdfWorkflow };
