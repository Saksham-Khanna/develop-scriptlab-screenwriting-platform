import { LessonPlayer } from "@/components/LessonPlayer";

export default async function LearnPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  return <LessonPlayer lessonId={lessonId} />;
}
