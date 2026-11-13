"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { Alert, Button, Card, Field, Input, PageLoader, StatusBadge, Textarea } from "@/components/ui";
import { formatDate } from "@/lib/format";

interface Sub {
  id: number; assignmentId: number; assignmentTitle: string; assignmentInstructions: string; maxScore: number; courseId: number; courseTitle: string;
  studentName: string; studentEmail: string; content: string; fileName: string | null; fileData: string | null; status: string; submittedAt: string; canReview: boolean;
  feedback: null | { score: number | null; comments: string; suggestions: string | null; createdAt: string; reviewerName: string };
}

export function ReviewSubmission({ id }: { id: string }) {
  const toast = useToast();
  const router = useRouter();
  const [s, setS] = useState<Sub | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<string>("");
  const [comments, setComments] = useState("");
  const [suggestions, setSuggestions] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Sub>(`/submissions/${id}`).then((d) => { setS(d); setScore(d.feedback?.score?.toString() ?? ""); setComments(d.feedback?.comments ?? ""); setSuggestions(d.feedback?.suggestions ?? ""); }).catch((e) => setError(e.message));
  }, [id]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      await api(`/submissions/${id}/feedback`, { method: "POST", json: { score: score === "" ? null : Number(score), comments, suggestions: suggestions || null } });
      toast("Feedback delivered to the student", "success");
      router.push("/mentor/submissions");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not save feedback", "error");
    } finally {
      setBusy(false);
    }
  }

  if (error) return <Alert>{error}</Alert>;
  if (!s) return <PageLoader />;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/mentor/submissions" className="text-xs uppercase tracking-wider text-muted hover:text-gold-soft">← Submissions</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl text-ivory sm:text-4xl">{s.assignmentTitle}</h1>
          <StatusBadge status={s.status} />
        </div>
        <p className="mt-1 text-sm text-muted">{s.courseTitle} · submitted by <span className="text-ivory">{s.studentName}</span> ({s.studentEmail}) on {formatDate(s.submittedAt)}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <details className="rounded-xl border border-line bg-charcoal">
            <summary className="cursor-pointer px-5 py-3 text-sm text-parchment">Assignment instructions</summary>
            <p className="whitespace-pre-line border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">{s.assignmentInstructions}</p>
          </details>
          <Card className="p-0">
            <div className="flex items-center justify-between border-b border-line px-5 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Student response</p>
              {s.fileName && (
                s.fileData ? <a href={s.fileData} download={s.fileName} className="text-xs text-gold-soft hover:underline">⬇ {s.fileName}</a> : <span className="text-xs text-muted">📎 {s.fileName}</span>
              )}
            </div>
            <pre className="scrollbar-thin max-h-[70vh] overflow-auto whitespace-pre-wrap p-5 font-[Courier_Prime,Courier,monospace] text-[13px] leading-relaxed text-parchment">{s.content}</pre>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {s.canReview ? (
            <form onSubmit={submit} className="sticky top-20 space-y-4 rounded-xl border border-gold/30 bg-gold/5 p-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">{s.feedback ? "Update feedback" : "Write feedback"}</p>
                {s.feedback && <p className="mt-1 text-xs text-muted">Last reviewed by {s.feedback.reviewerName} · {formatDate(s.feedback.createdAt)}</p>}
              </div>
              <Field label={`Score (out of ${s.maxScore})`}>
                <Input type="number" min={0} max={s.maxScore} value={score} onChange={(e) => setScore(e.target.value)} placeholder="Optional" />
              </Field>
              <Field label="Notes" hint="Describe the experience; locate problems by page or section.">
                <Textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={8} required minLength={10} placeholder="What's working, where attention dropped, what the pages are really about…" />
              </Field>
              <Field label="Suggestions for the rewrite" hint="Optional, numbered list works well.">
                <Textarea value={suggestions} onChange={(e) => setSuggestions(e.target.value)} rows={5} placeholder={"1. …\n2. …"} />
              </Field>
              <Button type="submit" className="w-full" loading={busy}>{s.feedback ? "Update & keep reviewed" : "Deliver feedback & mark reviewed"}</Button>
            </form>
          ) : (
            <Alert kind="info">You can view this submission but only the course mentor can leave feedback.</Alert>
          )}
        </div>
      </div>
    </div>
  );
}
