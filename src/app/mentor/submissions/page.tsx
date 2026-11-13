import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { SubmissionsList } from "@/components/mentor/SubmissionsList";

export default function Page() {
  return (
    <AppShell roles={["instructor", "admin"]} title="Submissions">
      <Suspense><SubmissionsList /></Suspense>
    </AppShell>
  );
}
