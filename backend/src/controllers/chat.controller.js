import mongoose from "mongoose";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";

import { Document } from "../models/document.model.js";
import { Message } from "../models/message.model.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const sendMessage = asyncHandler(async (req, res) => {
  const { documentId, message } = req.body;

  if (!documentId || !message || String(message).trim() === "") {
    throw new ApiError(400, "documentId and message are required");
  }

  const ownedDocument = await Document.findOne({
    _id: documentId,
    userId: req.user._id,
  }).select("_id userId title");

  if (!ownedDocument) {
    throw new ApiError(404, "Document not found or access denied");
  }

  const userMessageContent = String(message).trim();

  await Message.create({
    documentId: ownedDocument._id,
    userId: req.user._id,
    role: "user",
    content: userMessageContent,
  });

  const lastMessages = await Message.find({
    documentId: ownedDocument._id,
    userId: req.user._id,
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const orderedContextMessages = lastMessages.reverse();
  const chatHistoryContext = orderedContextMessages
    .map((item) => `${item.role}: ${item.content}`)
    .join("\n");

  if (!process.env.GEMINI_API_KEY) {
    throw new ApiError(500, "GEMINI_API_KEY is not configured");
  }

  if (!mongoose.connection.db) {
    throw new ApiError(500, "MongoDB connection is not ready");
  }

  const collection = mongoose.connection.db.collection(
    process.env.VECTOR_COLLECTION_NAME || "document_chunks"
  );

  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-001",
  });

  // Atlas Vector Search with pre-filter scoped to the requested document.
  const vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
    collection,
    indexName: process.env.VECTOR_INDEX_NAME || "default",
    textKey: "text",
    embeddingKey: "embedding",
  });

  let retrievalContext = "";

  try {
    const queryVector = await embeddings.embedQuery(userMessageContent);
    const retrievedChunksWithScore = await vectorStore.similaritySearchVectorWithScore(
      queryVector,
      4,
      {
        preFilter: {
          documentId: ownedDocument._id.toString(),
        },
      }
    );

    retrievalContext = retrievedChunksWithScore
      .map(([chunk], index) => `Chunk ${index + 1}: ${chunk.pageContent || ""}`)
      .join("\n\n");
  } catch (error) {
    console.warn("Vector search failed; falling back to non-vector chunks", {
      documentId: ownedDocument._id.toString(),
      error: error?.message,
    });
  }

  if (!retrievalContext) {
    const fallbackChunks = await collection
      .find(
        { documentId: ownedDocument._id.toString() },
        { projection: { text: 1 } }
      )
      .sort({ "loc.pageNumber": 1 })
      .limit(4)
      .toArray();

    retrievalContext = fallbackChunks
      .map((chunk, index) => `Chunk ${index + 1}: ${chunk.text || ""}`)
      .join("\n\n");
  }

  const systemPrompt =
    "You are an AI assistant. Use the provided context to answer. Context: " +
    retrievalContext;

  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: process.env.GEMINI_CHAT_MODEL || "gemini-1.5-flash",
    temperature: 0.2,
  });

  const inputMessages = [
    new SystemMessage(systemPrompt),
    new HumanMessage(`Conversation history:\n${chatHistoryContext}`),
    new HumanMessage(userMessageContent),
  ];

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  let fullAssistantResponse = "";

  try {
    const stream = await llm.stream(inputMessages);

    for await (const chunk of stream) {
      const token =
        typeof chunk.content === "string"
          ? chunk.content
          : Array.isArray(chunk.content)
            ? chunk.content
                .map((part) => (typeof part === "string" ? part : part?.text || ""))
                .join("")
            : "";

      if (!token) {
        continue;
      }

      fullAssistantResponse += token;
      res.write(`data: ${JSON.stringify({ token })}\n\n`);
    }

    await Message.create({
      documentId: ownedDocument._id,
      userId: req.user._id,
      role: "assistant",
      content: fullAssistantResponse,
    });

    res.write("event: done\ndata: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("sendMessage stream failed", {
      documentId,
      userId: req.user._id.toString(),
      error: error?.message,
    });

    if (!res.headersSent) {
      throw new ApiError(500, "Failed to stream AI response", [error?.message]);
    }

    res.write(
      `event: error\\ndata: ${JSON.stringify({ message: "Failed to stream AI response" })}\\n\\n`
    );
    res.end();
  }
});

export { sendMessage };
