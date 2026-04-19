import fs from "fs/promises";
import path from "path";

import { inngestClient } from "../inngest/client.js";
import { Document } from "../models/document.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const uploadDocument = asyncHandler(async (req, res) => {
  const { title } = req.body;

  if (!req.file) {
    throw new ApiError(400, "File is required");
  }

  const uploadedFilePath = path.normalize(req.file.path);

  let document;
  try {
    document = await Document.create({
      title: title?.trim() || req.file.originalname,
      userId: req.user._id,
      status: "pending",
      fileKey: uploadedFilePath.replace(/\\/g, "/"),
    });
  } catch (error) {
    try {
      await fs.unlink(uploadedFilePath);
    } catch (unlinkError) {
      if (unlinkError?.code !== "ENOENT") {
        console.warn("Failed to cleanup uploaded temp file after DB failure", {
          uploadedFilePath,
          error: unlinkError?.message,
        });
      }
    }

    throw error;
  }

  try {
    await inngestClient.send({
      name: "pdf/process.started",
      data: {
        documentId: document._id.toString(),
        filePath: document.fileKey,
        userId: req.user._id.toString(),
      },
    });
  } catch (error) {
    // Don't fail the upload in local/dev just because background processing isn't configured.
    console.error("Failed to enqueue pdf/process.started", {
      documentId: document._id.toString(),
      error: error?.message,
    });

    const isProd = process.env.NODE_ENV === "production";

    await Document.findByIdAndUpdate(document._id, { status: "failed" });
    document.status = "failed";

    // No background job will run if enqueue failed, so clean up the temp file.
    try {
      await fs.unlink(uploadedFilePath);
    } catch (unlinkError) {
      if (unlinkError?.code !== "ENOENT") {
        console.warn("Failed to cleanup uploaded temp file after enqueue failure", {
          uploadedFilePath,
          error: unlinkError?.message,
        });
      }
    }

    if (isProd) {
      throw error;
    }
  }

  const responseDocument = {
    _id: document._id,
    title: document.title,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };

  return res
    .status(201)
    .json(new ApiResponse(201, responseDocument, "Document uploaded successfully"));
});

const getDocuments = asyncHandler(async (req, res) => {
  const documents = await Document.find({ userId: req.user._id }).sort({
    createdAt: -1,
  });

  const responseDocuments = documents.map((document) => ({
    _id: document._id,
    title: document.title,
    status: document.status,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  }));

  return res
    .status(200)
    .json(new ApiResponse(200, responseDocuments, "Documents fetched successfully"));
});

export { uploadDocument, getDocuments };
