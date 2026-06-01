import { getApiBaseUrl } from './api';

function getMediaBaseUrl() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}

export function resolveMediaUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  if (url.startsWith('/uploads/')) return `${getMediaBaseUrl()}${url}`;
  return url;
}
