const API_URL = 'http://10.0.2.2:4000/api';

export async function apiFetch<T>(endpoint: string, options: RequestInit & { token?: string } = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API Error');
  return data.data;
}
