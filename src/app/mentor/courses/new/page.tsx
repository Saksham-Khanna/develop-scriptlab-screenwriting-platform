"use client";

import { AppShell } from "@/components/layout/AppShell";
import { CourseForm } from "@/components/mentor/CourseForm";

export default function Page() {
  return (
    <AppShell roles={["instructor", "admin"]} title="New course">
      <div className="mx-auto max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">New course</p>
        <h1 className="mt-2 mb-8 font-display text-4xl text-ivory">Create a program</h1>
        <CourseForm />
      </div>
    </AppShell>
  );
}
