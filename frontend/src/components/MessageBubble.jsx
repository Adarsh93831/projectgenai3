import ReactMarkdown from "react-markdown";

function MessageBubble({ role, content }) {
  const isUser = role === "user";

  return (
    <div className={`fade-in flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl border px-4 py-3 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "border-emerald-300/40 bg-[var(--user)]"
            : "border-[var(--line)] bg-[var(--assistant)]"
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="prose prose-sm max-w-none prose-headings:text-[var(--text-main)] prose-p:text-[var(--text-main)] prose-strong:text-[var(--text-main)]">
            <ReactMarkdown>{content || "..."}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

export default MessageBubble;
