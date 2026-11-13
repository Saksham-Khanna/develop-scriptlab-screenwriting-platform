"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";
import { CourseCard, type CourseSummary } from "@/components/CourseCard";
import { Alert, ButtonLink, EmptyState, PageLoader, SectionHeading } from "@/components/ui";

function Content() {
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { api<CourseSummary[]>("/enrollments").then(setCourses).catch((e) => setError(e.message)); }, []);
  if (error) return <Alert>{error}</Alert>;
  if (!courses) return <PageLoader />;
  return (
    <>
      <SectionHeading eyebrow="My courses" title="Enrolled programs" description="Pick up where you left off." action={<ButtonLink href="/courses" variant="secondary" size="sm">Explore more</ButtonLink>} />
      {courses.length === 0 ? (
        <EmptyState title="No enrollments yet" description="Browse the catalog and enroll in your first program." action={<ButtonLink href="/courses">Explore programs</ButtonLink>} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{courses.map((c) => <CourseCard key={c.id} course={c} />)}</div>
      )}
    </>
  );
}

export default function Page() {
  return <AppShell roles={["student"]} title="My courses"><Content /></AppShell>;
}
