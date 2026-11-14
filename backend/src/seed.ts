import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  User,
  Category,
  Course,
  Module,
  Lesson,
  Enrollment,
  LessonProgress,
  Assignment,
  Submission,
  Feedback,
  ActivityLog,
  Counter,
} from "./models/index.js";

async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type LessonSeed = { title: string; type?: "text" | "video"; minutes: number; content: string };
type ModuleSeed = { title: string; description: string; lessons: LessonSeed[] };
type CourseSeed = {
  title: string;
  tagline: string;
  description: string;
  category: number;
  level: "beginner" | "intermediate" | "advanced";
  weeks: number;
  featured?: boolean;
  cover: string;
  outcomes: string[];
  modules: ModuleSeed[];
  assignments: { title: string; description: string; instructions: string; dueInDays: number }[];
};

const CATEGORIES = [
  ["Commercial Screenwriting", "Writing for the market: specs, pitches, and producible scripts."],
  ["Story Structure – Three-Act and Five-Act Structure", "Architecting screenplays with classical and television structures."],
  ["Character Development", "Building protagonists, antagonists and ensembles that drive story."],
  ["Dialogue and Scene Writing", "Subtext, rhythm and scene construction on the page."],
  ["Story Breaking", "Taking a premise from logline to beat sheet to outline."],
  ["Writers' Room Collaboration", "How professional rooms pitch, break and assign episodes."],
  ["Table Reads and Critiques", "Hearing your pages and giving usable notes."],
  ["Script Doctoring", "Diagnosing and fixing scripts that are not working."],
  ["Rewrite Roadmaps", "Planning drafts two through ten with intent."],
] as const;

const COURSES: CourseSeed[] = [
  {
    title: "The Commercial Spec: Writing Screenplays That Sell",
    tagline: "Learn how produced writers turn an idea into a marketable, producible feature spec.",
    description: "Most first screenplays fail not because the writer lacks talent but because the script was never designed for the marketplace. This course walks you through concept testing, logline engineering, genre contracts, budget-aware writing and the professional formatting expectations of readers at agencies, studios and production companies.",
    category: 0,
    level: "beginner" as const,
    weeks: 6,
    featured: true,
    cover: "/images/course-commercial.png",
    outcomes: [
      "Evaluate a premise for commercial viability before writing a page",
      "Write a logline and one-page pitch that communicates genre, hook and stakes",
      "Understand reader coverage and what 'Consider' vs 'Pass' actually means",
      "Format a professional spec using industry-standard conventions",
    ],
    modules: [
      {
        title: "Thinking Like a Buyer",
        description: "Who buys scripts, what they're looking for and why most specs die in coverage.",
        lessons: [
          { title: "What 'Commercial' Actually Means", minutes: 12, content: "Every studio, agency and production company employs readers whose job is to say no. A commercial script is not a 'dumb' script; it's a script where the promise of the premise is clear." },
          { title: "Coverage Walkthrough: Anatomy of a Pass", type: "video" as const, minutes: 18, content: "In this session we read real coverage on a spec that received a Pass and discuss the gap between intent and execution." },
          { title: "Genre Contracts and Audience Promises", minutes: 14, content: "When an audience buys a ticket to a heist film they are buying specific pleasures: assembling the crew, the plan, the twist." }
        ]
      },
      {
        title: "Concept and Logline Engineering",
        description: "Pressure-testing ideas before you commit 100 pages.",
        lessons: [
          { title: "The Irony Test", minutes: 15, content: "Blake Snyder called it irony; Craig Mazin calls it the central dramatic argument. A protagonist specifically ill-suited for the problem." },
          { title: "Building the One-Page Pitch", minutes: 16, content: "A one-page pitch is the document that gets you in the room. It is read in ninety seconds." }
        ]
      }
    ],
    assignments: [
      { title: "Logline & Irony Analysis", description: "Submit 3 commercial loglines following the irony formula.", instructions: "Include protagonist, flaw, goal, stakes, and ticking clock for each.", dueInDays: 7 },
      { title: "First 10 Pages Spec Opening", description: "Write and submit the first 10 pages of your feature spec.", instructions: "Must establish ordinary world, inciting incident, and tone by page 10.", dueInDays: 14 }
    ]
  },
  {
    title: "Advanced TV Showrunner Masterclass",
    tagline: "Master pilot structure, series bibles, and running a professional writers' room.",
    description: "Television is a writer's medium. This masterclass dives deep into television architecture, episodic engines, franchiseable characters, pitch decks, and how to lead a writers' room with confidence.",
    category: 5,
    level: "advanced" as const,
    weeks: 8,
    featured: true,
    cover: "/images/course-tv.png",
    outcomes: [
      "Architect a returning series pilot with an infinite episodic engine",
      "Write a professional 15-page series bible and pitch deck",
      "Break stories collaboratively in a simulated writers' room environment",
    ],
    modules: [
      {
        title: "The Pilot Engine",
        description: "Why some shows run 7 seasons and others die in episode 3.",
        lessons: [
          { title: "The Episodic Engine", minutes: 20, content: "An engine is the narrative machine that generates conflict episode after episode without exhausting the premise." },
          { title: "A/B/C Storylines in Drama", minutes: 15, content: "Balancing the serialized emotional arc with the procedural case of the week." }
        ]
      }
    ],
    assignments: [
      { title: "Series Bible Pitch", description: "Submit your 5-page series bible and pilot outline.", instructions: "Must include logline, character bios, season 1 arc, and pilot teaser breakdown.", dueInDays: 10 }
    ]
  }
];

export async function seedDatabase(shouldDisconnectAndExit = true) {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/scriptlab";
  console.log(`Connecting to MongoDB at ${mongoUri}...`);
  if (mongoose.connection.readyState === 0) {
    try {
      await mongoose.connect(mongoUri);
    } catch (err) {
      console.log("Local MongoDB failed, starting mongodb-memory-server...");
      const { MongoMemoryServer } = await import("mongodb-memory-server");
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
    }
  }

  console.log("Cleaning existing data...");
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Course.deleteMany({}),
    Module.deleteMany({}),
    Lesson.deleteMany({}),
    Enrollment.deleteMany({}),
    LessonProgress.deleteMany({}),
    Assignment.deleteMany({}),
    Submission.deleteMany({}),
    Feedback.deleteMany({}),
    ActivityLog.deleteMany({}),
    Counter.deleteMany({})
  ]);

  console.log("Seeding users...");
  const hashedPw = await hashPassword("password123");
  const admin = await User.create({ name: "Admin User", email: "admin@scriptlab.io", passwordHash: hashedPw, role: "admin", bio: "Platform administrator" });
  const mentor = await User.create({ name: "Sarah Jenkins", email: "mentor@scriptlab.io", passwordHash: hashedPw, role: "instructor", bio: "WGA writer and showrunner with credits at HBO and Netflix." });
  const student = await User.create({ name: "Alex Rivera", email: "student@scriptlab.io", passwordHash: hashedPw, role: "student", bio: "Aspiring feature writer and fellow." });
  const student2 = await User.create({ name: "Jordan Lee", email: "student2@scriptlab.io", passwordHash: hashedPw, role: "student", bio: "Indie filmmaker transitioning to screenwriting." });

  console.log("Seeding categories...");
  const catMap: Record<number, any> = {};
  for (let i = 0; i < CATEGORIES.length; i++) {
    const [name, desc] = CATEGORIES[i];
    const cat = await Category.create({ name, slug: slugify(name), description: desc });
    catMap[i] = cat;
  }

  console.log("Seeding courses, modules, lessons, assignments...");
  const courseIds: number[] = [];
  const assignmentIds: number[] = [];
  const lessonIdsByCourse: Record<number, number[]> = {};

  for (const cs of COURSES) {
    const categoryDoc = catMap[cs.category] || catMap[0];
    const course = await Course.create({
      title: cs.title,
      slug: slugify(cs.title),
      tagline: cs.tagline,
      description: cs.description,
      categoryId: categoryDoc.id,
      instructorId: mentor.id,
      level: cs.level,
      durationWeeks: cs.weeks,
      coverImage: cs.cover,
      outcomes: cs.outcomes,
      isPublished: true,
      isFeatured: cs.featured ?? false,
    });
    courseIds.push(course.id);
    lessonIdsByCourse[course.id] = [];

    let orderCounter = 1;
    for (let mIdx = 0; mIdx < cs.modules.length; mIdx++) {
      const ms = cs.modules[mIdx];
      const mod = await Module.create({
        courseId: course.id,
        title: ms.title,
        description: ms.description,
        order: mIdx + 1,
      });

      for (let lIdx = 0; lIdx < ms.lessons.length; lIdx++) {
        const ls = ms.lessons[lIdx];
        const lesson = await Lesson.create({
          moduleId: mod.id,
          courseId: course.id,
          title: ls.title,
          type: ls.type ?? "text",
          content: ls.content,
          durationMinutes: ls.minutes,
          order: orderCounter++,
        });
        lessonIdsByCourse[course.id].push(lesson.id);
      }
    }

    for (const asgn of cs.assignments) {
      const due = new Date();
      due.setDate(due.getDate() + asgn.dueInDays);
      const aDoc = await Assignment.create({
        courseId: course.id,
        title: asgn.title,
        description: asgn.description,
        instructions: asgn.instructions,
        dueDate: due,
        maxScore: 100,
        createdBy: mentor.id,
      });
      assignmentIds.push(aDoc.id);
    }
  }

  console.log("Seeding enrollments and progress...");
  await Enrollment.create({ userId: student.id, courseId: courseIds[0] });
  await Enrollment.create({ userId: student.id, courseId: courseIds[1] });
  await Enrollment.create({ userId: student2.id, courseId: courseIds[0] });

  const c0Lessons = lessonIdsByCourse[courseIds[0]] || [];
  if (c0Lessons.length > 0) {
    await LessonProgress.create({ userId: student.id, lessonId: c0Lessons[0], courseId: courseIds[0], completed: true });
    if (c0Lessons.length > 1) {
      await LessonProgress.create({ userId: student.id, lessonId: c0Lessons[1], courseId: courseIds[0], completed: false });
    }
  }

  console.log("Seeding submissions and feedback...");
  if (assignmentIds.length > 0) {
    const sub = await Submission.create({
      assignmentId: assignmentIds[0],
      studentId: student.id,
      content: "Here is my logline submission:\n\n1. When a blind hitman discovers his next target is his estranged daughter, he must protect her from the syndicate before they eliminate them both.\n2. A corporate whistleblower is forced to spend 48 hours trapped in an elevator with the CEO she exposed.\n3. An aging astronaut with severe memory loss must pilot the final shuttle home.",
      status: "reviewed",
    });

    await Feedback.create({
      submissionId: sub.id,
      instructorId: mentor.id,
      score: 92,
      comments: "Excellent work on these loglines, Alex! The first one has fantastic dramatic irony and high stakes. The second has great locked-room tension.",
      suggestions: "Refine the third one to make the ticking clock more explicit.",
    });
  }

  await ActivityLog.create({ userId: admin.id, action: "system.seeded", detail: "Database successfully seeded with demo data." });

  console.log("Database seeding completed successfully!");
  if (shouldDisconnectAndExit) {
    await mongoose.disconnect();
    process.exit(0);
  }
}

if (process.argv[1]?.endsWith("seed.ts") || process.argv[1]?.endsWith("seed.js")) {
  seedDatabase(true).catch((err) => {
    console.error("Seeding failed:", err);
    process.exit(1);
  });
}
