import { useState } from "react";

function ChatInput({ disabled, onSend }) {
  const [value, setValue] = useState("");

  const handleSend = async () => {
    const content = value.trim();
    if (!content) {
      return;
    }

    setValue("");
    await onSend(content);
  };

  return (
    <div className="mt-3 rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-3">
      <textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            handleSend();
          }
        }}
        rows={3}
        placeholder="Ask a question about this document..."
        disabled={disabled}
        className="w-full resize-none rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60"
      />

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={handleSend}
          disabled={disabled || !value.trim()}
          className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatInput;
