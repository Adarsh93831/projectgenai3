import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const PORT = process.env.PORT || 8000;

const startServer = async () => {
  try {
    // Import the app only after dotenv has loaded, so modules that read env vars
    // at import-time (e.g., Inngest client config) see the correct values.
    const { app } = await import("./app.js");

    await mongoose.connect(process.env.MONGODB_URI);
    app.listen(PORT, () => {
      // Keep startup logging concise in development and deployment logs.
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

startServer();
