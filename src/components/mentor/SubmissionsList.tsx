"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Alert, EmptyState, PageLoader, SectionHeading, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/format";

interface Row { id: number; assignmentId: number; assignmentTitle: string; courseTitle: string; studentName: string; status: string; submittedAt: string; score: number | null; fileName: string | null }

export function SubmissionsList() {
  const params = useSearchParams();
  const assignmentFilter = params.get("assignment");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"all" | "submitted" | "reviewed">("all");
  useEffect(() => { api<Row[]>("/submissions").then(setRows).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!rows) return <PageLoader />;
  const shown = rows.filter((r) => (status === "all" || r.status === status) && (!assignmentFilter || String(r.assignmentId) === assignmentFilter));
  return (
    <>
      <SectionHeading eyebrow="Review" title="Student submissions" description="Open a submission to read the pages and leave scored feedback." />
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {(["all", "submitted", "reviewed"] as const).map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={`rounded-full border px-3 py-1 text-xs capitalize transition ${status === f ? "border-gold bg-gold/10 text-gold-soft" : "border-line text-parchment hover:border-gold/40"}`}>
            {f === "submitted" ? "Pending review" : f} <span className="text-muted">({rows.filter((r) => f === "all" || r.status === f).length})</span>
          </button>
        ))}
        {assignmentFilter && <Link href="/mentor/submissions" className="ml-2 text-xs text-muted hover:text-gold-soft">Clear assignment filter ✕</Link>}
      </div>
      {shown.length === 0 ? (
        <EmptyState title="No submissions" description="Student work will appear here as soon as it's submitted." />
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-charcoal">
          {shown.map((s) => (
            <li key={s.id}>
              <Link href={`/mentor/submissions/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate font-display text-gold">{s.studentName.charAt(0)}</span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-ivory">{s.studentName} <span className="text-muted">·</span> {s.assignmentTitle}</span>
                  <span className="block text-xs text-muted">{s.courseTitle}{s.fileName ? ` · 📎 ${s.fileName}` : ""}</span>
                </span>
                {s.score != null && <span className="font-display text-xl text-gold-soft">{s.score}</span>}
                <span className="hidden text-xs text-muted sm:block">{timeAgo(s.submittedAt)}</span>
                <StatusBadge status={s.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
