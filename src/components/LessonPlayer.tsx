"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Logo } from "@/components/layout/Navbar";
import { Alert, Button, ButtonLink, PageLoader, Progress } from "@/components/ui";
import { renderMarkdown } from "@/lib/format";
import type { CourseFull } from "./CourseDetail";

interface LessonData {
  lesson: { id: number; title: string; type: "text" | "video"; content: string; videoUrl: string | null; durationMinutes: number; courseId: number; moduleId: number };
  module: { id: number; title: string } | undefined;
  course: { id: number; title: string; slug: string };
  prev: { id: number; title: string } | null;
  next: { id: number; title: string } | null;
  position: { index: number; total: number };
  completed: boolean;
  completedLessonIds: number[];
  canManage: boolean;
}

function toEmbed(url: string) {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export function LessonPlayer({ lessonId }: { lessonId: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<LessonData | null>(null);
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sidebar, setSidebar] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=/learn/${lessonId}`);
  }, [loading, user, router, lessonId]);

  const load = useCallback(async () => {
    try {
      const d = await api<LessonData>(`/lessons/${lessonId}`);
      setData(d);
      const c = await api<CourseFull>(`/courses/${d.course.id}`);
      setCourse(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load lesson");
    }
  }, [lessonId]);

  useEffect(() => { if (user) { setData(null); load(); } }, [user, load]);

  const html = useMemo(() => (data ? renderMarkdown(data.lesson.content) : ""), [data]);

  async function toggleComplete() {
    if (!data) return;
    setBusy(true);
    try {
      const res = await api<{ completed: boolean }>(`/lessons/${lessonId}/complete${data.completed ? "?undo=true" : ""}`, { method: "POST" });
      toast(res.completed ? "Lesson marked complete" : "Marked as not complete", "success");
      await load();
      if (res.completed && data.next) router.push(`/learn/${data.next.id}`);
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not update progress", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error)
    return (
      <div className="mx-auto max-w-xl px-5 py-24">
        <Alert>{error}</Alert>
        <ButtonLink href="/courses" variant="secondary" className="mt-4">Back to programs</ButtonLink>
      </div>
    );
  if (!data || !course) return <PageLoader label="Opening lesson" />;

  const { lesson } = data;
  const completedSet = new Set(data.completedLessonIds);

  const outline = (
    <div className="flex h-full flex-col">
      <div className="border-b border-line px-5 py-4">
        <Link href={`/courses/${course.id}`} className="text-[11px] uppercase tracking-wider text-muted hover:text-gold-soft">← Program overview</Link>
        <p className="mt-1 font-display text-lg leading-snug text-ivory">{course.title}</p>
        <div className="mt-3 flex items-center gap-3 text-xs text-muted">
          <Progress value={course.progress.percent} className="flex-1" />
          <span>{course.progress.percent}%</span>
        </div>
      </div>
      <nav className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
        {course.curriculum.map((m, i) => (
          <div key={m.id} className="mb-4">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-wider text-gold">Module {i + 1} · {m.title}</p>
            <ul className="mt-1">
              {m.lessons.map((l) => {
                const active = l.id === lesson.id;
                return (
                  <li key={l.id}>
                    <Link href={`/learn/${l.id}`} onClick={() => setSidebar(false)} className={`flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition ${active ? "bg-slate text-gold-soft" : "text-parchment hover:bg-slate/50 hover:text-ivory"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[9px] ${completedSet.has(l.id) ? "border-gold bg-gold text-ink" : "border-line"}`}>{completedSet.has(l.id) ? "✓" : ""}</span>
                      <span className="flex-1 leading-snug">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-ink">
      <aside className="hidden w-80 shrink-0 border-r border-line bg-charcoal/60 lg:sticky lg:top-0 lg:block lg:h-screen">{outline}</aside>
      {sidebar && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setSidebar(false)} />
          <aside className="absolute left-0 top-0 h-full w-80 max-w-[85vw] bg-charcoal">{outline}</aside>
        </div>
      )}
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-ink/85 px-5 backdrop-blur lg:px-10">
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-ivory" onClick={() => setSidebar(true)} aria-label="Course outline">☰</button>
            <Logo className="hidden sm:flex" />
          </div>
          <span className="text-xs text-muted">Lesson {data.position.index} of {data.position.total}</span>
        </header>

        <article className="mx-auto max-w-3xl px-5 py-10 lg:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{data.module?.title}</p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ivory">{lesson.title}</h1>
          <p className="mt-2 text-sm text-muted">{lesson.type === "video" ? "Video lesson" : "Reading"} · {lesson.durationMinutes} min</p>

          {lesson.type === "video" && (
            <div className="mt-8 overflow-hidden rounded-xl border border-line bg-charcoal">
              {lesson.videoUrl ? (
                <iframe src={toEmbed(lesson.videoUrl)} className="aspect-video w-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title={lesson.title} />
              ) : (
                <div className="grain relative flex aspect-video flex-col items-center justify-center bg-gradient-to-br from-slate to-ink text-center">
                  <span className="flex h-16 w-16 items-center justify-center rounded-full border border-gold/50 text-2xl text-gold">▶</span>
                  <p className="mt-4 font-display text-xl text-ivory">Video lecture placeholder</p>
                  <p className="mt-1 max-w-xs text-xs text-muted">This lesson will stream once a hosted video URL is attached by the mentor.{data.canManage ? " Add one from the course manager." : ""}</p>
                </div>
              )}
            </div>
          )}

          <div className="prose-lesson mt-8" dangerouslySetInnerHTML={{ __html: html }} />

          <div className="mt-12 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              {data.prev ? (
                <Link href={`/learn/${data.prev.id}`} className="group text-sm text-parchment hover:text-ivory">
                  <span className="block text-[11px] uppercase tracking-wider text-muted">Previous</span>
                  ← {data.prev.title}
                </Link>
              ) : <span />}
            </div>
            <div className="flex items-center gap-3">
              {user?.role === "student" && (
                <Button variant={data.completed ? "secondary" : "primary"} onClick={toggleComplete} loading={busy}>
                  {data.completed ? "✓ Completed" : data.next ? "Mark complete & continue" : "Mark complete"}
                </Button>
              )}
              {data.next ? (
                <Link href={`/learn/${data.next.id}`} className="text-right text-sm text-parchment hover:text-ivory">
                  <span className="block text-[11px] uppercase tracking-wider text-muted">Next</span>
                  {data.next.title} →
                </Link>
              ) : (
                <Link href="/dashboard/assignments" className="text-right text-sm text-gold-soft hover:underline">
                  <span className="block text-[11px] uppercase tracking-wider text-muted">Finished</span>
                  Go to assignments →
                </Link>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}
