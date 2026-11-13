"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { Alert, ButtonLink, PageLoader, Stat } from "@/components/ui";
import { timeAgo } from "@/lib/format";

interface Stats {
  totals: { students: number; instructors: number; courses: number; enrollments: number; submissions: number; pendingReviews: number };
  activity: { id: number; action: string; detail: string | null; createdAt: string; userName: string | null }[];
}

const ACTION_LABEL: Record<string, string> = {
  "user.registered": "joined", "user.login": "signed in", "course.enrolled": "enrolled in", "lesson.completed": "completed lesson",
  "submission.created": "submitted", "feedback.given": "reviewed", "course.created": "created course", "course.updated": "updated course",
  "course.deleted": "deleted course", "assignment.created": "published assignment", "lesson.created": "added lesson", "user.updated": "updated user", "user.deleted": "removed user",
};

function Content() {
  const [data, setData] = useState<Stats | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<Stats>("/admin/stats").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;
  const t = data.totals;
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Administration</p>
          <h1 className="mt-2 font-display text-4xl text-ivory">Platform overview</h1>
        </div>
        <div className="flex gap-2">
          <ButtonLink href="/admin/users" variant="secondary" size="sm">Manage users</ButtonLink>
          <ButtonLink href="/admin/courses" variant="secondary" size="sm">Manage courses</ButtonLink>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Students" value={t.students} />
        <Stat label="Instructors" value={t.instructors} />
        <Stat label="Courses" value={t.courses} />
        <Stat label="Enrollments" value={t.enrollments} />
        <Stat label="Submissions" value={t.submissions} sub={`${t.pendingReviews} awaiting review`} />
      </div>
      <section>
        <h2 className="mb-4 font-display text-2xl text-ivory">Recent platform activity</h2>
        <ul className="divide-y divide-line rounded-xl border border-line bg-charcoal">
          {data.activity.map((a) => (
            <li key={a.id} className="flex items-center gap-4 px-5 py-3 text-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
              <span className="min-w-0 flex-1 truncate">
                <span className="text-ivory">{a.userName ?? "Someone"}</span> <span className="text-muted">{ACTION_LABEL[a.action] ?? a.action}</span> {a.detail && <span className="text-parchment">{a.detail}</span>}
              </span>
              <span className="shrink-0 text-xs text-muted">{timeAgo(a.createdAt)}</span>
            </li>
          ))}
          {data.activity.length === 0 && <li className="px-5 py-6 text-center text-sm text-muted">No activity yet.</li>}
        </ul>
      </section>
      <p className="text-xs text-muted">Need to review student work? <Link href="/mentor/submissions" className="text-gold-soft hover:underline">Open the submissions queue</Link>.</p>
    </div>
  );
}

export default function Page() {
  return <AppShell roles={["admin"]} title="Admin"><Content /></AppShell>;
}
