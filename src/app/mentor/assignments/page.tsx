"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, ButtonLink, EmptyState, PageLoader, SectionHeading } from "@/components/ui";
import { dueLabel, formatDate } from "@/lib/format";

interface A { id: number; courseId: number; title: string; courseTitle: string; description: string; dueDate: string | null; maxScore: number }

function Content() {
  const [rows, setRows] = useState<A[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<A[]>("/assignments").then(setRows).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!rows) return <PageLoader />;
  return (
    <>
      <SectionHeading eyebrow="Assignments" title="All assignments" description="Assignments are created from within each course manager." action={<ButtonLink href="/mentor/courses" variant="secondary" size="sm">Open a course</ButtonLink>} />
      {rows.length === 0 ? <EmptyState title="No assignments yet" /> : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-charcoal">
          {rows.map((a) => (
            <li key={a.id} className="flex flex-col gap-2 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <Link href={`/assignments/${a.id}`} className="text-sm font-medium text-ivory hover:text-gold-soft">{a.title}</Link>
                <p className="text-xs text-muted">{a.courseTitle} · {dueLabel(a.dueDate)}{a.dueDate ? ` (${formatDate(a.dueDate)})` : ""}</p>
              </div>
              <div className="flex gap-2">
                <ButtonLink href={`/mentor/submissions?assignment=${a.id}`} size="sm" variant="secondary">Submissions</ButtonLink>
                <ButtonLink href={`/mentor/courses/${a.courseId}`} size="sm" variant="ghost">Course</ButtonLink>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Page() {
  return <AppShell roles={["instructor", "admin"]} title="Assignments"><Content /></AppShell>;
}
