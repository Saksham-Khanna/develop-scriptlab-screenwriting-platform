import { AppShell } from "@/components/layout/AppShell";
import { CourseManager } from "@/components/mentor/CourseManager";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <AppShell roles={["instructor", "admin"]} title="Course manager">
      <CourseManager id={id} />
    </AppShell>
  );
}
