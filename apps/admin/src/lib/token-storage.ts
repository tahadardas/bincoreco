const ADMIN_TOKEN_KEY = 'admin_token';

function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

export const adminTokenStorage = {
  getToken(): string | null {
    if (!isBrowser()) return null;
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  setToken(token: string): void {
    if (!isBrowser()) return;
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  removeToken(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  clearAll(): void {
    if (!isBrowser()) return;
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },
};
