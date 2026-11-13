"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Alert, Badge, Button, ButtonLink, PageLoader, Progress } from "@/components/ui";
import { levelLabel } from "@/lib/format";

export interface CourseFull {
  id: number; title: string; tagline: string; description: string; level: string; durationWeeks: number; coverImage: string | null;
  outcomes: string[]; categoryName: string; categoryId: number; instructorName: string; instructorId: number; enrollmentCount: number; isPublished: boolean; isFeatured: boolean;
  curriculum: { id: number; title: string; description: string | null; lessons: { id: number; title: string; type: string; durationMinutes: number }[] }[];
  enrolled: boolean; progress: { total: number; completed: number; percent: number }; completedLessonIds: number[]; canManage: boolean;
}

export function CourseDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  const load = useCallback(() => api<CourseFull>(`/courses/${id}`).then(setCourse).catch((e) => setError(e.message)), [id]);
  useEffect(() => { load(); }, [load, user?.id]);

  async function enroll() {
    if (!user) return router.push(`/login?next=/courses/${id}`);
    setEnrolling(true);
    try {
      await api(`/courses/${id}/enroll`, { method: "POST" });
      toast("You're enrolled. Welcome to the program.", "success");
      await load();
    } catch (e) {
      toast(e instanceof Error ? e.message : "Enrollment failed", "error");
    } finally {
      setEnrolling(false);
    }
  }

  if (error) return <main className="mx-auto max-w-3xl px-5 py-20"><Alert>{error}</Alert></main>;
  if (!course) return <PageLoader label="Opening program" />;

  const totalLessons = course.curriculum.reduce((n, m) => n + m.lessons.length, 0);
  const totalMinutes = course.curriculum.reduce((n, m) => n + m.lessons.reduce((x, l) => x + l.durationMinutes, 0), 0);
  const firstLesson = course.curriculum.flatMap((m) => m.lessons)[0];
  const nextLesson = course.curriculum.flatMap((m) => m.lessons).find((l) => !course.completedLessonIds.includes(l.id)) ?? firstLesson;

  return (
    <main>
      <section className="relative overflow-hidden border-b border-line">
        {course.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/90 to-ink/50" />
        <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="gold">{course.categoryName}</Badge>
            <Badge>{levelLabel[course.level]}</Badge>
            {!course.isPublished && <Badge tone="red">Unpublished</Badge>}
          </div>
          <h1 className="mt-5 max-w-3xl font-display text-4xl leading-tight text-ivory sm:text-5xl">{course.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-parchment">{course.tagline}</p>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
            <span>Mentor · <span className="text-ivory">{course.instructorName}</span></span>
            <span>{course.durationWeeks} weeks</span>
            <span>{totalLessons} lessons · {Math.round(totalMinutes / 60 * 10) / 10}h</span>
            <span>{course.enrollmentCount} enrolled</span>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            {course.enrolled ? (
              <>
                {nextLesson && <ButtonLink href={`/learn/${nextLesson.id}`} size="lg">{course.progress.completed ? "Continue learning" : "Start the program"}</ButtonLink>}
                <div className="flex items-center gap-3 text-sm text-muted">
                  <Progress value={course.progress.percent} className="w-32" />
                  <span>{course.progress.percent}% complete</span>
                </div>
              </>
            ) : course.canManage ? (
              <ButtonLink href={`/mentor/courses/${course.id}`} size="lg">Manage this course</ButtonLink>
            ) : user && user.role !== "student" ? (
              <span className="text-sm text-muted">Enrollment is available to student accounts.</span>
            ) : (
              <Button size="lg" onClick={enroll} loading={enrolling}>{user ? "Enroll — free" : "Sign in to enroll"}</Button>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-14 lg:grid-cols-12 lg:px-8">
        <div className="space-y-12 lg:col-span-8">
          <div>
            <h2 className="font-display text-2xl text-ivory">About this program</h2>
            <p className="mt-3 leading-relaxed text-parchment">{course.description}</p>
          </div>
          <div>
            <h2 className="font-display text-2xl text-ivory">Curriculum</h2>
            <div className="mt-4 space-y-4">
              {course.curriculum.map((m, i) => (
                <div key={m.id} className="rounded-xl border border-line bg-charcoal">
                  <div className="border-b border-line px-5 py-4">
                    <p className="text-[11px] uppercase tracking-wider text-gold">Module {i + 1}</p>
                    <h3 className="mt-0.5 font-display text-xl text-ivory">{m.title}</h3>
                    {m.description && <p className="mt-1 text-sm text-muted">{m.description}</p>}
                  </div>
                  <ul className="divide-y divide-line">
                    {m.lessons.map((l) => {
                      const done = course.completedLessonIds.includes(l.id);
                      const accessible = course.enrolled || course.canManage;
                      const row = (
                        <div className="flex items-center gap-4 px-5 py-3">
                          <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${done ? "border-gold bg-gold text-ink" : "border-line text-muted"}`}>
                            {done ? "✓" : l.type === "video" ? "▶" : "¶"}
                          </span>
                          <span className={`flex-1 text-sm ${accessible ? "text-ivory" : "text-parchment"}`}>{l.title}</span>
                          <span className="text-xs text-muted">{l.durationMinutes} min</span>
                          {!accessible && <span className="text-muted">🔒</span>}
                        </div>
                      );
                      return (
                        <li key={l.id}>
                          {accessible ? <Link href={`/learn/${l.id}`} className="block transition hover:bg-slate/60">{row}</Link> : row}
                        </li>
                      );
                    })}
                    {m.lessons.length === 0 && <li className="px-5 py-3 text-sm text-muted">Lessons coming soon.</li>}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
        <aside className="lg:col-span-4">
          <div className="sticky top-24 rounded-xl border border-line bg-charcoal p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">You will learn to</p>
            <ul className="mt-4 space-y-3">
              {course.outcomes.map((o) => (
                <li key={o} className="flex gap-3 text-sm leading-relaxed text-parchment"><span className="text-gold">✦</span>{o}</li>
              ))}
            </ul>
            {course.enrolled && (
              <Link href="/dashboard/assignments" className="mt-6 block rounded-md border border-line px-4 py-3 text-center text-sm text-parchment transition hover:border-gold/40 hover:text-ivory">
                View assignments for this program →
              </Link>
            )}
          </div>
        </aside>
      </section>
    </main>
  );
}
