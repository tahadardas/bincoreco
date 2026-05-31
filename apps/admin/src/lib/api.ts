const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API Error');
  return data.data;
}
