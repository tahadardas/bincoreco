const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

interface FetchOptions extends RequestInit {
  token?: string | null;
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

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...fetchOptions,
    headers,
  });

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.message || 'API Error');
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
