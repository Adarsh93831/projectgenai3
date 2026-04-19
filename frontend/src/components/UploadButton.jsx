import { useRef, useState } from "react";

function UploadButton({ onUpload, uploading, progress }) {
  const inputRef = useRef(null);
  const [title, setTitle] = useState("");

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    await onUpload({ file, title });
    event.target.value = "";
    setTitle("");
  };

  return (
    <section className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
      <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Document title (optional)
      </label>
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="Q4 Product Strategy"
        className="mt-2 w-full rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)]"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-2xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[var(--accent-ink)] transition hover:translate-y-[-1px] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="hidden"
        />

        {uploading ? (
          <div className="min-w-40">
            <div className="h-2 overflow-hidden rounded-full bg-black/10">
              <div
                className="h-full rounded-full bg-[var(--accent)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{progress}% uploaded</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}

export default UploadButton;
