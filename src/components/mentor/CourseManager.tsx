"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Alert, Badge, Button, ButtonLink, Card, Field, Input, PageLoader, Select, Textarea } from "@/components/ui";
import { dueLabel, formatDate } from "@/lib/format";
import type { CourseFull } from "@/components/CourseDetail";
import { CourseForm } from "./CourseForm";

type Tab = "curriculum" | "assignments" | "settings";
interface AssignmentRow { id: number; title: string; description: string; dueDate: string | null; maxScore: number }
interface LessonDraft { moduleId: number; id?: number; title: string; type: "text" | "video"; content: string; videoUrl: string; durationMinutes: number }

export function CourseManager({ id }: { id: string }) {
  const toast = useToast();
  const [course, setCourse] = useState<CourseFull | null>(null);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("curriculum");
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDesc, setModuleDesc] = useState("");
  const [lessonDraft, setLessonDraft] = useState<LessonDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [aForm, setAForm] = useState({ title: "", description: "", instructions: "", dueDate: "", maxScore: 100 });

  const load = useCallback(async () => {
    try {
      const c = await api<CourseFull>(`/courses/${id}`);
      setCourse(c);
      setAssignments(await api<AssignmentRow[]>(`/assignments?courseId=${id}`));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [id]);
  useEffect(() => { load(); }, [load]);

  async function run(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    try { await fn(); toast(success, "success"); await load(); }
    catch (e) { toast(e instanceof Error ? e.message : "Action failed", "error"); }
    finally { setBusy(false); }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!course) return <PageLoader />;
  if (!course.canManage) return <Alert>You don&apos;t have permission to manage this course.</Alert>;

  const addModule = (e: FormEvent) => { e.preventDefault(); run(async () => { await api(`/courses/${id}/modules`, { method: "POST", json: { title: moduleTitle, description: moduleDesc } }); setModuleTitle(""); setModuleDesc(""); }, "Module added"); };
  const saveLesson = (e: FormEvent) => {
    e.preventDefault();
    if (!lessonDraft) return;
    const { id: lid, ...body } = lessonDraft;
    run(async () => {
      if (lid) await api(`/lessons/${lid}`, { method: "PATCH", json: body });
      else await api("/lessons", { method: "POST", json: body });
      setLessonDraft(null);
    }, lid ? "Lesson updated" : "Lesson added");
  };
  const addAssignment = (e: FormEvent) => {
    e.preventDefault();
    run(async () => {
      await api("/assignments", { method: "POST", json: { ...aForm, courseId: Number(id), maxScore: Number(aForm.maxScore), dueDate: aForm.dueDate ? new Date(aForm.dueDate).toISOString() : null } });
      setAForm({ title: "", description: "", instructions: "", dueDate: "", maxScore: 100 });
    }, "Assignment published to students");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/mentor/courses" className="text-xs uppercase tracking-wider text-muted hover:text-gold-soft">← Courses</Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="font-display text-3xl text-ivory sm:text-4xl">{course.title}</h1>
            {!course.isPublished && <Badge tone="red">Draft</Badge>}
            {course.isFeatured && <Badge tone="gold">Featured</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">{course.enrollmentCount} students · {course.curriculum.reduce((n, m) => n + m.lessons.length, 0)} lessons · {assignments.length} assignments</p>
        </div>
        <ButtonLink href={`/courses/${course.id}`} variant="secondary" size="sm">View as student →</ButtonLink>
      </div>

      <div className="flex gap-1 border-b border-line">
        {(["curriculum", "assignments", "settings"] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`-mb-px border-b-2 px-4 py-2.5 text-sm capitalize transition ${tab === t ? "border-gold text-gold-soft" : "border-transparent text-muted hover:text-ivory"}`}>{t}</button>
        ))}
      </div>

      {tab === "curriculum" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {course.curriculum.map((m, i) => (
              <Card key={m.id}>
                <div className="flex items-start justify-between gap-3 border-b border-line px-5 py-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-gold">Module {i + 1}</p>
                    <h3 className="font-display text-xl text-ivory">{m.title}</h3>
                    {m.description && <p className="text-sm text-muted">{m.description}</p>}
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setLessonDraft({ moduleId: m.id, title: "", type: "text", content: "", videoUrl: "", durationMinutes: 10 })}>+ Lesson</Button>
                    <Button size="sm" variant="danger" onClick={() => confirm("Delete this module and all of its lessons?") && run(() => api(`/modules/${m.id}`, { method: "DELETE" }), "Module deleted")}>Delete</Button>
                  </div>
                </div>
                <ul className="divide-y divide-line">
                  {m.lessons.map((l) => (
                    <li key={l.id} className="flex items-center gap-3 px-5 py-2.5 text-sm">
                      <span className="text-muted">{l.type === "video" ? "▶" : "¶"}</span>
                      <span className="flex-1 text-ivory">{l.title}</span>
                      <span className="text-xs text-muted">{l.durationMinutes} min</span>
                      <Link href={`/learn/${l.id}`} className="text-xs text-muted hover:text-gold-soft">Preview</Link>
                      <button className="text-xs text-parchment hover:text-gold-soft" onClick={async () => { const d = await api<{ lesson: { id: number; title: string; type: "text" | "video"; content: string; videoUrl: string | null; durationMinutes: number } }>(`/lessons/${l.id}`); setLessonDraft({ moduleId: m.id, id: d.lesson.id, title: d.lesson.title, type: d.lesson.type, content: d.lesson.content, videoUrl: d.lesson.videoUrl ?? "", durationMinutes: d.lesson.durationMinutes }); }}>Edit</button>
                      <button className="text-xs text-red-300/80 hover:text-red-300" onClick={() => confirm("Delete lesson?") && run(() => api(`/lessons/${l.id}`, { method: "DELETE" }), "Lesson deleted")}>Delete</button>
                    </li>
                  ))}
                  {m.lessons.length === 0 && <li className="px-5 py-3 text-sm text-muted">No lessons yet.</li>}
                </ul>
              </Card>
            ))}
            {course.curriculum.length === 0 && <p className="text-sm text-muted">No modules yet. Add your first module to start building the curriculum.</p>}
          </div>
          <div className="space-y-6">
            <Card className="p-5">
              <h3 className="font-display text-xl text-ivory">Add module</h3>
              <form onSubmit={addModule} className="mt-4 space-y-3">
                <Field label="Title"><Input value={moduleTitle} onChange={(e) => setModuleTitle(e.target.value)} required minLength={2} /></Field>
                <Field label="Description"><Input value={moduleDesc} onChange={(e) => setModuleDesc(e.target.value)} /></Field>
                <Button type="submit" size="sm" loading={busy}>Add module</Button>
              </form>
            </Card>
            {lessonDraft && (
              <Card className="p-5">
                <h3 className="font-display text-xl text-ivory">{lessonDraft.id ? "Edit lesson" : "New lesson"}</h3>
                <form onSubmit={saveLesson} className="mt-4 space-y-3">
                  <Field label="Title"><Input value={lessonDraft.title} onChange={(e) => setLessonDraft({ ...lessonDraft, title: e.target.value })} required minLength={2} /></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Type">
                      <Select value={lessonDraft.type} onChange={(e) => setLessonDraft({ ...lessonDraft, type: e.target.value as "text" | "video" })}><option value="text">Reading</option><option value="video">Video</option></Select>
                    </Field>
                    <Field label="Minutes"><Input type="number" min={1} value={lessonDraft.durationMinutes} onChange={(e) => setLessonDraft({ ...lessonDraft, durationMinutes: Number(e.target.value) })} /></Field>
                  </div>
                  {lessonDraft.type === "video" && (
                    <Field label="Video URL" hint="YouTube, Vimeo or direct embed URL. Leave blank for a placeholder."><Input value={lessonDraft.videoUrl} onChange={(e) => setLessonDraft({ ...lessonDraft, videoUrl: e.target.value })} placeholder="https://youtu.be/…" /></Field>
                  )}
                  <Field label="Content" hint="Supports ## headings, lists, tables, > quotes, **bold**"><Textarea value={lessonDraft.content} onChange={(e) => setLessonDraft({ ...lessonDraft, content: e.target.value })} rows={10} /></Field>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" loading={busy}>{lessonDraft.id ? "Save" : "Add lesson"}</Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setLessonDraft(null)}>Cancel</Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </div>
      )}

      {tab === "assignments" && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {assignments.map((a) => (
              <Card key={a.id} className="flex items-start justify-between gap-4 p-5">
                <div className="min-w-0">
                  <Link href={`/assignments/${a.id}`} className="font-medium text-ivory hover:text-gold-soft">{a.title}</Link>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{a.description}</p>
                  <p className="mt-2 text-xs text-muted">{dueLabel(a.dueDate)}{a.dueDate ? ` · ${formatDate(a.dueDate)}` : ""} · max {a.maxScore}</p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <ButtonLink href={`/mentor/submissions?assignment=${a.id}`} size="sm" variant="secondary">Submissions</ButtonLink>
                  <Button size="sm" variant="danger" onClick={() => confirm("Delete assignment and all submissions?") && run(() => api(`/assignments/${a.id}`, { method: "DELETE" }), "Assignment deleted")}>Delete</Button>
                </div>
              </Card>
            ))}
            {assignments.length === 0 && <p className="text-sm text-muted">No assignments yet.</p>}
          </div>
          <Card className="h-fit p-5">
            <h3 className="font-display text-xl text-ivory">New assignment</h3>
            <form onSubmit={addAssignment} className="mt-4 space-y-3">
              <Field label="Title"><Input value={aForm.title} onChange={(e) => setAForm({ ...aForm, title: e.target.value })} required minLength={3} /></Field>
              <Field label="Short description"><Input value={aForm.description} onChange={(e) => setAForm({ ...aForm, description: e.target.value })} required minLength={5} /></Field>
              <Field label="Instructions"><Textarea value={aForm.instructions} onChange={(e) => setAForm({ ...aForm, instructions: e.target.value })} required minLength={5} /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Deadline"><Input type="date" value={aForm.dueDate} onChange={(e) => setAForm({ ...aForm, dueDate: e.target.value })} /></Field>
                <Field label="Max score"><Input type="number" min={1} value={aForm.maxScore} onChange={(e) => setAForm({ ...aForm, maxScore: Number(e.target.value) })} /></Field>
              </div>
              <Button type="submit" size="sm" loading={busy}>Publish assignment</Button>
            </form>
          </Card>
        </div>
      )}

      {tab === "settings" && (
        <div className="max-w-2xl">
          <CourseForm
            initial={{ id: course.id, title: course.title, tagline: course.tagline, description: course.description, categoryId: course.categoryId, instructorId: course.instructorId, level: course.level, durationWeeks: course.durationWeeks, coverImage: course.coverImage, outcomes: course.outcomes.length ? course.outcomes : [""], isPublished: course.isPublished, isFeatured: course.isFeatured }}
            onSaved={load}
          />
        </div>
      )}
    </div>
  );
}
