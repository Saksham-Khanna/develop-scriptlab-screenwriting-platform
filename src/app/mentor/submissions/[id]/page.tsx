import { AppShell } from "@/components/layout/AppShell";
import { ReviewSubmission } from "@/components/mentor/ReviewSubmission";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell roles={["instructor", "admin"]} title="Review submission">
      <ReviewSubmission id={id} />
    </AppShell>
  );
}
