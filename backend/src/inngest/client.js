import { Inngest } from "inngest";

const isProd = process.env.NODE_ENV === "production";

const inngestClient = new Inngest({
  id: "pdf-query-ai",
  name: "PDF Query AI",
  // In local/dev, Inngest commonly uses the "local" event key.
  // In production, require INNGEST_EVENT_KEY to be configured.
  eventKey: process.env.INNGEST_EVENT_KEY || (isProd ? undefined : "local"),
});

export { inngestClient };
