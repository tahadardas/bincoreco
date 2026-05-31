const SESSION_KEY = '@br_guest_session';

let cachedSession: string | null = null;

function generateSession(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function getGuestSession(): Promise<string> {
  if (!cachedSession) {
    cachedSession = generateSession();
  }
  return cachedSession;
}

export function getGuestSessionSync(): string {
  if (!cachedSession) {
    cachedSession = generateSession();
  }
  return cachedSession;
}
