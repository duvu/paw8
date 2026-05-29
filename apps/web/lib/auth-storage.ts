export const ACCESS_TOKEN_STORAGE_KEY = 'access_token';
export const REFRESH_TOKEN_STORAGE_KEY = 'refresh_token';
export const EXPIRES_AT_STORAGE_KEY = 'auth_expires_at';
export const SESSION_NOTICE_STORAGE_KEY = 'session_notice';

export interface AuthSessionPayload {
  accessToken: string;
  refreshToken?: string | null;
  expiresIn?: number | null;
}

export function getStoredAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function storeSession(payload: AuthSessionPayload): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, payload.accessToken);

  if (payload.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, payload.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  if (typeof payload.expiresIn === 'number' && Number.isFinite(payload.expiresIn)) {
    const expiresAt = Date.now() + payload.expiresIn * 1000;
    localStorage.setItem(EXPIRES_AT_STORAGE_KEY, String(expiresAt));
  } else {
    localStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
  }
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  localStorage.removeItem(EXPIRES_AT_STORAGE_KEY);
}

export function getSessionNotice(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(SESSION_NOTICE_STORAGE_KEY);
}

export function setSessionNotice(value: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SESSION_NOTICE_STORAGE_KEY, value);
}

export function clearSessionNotice(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(SESSION_NOTICE_STORAGE_KEY);
}
