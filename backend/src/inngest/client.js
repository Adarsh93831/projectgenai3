import { Inngest } from "inngest";

const isProd = process.env.NODE_ENV === "production";
const eventKey = process.env.INNGEST_EVENT_KEY;

if (isProd && !eventKey) {
  throw new Error("INNGEST_EVENT_KEY is required in production");
}

const inngestClient = new Inngest({
  id: "pdf-query-ai",
  name: "PDF Query AI",
  eventKey,
});

export { inngestClient };
