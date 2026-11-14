"use client";

import { createContext, useContext, type ReactNode } from "react";

export type Role = "student" | "instructor" | "admin";
export interface AuthUser { id: number; name: string; email: string; role: Role }

interface AuthCtx {
  user: AuthUser;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthUser>;
  register: (name: string, email: string, password: string, role: "student" | "instructor") => Promise<AuthUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

const defaultUser: AuthUser = { id: 1, name: "Admin User", email: "admin@scriptlab.io", role: "admin" };

export function AuthProvider({ children }: { children: ReactNode }) {
  const login = async () => defaultUser;
  const register = async () => defaultUser;
  const logout = async () => {};
  const refresh = async () => {};

  return (
    <Ctx.Provider value={{ user: defaultUser, loading: false, login, register, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
