"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, EmptyState, PageLoader, SectionHeading, StatusBadge } from "@/components/ui";
import { dueLabel, formatDate } from "@/lib/format";

interface A { id: number; title: string; courseTitle: string; description: string; dueDate: string | null; status: string; maxScore: number }

function Content() {
  const [rows, setRows] = useState<A[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "submitted" | "reviewed">("all");
  useEffect(() => { api<A[]>("/assignments").then(setRows).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!rows) return <PageLoader />;
  const shown = rows.filter((r) => filter === "all" || r.status === filter);
  return (
    <>
      <SectionHeading eyebrow="Assignments" title="Writing assignments" description="Every program sets real deliverables. Submit text and attach your screenplay file." />
      <div className="mb-5 flex flex-wrap gap-2">
        {(["all", "pending", "submitted", "reviewed"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full border px-3 py-1 text-xs capitalize transition ${filter === f ? "border-gold bg-gold/10 text-gold-soft" : "border-line text-parchment hover:border-gold/40"}`}>
            {f} {f !== "all" && <span className="text-muted">({rows.filter((r) => r.status === f).length})</span>}
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No assignments here" description={rows.length === 0 ? "Enroll in a program to receive assignments." : "Try a different filter."} />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-charcoal">
          {shown.map((a) => (
            <li key={a.id}>
              <Link href={`/assignments/${a.id}`} className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate/50 sm:flex-row sm:items-center sm:gap-6">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ivory">{a.title}</p>
                  <p className="text-xs text-muted">{a.courseTitle}</p>
                  <p className="mt-1 line-clamp-1 text-xs text-parchment">{a.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted sm:flex-col sm:items-end sm:gap-1">
                  <StatusBadge status={a.status} />
                  <span>{dueLabel(a.dueDate)}{a.dueDate ? ` · ${formatDate(a.dueDate)}` : ""}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return <AppShell roles={["student"]} title="Assignments"><Content /></AppShell>;
}
