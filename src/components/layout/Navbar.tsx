"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { roleHome } from "@/lib/format";
import { Button, ButtonLink } from "@/components/ui";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-sm border border-gold/60 font-display text-lg font-semibold text-gold transition group-hover:bg-gold group-hover:text-ink">S</span>
      <span className="font-display text-xl font-semibold tracking-tight text-ivory">
        Script<span className="text-gold">Lab</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/courses", label: "Programs" },
    { href: "/#how", label: "How it works" },
    { href: "/#outcomes", label: "Outcomes" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-parchment transition hover:text-gold-soft">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          {loading ? null : user ? (
            <>
              <ButtonLink href={roleHome[user.role]} variant="secondary" size="sm">
                {user.role === "student" ? "My dashboard" : user.role === "instructor" ? "Mentor studio" : "Admin"}
              </ButtonLink>
              <Button variant="ghost" size="sm" onClick={async () => { await logout(); router.push("/"); }}>
                Sign out
              </Button>
            </>
          ) : (
            <>
              <ButtonLink href="/login" variant="ghost" size="sm">Sign in</ButtonLink>
              <ButtonLink href="/register" size="sm">Join the Lab</ButtonLink>
            </>
          )}
        </div>
        <button className="md:hidden text-ivory" aria-label="Menu" onClick={() => setOpen((s) => !s)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={open ? "M6 6l12 12M18 6L6 18" : "M4 7h16M4 12h16M4 17h16"} /></svg>
        </button>
      </div>
      {open && (
        <div className="border-t border-line bg-ink px-5 py-4 md:hidden">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm text-parchment">{l.label}</Link>
            ))}
            <div className="mt-2 flex gap-2">
              {user ? (
                <>
                  <ButtonLink href={roleHome[user.role]} size="sm">Dashboard</ButtonLink>
                  <Button variant="secondary" size="sm" onClick={async () => { await logout(); setOpen(false); router.push("/"); }}>Sign out</Button>
                </>
              ) : (
                <>
                  <ButtonLink href="/login" variant="secondary" size="sm">Sign in</ButtonLink>
                  <ButtonLink href="/register" size="sm">Join the Lab</ButtonLink>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
