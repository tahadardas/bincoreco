export function getAdminApiBaseUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:4000/api`;
  }
  return '/api';
}

export function getWebsiteBaseUrl() {
  if (process.env.NEXT_PUBLIC_WEBSITE_URL) {
    return process.env.NEXT_PUBLIC_WEBSITE_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return '';
}

export async function adminFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${getAdminApiBaseUrl()}${endpoint}`, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'API Error');
  return data.data;
}

export async function adminUpload(file: File, folder: string = 'products'): Promise<{ url: string }> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${getAdminApiBaseUrl()}/admin/media/upload?folder=${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (res.status === 401) {
    localStorage.removeItem('admin_token');
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Upload failed');
  return data.data;
}
