"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, tokenStore } from "@/lib/api";

export type Role = "student" | "instructor" | "admin";
export interface AuthUser { id: number; name: string; email: string; role: Role }

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, role: "student" | "instructor") => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const { user } = await api<{ user: AuthUser | null }>("/auth/me");
      setUser(user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (email: string, password: string) => {
    const { user, token } = await api<{ user: AuthUser; token: string }>("/auth/login", { method: "POST", json: { email, password } });
    tokenStore.set(token);
    setUser(user);
    return user;
  };
  const register = async (name: string, email: string, password: string, role: "student" | "instructor") => {
    const { user, token } = await api<{ user: AuthUser; token: string }>("/auth/register", { method: "POST", json: { name, email, password, role } });
    tokenStore.set(token);
    setUser(user);
    return user;
  };
  const logout = async () => {
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    tokenStore.clear();
    setUser(null);
  };

  return <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
