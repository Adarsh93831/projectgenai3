import { Router } from "express";

import {
  getDocuments,
  uploadDocument,
} from "../controllers/document.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const documentRouter = Router();

documentRouter.post("/upload", verifyJWT, upload.single("file"), uploadDocument);
documentRouter.get("/", verifyJWT, getDocuments);

export { documentRouter };
