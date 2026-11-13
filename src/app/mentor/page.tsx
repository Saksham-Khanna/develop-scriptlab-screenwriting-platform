"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { Alert, ButtonLink, EmptyState, PageLoader, Stat, StatusBadge } from "@/components/ui";
import { timeAgo } from "@/lib/format";
import type { CourseSummary } from "@/components/CourseCard";

interface Dash {
  courses: (CourseSummary & { assignmentCount: number })[];
  stats: { courses: number; students: number; pendingReviews: number; reviewed: number };
  pendingSubmissions: { id: number; assignmentTitle: string; courseTitle: string; studentName: string; status: string; submittedAt: string }[];
  recentSubmissions: { id: number; assignmentTitle: string; courseTitle: string; studentName: string; status: string; submittedAt: string }[];
}

function Content() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<Dash>("/dashboard/instructor").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;
  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Mentor studio</p>
          <h1 className="mt-2 font-display text-4xl text-ivory">Good to see you, {user?.name.split(" ")[0]}.</h1>
          <p className="mt-1 text-sm text-muted">{data.stats.pendingReviews > 0 ? `${data.stats.pendingReviews} submission${data.stats.pendingReviews === 1 ? "" : "s"} waiting for your notes.` : "Your review queue is clear."}</p>
        </div>
        <ButtonLink href="/mentor/courses/new" variant="secondary">+ New course</ButtonLink>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Courses" value={data.stats.courses} sub="assigned to you" />
        <Stat label="Students" value={data.stats.students} sub="total enrollments" />
        <Stat label="Pending reviews" value={data.stats.pendingReviews} sub="awaiting feedback" />
        <Stat label="Reviewed" value={data.stats.reviewed} sub="feedback delivered" />
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ivory">Review queue</h2>
            <Link href="/mentor/submissions" className="text-sm text-gold-soft hover:underline">All submissions →</Link>
          </div>
          {data.pendingSubmissions.length === 0 ? (
            <EmptyState title="Queue is clear" description="New student submissions will appear here." />
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-charcoal">
              {data.pendingSubmissions.map((s) => (
                <li key={s.id}>
                  <Link href={`/mentor/submissions/${s.id}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate/50">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate font-display text-gold">{s.studentName.charAt(0)}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{s.studentName} · {s.assignmentTitle}</span>
                      <span className="block text-xs text-muted">{s.courseTitle}</span>
                    </span>
                    <span className="text-xs text-muted">{timeAgo(s.submittedAt)}</span>
                    <StatusBadge status={s.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-2xl text-ivory">Your courses</h2>
            <Link href="/mentor/courses" className="text-sm text-gold-soft hover:underline">Manage →</Link>
          </div>
          <ul className="space-y-2">
            {data.courses.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link href={`/mentor/courses/${c.id}`} className="block rounded-lg border border-line bg-charcoal px-4 py-3 transition hover:border-gold/40">
                  <p className="text-sm text-ivory">{c.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{c.enrollmentCount} students · {c.assignmentCount} assignments{c.isPublished === false ? " · draft" : ""}</p>
                </Link>
              </li>
            ))}
            {data.courses.length === 0 && <li className="text-sm text-muted">No courses yet. Create one to get started.</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}

export default function Page() {
  return <AppShell roles={["instructor", "admin"]} title="Mentor studio"><Content /></AppShell>;
}
