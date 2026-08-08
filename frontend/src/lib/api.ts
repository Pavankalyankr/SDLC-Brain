/**
 * SDLC Brain — API Client
 *
 * Fetch wrapper for backend communication with SSE streaming support.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

interface ApiOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { method = "GET", body, headers = {} } = options;

    const config: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || error.detail || `API Error: ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  // --- Generic CRUD ---
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint);
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "POST", body });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, { method: "PATCH", body });
  }

  async delete(endpoint: string): Promise<void> {
    await this.request(endpoint, { method: "DELETE" });
  }

  // --- File Upload ---
  async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || `Upload Error: ${response.status}`);
    }

    return response.json();
  }

  // --- SSE Streaming ---
  async *stream(endpoint: string): AsyncGenerator<{ type: string; data: unknown }> {
    const response = await fetch(`${this.baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`Stream Error: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error("No response body");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            yield data;
          } catch {
            // Skip malformed SSE data
          }
        }
      }
    }
  }
}

export const api = new ApiClient(API_BASE);

// --- Typed API Methods ---

export const projectsApi = {
  list: () => api.get("/projects"),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: { name: string; description?: string }) => api.post("/projects", data),
  update: (id: string, data: Record<string, unknown>) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  getMemory: (id: string) => api.get(`/projects/${id}/memory`),
  addMemory: (id: string, data: { key: string; value: string }) =>
    api.post(`/projects/${id}/memory`, data),
};

export const agileApi = {
  getRequirements: (projectId: string) => api.get(`/agile/requirements/${projectId}`),
  getEpics: (projectId: string) => api.get(`/agile/epics/${projectId}`),
  getFeatures: (projectId: string) => api.get(`/agile/features/${projectId}`),
  getStories: (projectId: string) => api.get(`/agile/stories/${projectId}`),
  getApprovedStories: (projectId: string) => api.get(`/agile/stories/${projectId}/approved`),
  generateRequirements: (data: { project_id: string; source_content: string }) =>
    api.post("/agile/requirements/generate", data),
  updateStatus: (id: string, data: { status: string; feedback?: string }) =>
    api.patch(`/agile/requirements/${id}/status`, data),
};

export const aiConfigApi = {
  getModels: () => api.get("/ai-config/models"),
  getProviders: () => api.get("/ai-config/providers"),
  getRouting: () => api.get("/ai-config/routing"),
  updateRouting: (taskType: string, modelName: string) =>
    api.patch(`/ai-config/routing/${taskType}?model_name=${modelName}`),
  testConnection: (provider: string) => api.post(`/ai-config/test-connection/${provider}`),
  reload: () => api.post("/ai-config/reload"),
};

export const searchApi = {
  search: (query: string, projectId?: string) => {
    const params = new URLSearchParams({ q: query });
    if (projectId) params.set("project_id", projectId);
    return api.get(`/search?${params}`);
  },
};

export const documentApi = {
  upload: (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.upload(`/documents/${projectId}/upload`, formData);
  },
  list: (projectId: string) => api.get(`/documents/${projectId}`),
  delete: (projectId: string, documentId: string) => api.delete(`/documents/${projectId}/${documentId}`),
};

export const exportApi = {
  downloadAgilePdf: async (projectId: string, moduleType: string, format: string = "pdf") => {
    const url = `${API_BASE}/export/agile/${projectId}/${moduleType}/${format}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${moduleType}.${format}`);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentElement) {
        document.body.removeChild(link);
      }
    }, 500);
  },
  downloadAgileExport: async (projectId: string, moduleType: string, format: string = "pdf") => {
    return exportApi.downloadAgilePdf(projectId, moduleType, format);
  },
  downloadArchitectureExport: async (
    projectId: string,
    moduleType: string,
    format: string,
    sourceId?: string
  ) => {
    let url = `${API_BASE}/export/architecture/${projectId}/${moduleType}/${format}`;
    if (sourceId) {
      url += `?source_id=${encodeURIComponent(sourceId)}`;
    }
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${moduleType}.${format}`);
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      if (link.parentElement) {
        document.body.removeChild(link);
      }
    }, 500);
  },
};
