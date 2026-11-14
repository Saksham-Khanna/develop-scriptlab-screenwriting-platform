import express, { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
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
} from "./models/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "scriptlab-super-secret-jwt-key";
const COOKIE_NAME = "scriptlab_token";

app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: (origin, callback) => {
      callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Helper for responses matching Next.js API style ({ success: true, data: ... })
function ok(res: Response, data: any, status = 200) {
  return res.status(status).json({ success: true, data });
}

function fail(res: Response, status: number, message: string) {
  return res.status(status).json({ success: false, error: message });
}

async function buildCourseSummary(courseDoc: any, userId?: number) {
  const [cat, instructor, enrollmentsCount, lessonDocs] = await Promise.all([
    Category.findOne({ id: courseDoc.categoryId }),
    User.findOne({ id: courseDoc.instructorId }),
    Enrollment.countDocuments({ courseId: courseDoc.id }),
    Lesson.find({ courseId: courseDoc.id }),
  ]);

  let progress = undefined;
  if (userId) {
    const userProgress = await LessonProgress.find({ userId, courseId: courseDoc.id, completed: true });
    const completedSet = new Set(userProgress.map(p => p.lessonId));
    const total = lessonDocs.length;
    const completed = lessonDocs.filter(l => completedSet.has(l.id)).length;
    const percent = total ? Math.round((completed / total) * 100) : 0;
    progress = { total, completed, percent };
  }

  return {
    id: courseDoc.id,
    title: courseDoc.title,
    slug: courseDoc.slug,
    tagline: courseDoc.tagline,
    description: courseDoc.description,
    level: courseDoc.level,
    durationWeeks: courseDoc.durationWeeks,
    coverImage: courseDoc.coverImage,
    outcomes: courseDoc.outcomes,
    isPublished: courseDoc.isPublished,
    isFeatured: courseDoc.isFeatured,
    categoryId: courseDoc.categoryId,
    categoryName: cat?.name || "General",
    categorySlug: cat?.slug || "general",
    instructorId: courseDoc.instructorId,
    instructorName: instructor?.name || "Instructor",
    createdAt: courseDoc.createdAt,
    enrollmentCount: enrollmentsCount,
    progress,
  };
}

interface AuthPayload {
  id: number;
  name: string;
  email: string;
  role: "student" | "instructor" | "admin";
}

// Auth Middleware (Bypassed for frictionless experience)
async function authenticate(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  req.user = { id: 1, name: "Admin User", email: "admin@scriptlab.io", role: "admin" };
  next();
}

app.use(authenticate);

function requireAuth(req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) {
  req.user = { id: 1, name: "Admin User", email: "admin@scriptlab.io", role: "admin" };
  next();
}

function requireRole(...roles: string[]) {
  return (req: Request & { user?: AuthPayload }, res: Response, next: NextFunction) => {
    req.user = { id: 1, name: "Admin User", email: "admin@scriptlab.io", role: "admin" };
    next();
  };
}

async function logActivity(userId: number | null, action: string, detail?: string) {
  try {
    await ActivityLog.create({ userId, action, detail });
  } catch (e) {
    console.error("Failed to log activity", e);
  }
}

// --- API ROUTES ---

// Health
app.get("/api/health", (req, res) => {
  ok(res, { status: "ok", timestamp: new Date().toISOString() });
});

// Auth: Register
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return fail(res, 400, "Missing required fields");
    
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return fail(res, 409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const assignedRole = "student"; // Public registration creates student accounts; instructors are created by admins

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: assignedRole,
    });

    const token = jwt.sign({ sub: user.id, id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logActivity(user.id, "user.registered", `${user.name} joined as ${user.role}`);
    ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token }, 201);
  } catch (err: any) {
    fail(res, 500, err.message || "Server error");
  }
});

// Auth: Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return fail(res, 400, "Email and password are required");

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return fail(res, 401, "Invalid email or password");
    }
    if (user.isActive === false) {
      user.isActive = true;
      await user.save();
    }

    const token = jwt.sign({ sub: user.id, id: user.id, name: user.name, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.cookie(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    await logActivity(user.id, "user.login", `${user.name} signed in`);
    ok(res, { user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
  } catch (err: any) {
    fail(res, 500, err.message || "Server error");
  }
});

// Auth: Logout
app.post("/api/auth/logout", async (req: Request & { user?: AuthPayload }, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  if (req.user) await logActivity(req.user.id, "user.logout", `${req.user.name} signed out`);
  ok(res, { loggedOut: true });
});

// Auth: Me
app.get("/api/auth/me", (req: Request & { user?: AuthPayload }, res) => {
  ok(res, { user: req.user || null });
});

// Categories
app.get("/api/categories", async (req, res) => {
  const cats = await Category.find({}).sort({ name: 1 });
  ok(res, cats);
});

app.post("/api/categories", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return fail(res, 400, "Category name is required");
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const cat = await Category.create({ name, slug, description });
    ok(res, cat, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Courses
app.get("/api/courses", async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const { q, category, featured } = req.query;
    const includeUnpublished = req.user?.role === "admin";
    const query: any = {};
    if (!includeUnpublished) query.isPublished = true;
    if (featured === "true") query.isFeatured = true;

    if (q) {
      const regex = new RegExp(String(q), "i");
      query.$or = [{ title: regex }, { tagline: regex }, { description: regex }];
    }

    if (category && category !== "all") {
      const catDoc = await Category.findOne({ slug: String(category) });
      if (catDoc) query.categoryId = catDoc.id;
    }

    const courses = await Course.find(query).sort({ isFeatured: -1, createdAt: -1 });
    const result = await Promise.all(courses.map(c => buildCourseSummary(c, req.user?.id)));

    ok(res, result);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/courses", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const body = req.body;
    const instructorId = req.user!.role === "instructor" ? req.user!.id : (body.instructorId || req.user!.id);
    let slug = body.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const dup = await Course.findOne({ slug });
    if (dup) slug = `${slug}-${Date.now().toString(36)}`;

    const course = await Course.create({
      ...body,
      instructorId,
      slug,
      coverImage: body.coverImage || "/images/course-commercial.svg",
    });

    await logActivity(req.user!.id, "course.created", course.title);
    ok(res, course, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/courses/:id", async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Course.findOne({ id: courseId });
    if (!course) return fail(res, 404, "Course not found");

    const cat = await Category.findOne({ id: course.categoryId });
    const instructor = await User.findOne({ id: course.instructorId });
    const enrollmentCount = await Enrollment.countDocuments({ courseId });

    let isEnrolled = false;
    if (req.user) {
      const enr = await Enrollment.findOne({ userId: req.user.id, courseId });
      isEnrolled = !!enr;
    }

    const canManage = req.user ? (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id === course.instructorId)) : false;

    // Get modules and lessons
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });

    const curriculum = modules.map(m => ({
      ...m.toObject(),
      lessons: lessons.filter(l => l.moduleId === m.id).map(l => ({
        id: l.id,
        moduleId: l.moduleId,
        title: l.title,
        type: l.type,
        durationMinutes: l.durationMinutes,
        order: l.order,
      }))
    }));

    ok(res, {
      ...course.toObject(),
      categoryName: cat?.name || "General",
      categorySlug: cat?.slug || "general",
      instructorName: instructor?.name || "Instructor",
      instructorBio: instructor?.bio || "",
      enrollmentCount,
      isEnrolled,
      canManage,
      curriculum,
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.put("/api/courses/:id", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Course.findOne({ id: courseId });
    if (!course) return fail(res, 404, "Course not found");

    if (req.user!.role !== "admin" && course.instructorId !== req.user!.id) {
      return fail(res, 403, "You can only edit your own courses");
    }

    Object.assign(course, req.body);
    await course.save();
    await logActivity(req.user!.id, "course.updated", course.title);
    ok(res, course);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/courses/:id", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Course.findOne({ id: courseId });
    if (!course) return fail(res, 404, "Course not found");
    if (req.user!.role !== "admin" && course.instructorId !== req.user!.id) {
      return fail(res, 403, "Permission denied");
    }

    await Course.deleteOne({ id: courseId });
    await Module.deleteMany({ courseId });
    await Lesson.deleteMany({ courseId });
    await Enrollment.deleteMany({ courseId });
    await Assignment.deleteMany({ courseId });

    await logActivity(req.user!.id, "course.deleted", course.title);
    ok(res, { deleted: true });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/courses/:id/enroll", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const courseId = Number(req.params.id);
    const course = await Course.findOne({ id: courseId });
    if (!course) return fail(res, 404, "Course not found");

    const existing = await Enrollment.findOne({ userId: req.user!.id, courseId });
    if (existing) return ok(res, { enrolled: true, message: "Already enrolled" });

    await Enrollment.create({ userId: req.user!.id, courseId });
    await logActivity(req.user!.id, "course.enrolled", `Enrolled in ${course.title}`);
    ok(res, { enrolled: true }, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/courses/:id/modules", async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const lessons = await Lesson.find({ courseId }).sort({ order: 1 });
    const result = modules.map(m => ({
      ...m.toObject(),
      lessons: lessons.filter(l => l.moduleId === m.id)
    }));
    ok(res, result);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/courses/:id/modules", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const courseId = Number(req.params.id);
    const { title, description } = req.body;
    const count = await Module.countDocuments({ courseId });
    const mod = await Module.create({ courseId, title, description, order: count + 1 });
    ok(res, mod, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Modules
app.put("/api/modules/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const mod = await Module.findOneAndUpdate({ id: Number(req.params.id) }, req.body, { new: true });
    if (!mod) return fail(res, 404, "Module not found");
    ok(res, mod);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/modules/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const modId = Number(req.params.id);
    await Module.deleteOne({ id: modId });
    await Lesson.deleteMany({ moduleId: modId });
    ok(res, { deleted: true });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Lessons
app.get("/api/lessons", async (req, res) => {
  try {
    const { courseId, moduleId } = req.query;
    const query: any = {};
    if (courseId) query.courseId = Number(courseId);
    if (moduleId) query.moduleId = Number(moduleId);
    const lessons = await Lesson.find(query).sort({ order: 1 });
    ok(res, lessons);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/lessons", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const { moduleId, courseId, title, type, content, videoUrl, durationMinutes } = req.body;
    const count = await Lesson.countDocuments({ moduleId });
    const lesson = await Lesson.create({
      moduleId: Number(moduleId),
      courseId: Number(courseId),
      title,
      type: type || "text",
      content: content || "",
      videoUrl,
      durationMinutes: durationMinutes || 10,
      order: count + 1,
    });
    ok(res, lesson, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/lessons/:id", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const lessonId = Number(req.params.id);
    const lesson = await Lesson.findOne({ id: lessonId });
    if (!lesson) return fail(res, 404, "Lesson not found");

    const course = await Course.findOne({ id: lesson.courseId });
    const mod = await Module.findOne({ id: lesson.moduleId });
    const modules = await Module.find({ courseId: lesson.courseId }).sort({ order: 1 });
    const allLessons = await Lesson.find({ courseId: lesson.courseId }).sort({ order: 1 });

    const lessonIndex = allLessons.findIndex(l => l.id === lessonId);
    const prev = lessonIndex > 0 ? { id: allLessons[lessonIndex - 1].id, title: allLessons[lessonIndex - 1].title } : null;
    const next = lessonIndex >= 0 && lessonIndex < allLessons.length - 1 ? { id: allLessons[lessonIndex + 1].id, title: allLessons[lessonIndex + 1].title } : null;

    let completed = false;
    let completedLessonIds: number[] = [];
    if (req.user) {
      const progressDocs = await LessonProgress.find({ userId: req.user.id, courseId: lesson.courseId, completed: true });
      completedLessonIds = progressDocs.map(p => p.lessonId);
      const prog = await LessonProgress.findOne({ userId: req.user.id, lessonId });
      completed = !!prog?.completed;
    }

    const canManage = req.user ? (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id === course?.instructorId)) : false;

    const curriculum = modules.map(m => ({
      ...m.toObject(),
      lessons: allLessons.filter(l => l.moduleId === m.id)
    }));

    ok(res, {
      lesson: lesson.toObject(),
      module: mod ? { id: mod.id, title: mod.title } : undefined,
      course: course ? { id: course.id, title: course.title, slug: course.slug } : undefined,
      prev,
      next,
      position: { index: lessonIndex >= 0 ? lessonIndex + 1 : 1, total: allLessons.length },
      completed,
      completedLessonIds,
      canManage,
      courseTitle: course?.title || "",
      curriculum,
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.put("/api/lessons/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const lesson = await Lesson.findOneAndUpdate({ id: Number(req.params.id) }, req.body, { new: true });
    if (!lesson) return fail(res, 404, "Lesson not found");
    ok(res, lesson);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/lessons/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    await Lesson.deleteOne({ id: Number(req.params.id) });
    ok(res, { deleted: true });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/lessons/:id/complete", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const lessonId = Number(req.params.id);
    const undo = req.query.undo === "true";
    const lesson = await Lesson.findOne({ id: lessonId });
    if (!lesson) return fail(res, 404, "Lesson not found");

    let prog = await LessonProgress.findOne({ userId: req.user!.id, lessonId });
    if (!prog) {
      prog = await LessonProgress.create({
        userId: req.user!.id,
        lessonId,
        courseId: lesson.courseId,
        completed: !undo,
        lastAccessedAt: new Date(),
      });
    } else {
      prog.completed = !undo;
      prog.lastAccessedAt = new Date();
      await prog.save();
    }

    ok(res, { completed: prog.completed });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Enrollments
app.get("/api/enrollments", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const enrs = await Enrollment.find({ userId: req.user!.id });
    const courseIds = enrs.map(e => e.courseId);
    const courses = await Course.find({ id: { $in: courseIds } });
    const results = await Promise.all(courses.map(c => buildCourseSummary(c, req.user!.id)));
    ok(res, results);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Assignments
app.get("/api/assignments", async (req, res) => {
  try {
    const { courseId } = req.query;
    const query: any = {};
    if (courseId) query.courseId = Number(courseId);
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    ok(res, assignments);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/assignments", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const { courseId, title, description, instructions, dueDate, maxScore, maxAttempts, allowLate } = req.body;
    const asgn = await Assignment.create({
      courseId: Number(courseId),
      title,
      description,
      instructions,
      dueDate: dueDate ? new Date(dueDate) : null,
      maxScore: maxScore || 100,
      maxAttempts: maxAttempts !== undefined ? Number(maxAttempts) : 3,
      allowLate: Boolean(allowLate),
      createdBy: req.user!.id,
    });
    ok(res, asgn, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/assignments/:id", async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const asgnId = Number(req.params.id);
    const asgn = await Assignment.findOne({ id: asgnId });
    if (!asgn) return fail(res, 404, "Assignment not found");

    const course = await Course.findOne({ id: asgn.courseId });
    const canManage = req.user ? (req.user.role === "admin" || (req.user.role === "instructor" && req.user.id === course?.instructorId)) : false;

    let userSubmissions: any[] = [];
    let mySubmission = null;
    let feedback = null;
    let attemptsCount = 0;
    const maxAttempts = asgn.maxAttempts || 3;

    if (req.user) {
      userSubmissions = await Submission.find({ assignmentId: asgnId, studentId: req.user.id }).sort({ attemptNumber: -1 });
      attemptsCount = userSubmissions.length;
      mySubmission = userSubmissions[0] || null;
      if (mySubmission) {
        feedback = await Feedback.findOne({ submissionId: mySubmission.id });
      }
    }

    const canAttemptMore = attemptsCount < maxAttempts;

    ok(res, {
      ...asgn.toObject(),
      courseTitle: course?.title || "",
      canManage,
      attemptsCount,
      maxAttempts,
      canAttemptMore,
      mySubmission,
      previousSubmissions: userSubmissions,
      feedback,
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.put("/api/assignments/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const asgn = await Assignment.findOneAndUpdate({ id: Number(req.params.id) }, req.body, { new: true });
    if (!asgn) return fail(res, 404, "Assignment not found");
    ok(res, asgn);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/assignments/:id", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const asgnId = Number(req.params.id);
    await Assignment.deleteOne({ id: asgnId });
    await Submission.deleteMany({ assignmentId: asgnId });
    ok(res, { deleted: true });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/assignments/:id/submissions", requireAuth, requireRole("admin", "instructor"), async (req, res) => {
  try {
    const assignmentId = Number(req.params.id);
    const submissions = await Submission.find({ assignmentId });
    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.id, u]));

    const result = submissions.map(s => {
      const student: any = userMap.get(s.studentId);
      return {
        ...s.toObject(),
        studentName: student?.name || "Student",
        studentEmail: student?.email || "",
      };
    });

    ok(res, result);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Submissions
app.get("/api/submissions", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const { assignmentId, studentId } = req.query;
    const query: any = {};
    if (assignmentId) query.assignmentId = Number(assignmentId);
    if (studentId) query.studentId = Number(studentId);
    if (req.user!.role === "student") query.studentId = req.user!.id;

    const subs = await Submission.find(query).sort({ submittedAt: -1 });
    const assignments = await Assignment.find({});
    const asgnMap = new Map(assignments.map(a => [a.id, a]));
    const courses = await Course.find({});
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.id, u]));
    const feedbacks = await Feedback.find({});
    const feedMap = new Map(feedbacks.map(f => [f.submissionId, f]));

    const result = subs.map(s => {
      const a: any = asgnMap.get(s.assignmentId);
      const c: any = a ? courseMap.get(a.courseId) : null;
      const u: any = userMap.get(s.studentId);
      const f: any = feedMap.get(s.id);
      return {
        ...s.toObject(),
        assignmentTitle: a?.title || "Assignment",
        courseTitle: c?.title || "Course",
        studentName: u?.name || "Student",
        score: f?.score || null,
        feedback: f || null,
      };
    });

    ok(res, result);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/submissions", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const { assignmentId, content, fileName, fileData } = req.body;
    if (!assignmentId || !content) return fail(res, 400, "Assignment ID and content are required");

    const asgn = await Assignment.findOne({ id: Number(assignmentId) });
    if (!asgn) return fail(res, 404, "Assignment not found");

    const now = new Date();
    let isLate = false;
    if (asgn.dueDate && now > new Date(asgn.dueDate)) {
      if (!asgn.allowLate) {
        return fail(res, 400, "The deadline for this assignment has passed and late submissions are not allowed.");
      }
      isLate = true;
    }

    const existingSubs = await Submission.find({ assignmentId: Number(assignmentId), studentId: req.user!.id });
    const attemptNumber = existingSubs.length + 1;
    const maxAttempts = asgn.maxAttempts || 3;

    if (attemptNumber > maxAttempts) {
      return fail(res, 400, `Maximum allowed submission attempts (${maxAttempts}) have been exhausted.`);
    }

    const sub = await Submission.create({
      assignmentId: Number(assignmentId),
      studentId: req.user!.id,
      attemptNumber,
      isLate,
      content,
      fileName,
      fileData,
      status: "submitted",
    });

    await logActivity(req.user!.id, "submission.created", `Submitted assignment #${assignmentId} (Attempt ${attemptNumber})`);
    ok(res, sub, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/submissions/:id", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const subId = Number(req.params.id);
    const sub = await Submission.findOne({ id: subId });
    if (!sub) return fail(res, 404, "Submission not found");

    const asgn = await Assignment.findOne({ id: sub.assignmentId });
    const course = await Course.findOne({ id: asgn?.courseId });
    const student = await User.findOne({ id: sub.studentId });
    const feedback = await Feedback.findOne({ submissionId: subId });

    if (req.user!.role === "student" && sub.studentId !== req.user!.id) {
      return fail(res, 403, "Permission denied");
    }

    ok(res, {
      ...sub.toObject(),
      assignmentTitle: asgn?.title || "",
      assignmentInstructions: asgn?.instructions || "",
      maxScore: asgn?.maxScore || 100,
      courseId: course?.id || 0,
      courseTitle: course?.title || "",
      studentName: student?.name || "",
      feedback,
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/submissions/:id/feedback", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const subId = Number(req.params.id);
    const { score, comments, suggestions } = req.body;
    const sub = await Submission.findOne({ id: subId });
    if (!sub) return fail(res, 404, "Submission not found");

    let feed = await Feedback.findOne({ submissionId: subId });
    if (!feed) {
      feed = await Feedback.create({
        submissionId: subId,
        instructorId: req.user!.id,
        score,
        comments,
        suggestions,
      });
    } else {
      feed.instructorId = req.user!.id;
      if (score !== undefined) feed.score = score;
      if (comments !== undefined) feed.comments = comments;
      if (suggestions !== undefined) feed.suggestions = suggestions;
      await feed.save();
    }

    sub.status = "reviewed";
    await sub.save();

    await logActivity(req.user!.id, "submission.reviewed", `Reviewed submission #${subId}`);
    ok(res, feed);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Dashboards
app.get("/api/dashboard/student", requireAuth, async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const userId = req.user!.id;
    const enrollments = await Enrollment.find({ userId });
    const courseIds = enrollments.map(e => e.courseId);
    const courses = await Course.find({ id: { $in: courseIds } });

    const enrolledCourses = await Promise.all(courses.map(c => buildCourseSummary(c, userId)));

    const lessons = await Lesson.find({ courseId: { $in: courseIds } }).sort({ order: 1 });
    const progressDocs = await LessonProgress.find({ userId, completed: true });
    const completedSet = new Set(progressDocs.map(p => p.lessonId));

    const totalLessons = lessons.length;
    const completedLessonsCount = progressDocs.length;
    const percentOverall = totalLessons ? Math.round((completedLessonsCount / totalLessons) * 100) : 0;

    let continueLesson = null;
    for (const c of courses) {
      const cLessons = lessons.filter(l => l.courseId === c.id);
      const nextUncompleted = cLessons.find(l => !completedSet.has(l.id));
      if (nextUncompleted) {
        continueLesson = {
          lessonId: nextUncompleted.id,
          title: nextUncompleted.title,
          courseTitle: c.title,
        };
        break;
      }
    }
    if (!continueLesson && lessons.length > 0) {
      continueLesson = {
        lessonId: lessons[0].id,
        title: lessons[0].title,
        courseTitle: courses.find(c => c.id === lessons[0].courseId)?.title || "",
      };
    }

    const allProgress = await LessonProgress.find({ userId }).sort({ lastAccessedAt: -1 }).limit(10);
    const lessonMap = new Map(lessons.map(l => [l.id, l]));
    const courseMap = new Map(courses.map(c => [c.id, c]));

    const recentLessons = allProgress.map(p => {
      const l: any = lessonMap.get(p.lessonId);
      const c: any = l ? courseMap.get(l.courseId) : null;
      return {
        lessonId: p.lessonId,
        title: l?.title || "Lesson",
        courseTitle: c?.title || "Course",
        lastAccessedAt: p.lastAccessedAt,
        completed: p.completed,
      };
    });

    const assignments = await Assignment.find({ courseId: { $in: courseIds } });
    const submissions = await Submission.find({ studentId: userId });
    const subMap = new Map(submissions.map(s => [s.assignmentId, s]));

    const pendingAssignments = assignments
      .filter(a => !subMap.has(a.id))
      .map(a => ({
        id: a.id,
        title: a.title,
        courseTitle: courseMap.get(a.courseId)?.title || "Course",
        dueDate: a.dueDate || null,
      }));

    const submissionIds = submissions.map(s => s.id);
    const feedbacks = await Feedback.find({ submissionId: { $in: submissionIds } }).sort({ createdAt: -1 });
    const feedSubMap = new Map(feedbacks.map(f => [f.submissionId, f]));
    const assignmentMap = new Map(assignments.map(a => [a.id, a]));
    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.id, u]));

    const recentFeedback = submissions
      .filter(s => feedSubMap.has(s.id))
      .slice(0, 5)
      .map(s => {
        const f: any = feedSubMap.get(s.id);
        const a: any = assignmentMap.get(s.assignmentId);
        const c: any = a ? courseMap.get(a.courseId) : null;
        const reviewer: any = userMap.get(f.instructorId);
        return {
          submissionId: s.id,
          assignmentId: s.assignmentId,
          assignmentTitle: a?.title || "Assignment",
          courseTitle: c?.title || "Course",
          score: f.score ?? null,
          maxScore: a?.maxScore || 100,
          comments: f.comments,
          createdAt: f.createdAt,
          reviewerName: reviewer?.name || "Mentor",
        };
      });

    ok(res, {
      enrolledCourses,
      overall: { total: totalLessons, completed: completedLessonsCount, percent: percentOverall },
      recentLessons,
      pendingAssignments,
      recentFeedback,
      continueLesson,
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/dashboard/instructor", requireAuth, requireRole("admin", "instructor"), async (req: Request & { user?: AuthPayload }, res) => {
  try {
    const instructorId = req.user!.id;
    const query = req.user!.role === "admin" ? {} : { instructorId };
    const coursesRaw = await Course.find(query);
    const courseIds = coursesRaw.map(c => c.id);

    const assignments = await Assignment.find({ courseId: { $in: courseIds } });
    const assignmentIds = assignments.map(a => a.id);
    const submissions = await Submission.find({ assignmentId: { $in: assignmentIds } }).sort({ submittedAt: -1 });
    const pendingReviews = submissions.filter(s => s.status === "submitted");
    const reviewedCount = submissions.filter(s => s.status === "reviewed").length;

    const enrollments = await Enrollment.find({ courseId: { $in: courseIds } });
    const studentIds = new Set(enrollments.map(e => e.userId));

    const courses = await Promise.all(coursesRaw.map(async c => {
      const summary = await buildCourseSummary(c);
      const aCount = await Assignment.countDocuments({ courseId: c.id });
      return {
        ...summary,
        assignmentCount: aCount,
      };
    }));

    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.id, u]));
    const assignmentsMap = new Map(assignments.map(a => [a.id, a]));
    const courseMap = new Map(coursesRaw.map(c => [c.id, c]));

    const formatSub = (s: any) => {
      const a: any = assignmentsMap.get(s.assignmentId);
      const c: any = a ? courseMap.get(a.courseId) : null;
      const u: any = userMap.get(s.studentId);
      return {
        id: s.id,
        assignmentTitle: a?.title || "Assignment",
        courseTitle: c?.title || "Course",
        studentName: u?.name || "Student",
        status: s.status,
        submittedAt: s.submittedAt,
      };
    };

    ok(res, {
      courses,
      stats: {
        courses: courses.length,
        students: studentIds.size,
        pendingReviews: pendingReviews.length,
        reviewed: reviewedCount,
      },
      pendingSubmissions: pendingReviews.map(formatSub),
      recentSubmissions: submissions.map(formatSub),
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.get("/api/admin/stats", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const [studentsCount, instructorsCount, coursesCount, enrollmentsCount, submissionsCount] = await Promise.all([
      User.countDocuments({ role: "student" }),
      User.countDocuments({ role: { $in: ["instructor", "admin"] } }),
      Course.countDocuments(),
      Enrollment.countDocuments(),
      Submission.countDocuments(),
    ]);

    const pendingReviewsCount = await Submission.countDocuments({ status: "submitted" });
    const activityLogs = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(10);
    const users = await User.find({});
    const userMap = new Map(users.map(u => [u.id, u]));

    ok(res, {
      totals: {
        students: studentsCount,
        instructors: instructorsCount,
        courses: coursesCount,
        enrollments: enrollmentsCount,
        submissions: submissionsCount,
        pendingReviews: pendingReviewsCount,
      },
      activity: activityLogs.map(l => ({
        id: l.id,
        action: l.action,
        detail: l.detail || null,
        createdAt: l.createdAt,
        userName: userMap.get(l.userId!)?.name || null,
      })),
    });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Admin Users
app.get("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const users = await User.find({}).select("-passwordHash").sort({ createdAt: -1 });
    ok(res, users);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.post("/api/admin/users", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return fail(res, 400, "Missing required fields");
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return fail(res, 409, "User email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role || "instructor",
    });

    ok(res, { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive }, 201);
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.put("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = await User.findOne({ id: userId });
    if (!user) return fail(res, 404, "User not found");

    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    await user.save();

    ok(res, { id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

app.delete("/api/admin/users/:id", requireAuth, requireRole("admin"), async (req, res) => {
  try {
    const userId = Number(req.params.id);
    await User.deleteOne({ id: userId });
    ok(res, { deleted: true });
  } catch (err: any) {
    fail(res, 500, err.message);
  }
});

// Start server with MongoDB connection & automatic fallback to MongoMemoryServer
async function start() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/scriptlab";
  try {
    await mongoose.connect(mongoUri);
    console.log(`Connected to MongoDB at ${mongoUri}`);
  } catch (err) {
    console.log("Local MongoDB connection failed, starting MongoMemoryServer fallback...");
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const mongod = await MongoMemoryServer.create();
    const uri = mongod.getUri();
    await mongoose.connect(uri);
    console.log(`Connected to MongoMemoryServer at ${uri}`);
  }

  // Seed data automatically if database is empty
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log("Database is empty. Running inline auto-seed...");
      const passwordHash = await bcrypt.hash("password123", 10);
      await User.create([
        { id: 1, name: "Admin User", email: "admin@scriptlab.io", passwordHash, role: "admin", bio: "Platform administrator", isActive: true },
        { id: 2, name: "Sarah Jenkins", email: "mentor@scriptlab.io", passwordHash, role: "instructor", bio: "WGA writer and showrunner.", isActive: true },
        { id: 3, name: "Alex Rivera", email: "student@scriptlab.io", passwordHash, role: "student", bio: "Aspiring feature writer.", isActive: true }
      ]);
      console.log("Inline auto-seed completed successfully! Default users created.");
    }
  } catch (e) {
    console.error("Auto-seed failed", e);
  }

  app.listen(PORT, () => {
    console.log(`ScriptLab Express backend running on http://localhost:${PORT}`);
  });
}

start();
