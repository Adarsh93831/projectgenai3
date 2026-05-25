import { Router } from "express";
import { serve } from "inngest/express";

import { inngestClient } from "../inngest/client.js";
import { processPdfWorkflow } from "../inngest/functions.js";

const inngestRouter = Router();

inngestRouter.use(
  "/",
  serve({
    client: inngestClient,
    functions: [processPdfWorkflow],
    signingKey: process.env.INNGEST_SIGNING_KEY,
  })
);

export { inngestRouter };
