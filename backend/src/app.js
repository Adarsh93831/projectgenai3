import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

import { errorHandler } from "./middlewares/error.middleware.js";
import { authRouter } from "./routes/auth.routes.js";
import { chatRouter } from "./routes/chat.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { inngestRouter } from "./routes/inngest.routes.js";
import { ApiResponse } from "./utils/ApiResponse.js";

const app = express();

const envOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const isProduction = process.env.NODE_ENV === "production";

const isDevLoopbackOrigin = (origin) =>
  /^http:\/\/(localhost|127\.0\.0\.1):(\d+)$/.test(origin);

const allowedOrigins = new Set(envOrigins);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow same-origin or non-browser requests that do not send Origin.
    if (!origin) {
      callback(null, true);
      return;
    }

    if (allowedOrigins.has(origin)) {
      callback(null, true);
      return;
    }

    // In local development allow any localhost/127.0.0.1 port (Vite may switch ports).
    if (!isProduction && isDevLoopbackOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

app.get("/api/v1/health", (_req, res) => {
  res.status(200).json(new ApiResponse(200, {}, "Server is healthy"));
});

app.use("/api/v1/auth", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/v1/documents", documentRouter);
app.use("/api/v1/chat", chatRouter);
app.use("/api/inngest", inngestRouter);

app.use(errorHandler);

export { app };
