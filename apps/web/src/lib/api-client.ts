/**
 * API Client for Code Runner Web App
 *
 * This client handles all communication with the backend API service.
 * It abstracts fetch calls and provides a clean interface for API requests.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  credentials?: RequestCredentials;
}

class APIClient {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  /**
   * Build headers with authentication
   */
  private buildHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders };

    const token = this.getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Generic request method
   */
  private async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = this.buildHeaders(options.headers);

    const config: RequestInit = {
      method: options.method || 'GET',
      headers,
      credentials: options.credentials || 'include',
    };

    if (options.body) {
      config.body = JSON.stringify(options.body);
    }

    try {
      const response = await fetch(url, config);

      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return (await response.text()) as T;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || `HTTP ${response.status}`);
      }

      return data as T;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', headers });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'POST', body, headers });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PUT', body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, body: any, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(endpoint, { method: 'PATCH', body, headers });
  }
}

// Export singleton instance
export const apiClient = new APIClient(API_URL);

// Export typed API methods for common operations
export const api = {
  // Authentication
  auth: {
    login: (username: string, password: string) =>
      apiClient.post('/auth/login', { username, password }),
    register: (data: { username: string; email: string; password: string; age_group: string }) =>
      apiClient.post('/auth/register', data),
    logout: () => apiClient.post('/auth/logout', {}),
  },

  // Problems
  problems: {
    getAll: () => apiClient.get('/problems'),
    getById: (id: number) => apiClient.get(`/problems/${id}`),
    getTestCases: (id: number) => apiClient.get(`/problems/${id}/test-cases`),
  },

  // Levels
  levels: {
    getByAgeGroup: (ageGroup: '11-14' | '15-18') =>
      apiClient.get(`/levels/${ageGroup}`),
  },

  // Sessions
  sessions: {
    getById: (id: number) => apiClient.get(`/sessions/${id}`),
  },

  // Code Execution (NEW - Queue-based)
  execution: {
    // Submit code for execution (returns jobId)
    submit: (code: string, problemId?: number, userSessionId?: string) =>
      apiClient.post('/submit', { code, problemId, userSessionId }),

    // Get execution result by jobId
    getResult: (jobId: string) => apiClient.get(`/results/${jobId}`),

    // Submit code for grading
    submitForGrading: (code: string, problemId: number) =>
      apiClient.post('/submit/grade', { code, problemId }),
  },

  // Progress
  progress: {
    get: (userId: string) => apiClient.get(`/progress?userId=${userId}`),
    update: (data: any) => apiClient.post('/progress', data),
    complete: (data: any) => apiClient.post('/progress/complete', data),
  },

  // Files
  files: {
    upload: (data: any) => apiClient.post('/files', data),
    list: (userSessionId: string) => apiClient.get(`/files/list?userSessionId=${userSessionId}`),
    delete: (fileName: string, userSessionId: string) =>
      apiClient.post('/files/delete', { fileName, userSessionId }),
    get: (fileName: string, userSessionId: string) =>
      apiClient.get(`/files?fileName=${fileName}&userSessionId=${userSessionId}`),
  },
};

export default apiClient;
