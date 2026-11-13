"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Button, Field, Input, Select, Textarea } from "@/components/ui";

type Cat = { id: number; name: string };
type Inst = { id: number; name: string };

export interface CourseFormValues {
  id?: number; title: string; tagline: string; description: string; categoryId: number; instructorId: number; level: string; durationWeeks: number; coverImage: string | null; outcomes: string[]; isPublished: boolean; isFeatured: boolean;
}

export function CourseForm({ initial, onSaved }: { initial?: CourseFormValues; onSaved?: () => void }) {
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [cats, setCats] = useState<Cat[]>([]);
  const [instructors, setInstructors] = useState<Inst[]>([]);
  const [v, setV] = useState<CourseFormValues>(initial ?? { title: "", tagline: "", description: "", categoryId: 0, instructorId: user?.id ?? 0, level: "beginner", durationWeeks: 4, coverImage: "/images/course-commercial.jpg", outcomes: [""], isPublished: true, isFeatured: false });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Cat[]>("/categories").then((c) => { setCats(c); setV((s) => ({ ...s, categoryId: s.categoryId || c[0]?.id || 0 })); });
    if (user?.role === "admin") api<Inst[]>("/admin/users?role=instructor").then(setInstructors).catch(() => null);
  }, [user?.role]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const payload = { ...v, outcomes: v.outcomes.filter((o) => o.trim()), durationWeeks: Number(v.durationWeeks), categoryId: Number(v.categoryId), instructorId: Number(v.instructorId) || user!.id };
      if (initial?.id) {
        await api(`/courses/${initial.id}`, { method: "PATCH", json: payload });
        toast("Course updated", "success");
        onSaved?.();
      } else {
        const row = await api<{ id: number }>("/courses", { method: "POST", json: payload });
        toast("Course created. Now add modules and lessons.", "success");
        router.push(`/mentor/courses/${row.id}`);
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Save failed", "error");
    } finally {
      setBusy(false);
    }
  }

  const covers = ["commercial", "structure", "character", "dialogue", "breaking", "room", "tableread", "doctoring", "rewrite"];

  return (
    <form onSubmit={submit} className="space-y-5">
      <Field label="Title"><Input value={v.title} onChange={(e) => setV({ ...v, title: e.target.value })} required minLength={3} /></Field>
      <Field label="Tagline"><Input value={v.tagline} onChange={(e) => setV({ ...v, tagline: e.target.value })} required minLength={3} /></Field>
      <Field label="Description"><Textarea value={v.description} onChange={(e) => setV({ ...v, description: e.target.value })} required minLength={10} /></Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Category">
          <Select value={v.categoryId} onChange={(e) => setV({ ...v, categoryId: Number(e.target.value) })}>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Level">
          <Select value={v.level} onChange={(e) => setV({ ...v, level: e.target.value })}>
            <option value="beginner">Foundation</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
          </Select>
        </Field>
        <Field label="Duration (weeks)"><Input type="number" min={1} max={52} value={v.durationWeeks} onChange={(e) => setV({ ...v, durationWeeks: Number(e.target.value) })} /></Field>
      </div>
      {user?.role === "admin" && instructors.length > 0 && (
        <Field label="Instructor">
          <Select value={v.instructorId} onChange={(e) => setV({ ...v, instructorId: Number(e.target.value) })}>
            {instructors.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
          </Select>
        </Field>
      )}
      <Field label="Cover image">
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-9">
          {covers.map((c) => {
            const src = `/images/course-${c}.jpg`;
            return (
              <button type="button" key={c} onClick={() => setV({ ...v, coverImage: src })} className={`aspect-video overflow-hidden rounded border-2 transition ${v.coverImage === src ? "border-gold" : "border-transparent opacity-60 hover:opacity-100"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            );
          })}
        </div>
      </Field>
      <Field label="Learning outcomes">
        <div className="space-y-2">
          {v.outcomes.map((o, i) => (
            <div key={i} className="flex gap-2">
              <Input value={o} onChange={(e) => setV({ ...v, outcomes: v.outcomes.map((x, j) => (j === i ? e.target.value : x)) })} placeholder="Students will be able to…" />
              <Button type="button" variant="ghost" size="sm" onClick={() => setV({ ...v, outcomes: v.outcomes.filter((_, j) => j !== i) })}>✕</Button>
            </div>
          ))}
          <Button type="button" variant="secondary" size="sm" onClick={() => setV({ ...v, outcomes: [...v.outcomes, ""] })}>+ Add outcome</Button>
        </div>
      </Field>
      <div className="flex flex-wrap gap-6 text-sm text-parchment">
        <label className="flex items-center gap-2"><input type="checkbox" checked={v.isPublished} onChange={(e) => setV({ ...v, isPublished: e.target.checked })} className="accent-[#c9a24d]" /> Published (visible in catalog)</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={v.isFeatured} onChange={(e) => setV({ ...v, isFeatured: e.target.checked })} className="accent-[#c9a24d]" /> Featured on landing page</label>
      </div>
      <Button type="submit" loading={busy}>{initial?.id ? "Save changes" : "Create course"}</Button>
    </form>
  );
}
