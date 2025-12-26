/**
 * Authentication Context
 * Provides user authentication state and methods throughout the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types/user';
import { mesApi } from '../services/mesApi';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  originalUser: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  impersonate: (userId: string) => Promise<boolean>;
  stopImpersonation: () => Promise<void>;
  canAccessStation: (stationId: string) => boolean;
  getAssignedStations: () => string[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(() => mesApi.getCurrentUser());
  const [isImpersonating, setIsImpersonating] = useState(() => mesApi.isImpersonating());
  const [originalUser, setOriginalUser] = useState<User | null>(() => mesApi.getOriginalUser());

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const loggedInUser = await mesApi.login(username, password);
    if (loggedInUser) {
      setUser(loggedInUser);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    await mesApi.logout();
    setUser(null);
    setIsImpersonating(false);
    setOriginalUser(null);
  }, []);

  const impersonate = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const impersonatedUser = await mesApi.impersonateUser(userId);
      if (impersonatedUser) {
        setOriginalUser(user);
        setUser(impersonatedUser);
        setIsImpersonating(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [user]);

  const stopImpersonation = useCallback(async (): Promise<void> => {
    const original = await mesApi.stopImpersonation();
    if (original) {
      setUser(original);
      setIsImpersonating(false);
      setOriginalUser(null);
    }
  }, []);

  const canAccessStation = useCallback((stationId: string): boolean => {
    return mesApi.canUserAccessStation(stationId);
  }, []);

  const getAssignedStations = useCallback((): string[] => {
    if (!user) return [];
    return mesApi.getAssignedStations(user.id);
  }, [user]);

  // Sync state if localStorage changes externally
  useEffect(() => {
    const handleStorageChange = () => {
      setUser(mesApi.getCurrentUser());
      setIsImpersonating(mesApi.isImpersonating());
      setOriginalUser(mesApi.getOriginalUser());
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isImpersonating,
    originalUser,
    login,
    logout,
    impersonate,
    stopImpersonation,
    canAccessStation,
    getAssignedStations,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
