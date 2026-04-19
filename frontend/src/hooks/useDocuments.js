import { useCallback, useEffect, useMemo } from "react";

import { fetchDocumentsApi, uploadDocumentApi } from "../lib/api.js";
import { useAppStore } from "../store/app.store.js";

const useDocuments = () => {
  const {
    documents,
    documentsLoading,
    uploading,
    uploadProgress,
    setDocuments,
    setDocumentsLoading,
    setUploading,
    setUploadProgress,
    setError,
  } = useAppStore();

  const fetchDocuments = useCallback(async () => {
    setDocumentsLoading(true);

    try {
      const result = await fetchDocumentsApi();
      setDocuments(result);
      setError("");
    } catch (error) {
      setError(error.message);
    } finally {
      setDocumentsLoading(false);
    }
  }, [setDocuments, setDocumentsLoading, setError]);

  const uploadDocument = useCallback(
    async ({ file, title }) => {
      setUploading(true);
      setUploadProgress(0);

      try {
        await uploadDocumentApi(file, title, setUploadProgress);
        await fetchDocuments();
        setError("");
      } catch (error) {
        setError(error.message);
      } finally {
        setUploading(false);
      }
    },
    [fetchDocuments, setError, setUploadProgress, setUploading]
  );

  const hasProcessingDocuments = useMemo(
    () => documents.some((doc) => doc.status === "processing" || doc.status === "pending"),
    [documents]
  );

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  useEffect(() => {
    if (!hasProcessingDocuments) {
      return undefined;
    }

    const id = setInterval(() => {
      fetchDocuments();
    }, 3000);

    return () => clearInterval(id);
  }, [fetchDocuments, hasProcessingDocuments]);

  return {
    documents,
    documentsLoading,
    uploading,
    uploadProgress,
    hasProcessingDocuments,
    fetchDocuments,
    uploadDocument,
  };
};

export { useDocuments };
