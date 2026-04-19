const statusStyles = {
  pending: "bg-amber-100 text-amber-800 border-amber-300/50",
  processing: "bg-sky-100 text-sky-800 border-sky-300/50",
  ready: "bg-emerald-100 text-emerald-800 border-emerald-300/50",
  failed: "bg-red-100 text-red-800 border-red-300/50",
};

function Sidebar({ documents, selectedDocumentId, onSelectDocument }) {
  return (
    <aside className="w-full max-w-sm border-r border-[var(--line)] bg-[var(--panel)] backdrop-blur">
      <div className="border-b border-[var(--line)] px-6 py-5">
        <h1 className="text-xl font-bold tracking-tight">PDF Query AI</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Pick a document to start contextual chat.
        </p>
      </div>

      <div className="scrollbar-thin max-h-[calc(100vh-120px)] overflow-y-auto px-4 py-4">
        {documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white/40 p-4 text-sm text-[var(--text-muted)]">
            No documents yet. Upload your first PDF.
          </div>
        ) : (
          <ul className="space-y-3">
            {documents.map((document) => {
              const isActive = selectedDocumentId === document._id;

              return (
                <li key={document._id}>
                  <button
                    type="button"
                    onClick={() => onSelectDocument(document._id)}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-[var(--accent)] bg-orange-50 shadow-[0_10px_26px_rgba(234,91,42,0.2)]"
                        : "border-[var(--line)] bg-[var(--panel-soft)] hover:border-[var(--accent-soft)] hover:bg-white/70"
                    }`}
                  >
                    <div className="line-clamp-2 text-sm font-semibold">{document.title}</div>
                    <div className="mt-3 flex items-center justify-between">
                      <span
                        className={`rounded-full border px-2 py-1 text-xs font-medium ${
                          statusStyles[document.status] || statusStyles.pending
                        }`}
                      >
                        {document.status}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;
