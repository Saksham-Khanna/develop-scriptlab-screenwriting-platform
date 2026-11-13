"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { Navbar } from "@/components/layout/Navbar";
import { Alert, Badge, Button, ButtonLink, Card, Field, PageLoader, StatusBadge, Textarea } from "@/components/ui";
import { dueLabel, formatDate } from "@/lib/format";

interface AssignmentData {
  id: number; courseId: number; courseTitle: string; title: string; description: string; instructions: string; dueDate: string | null; maxScore: number; canManage: boolean;
  mySubmission: null | { id: number; content: string; fileName: string | null; status: string; submittedAt: string; feedbackScore: number | null; feedbackComments: string | null; feedbackSuggestions: string | null; feedbackAt: string | null; reviewerName: string | null };
}

export function AssignmentDetail({ id }: { id: string }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [data, setData] = useState<AssignmentData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [file, setFile] = useState<{ name: string; data: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => { if (!loading && !user) router.replace(`/login?next=/assignments/${id}`); }, [loading, user, router, id]);
  const load = useCallback(() => api<AssignmentData>(`/assignments/${id}`).then((d) => { setData(d); setContent(d.mySubmission?.content ?? ""); }).catch((e) => setError(e.message)), [id]);
  useEffect(() => { if (user) load(); }, [user, load]);

  function onFile(f: File | null) {
    if (!f) return setFile(null);
    if (f.size > 1_400_000) return toast("Please attach a file under 1.4 MB", "error");
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, data: String(reader.result) });
    reader.readAsDataURL(f);
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/assignments/${id}/submissions`, { method: "POST", json: { content, fileName: file?.name ?? data?.mySubmission?.fileName ?? null, fileData: file?.data ?? undefined } });
      toast("Submission received. Your mentor will be notified.", "success");
      setEditing(false);
      setFile(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Submission failed", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <><Navbar /><main className="mx-auto max-w-xl px-5 py-20"><Alert>{error}</Alert></main></>;
  if (!data) return <><Navbar /><PageLoader label="Loading assignment" /></>;

  const sub = data.mySubmission;
  const showForm = user?.role === "student" && (!sub || editing);

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-12 lg:px-8">
        <Link href={data.canManage ? `/mentor/courses/${data.courseId}` : "/dashboard/assignments"} className="text-xs uppercase tracking-wider text-muted hover:text-gold-soft">← {data.canManage ? "Course manager" : "My assignments"}</Link>
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gold-soft">{data.courseTitle}</p>
            <h1 className="mt-1 font-display text-4xl text-ivory">{data.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-muted">
              <span>{dueLabel(data.dueDate)}{data.dueDate && ` · ${formatDate(data.dueDate)}`}</span>
              <span>·</span>
              <span>Max score {data.maxScore}</span>
              {user?.role === "student" && <StatusBadge status={sub?.status} />}
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-10 lg:grid-cols-12">
          <div className="space-y-8 lg:col-span-7">
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Brief</h2>
              <p className="mt-2 leading-relaxed text-parchment">{data.description}</p>
            </section>
            <section>
              <h2 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Instructions</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-parchment">{data.instructions}</p>
            </section>

            {showForm && (
              <form onSubmit={submit} className="space-y-4 rounded-xl border border-line bg-charcoal p-6">
                <h2 className="font-display text-2xl text-ivory">{sub ? "Revise your submission" : "Your submission"}</h2>
                <Field label="Written response" hint="Paste your pages, outline or memo. Screenplay formatting is preserved as plain text.">
                  <Textarea value={content} onChange={(e) => setContent(e.target.value)} rows={14} className="font-[Courier_Prime,Courier,monospace] text-[13px]" placeholder={"FADE IN:\n\nINT. DISPATCH CENTRE - NIGHT\n\n..."} required minLength={20} />
                </Field>
                <Field label="Attach screenplay (optional)" hint="PDF, FDX or Fountain up to 1.4 MB">
                  <input type="file" accept=".pdf,.fdx,.fountain,.txt,.doc,.docx" onChange={(e) => onFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-parchment file:mr-3 file:rounded-md file:border file:border-line file:bg-slate file:px-3 file:py-1.5 file:text-xs file:text-ivory" />
                  {(file || sub?.fileName) && <span className="mt-1 block text-xs text-gold-soft">Attached: {file?.name ?? sub?.fileName}</span>}
                </Field>
                <div className="flex gap-2">
                  <Button type="submit" loading={busy}>{sub ? "Update submission" : "Submit for review"}</Button>
                  {sub && <Button type="button" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>}
                </div>
              </form>
            )}

            {sub && !editing && user?.role === "student" && (
              <Card className="p-6">
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl text-ivory">Your submission</h2>
                  <span className="text-xs text-muted">Submitted {formatDate(sub.submittedAt)}</span>
                </div>
                <pre className="mt-4 max-h-96 overflow-auto whitespace-pre-wrap rounded-md border border-line bg-ink p-4 font-[Courier_Prime,Courier,monospace] text-[13px] leading-relaxed text-parchment scrollbar-thin">{sub.content}</pre>
                {sub.fileName && <p className="mt-3 text-xs text-muted">Attachment: <span className="text-gold-soft">{sub.fileName}</span></p>}
                {sub.status !== "reviewed" && <Button variant="secondary" size="sm" className="mt-4" onClick={() => setEditing(true)}>Revise before review</Button>}
              </Card>
            )}
            {data.canManage && (
              <ButtonLink href={`/mentor/submissions?assignment=${data.id}`} variant="secondary">View student submissions</ButtonLink>
            )}
          </div>

          <aside className="lg:col-span-5">
            {sub?.status === "reviewed" ? (
              <div className="rounded-xl border border-gold/30 bg-gold/5 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Mentor feedback</p>
                  {sub.feedbackScore != null && <span className="font-display text-3xl text-ivory">{sub.feedbackScore}<span className="text-base text-muted">/{data.maxScore}</span></span>}
                </div>
                <p className="mt-1 text-xs text-muted">{sub.reviewerName} · {formatDate(sub.feedbackAt)}</p>
                <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-ivory">{sub.feedbackComments}</p>
                {sub.feedbackSuggestions && (
                  <div className="mt-5 border-t border-gold/20 pt-4">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-gold">Suggestions for the rewrite</p>
                    <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-parchment">{sub.feedbackSuggestions}</p>
                  </div>
                )}
              </div>
            ) : (
              <Card className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Review status</p>
                <div className="mt-3"><StatusBadge status={sub?.status} /></div>
                <p className="mt-3 text-sm text-muted">
                  {!sub ? "Submit your response to put it in your mentor's review queue." : "Your mentor has your pages. Feedback typically lands within a few days."}
                </p>
                <div className="mt-5 space-y-2 text-xs text-muted">
                  <p><Badge tone="neutral">Pending</Badge> &nbsp;Not yet submitted</p>
                  <p><Badge tone="amber">Submitted</Badge> &nbsp;Awaiting mentor review</p>
                  <p><Badge tone="green">Reviewed</Badge> &nbsp;Feedback available</p>
                </div>
              </Card>
            )}
          </aside>
        </div>
      </main>
    </>
  );
}
