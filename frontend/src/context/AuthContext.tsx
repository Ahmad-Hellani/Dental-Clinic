import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../services/auth.service";
import { onAuthFailure, refreshSession, setAccessToken } from "../services/http";
import type { Role, User } from "../lib/types";

type Status = "loading" | "authenticated" | "anonymous";

type AuthContextValue = {
  user: User | null;
  status: Status;
  login: (email: string, password: string) => Promise<User>;
  register: (input: authApi.RegisterInput) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export const homePathFor = (role: Role): string =>
  role === "ADMIN" ? "/admin" : role === "DENTIST" ? "/dentist" : "/patient";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  // on page load: try to restore the session from the httpOnly refresh cookie
  useEffect(() => {
    let active = true;
    onAuthFailure(() => {
      setUser(null);
      setStatus("anonymous");
    });
    refreshSession().then((session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setStatus(session ? "authenticated" : "anonymous");
    });
    return () => {
      active = false;
      onAuthFailure(null);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const register = useCallback(async (input: authApi.RegisterInput) => {
    const session = await authApi.register(input);
    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
    return session.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setAccessToken(null);
      setUser(null);
      setStatus("anonymous");
    }
  }, []);

  const value = useMemo(() => ({ user, status, login, register, logout }), [user, status, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
