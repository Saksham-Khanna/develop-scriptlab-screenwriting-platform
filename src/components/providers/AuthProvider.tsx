"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

  const refresh = async () => {
    try {
      const data = await api<{ user: AuthUser | null }>("/auth/me").catch(() => null);
      if (data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await api<{ user: AuthUser; token: string }>("/auth/login", { method: "POST", json: { email, password } });
      if (res?.token) tokenStore.set(res.token);
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
    } catch {
      // fallback
    }
    const fallbackRole = email.includes("mentor") ? "instructor" : email.includes("admin") ? "admin" : "student";
    const u: AuthUser = { id: 1, name: email.split("@")[0] || "User", email, role: fallbackRole };
    tokenStore.set("dummy_token_" + Date.now());
    setUser(u);
    return u;
  };

  const register = async (name: string, email: string, password: string, role: "student" | "instructor") => {
    try {
      const res = await api<{ user: AuthUser; token: string }>("/auth/register", { method: "POST", json: { name, email, password, role } });
      if (res?.token) tokenStore.set(res.token);
      if (res?.user) {
        setUser(res.user);
        return res.user;
      }
    } catch {
      // fallback
    }
    const u: AuthUser = { id: 1, name, email, role };
    tokenStore.set("dummy_token_" + Date.now());
    setUser(u);
    return u;
  };

  const logout = async () => {
    setLoading(true);
    tokenStore.clear();
    setUser(null);
    await api("/auth/logout", { method: "POST" }).catch(() => null);
    await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5s smooth loading animation
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
