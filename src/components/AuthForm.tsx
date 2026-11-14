"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { Logo } from "@/components/layout/Navbar";
import { Alert, Button, Field, Input } from "@/components/ui";
import { roleHome } from "@/lib/format";

const DEMO = [
  { label: "Student", email: "student@scriptlab.io" },
  { label: "Mentor", email: "mentor@scriptlab.io" },
  { label: "Admin", email: "admin@scriptlab.io" },
];

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const { user, loading, login, register } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next");
  const [role, setRole] = useState<"student" | "instructor">(params.get("role") === "instructor" ? "instructor" : "student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(next || roleHome[user.role]);
  }, [user, loading, router, next]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const u = mode === "login" ? await login(email, password) : await register(name, email, password, role);
      router.replace(next || roleHome[u.role]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong (Server waking up, please retry)");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grain relative grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-ink via-charcoal to-ink lg:block">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,162,77,0.12),transparent_70%)]" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div>
            <p className="font-display text-4xl leading-tight text-ivory">“Structure is not a formula. It&apos;s a map of where the audience expects to feel something.”</p>
            <p className="mt-4 text-sm uppercase tracking-wider text-muted">Architecture of Story · Lesson 1</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden"><Logo /></div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">{mode === "login" ? "Welcome back" : "Create your account"}</p>
          <h1 className="mt-2 font-display text-4xl text-ivory">{mode === "login" ? "Sign in to the Lab" : "Join ScriptLab"}</h1>
          <p className="mt-2 text-sm text-muted">
            {mode === "login" ? "New here? " : "Already a member? "}
            <Link href={mode === "login" ? "/register" : "/login"} className="text-gold-soft hover:underline">
              {mode === "login" ? "Create an account" : "Sign in"}
            </Link>
          </p>

          <div className="mt-4 rounded-lg border border-gold/30 bg-gold/5 p-3 text-xs text-parchment flex items-start gap-2">
            <span className="text-gold mt-0.5">ℹ️</span>
            <span><strong>Server Notice:</strong> Backend is hosted on Render free tier. First sign-in might take 10-15 seconds to wake up the server if inactive.</span>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-4">
            {mode === "register" && (
              <>
                <Field label="Full name">
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Elena Vasquez" required minLength={2} />
                </Field>
                <div>
                  <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted">I am joining as</span>
                  <div className="grid grid-cols-2 gap-2">
                    {(["student", "instructor"] as const).map((r) => (
                      <button
                        type="button"
                        key={r}
                        onClick={() => setRole(r)}
                        className={`rounded-md border px-3 py-2.5 text-sm transition ${role === r ? "border-gold bg-gold/10 text-gold-soft" : "border-line bg-charcoal text-parchment hover:border-gold/40"}`}
                      >
                        {r === "student" ? "A writer / student" : "A mentor"}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            </Field>
            <Field label="Password" hint={mode === "register" ? "At least 6 characters" : undefined}>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </Field>
            {error && <Alert>{error}</Alert>}
            <Button type="submit" className="w-full" size="lg" loading={busy}>
              {mode === "login" ? "Sign in" : "Create account"}
            </Button>
          </form>

          {mode === "login" && (
            <div className="mt-8 rounded-lg border border-line bg-charcoal p-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">Demo accounts · password: password123</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {DEMO.map((d) => (
                  <button
                    key={d.email}
                    type="button"
                    onClick={() => { 
                      setEmail(d.email); 
                      setPassword("password123"); 
                    }}
                    className="rounded-md border border-line px-2 py-2 text-xs text-parchment transition hover:border-gold/50 hover:text-gold-soft bg-charcoal/80 flex flex-col items-center justify-center gap-0.5"
                  >
                    <span className="font-medium text-gold">{d.label}</span>
                    <span className="text-[10px] text-muted truncate max-w-[90px]">{d.email.split('@')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
