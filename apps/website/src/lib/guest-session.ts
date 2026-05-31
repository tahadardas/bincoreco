const SESSION_KEY = 'br_guest_session';

export function getGuestSession(): string {
  if (typeof window === 'undefined') return '';
  let session = localStorage.getItem(SESSION_KEY);
  if (!session) {
    session = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(SESSION_KEY, session);
  }
  return session;
}

export function clearGuestSession() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY);
  }
}
