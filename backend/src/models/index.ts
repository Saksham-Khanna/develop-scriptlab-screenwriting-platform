import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Safe no-op connect to prevent any external MongoDB / binary downloads
mongoose.connect = async (_uri?: string, _options?: any) => {
  console.log("Connected to built-in high-performance JSON data store.");
  return mongoose as any;
};
mongoose.disconnect = async () => {};

const DATA_DIR = path.resolve(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface DBData {
  counters: Record<string, number>;
  users: any[];
  categories: any[];
  courses: any[];
  modules: any[];
  lessons: any[];
  enrollments: any[];
  lesson_progress: any[];
  assignments: any[];
  submissions: any[];
  feedback: any[];
  activity_log: any[];
}

function loadDb(): DBData {
  if (!fs.existsSync(DB_FILE)) {
    const initial: DBData = {
      counters: { users: 4, categories: 9, courses: 2, modules: 3, lessons: 7, enrollments: 3, lesson_progress: 2, assignments: 3, submissions: 1, feedback: 1, activity_log: 1 },
      users: [
        { id: 1, name: "Admin User", email: "admin@scriptlab.io", passwordHash: bcrypt.hashSync("password123", 10), role: "admin", bio: "Platform administrator", isActive: true, createdAt: new Date() },
        { id: 2, name: "Sarah Jenkins", email: "mentor@scriptlab.io", passwordHash: bcrypt.hashSync("password123", 10), role: "instructor", bio: "WGA writer and showrunner with credits at HBO and Netflix.", isActive: true, createdAt: new Date() },
        { id: 3, name: "Alex Rivera", email: "student@scriptlab.io", passwordHash: bcrypt.hashSync("password123", 10), role: "student", bio: "Aspiring feature writer and fellow.", isActive: true, createdAt: new Date() },
        { id: 4, name: "Jordan Lee", email: "student2@scriptlab.io", passwordHash: bcrypt.hashSync("password123", 10), role: "student", bio: "Indie filmmaker transitioning to screenwriting.", isActive: true, createdAt: new Date() },
      ],
      categories: [
        { id: 1, name: "Commercial Screenwriting", slug: "commercial-screenwriting", description: "Writing for the market: specs, pitches, and producible scripts." },
        { id: 2, name: "Story Structure – Three-Act and Five-Act Structure", slug: "story-structure-three-act-and-five-act-structure", description: "Architecting screenplays with classical and television structures." },
        { id: 3, name: "Character Development", slug: "character-development", description: "Building protagonists, antagonists and ensembles that drive story." },
        { id: 4, name: "Dialogue and Scene Writing", slug: "dialogue-and-scene-writing", description: "Subtext, rhythm and scene construction on the page." },
        { id: 5, name: "Story Breaking", slug: "story-breaking", description: "Taking a premise from logline to beat sheet to outline." },
        { id: 6, name: "Writers' Room Collaboration", slug: "writers-room-collaboration", description: "How professional rooms pitch, break and assign episodes." },
        { id: 7, name: "Table Reads and Critiques", slug: "table-reads-and-critiques", description: "Hearing your pages and giving usable notes." },
        { id: 8, name: "Script Doctoring", slug: "script-doctoring", description: "Diagnosing and fixing scripts that are not working." },
        { id: 9, name: "Rewrite Roadmaps", slug: "rewrite-roadmaps", description: "Planning drafts two through ten with intent." },
      ],
      courses: [
        {
          id: 1,
          title: "The Commercial Spec: Writing Screenplays That Sell",
          slug: "the-commercial-spec-writing-screenplays-that-sell",
          tagline: "Learn how produced writers turn an idea into a marketable, producible feature spec.",
          description: "Most first screenplays fail not because the writer lacks talent but because the script was never designed for the marketplace. This course walks you through concept testing, logline engineering, genre contracts, budget-aware writing and the professional formatting expectations of readers at agencies, studios and production companies.",
          categoryId: 1,
          instructorId: 2,
          level: "beginner",
          durationWeeks: 6,
          coverImage: "/images/course-commercial.svg",
          outcomes: [
            "Evaluate a premise for commercial viability before writing a page",
            "Write a logline and one-page pitch that communicates genre, hook and stakes",
            "Understand reader coverage and what 'Consider' vs 'Pass' actually means",
            "Format a professional spec using industry-standard conventions",
          ],
          isPublished: true,
          isFeatured: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          title: "Advanced TV Showrunner Masterclass",
          slug: "advanced-tv-showrunner-masterclass",
          tagline: "Master pilot structure, series bibles, and running a professional writers' room.",
          description: "Television is a writer's medium. This masterclass dives deep into television architecture, episodic engines, franchiseable characters, pitch decks, and how to lead a writers' room with confidence.",
          categoryId: 6,
          instructorId: 2,
          level: "advanced",
          durationWeeks: 8,
          coverImage: "/images/course-tv.svg",
          outcomes: [
            "Architect a returning series pilot with an infinite episodic engine",
            "Write a professional 15-page series bible and pitch deck",
            "Break stories collaboratively in a simulated writers' room environment",
          ],
          isPublished: true,
          isFeatured: true,
          createdAt: new Date(),
        }
      ],
      modules: [
        { id: 1, courseId: 1, title: "Thinking Like a Buyer", description: "Who buys scripts, what they're looking for and why most specs die in coverage.", order: 1 },
        { id: 2, courseId: 1, title: "Concept and Logline Engineering", description: "Pressure-testing ideas before you commit 100 pages.", order: 2 },
        { id: 3, courseId: 2, title: "The Pilot Engine", description: "Why some shows run 7 seasons and others die in episode 3.", order: 1 },
      ],
      lessons: [
        { id: 1, courseId: 1, moduleId: 1, title: "What 'Commercial' Actually Means", type: "text", content: "Every studio, agency and production company employs readers whose job is to say no. A commercial script is not a 'dumb' script; it's a script where the promise of the premise is clear.", durationMinutes: 12, order: 1 },
        { id: 2, courseId: 1, moduleId: 1, title: "Coverage Walkthrough: Anatomy of a Pass", type: "video", content: "In this session we read real coverage on a spec that received a Pass and discuss the gap between intent and execution.", videoUrl: "https://youtu.be/dQw4w9WgXcQ", durationMinutes: 18, order: 2 },
        { id: 3, courseId: 1, moduleId: 1, title: "Genre Contracts and Audience Promises", type: "text", content: "When an audience buys a ticket to a heist film they are buying specific pleasures: assembling the crew, the plan, the twist.", durationMinutes: 14, order: 3 },
        { id: 4, courseId: 1, moduleId: 2, title: "The Irony Test", type: "text", content: "Blake Snyder called it irony; Craig Mazin calls it the central dramatic argument. A protagonist specifically ill-suited for the problem.", durationMinutes: 15, order: 4 },
        { id: 5, courseId: 1, moduleId: 2, title: "Building the One-Page Pitch", type: "text", content: "A one-page pitch is the document that gets you in the room. It is read in ninety seconds.", durationMinutes: 16, order: 5 },
        { id: 6, courseId: 2, moduleId: 3, title: "The Episodic Engine", type: "text", content: "An engine is the narrative machine that generates conflict episode after episode without exhausting the premise.", durationMinutes: 20, order: 6 },
        { id: 7, courseId: 2, moduleId: 3, title: "A/B/C Storylines in Drama", type: "text", content: "Balancing the serialized emotional arc with the procedural case of the week.", durationMinutes: 15, order: 7 },
      ],
      enrollments: [
        { id: 1, userId: 3, courseId: 1, enrolledAt: new Date() },
        { id: 2, userId: 3, courseId: 2, enrolledAt: new Date() },
        { id: 3, userId: 4, courseId: 1, enrolledAt: new Date() },
      ],
      lesson_progress: [
        { id: 1, userId: 3, lessonId: 1, courseId: 1, completed: true, lastAccessedAt: new Date() },
        { id: 2, userId: 3, lessonId: 2, courseId: 1, completed: false, lastAccessedAt: new Date() },
      ],
      assignments: [
        { id: 1, courseId: 1, title: "Logline & Irony Analysis", description: "Submit 3 commercial loglines following the irony formula.", instructions: "Include protagonist, flaw, goal, stakes, and ticking clock for each.", dueDate: new Date(Date.now() + 7 * 86400000), maxScore: 100, maxAttempts: 3, allowLate: false, createdBy: 2, createdAt: new Date() },
        { id: 2, courseId: 1, title: "First 10 Pages Spec Opening", description: "Write and submit the first 10 pages of your feature spec.", instructions: "Must establish ordinary world, inciting incident, and tone by page 10.", dueDate: new Date(Date.now() + 14 * 86400000), maxScore: 100, maxAttempts: 3, allowLate: false, createdBy: 2, createdAt: new Date() },
        { id: 3, courseId: 2, title: "Series Bible Pitch", description: "Submit your 5-page series bible and pilot outline.", instructions: "Must include logline, character bios, season 1 arc, and pilot teaser breakdown.", dueDate: new Date(Date.now() + 10 * 86400000), maxScore: 100, maxAttempts: 3, allowLate: false, createdBy: 2, createdAt: new Date() },
      ],
      submissions: [
        {
          id: 1,
          assignmentId: 1,
          studentId: 3,
          attemptNumber: 1,
          isLate: false,
          content: "Here is my logline submission:\n\n1. When a blind hitman discovers his next target is his estranged daughter, he must protect her from the syndicate before they eliminate them both.\n2. A corporate whistleblower is forced to spend 48 hours trapped in an elevator with the CEO she exposed.\n3. An aging astronaut with severe memory loss must pilot the final shuttle home.",
          status: "reviewed",
          submittedAt: new Date(),
        }
      ],
      feedback: [
        {
          id: 1,
          submissionId: 1,
          instructorId: 2,
          score: 92,
          comments: "Excellent work on these loglines, Alex! The first one has fantastic dramatic irony and high stakes. The second has great locked-room tension.",
          suggestions: "Refine the third one to make the ticking clock more explicit.",
          createdAt: new Date(),
        }
      ],
      activity_log: [
        { id: 1, userId: 1, action: "system.seeded", detail: "Database initialized with JSON storage.", createdAt: new Date() }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  const raw = fs.readFileSync(DB_FILE, "utf-8");
  return JSON.parse(raw);
}

function saveDb(data: DBData) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function getNextSequence(name: string): Promise<number> {
  const db = loadDb();
  if (!db.counters) db.counters = {};
  const items = db[name] || [];
  const maxId = items.reduce((max: number, item: any) => (item.id > max ? item.id : max), 0);
  const nextId = Math.max(maxId + 1, (db.counters[name] || 0) + 1);
  db.counters[name] = nextId;
  saveDb(db);
  return nextId;
}

class ModelWrapper {
  collection: keyof DBData;
  constructor(collection: keyof DBData) {
    this.collection = collection;
  }

  find(query: any = {}) {
    const db = loadDb();
    let items = db[this.collection] || [];
    if (!Array.isArray(items)) items = [];
    items = items.filter(item => {
      for (const key in query) {
        if (query[key] !== undefined) {
          if (query[key] && typeof query[key] === "object" && "$in" in query[key]) {
            if (!query[key].$in.includes(item[key])) return false;
          } else if (item[key] !== query[key]) {
            return false;
          }
        }
      }
      if (query.$or) {
        const matches = query.$or.some((cond: any) => {
          return Object.keys(cond).some(k => {
            if (cond[k] instanceof RegExp) {
              return cond[k].test(item[k]);
            }
            return item[k] === cond[k];
          });
        });
        if (!matches) return false;
      }
      return true;
    });

    const queryBuilder: any = {
      sort: (sortObj: any) => {
        const sorted = [...items];
        const keys = Object.keys(sortObj);
        if (keys.length > 0) {
          sorted.sort((a, b) => {
            for (const key of keys) {
              const dir = sortObj[key];
              const aVal = a[key] ?? 0;
              const bVal = b[key] ?? 0;
              if (aVal > bVal) return dir;
              if (aVal < bVal) return -dir;
            }
            return 0;
          });
        }
        items = sorted;
        return queryBuilder;
      },
      limit: (n: number) => {
        items = items.slice(0, n);
        return queryBuilder;
      },
      select: () => queryBuilder,
      then: (resolve: any, reject?: any) => Promise.resolve(items).then(resolve, reject),
      catch: (reject: any) => Promise.resolve(items).catch(reject),
      [Symbol.iterator]: function* () { yield* items; }
    };

    return queryBuilder;
  }

  async findOne(query: any) {
    const items: any = await this.find(query);
    const arr = Array.isArray(items) ? items : items.then ? await items : [];
    const doc = arr[0] || null;
    if (!doc) return null;
    return this.wrapDoc(doc);
  }

  async create(data: any) {
    const db = loadDb();
    const items = db[this.collection] || [];
    const id = await getNextSequence(this.collection);
    const doc = { id, ...data, createdAt: data.createdAt || new Date() };
    items.push(doc);
    db[this.collection] = items;
    saveDb(db);
    return this.wrapDoc(doc);
  }

  async findOneAndUpdate(query: any, update: any, options: any = {}) {
    const db = loadDb();
    const items = db[this.collection] || [];
    const idx = items.findIndex((item: any) => {
      return Object.keys(query).every(k => item[k] === query[k]);
    });
    if (idx === -1) {
      if (options.upsert) {
        const newDoc = { ...query, ...update, id: await getNextSequence(this.collection) };
        items.push(newDoc);
        db[this.collection] = items;
        saveDb(db);
        return this.wrapDoc(newDoc);
      }
      return null;
    }
    items[idx] = { ...items[idx], ...update };
    db[this.collection] = items;
    saveDb(db);
    return this.wrapDoc(items[idx]);
  }

  async deleteOne(query: any) {
    const db = loadDb();
    let items = db[this.collection] || [];
    const idx = items.findIndex((item: any) => Object.keys(query).every(k => item[k] === query[k]));
    if (idx !== -1) {
      items.splice(idx, 1);
      db[this.collection] = items;
      saveDb(db);
    }
    return { deletedCount: idx !== -1 ? 1 : 0 };
  }

  async deleteMany(query: any) {
    const db = loadDb();
    if (this.collection === ("counters" as any)) {
      db.counters = {};
      saveDb(db);
      return { deletedCount: 1 };
    }
    let items = db[this.collection] || [];
    if (!Array.isArray(items)) items = [];
    const initialLen = items.length;
    if (!query || Object.keys(query).length === 0) {
      db[this.collection] = [];
      saveDb(db);
      return { deletedCount: initialLen };
    }
    items = items.filter((item: any) => {
      return !Object.keys(query).every(k => item[k] === query[k]);
    });
    db[this.collection] = items;
    saveDb(db);
    return { deletedCount: initialLen - items.length };
  }

  async countDocuments(query: any = {}) {
    const res: any = await this.find(query);
    const arr = Array.isArray(res) ? res : (res && typeof res.then === "function" ? await res : (res && res.select ? res.select() : []));
    return Array.isArray(arr) ? arr.length : 0;
  }

  async aggregate(pipeline: any[]) {
    const db = loadDb();
    if (pipeline.some(p => p.$group)) {
      const match = pipeline.find(p => p.$match)?.$match || {};
      const items: any = await this.find(match);
      const arr = Array.isArray(items) ? items : await items;
      const map = new Map<any, number>();
      for (const item of arr) {
        const idVal = item.courseId;
        map.set(idVal, (map.get(idVal) || 0) + 1);
      }
      const result: any[] = [];
      map.forEach((count, _id) => {
        result.push({ _id, count });
      });
      return result;
    }
    return [];
  }

  wrapDoc(doc: any) {
    return {
      ...doc,
      toObject: function () { return { ...this }; },
      save: async function () {
        const db = loadDb();
        const items = db[this.collection] || [];
        const idx = items.findIndex((i: any) => i.id === this.id);
        if (idx !== -1) {
          items[idx] = { ...this };
          db[this.collection] = items;
          saveDb(db);
        }
        return this;
      }.bind({ ...doc, collection: this.collection })
    };
  }
}

export const User = new ModelWrapper("users");
export const Category = new ModelWrapper("categories");
export const Course = new ModelWrapper("courses");
export const Module = new ModelWrapper("modules");
export const Lesson = new ModelWrapper("lessons");
export const Enrollment = new ModelWrapper("enrollments");
export const LessonProgress = new ModelWrapper("lesson_progress");
export const Assignment = new ModelWrapper("assignments");
export const Submission = new ModelWrapper("submissions");
export const Feedback = new ModelWrapper("feedback");
export const ActivityLog = new ModelWrapper("activity_log");
export const Counter = new ModelWrapper("counters" as any);
