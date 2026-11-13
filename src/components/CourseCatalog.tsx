"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { CourseCard, type CourseSummary } from "@/components/CourseCard";
import { EmptyState, Input, PageLoader, Alert } from "@/components/ui";

type Category = { id: number; name: string; slug: string; courseCount: number };

export function CourseCatalog() {
  const params = useSearchParams();
  const router = useRouter();
  const category = params.get("category") ?? "all";
  const [q, setQ] = useState(params.get("q") ?? "");
  const [debounced, setDebounced] = useState(q);
  const [categories, setCategories] = useState<Category[]>([]);
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { api<Category[]>("/categories").then(setCategories).catch(() => null); }, []);
  useEffect(() => { const t = setTimeout(() => setDebounced(q), 300); return () => clearTimeout(t); }, [q]);
  useEffect(() => {
    setCourses(null);
    setError(null);
    const sp = new URLSearchParams();
    if (debounced) sp.set("q", debounced);
    if (category !== "all") sp.set("category", category);
    api<CourseSummary[]>(`/courses?${sp}`).then(setCourses).catch((e) => setError(e.message));
  }, [debounced, category]);

  const setCategory = (slug: string) => {
    const sp = new URLSearchParams(params.toString());
    if (slug === "all") sp.delete("category"); else sp.set("category", slug);
    router.replace(`/courses?${sp}`);
  };

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-12">
      <aside className="lg:col-span-3">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search programs…" aria-label="Search" />
        <p className="mb-2 mt-7 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">Craft area</p>
        <ul className="space-y-0.5">
          {[{ id: 0, name: "All programs", slug: "all", courseCount: 0 }, ...categories].map((c) => {
            const active = category === c.slug;
            return (
              <li key={c.slug}>
                <button
                  onClick={() => setCategory(c.slug)}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${active ? "bg-slate text-gold-soft" : "text-parchment hover:bg-slate/50 hover:text-ivory"}`}
                >
                  <span className="pr-2">{c.name.split(" – ")[0]}</span>
                  {c.slug !== "all" && <span className="text-xs text-muted">{c.courseCount}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>
      <div className="lg:col-span-9">
        {error ? (
          <Alert>{error}</Alert>
        ) : !courses ? (
          <PageLoader label="Loading programs" />
        ) : courses.length === 0 ? (
          <EmptyState title="No programs match" description="Try another search term or clear the category filter." />
        ) : (
          <>
            <p className="mb-4 text-xs text-muted">{courses.length} program{courses.length === 1 ? "" : "s"}</p>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {courses.map((c) => <CourseCard key={c.id} course={c} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
