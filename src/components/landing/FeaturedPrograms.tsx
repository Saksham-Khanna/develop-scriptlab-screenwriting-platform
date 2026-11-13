"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CourseCard, type CourseSummary } from "@/components/CourseCard";

export function FeaturedPrograms() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<CourseSummary[]>("/courses?featured=true")
      .then((rows) => setCourses(rows.slice(0, 4)))
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="text-sm text-red-300">Couldn&apos;t load programs: {error}</p>;
  if (!courses)
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-80 animate-pulse rounded-xl border border-line bg-charcoal" />
        ))}
      </div>
    );
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} />
      ))}
    </div>
  );
}
