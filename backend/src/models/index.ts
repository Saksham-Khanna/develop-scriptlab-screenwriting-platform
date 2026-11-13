import mongoose, { Schema, Document, Model } from "mongoose";

const counterSchema = new Schema({
  name: { type: String, required: true, unique: true },
  seq: { type: Number, default: 0 },
});
export const Counter = mongoose.models.Counter || mongoose.model("Counter", counterSchema);

export async function getNextSequence(name: string): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

// User
export interface IUser extends Document {
  id: number;
  name: string;
  email: string;
  passwordHash: string;
  role: "student" | "instructor" | "admin";
  bio?: string;
  isActive: boolean;
  createdAt: Date;
}
const userSchema = new Schema<IUser>({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["student", "instructor", "admin"], default: "student" },
  bio: { type: String },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});
userSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("users");
  }
  next();
});
export const User = mongoose.models.User || mongoose.model<IUser>("User", userSchema);

// Category
export interface ICategory extends Document {
  id: number;
  name: string;
  slug: string;
  description?: string;
}
const categorySchema = new Schema<ICategory>({
  id: { type: Number, unique: true, index: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
});
categorySchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("categories");
  }
  next();
});
export const Category = mongoose.models.Category || mongoose.model<ICategory>("Category", categorySchema);

// Course
export interface ICourse extends Document {
  id: number;
  title: string;
  slug: string;
  tagline: string;
  description: string;
  categoryId: number;
  instructorId: number;
  level: "beginner" | "intermediate" | "advanced";
  durationWeeks: number;
  coverImage?: string;
  outcomes: string[];
  isPublished: boolean;
  isFeatured: boolean;
  createdAt: Date;
}
const courseSchema = new Schema<ICourse>({
  id: { type: Number, unique: true, index: true },
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  tagline: { type: String, required: true },
  description: { type: String, required: true },
  categoryId: { type: Number, required: true },
  instructorId: { type: Number, required: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "beginner" },
  durationWeeks: { type: Number, default: 4 },
  coverImage: { type: String },
  outcomes: { type: [String], default: [] },
  isPublished: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
courseSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("courses");
  }
  next();
});
export const Course = mongoose.models.Course || mongoose.model<ICourse>("Course", courseSchema);

// Module
export interface IModule extends Document {
  id: number;
  courseId: number;
  title: string;
  description?: string;
  order: number;
}
const moduleSchema = new Schema<IModule>({
  id: { type: Number, unique: true, index: true },
  courseId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  order: { type: Number, default: 0 },
});
moduleSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("modules");
  }
  next();
});
export const Module = mongoose.models.Module || mongoose.model<IModule>("Module", moduleSchema);

// Lesson
export interface ILesson extends Document {
  id: number;
  moduleId: number;
  courseId: number;
  title: string;
  type: "text" | "video";
  content: string;
  videoUrl?: string;
  durationMinutes: number;
  order: number;
}
const lessonSchema = new Schema<ILesson>({
  id: { type: Number, unique: true, index: true },
  moduleId: { type: Number, required: true },
  courseId: { type: Number, required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["text", "video"], default: "text" },
  content: { type: String, default: "" },
  videoUrl: { type: String },
  durationMinutes: { type: Number, default: 10 },
  order: { type: Number, default: 0 },
});
lessonSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("lessons");
  }
  next();
});
export const Lesson = mongoose.models.Lesson || mongoose.model<ILesson>("Lesson", lessonSchema);

// Enrollment
export interface IEnrollment extends Document {
  id: number;
  userId: number;
  courseId: number;
  enrolledAt: Date;
}
const enrollmentSchema = new Schema<IEnrollment>({
  id: { type: Number, unique: true, index: true },
  userId: { type: Number, required: true },
  courseId: { type: Number, required: true },
  enrolledAt: { type: Date, default: Date.now },
});
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });
enrollmentSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("enrollments");
  }
  next();
});
export const Enrollment = mongoose.models.Enrollment || mongoose.model<IEnrollment>("Enrollment", enrollmentSchema);

// LessonProgress
export interface ILessonProgress extends Document {
  id: number;
  userId: number;
  lessonId: number;
  courseId: number;
  completed: boolean;
  lastAccessedAt: Date;
}
const lessonProgressSchema = new Schema<ILessonProgress>({
  id: { type: Number, unique: true, index: true },
  userId: { type: Number, required: true },
  lessonId: { type: Number, required: true },
  courseId: { type: Number, required: true },
  completed: { type: Boolean, default: false },
  lastAccessedAt: { type: Date, default: Date.now },
});
lessonProgressSchema.index({ userId: 1, lessonId: 1 }, { unique: true });
lessonProgressSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("lesson_progress");
  }
  next();
});
export const LessonProgress = mongoose.models.LessonProgress || mongoose.model<ILessonProgress>("LessonProgress", lessonProgressSchema);

// Assignment
export interface IAssignment extends Document {
  id: number;
  courseId: number;
  title: string;
  description: string;
  instructions: string;
  dueDate?: Date;
  maxScore: number;
  maxAttempts: number;
  allowLate: boolean;
  createdBy: number;
  createdAt: Date;
}
const assignmentSchema = new Schema<IAssignment>({
  id: { type: Number, unique: true, index: true },
  courseId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String, required: true },
  dueDate: { type: Date },
  maxScore: { type: Number, default: 100 },
  maxAttempts: { type: Number, default: 3 },
  allowLate: { type: Boolean, default: false },
  createdBy: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});
assignmentSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("assignments");
  }
  next();
});
export const Assignment = mongoose.models.Assignment || mongoose.model<IAssignment>("Assignment", assignmentSchema);

// Submission
export interface ISubmission extends Document {
  id: number;
  assignmentId: number;
  studentId: number;
  attemptNumber: number;
  isLate: boolean;
  content: string;
  fileName?: string;
  fileData?: string;
  status: "submitted" | "reviewed";
  submittedAt: Date;
}
const submissionSchema = new Schema<ISubmission>({
  id: { type: Number, unique: true, index: true },
  assignmentId: { type: Number, required: true },
  studentId: { type: Number, required: true },
  attemptNumber: { type: Number, default: 1 },
  isLate: { type: Boolean, default: false },
  content: { type: String, required: true },
  fileName: { type: String },
  fileData: { type: String },
  status: { type: String, enum: ["submitted", "reviewed"], default: "submitted" },
  submittedAt: { type: Date, default: Date.now },
});
submissionSchema.index({ assignmentId: 1, studentId: 1, attemptNumber: 1 }, { unique: true });
submissionSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("submissions");
  }
  next();
});
export const Submission = mongoose.models.Submission || mongoose.model<ISubmission>("Submission", submissionSchema);

// Feedback
export interface IFeedback extends Document {
  id: number;
  submissionId: number;
  instructorId: number;
  score?: number;
  comments: string;
  suggestions?: string;
  createdAt: Date;
}
const feedbackSchema = new Schema<IFeedback>({
  id: { type: Number, unique: true, index: true },
  submissionId: { type: Number, required: true, unique: true },
  instructorId: { type: Number, required: true },
  score: { type: Number },
  comments: { type: String, required: true },
  suggestions: { type: String },
  createdAt: { type: Date, default: Date.now },
});
feedbackSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("feedback");
  }
  next();
});
export const Feedback = mongoose.models.Feedback || mongoose.model<IFeedback>("Feedback", feedbackSchema);

// ActivityLog
export interface IActivityLog extends Document {
  id: number;
  userId?: number;
  action: string;
  detail?: string;
  createdAt: Date;
}
const activityLogSchema = new Schema<IActivityLog>({
  id: { type: Number, unique: true, index: true },
  userId: { type: Number },
  action: { type: String, required: true },
  detail: { type: String },
  createdAt: { type: Date, default: Date.now },
});
activityLogSchema.pre("save", async function (next) {
  if (this.isNew && !this.id) {
    this.id = await getNextSequence("activity_log");
  }
  next();
});
export const ActivityLog = mongoose.models.ActivityLog || mongoose.model<IActivityLog>("ActivityLog", activityLogSchema);
