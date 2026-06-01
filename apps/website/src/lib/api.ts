export function getApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return '/api';
}

interface FetchOptions extends RequestInit {
  token?: string | null;
}

export class ApiError extends Error {
  status: number;
  errors: unknown;

  constructor(message: string, status: number, errors?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
  }
}

function clearStoredAuth() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  window.dispatchEvent(new Event('banco-auth-unauthorized'));
}

async function apiFetch<T>(endpoint: string, options: FetchOptions & { token?: string | null } = {}): Promise<T> {
  const { token, ...fetchOptions } = options;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${endpoint}`, {
      ...fetchOptions,
      headers,
    });
  } catch {
    throw new ApiError('Network error. Please try again.', 0);
  }

  const text = await res.text();
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new ApiError('Unexpected server response.', res.status);
    }
  }

  if (res.status === 401) {
    clearStoredAuth();
  }

  if (!res.ok || !data?.success) {
    throw new ApiError(data?.message || 'API Error', res.status, data?.errors);
  }
  return data.data;
}

export const api = {
  get: <T>(endpoint: string, token?: string | null) => apiFetch<T>(endpoint, { token }),
  post: <T>(endpoint: string, body: unknown, token?: string | null) =>
    apiFetch<T>(endpoint, { method: 'POST', body: JSON.stringify(body), token }),
  patch: <T>(endpoint: string, body: unknown, token?: string | null) =>
    apiFetch<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body), token }),
  delete: <T>(endpoint: string, token?: string | null) => apiFetch<T>(endpoint, { method: 'DELETE', token }),
};
