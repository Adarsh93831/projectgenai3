import { useCallback } from "react";

import { createChatStream } from "../lib/api.js";
import { useAppStore } from "../store/app.store.js";

const useChatStream = () => {
  const {
    appendMessage,
    patchLastAssistantMessage,
    setError,
    setStreaming,
    streaming,
  } = useAppStore();

  const sendMessage = useCallback(
    async ({ documentId, content }) => {
      if (!documentId || !content?.trim() || streaming) {
        return;
      }

      const userText = content.trim();

      appendMessage(documentId, {
        role: "user",
        content: userText,
      });

      appendMessage(documentId, {
        role: "assistant",
        content: "",
      });

      setStreaming(true);
      setError("");

      try {
        const reader = await createChatStream(documentId, userText);
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { value, done } = await reader.read();

          if (done) {
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() || "";

          for (const eventText of events) {
            const lines = eventText.split("\n");
            for (const line of lines) {
              if (!line.startsWith("data: ")) {
                continue;
              }

              const raw = line.slice(6).trim();
              if (!raw || raw === "[DONE]") {
                continue;
              }

              try {
                const parsed = JSON.parse(raw);
                if (parsed.token) {
                  patchLastAssistantMessage(documentId, parsed.token);
                }
              } catch {
                patchLastAssistantMessage(documentId, raw);
              }
            }
          }
        }
      } catch (error) {
        setError(error.message);
      } finally {
        setStreaming(false);
      }
    },
    [appendMessage, patchLastAssistantMessage, setError, setStreaming, streaming]
  );

  return { sendMessage, streaming };
};

export { useChatStream };
