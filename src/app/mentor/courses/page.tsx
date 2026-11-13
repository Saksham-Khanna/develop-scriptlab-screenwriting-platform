"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard, type CourseSummary } from "@/components/CourseCard";
import { Alert, ButtonLink, EmptyState, PageLoader, SectionHeading } from "@/components/ui";

function Content() {
  const [data, setData] = useState<{ courses: CourseSummary[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<{ courses: CourseSummary[] }>("/dashboard/instructor").then(setData).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!data) return <PageLoader />;
  return (
    <>
      <SectionHeading eyebrow="Courses" title="Courses you teach" description="Open a course to manage modules, lessons and assignments." action={<ButtonLink href="/mentor/courses/new" size="sm">+ New course</ButtonLink>} />
      {data.courses.length === 0 ? (
        <EmptyState title="No courses yet" action={<ButtonLink href="/mentor/courses/new">Create your first course</ButtonLink>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{data.courses.map((c) => <CourseCard key={c.id} course={c} href={`/mentor/courses/${c.id}`} />)}</div>
      )}
    </>
  );
}

export default function Page() {
  return <AppShell roles={["instructor", "admin"]} title="My courses"><Content /></AppShell>;
}
