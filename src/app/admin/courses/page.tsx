"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { useToast } from "@/components/ui/Toast";
import { Alert, Badge, Button, ButtonLink, Card, Field, Input, PageLoader, SectionHeading } from "@/components/ui";
import type { CourseSummary } from "@/components/CourseCard";

type Cat = { id: number; name: string; slug: string; courseCount: number };

function Content() {
  const toast = useToast();
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [cats, setCats] = useState<Cat[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [catName, setCatName] = useState("");
  const load = useCallback(() => Promise.all([api<CourseSummary[]>("/courses"), api<Cat[]>("/categories")]).then(([c, k]) => { setCourses(c); setCats(k); }).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  async function toggle(c: CourseSummary, patch: Record<string, boolean>) {
    try { await api(`/courses/${c.id}`, { method: "PATCH", json: patch }); load(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function remove(c: CourseSummary) {
    if (!confirm(`Delete "${c.title}"? This removes all lessons, enrollments and submissions.`)) return;
    try { await api(`/courses/${c.id}`, { method: "DELETE" }); toast("Course deleted", "success"); load(); } catch (e) { toast(e instanceof Error ? e.message : "Failed", "error"); }
  }
  async function addCat(e: FormEvent) {
    e.preventDefault();
    try { await api("/categories", { method: "POST", json: { name: catName } }); setCatName(""); toast("Category added", "success"); load(); } catch (err) { toast(err instanceof Error ? err.message : "Failed", "error"); }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!courses) return <PageLoader />;
  return (
    <div className="grid gap-10 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <SectionHeading eyebrow="Courses" title="Course management" description={`${courses.length} courses`} action={<ButtonLink href="/mentor/courses/new" size="sm">+ New course</ButtonLink>} />
        <div className="overflow-x-auto rounded-xl border border-line bg-charcoal">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-line text-left text-[11px] uppercase tracking-wider text-muted"><th className="px-5 py-3">Course</th><th className="px-5 py-3">Enrolled</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-line">
              {courses.map((c) => (
                <tr key={c.id} className="hover:bg-slate/40">
                  <td className="px-5 py-3"><Link href={`/mentor/courses/${c.id}`} className="text-ivory hover:text-gold-soft">{c.title}</Link><p className="text-xs text-muted">{c.categoryName} · {c.instructorName}</p></td>
                  <td className="px-5 py-3 text-muted">{c.enrollmentCount}</td>
                  <td className="px-5 py-3"><div className="flex gap-1">{c.isPublished ? <Badge tone="green">Live</Badge> : <Badge tone="red">Draft</Badge>}{c.isFeatured && <Badge tone="gold">Featured</Badge>}</div></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="sm" variant="secondary" onClick={() => toggle(c, { isPublished: !c.isPublished })}>{c.isPublished ? "Unpublish" : "Publish"}</Button>
                      <Button size="sm" variant="secondary" onClick={() => toggle(c, { isFeatured: !c.isFeatured })}>{c.isFeatured ? "Unfeature" : "Feature"}</Button>
                      <Button size="sm" variant="danger" onClick={() => remove(c)}>Delete</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div>
        <SectionHeading eyebrow="Categories" title="Craft areas" />
        <Card className="p-5">
          <ul className="space-y-2 text-sm">
            {cats.map((c) => <li key={c.id} className="flex justify-between text-parchment"><span>{c.name}</span><span className="text-muted">{c.courseCount}</span></li>)}
          </ul>
          <form onSubmit={addCat} className="mt-5 space-y-2 border-t border-line pt-4">
            <Field label="New category"><Input value={catName} onChange={(e) => setCatName(e.target.value)} required minLength={2} placeholder="e.g. Pitching & Development" /></Field>
            <Button type="submit" size="sm">Add category</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return <AppShell roles={["admin"]} title="Courses"><Content /></AppShell>;
}
