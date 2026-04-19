import { Router } from "express";

import { sendMessage } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const chatRouter = Router();

chatRouter.post("/send", verifyJWT, sendMessage);

export { chatRouter };
