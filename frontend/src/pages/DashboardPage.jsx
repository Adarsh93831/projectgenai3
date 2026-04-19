import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

import ChatInput from "../components/ChatInput.jsx";
import MessageBubble from "../components/MessageBubble.jsx";
import Sidebar from "../components/Sidebar.jsx";
import UploadButton from "../components/UploadButton.jsx";
import { useChatStream } from "../hooks/useChatStream.js";
import { useDocuments } from "../hooks/useDocuments.js";
import { useAppStore } from "../store/app.store.js";
import { useAuthStore } from "../store/auth.store.js";

function DashboardPage() {
  const navigate = useNavigate();
  const {
    documents,
    uploading,
    uploadProgress,
    hasProcessingDocuments,
    uploadDocument,
  } = useDocuments();

  const {
    selectedDocumentId,
    setSelectedDocumentId,
    messagesByDocument,
    error,
  } = useAppStore();

  const logout = useAuthStore((state) => state.logout);

  const { sendMessage, streaming } = useChatStream();

  const currentMessages = useMemo(
    () => messagesByDocument[selectedDocumentId] || [],
    [messagesByDocument, selectedDocumentId]
  );

  const selectedDocument = useMemo(
    () => documents.find((doc) => doc._id === selectedDocumentId),
    [documents, selectedDocumentId]
  );

  const handleSend = async (content) => {
    await sendMessage({
      documentId: selectedDocumentId,
      content,
    });
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="glass mx-auto flex min-h-[calc(100vh-2rem)] max-w-7xl overflow-hidden rounded-[30px] shadow-[0_30px_90px_rgba(31,47,38,0.18)]">
        <Sidebar
          documents={documents}
          selectedDocumentId={selectedDocumentId}
          onSelectDocument={setSelectedDocumentId}
        />

        <section className="flex min-h-full flex-1 flex-col bg-[var(--panel-soft)] p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <UploadButton
              onUpload={uploadDocument}
              uploading={uploading}
              progress={uploadProgress}
            />

            <div className="rounded-3xl border border-[var(--line)] bg-[var(--panel)] p-4 sm:p-5">
              <h2 className="text-lg font-semibold">Workspace Status</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                {selectedDocument
                  ? `Active: ${selectedDocument.title}`
                  : "Select a document from the sidebar."}
              </p>
              {hasProcessingDocuments ? (
                <p className="mt-3 inline-flex items-center rounded-full border border-emerald-300/40 bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  Processing in progress - polling every 3 seconds
                </p>
              ) : null}
              {error ? (
                <p className="mt-3 rounded-2xl border border-red-300/60 bg-red-100/70 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              ) : null}
              <button
                type="button"
                onClick={handleLogout}
                className="mt-4 rounded-2xl border border-[var(--line)] bg-white/70 px-3 py-2 text-sm font-semibold text-[var(--text-main)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-[var(--panel)]">
            <div className="border-b border-[var(--line)] px-4 py-3 sm:px-5 sm:py-4">
              <h2 className="text-lg font-semibold">RAG Chat</h2>
            </div>

            <div className="scrollbar-thin flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
              {selectedDocumentId ? (
                currentMessages.length ? (
                  currentMessages.map((item, index) => (
                    <MessageBubble
                      key={`${item.role}-${index}`}
                      role={item.role}
                      content={item.content}
                    />
                  ))
                ) : (
                  <p className="text-sm text-[var(--text-muted)]">
                    Ask a question about this document to start the conversation.
                  </p>
                )
              ) : (
                <p className="text-sm text-[var(--text-muted)]">
                  Select a document to enable chat.
                </p>
              )}
            </div>

            <div className="px-4 pb-4 sm:px-5 sm:pb-5">
              <ChatInput
                disabled={!selectedDocumentId || streaming}
                onSend={handleSend}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default DashboardPage;
