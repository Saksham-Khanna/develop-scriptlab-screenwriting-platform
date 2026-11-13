"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/components/providers/AuthProvider";
import { CourseCard, type CourseSummary } from "@/components/CourseCard";
import { Alert, ButtonLink, Card, EmptyState, PageLoader, Progress, Stat } from "@/components/ui";
import { dueLabel, timeAgo } from "@/lib/format";

interface Dash {
  enrolledCourses: CourseSummary[];
  overall: { total: number; completed: number; percent: number };
  recentLessons: { lessonId: number; title: string; courseTitle: string; lastAccessedAt: string; completed: boolean }[];
  pendingAssignments: { id: number; title: string; courseTitle: string; dueDate: string | null }[];
  recentFeedback: { submissionId: number; assignmentId: number; assignmentTitle: string; courseTitle: string; score: number | null; maxScore: number; comments: string; createdAt: string; reviewerName: string }[];
  continueLesson: { lessonId: number; title: string; courseTitle: string } | null;
}

function Content() {
  const { user } = useAuth();
  const [data, setData] = useState<Dash | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<Dash>("/dashboard/student").then(setData).catch((e) => setError(e.message)); }, []);

  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">Student dashboard</p>
          <h1 className="mt-2 font-display text-4xl text-ivory">Welcome back, {user?.name.split(" ")[0]}.</h1>
          <p className="mt-1 text-sm text-muted">{data.overall.completed} of {data.overall.total} lessons complete across {data.enrolledCourses.length} program{data.enrolledCourses.length === 1 ? "" : "s"}.</p>
        </div>
        {data.continueLesson && (
          <Link href={`/learn/${data.continueLesson.lessonId}`} className="group flex items-center gap-4 rounded-xl border border-gold/40 bg-gold/5 px-5 py-4 transition hover:bg-gold/10">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-ink">▶</span>
            <span>
              <span className="block text-[11px] uppercase tracking-wider text-gold">Continue learning</span>
              <span className="block text-sm text-ivory">{data.continueLesson.title}</span>
              <span className="block text-xs text-muted">{data.continueLesson.courseTitle}</span>
            </span>
          </Link>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Programs" value={data.enrolledCourses.length} sub="enrolled" />
        <Stat label="Lessons done" value={data.overall.completed} sub={`of ${data.overall.total}`} />
        <Stat label="Pending work" value={data.pendingAssignments.length} sub="assignments to submit" />
        <div className="rounded-xl border border-line bg-charcoal px-5 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">Overall progress</p>
          <p className="mt-2 font-display text-3xl text-ivory">{data.overall.percent}%</p>
          <Progress value={data.overall.percent} className="mt-2" />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-ivory">My programs</h2>
          <Link href="/dashboard/courses" className="text-sm text-gold-soft hover:underline">All courses →</Link>
        </div>
        {data.enrolledCourses.length === 0 ? (
          <EmptyState title="You haven't enrolled yet" description="Pick a track to begin — the Commercial Spec program is the recommended starting point." action={<ButtonLink href="/courses">Explore programs</ButtonLink>} />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {data.enrolledCourses.slice(0, 3).map((c) => <CourseCard key={c.id} course={c} />)}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-4 font-display text-2xl text-ivory">Pending assignments</h2>
          {data.pendingAssignments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Nothing pending. Nice work.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-charcoal">
              {data.pendingAssignments.map((a) => (
                <li key={a.id}>
                  <Link href={`/assignments/${a.id}`} className="flex items-center justify-between gap-4 px-5 py-3.5 transition hover:bg-slate/50">
                    <span>
                      <span className="block text-sm text-ivory">{a.title}</span>
                      <span className="block text-xs text-muted">{a.courseTitle}</span>
                    </span>
                    <span className={`shrink-0 text-xs ${a.dueDate && new Date(a.dueDate) < new Date() ? "text-red-300" : "text-gold-soft"}`}>{dueLabel(a.dueDate)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <h2 className="mb-4 font-display text-2xl text-ivory">Recently accessed</h2>
          {data.recentLessons.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Your recent lessons will appear here.</p>
          ) : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-charcoal">
              {data.recentLessons.map((l) => (
                <li key={l.lessonId}>
                  <Link href={`/learn/${l.lessonId}`} className="flex items-center gap-4 px-5 py-3.5 transition hover:bg-slate/50">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[9px] ${l.completed ? "border-gold bg-gold text-ink" : "border-line"}`}>{l.completed ? "✓" : ""}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-ivory">{l.title}</span>
                      <span className="block text-xs text-muted">{l.courseTitle}</span>
                    </span>
                    <span className="text-xs text-muted">{timeAgo(l.lastAccessedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section>
        <h2 className="mb-4 font-display text-2xl text-ivory">Recent mentor feedback</h2>
        {data.recentFeedback.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line px-5 py-8 text-center text-sm text-muted">Feedback on your submissions will appear here.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {data.recentFeedback.map((f) => (
              <Link key={f.submissionId} href={`/assignments/${f.assignmentId}`}>
                <Card className="h-full p-5 transition hover:border-gold/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-ivory">{f.assignmentTitle}</p>
                      <p className="text-xs text-muted">{f.courseTitle} · {f.reviewerName}</p>
                    </div>
                    {f.score != null && <span className="font-display text-2xl text-gold-soft">{f.score}<span className="text-sm text-muted">/{f.maxScore}</span></span>}
                  </div>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-parchment">{f.comments}</p>
                  <p className="mt-3 text-xs text-muted">{timeAgo(f.createdAt)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default function StudentDashboard() {
  return <AppShell roles={["student"]} title="Student dashboard"><Content /></AppShell>;
}
