"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth, type Role } from "@/components/providers/AuthProvider";
import { Logo } from "./Navbar";
import { PageLoader } from "@/components/ui";
import { roleHome } from "@/lib/format";

const NAV: Record<Role, { href: string; label: string }[]> = {
  student: [
    { href: "/dashboard", label: "Overview" },
    { href: "/dashboard/courses", label: "My courses" },
    { href: "/dashboard/assignments", label: "Assignments" },
    { href: "/courses", label: "Explore programs" },
  ],
  instructor: [
    { href: "/mentor", label: "Overview" },
    { href: "/mentor/courses", label: "My courses" },
    { href: "/mentor/submissions", label: "Submissions" },
    { href: "/mentor/assignments", label: "Assignments" },
  ],
  admin: [
    { href: "/admin", label: "Overview" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/courses", label: "Courses" },
    { href: "/mentor/submissions", label: "Submissions" },
  ],
};

/** Protected dashboard shell with role guard and sidebar navigation. */
export function AppShell({ children, roles, title }: { children: ReactNode; roles: Role[]; title?: string }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (!roles.includes(user.role)) router.replace(roleHome[user.role]);
  }, [loading, user, roles, router, pathname]);

  if (loading || !user || !roles.includes(user.role)) return <PageLoader label="Preparing your workspace" />;

  const nav = NAV[user.role];
  const roleLabel = user.role === "student" ? "Student" : user.role === "instructor" ? "Mentor" : "Admin";

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 py-5"><Logo /></div>
      <nav className="flex-1 space-y-0.5 px-3">
        {nav.map((n) => {
          const active = pathname === n.href || (n.href !== roleHome[user.role] && pathname.startsWith(n.href) && n.href !== "/courses");
          return (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className={`block rounded-md px-3 py-2 text-sm transition ${active ? "bg-slate text-gold-soft" : "text-parchment hover:bg-slate/60 hover:text-ivory"}`}
            >
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gold/15 font-display text-base text-gold">{user.name.charAt(0)}</div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-ivory">{user.name}</p>
            <p className="text-[11px] uppercase tracking-wider text-muted">{roleLabel}</p>
          </div>
        </div>
        <button onClick={async () => { await logout(); router.push("/"); }} className="mt-3 w-full rounded-md border border-line py-1.5 text-xs text-parchment transition hover:border-gold/40 hover:text-ivory">
          Sign out
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink lg:flex">
      <aside className="hidden w-60 shrink-0 border-r border-line bg-charcoal/60 lg:block lg:sticky lg:top-0 lg:h-screen">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 border-r border-line bg-charcoal">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/80 px-5 backdrop-blur lg:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-ivory" onClick={() => setOpen(true)} aria-label="Open menu">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
            </button>
            <span className="text-sm text-muted">{title ?? `${roleLabel} workspace`}</span>
          </div>
          <Link href="/courses" className="text-xs text-parchment hover:text-gold-soft">Browse programs →</Link>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
