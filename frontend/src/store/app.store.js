import { create } from "zustand";

const useAppStore = create((set, get) => ({
  documents: [],
  selectedDocumentId: "",
  messagesByDocument: {},
  documentsLoading: false,
  uploading: false,
  uploadProgress: 0,
  streaming: false,
  error: "",

  setDocuments: (documents) =>
    set((state) => {
      const selectedDocumentId =
        state.selectedDocumentId &&
        documents.some((doc) => doc._id === state.selectedDocumentId)
          ? state.selectedDocumentId
          : documents[0]?._id || "";

      return { documents, selectedDocumentId };
    }),

  setSelectedDocumentId: (selectedDocumentId) => set({ selectedDocumentId }),

  setMessagesForDocument: (documentId, messages) =>
    set((state) => ({
      messagesByDocument: {
        ...state.messagesByDocument,
        [documentId]: messages,
      },
    })),

  appendMessage: (documentId, message) => {
    const existing = get().messagesByDocument[documentId] || [];
    set((state) => ({
      messagesByDocument: {
        ...state.messagesByDocument,
        [documentId]: [...existing, message],
      },
    }));
  },

  patchLastAssistantMessage: (documentId, chunk) => {
    const existing = get().messagesByDocument[documentId] || [];
    if (!existing.length) {
      return;
    }

    const lastIndex = existing.length - 1;
    const last = existing[lastIndex];
    if (last.role !== "assistant") {
      return;
    }

    const next = [...existing];
    next[lastIndex] = {
      ...last,
      content: `${last.content}${chunk}`,
    };

    set((state) => ({
      messagesByDocument: {
        ...state.messagesByDocument,
        [documentId]: next,
      },
    }));
  },

  setDocumentsLoading: (documentsLoading) => set({ documentsLoading }),
  setUploading: (uploading) => set({ uploading }),
  setUploadProgress: (uploadProgress) => set({ uploadProgress }),
  setStreaming: (streaming) => set({ streaming }),
  setError: (error) => set({ error }),
}));

export { useAppStore };
