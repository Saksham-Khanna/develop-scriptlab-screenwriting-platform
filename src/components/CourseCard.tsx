import Link from "next/link";
import { Badge, Progress } from "@/components/ui";
import { levelLabel } from "@/lib/format";

export interface CourseSummary {
  id: number;
  title: string;
  slug: string;
  tagline: string;
  level: string;
  durationWeeks: number;
  coverImage: string | null;
  categoryName: string;
  instructorName: string;
  enrollmentCount?: number;
  isFeatured?: boolean;
  isPublished?: boolean;
  progress?: { total: number; completed: number; percent: number };
}

export function CourseCard({ course, href }: { course: CourseSummary; href?: string }) {
  return (
    <Link
      href={href ?? `/courses/${course.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-line bg-charcoal transition duration-300 hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-[0_20px_50px_-20px_rgba(201,162,77,0.25)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate">
        {course.coverImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={course.coverImage} alt="" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent" />
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge tone="gold">{course.categoryName.split(" – ")[0]}</Badge>
          {course.isPublished === false && <Badge tone="red">Draft</Badge>}
        </div>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-muted">
          <span>{levelLabel[course.level] ?? course.level}</span>
          <span>·</span>
          <span>{course.durationWeeks} weeks</span>
        </div>
        <h3 className="mt-2 font-display text-xl leading-snug text-ivory transition group-hover:text-gold-soft">{course.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{course.tagline}</p>
        <div className="mt-auto pt-4">
          {course.progress ? (
            <div>
              <div className="mb-1.5 flex justify-between text-xs text-muted">
                <span>{course.progress.completed}/{course.progress.total} lessons</span>
                <span className="text-gold-soft">{course.progress.percent}%</span>
              </div>
              <Progress value={course.progress.percent} />
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-muted">
              <span>with {course.instructorName}</span>
              {course.enrollmentCount !== undefined && <span>{course.enrollmentCount} enrolled</span>}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
