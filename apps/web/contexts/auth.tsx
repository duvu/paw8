'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import {
  clearSessionNotice,
  clearStoredSession,
  getStoredAccessToken,
  storeSession,
} from '@/lib/auth-storage';

interface CurrentUser {
  sub: string;
  tenantId?: string | null;
  role: string;
  allowedStoreIds: string[];
  email?: string;
  fullName?: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface UserProfileResponse {
  id: string;
  tenantId?: string | null;
  role?: string;
  allowedStoreIds?: string[];
  email?: string;
  fullName?: string;
}

interface AuthContextValue {
  currentUser: CurrentUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
}

function decodeJwt(token: string): CurrentUser | null {
  try {
    const segment = token.split('.')[1];
    if (!segment) return null;

    const normalized = segment.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    const payload = JSON.parse(atob(padded));

    if (typeof payload.sub !== 'string' || typeof payload.role !== 'string') {
      return null;
    }

    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      allowedStoreIds: Array.isArray(payload.allowedStoreIds) ? payload.allowedStoreIds : [],
      email: payload.email,
      fullName: payload.fullName,
    };
  } catch {
    return null;
  }
}

function mergeUser(decoded: CurrentUser, profile?: UserProfileResponse | null): CurrentUser {
  return {
    sub: profile?.id ?? decoded.sub,
    tenantId: profile?.tenantId ?? decoded.tenantId,
    role: profile?.role ?? decoded.role,
    allowedStoreIds: profile?.allowedStoreIds ?? decoded.allowedStoreIds,
    email: profile?.email ?? decoded.email,
    fullName: profile?.fullName ?? decoded.fullName,
  };
}

function normalizeAuthErrorCode(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'invalid_credentials';
    if (error.response?.status === 403) return 'access_forbidden';
  }

  if (error instanceof Error && error.message === 'invalid_auth_response') {
    return error.message;
  }

  return 'unexpected_auth_error';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const hydrateSession = async () => {
      const token = getStoredAccessToken();

      if (!token) {
        if (active) setLoading(false);
        return;
      }

      const decoded = decodeJwt(token);

      if (!decoded) {
        clearStoredSession();
        clearSessionNotice();
        if (active) {
          setCurrentUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const profile = await api.get<UserProfileResponse>(`/users/${decoded.sub}`);
        if (active) {
          setCurrentUser(mergeUser(decoded, profile.data));
        }
      } catch {
        if (active) {
          setCurrentUser(decoded);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void hydrateSession();

    return () => {
      active = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api.post<AuthResponse>('/auth/login', { email, password });
      const { accessToken, refreshToken, expiresIn } = res.data;

      if (
        typeof accessToken !== 'string' ||
        typeof refreshToken !== 'string' ||
        typeof expiresIn !== 'number'
      ) {
        throw new Error('invalid_auth_response');
      }

      storeSession({ accessToken, refreshToken, expiresIn });
      clearSessionNotice();

      const decoded = decodeJwt(accessToken);
      if (!decoded) {
        clearStoredSession();
        throw new Error('invalid_auth_response');
      }

      try {
        const profile = await api.get<UserProfileResponse>(`/users/${decoded.sub}`);
        const merged = mergeUser(decoded, profile.data);
        setCurrentUser(merged);
        return merged;
      } catch {
        setCurrentUser(decoded);
        return decoded;
      }
    } catch (error) {
      clearStoredSession();
      throw new Error(normalizeAuthErrorCode(error));
    }
  };

  const logout = async () => {
    try {
      if (getStoredAccessToken()) {
        await api.post('/auth/logout');
      }
    } catch {
      // Clear local session even if the server session is already gone.
    } finally {
      clearStoredSession();
      clearSessionNotice();
      setCurrentUser(null);
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
