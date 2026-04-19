const rawBase = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

// Base should point to the API root (i.e. ends with /api). If VITE_API_BASE_URL
// is empty, default to relative /api so Vite proxy works in development.
const apiBase = rawBase
  ? rawBase.endsWith("/api")
    ? rawBase
    : `${rawBase}/api`
  : "/api";

const withBase = (path) => `${apiBase}${path}`;

const parseJson = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json();
};

const handleError = async (response) => {
  const payload = await parseJson(response);
  const message = payload?.message || `Request failed (${response.status})`;
  throw new Error(message);
};

const fetchDocumentsApi = async () => {
  const response = await fetch(withBase("/v1/documents"), {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    await handleError(response);
  }

  const payload = await response.json();
  return payload.data || [];
};

const uploadDocumentApi = (file, title, onProgress) =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();

    formData.append("file", file);
    if (title?.trim()) {
      formData.append("title", title.trim());
    }

    xhr.open("POST", withBase("/v1/documents/upload"), true);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      const percent = Math.round((event.loaded / event.total) * 100);
      onProgress?.(percent);
    };

    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}");

        if (xhr.status >= 200 && xhr.status < 300) {
          resolve(payload.data);
          return;
        }

        reject(new Error(payload.message || `Upload failed (${xhr.status})`));
      } catch {
        reject(new Error("Unexpected upload response"));
      }
    };

    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.send(formData);
  });

const createChatStream = async (documentId, message) => {
  const response = await fetch(withBase("/v1/chat/send"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ documentId, message }),
  });

  if (!response.ok) {
    await handleError(response);
  }

  if (!response.body) {
    throw new Error("Streaming is not supported in this environment");
  }

  return response.body.getReader();
};

export { createChatStream, fetchDocumentsApi, uploadDocumentApi };
