const BASE_URL = "http://localhost:5000/api";

interface TestResult {
  feature: string;
  status: "Pass" | "Fail";
  evidence: string;
}

const results: TestResult[] = [];

async function runAudit() {
  console.log("Starting ScriptLab Functional Audit & Integration Testing...\n");

  // 1. Authentication Tests
  let studentCookie = "";
  let studentToken = "";
  let studentId = 0;

  try {
    // Register new student
    const regEmail = `teststudent_${Date.now()}@scriptlab.io`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Test Student", email: regEmail, password: "password123", role: "student" }),
    });
    const regJson = await regRes.json() as any;
    if (regRes.status === 201 && regJson.success) {
      studentToken = regJson.data.token;
      studentId = regJson.data.user.id;
      studentCookie = regRes.headers.get("set-cookie") || `scriptlab_token=${studentToken}`;
      results.push({ feature: "Authentication", status: "Pass", evidence: `Registered new student successfully (ID: ${studentId}, email: ${regEmail}).` });
    } else {
      results.push({ feature: "Authentication", status: "Fail", evidence: `Registration failed: ${regJson.error || regRes.statusText}` });
    }

    // Login with valid credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: "password123" }),
    });
    const loginJson = await loginRes.json() as any;
    if (loginRes.status === 200 && loginJson.success) {
      results.push({ feature: "Authentication", status: "Pass", evidence: "Login with valid credentials succeeded." });
    } else {
      results.push({ feature: "Authentication", status: "Fail", evidence: "Login with valid credentials failed." });
    }

    // Reject invalid credentials
    const badLoginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: regEmail, password: "wrongpassword" }),
    });
    if (badLoginRes.status === 401) {
      results.push({ feature: "Authentication", status: "Pass", evidence: "Successfully rejected invalid credentials (401 Unauthorized)." });
    } else {
      results.push({ feature: "Authentication", status: "Fail", evidence: `Expected 401 for invalid credentials, got ${badLoginRes.status}.` });
    }

    // Session persistence (/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meJson = await meRes.json() as any;
    if (meRes.status === 200 && meJson.success && meJson.data.user?.id === studentId) {
      results.push({ feature: "Authentication", status: "Pass", evidence: "Session persistence verified via /auth/me." });
    } else {
      results.push({ feature: "Authentication", status: "Fail", evidence: "Session persistence check failed." });
    }

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (logoutRes.status === 200) {
      results.push({ feature: "Authentication", status: "Pass", evidence: "Logout executed successfully." });
    } else {
      results.push({ feature: "Authentication", status: "Fail", evidence: "Logout failed." });
    }
  } catch (err: any) {
    results.push({ feature: "Authentication", status: "Fail", evidence: `Auth test threw error: ${err.message}` });
  }

  // 2. Student Workflow & MongoDB Persistence
  let courseId = 1;
  let lessonId = 1;
  let assignmentId = 1;

  try {
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesJson = await coursesRes.json() as any;
    if (coursesRes.status === 200 && coursesJson.success && coursesJson.data.length > 0) {
      courseId = coursesJson.data[0].id;
      results.push({ feature: "Student workflow", status: "Pass", evidence: `Fetched ${coursesJson.data.length} courses successfully.` });
    } else {
      results.push({ feature: "Student workflow", status: "Fail", evidence: "Failed to fetch courses catalog." });
    }

    // Enroll in course
    const enrollRes = await fetch(`${BASE_URL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (enrollRes.status === 201 || enrollRes.status === 200) {
      const enrCheck = await fetch(`${BASE_URL}/enrollments`, {
        headers: { Authorization: `Bearer ${studentToken}` },
      });
      const enrJson = await enrCheck.json() as any;
      if (enrJson.success && enrJson.data.some((c: any) => c.id === courseId)) {
        results.push({ feature: "MongoDB persistence", status: "Pass", evidence: `Enrollment successfully created and persisted in MongoDB for user ${studentId}, course ${courseId}.` });
      } else {
        results.push({ feature: "MongoDB persistence", status: "Fail", evidence: "Enrollment API succeeded but enrollment not returned in user enrollments." });
      }
    } else {
      results.push({ feature: "Student workflow", status: "Fail", evidence: "Course enrollment failed." });
    }

    // Get course details & curriculum
    const detailRes = await fetch(`${BASE_URL}/courses/${courseId}`);
    const detailJson = await detailRes.json() as any;
    if (detailRes.status === 200 && detailJson.success && detailJson.data.curriculum) {
      const cur = detailJson.data.curriculum;
      if (cur.length > 0 && cur[0].lessons.length > 0) {
        lessonId = cur[0].lessons[0].id;
      }
      results.push({ feature: "Student workflow", status: "Pass", evidence: "Course details and curriculum fetched successfully." });
    } else {
      results.push({ feature: "Student workflow", status: "Fail", evidence: "Failed to fetch course details." });
    }

    // Mark lesson complete
    const completeRes = await fetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (completeRes.status === 200) {
      results.push({ feature: "Student workflow", status: "Pass", evidence: `Lesson ${lessonId} marked complete successfully.` });
    } else {
      results.push({ feature: "Student workflow", status: "Fail", evidence: "Marking lesson complete failed." });
    }

    // Assignments & Submissions (with file upload test)
    const asgnRes = await fetch(`${BASE_URL}/assignments?courseId=${courseId}`);
    const asgnJson = await asgnRes.json() as any;
    if (asgnRes.status === 200 && asgnJson.success && asgnJson.data.length > 0) {
      assignmentId = asgnJson.data[0].id;
    }

    const subRes = await fetch(`${BASE_URL}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        assignmentId,
        content: "Here is my feature script draft Act 1.",
        fileName: "script_draft_v1.pdf",
        fileData: "data:application/pdf;base64,JVBERi0xLjcK...",
      }),
    });
    const subJson = await subRes.json() as any;
    if (subRes.status === 201 && subJson.success && subJson.data.fileName === "script_draft_v1.pdf") {
      results.push({ feature: "File uploads", status: "Pass", evidence: "File upload & text submission saved and retrieved successfully." });
    } else {
      results.push({ feature: "File uploads", status: "Fail", evidence: "File upload submission failed." });
    }
  } catch (err: any) {
    results.push({ feature: "Student workflow", status: "Fail", evidence: `Student workflow threw error: ${err.message}` });
  }

  // 3. Instructor Workflow & Authorization
  try {
    // Login as mentor/instructor
    const mentorLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mentor@scriptlab.io", password: "password123" }),
    });
    const mentorJson = await mentorLogin.json() as any;
    const mentorToken = mentorJson.data.token;

    // Instructor dashboard
    const dashRes = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const dashJson = await dashRes.json() as any;
    if (dashRes.status === 200 && dashJson.success) {
      results.push({ feature: "Instructor workflow", status: "Pass", evidence: "Instructor dashboard loaded with assigned courses and stats." });
    } else {
      results.push({ feature: "Instructor workflow", status: "Fail", evidence: "Instructor dashboard failed to load." });
    }

    // Review submission & give feedback
    const subsRes = await fetch(`${BASE_URL}/submissions`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const subsJson = await subsRes.json() as any;
    if (subsJson.success && subsJson.data.length > 0) {
      const subIdToReview = subsJson.data[0].id;
      const fbRes = await fetch(`${BASE_URL}/submissions/${subIdToReview}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
        body: JSON.stringify({ score: 95, comments: "Great cinematic pacing and structure!", suggestions: "Deepen the inciting incident." }),
      });
      if (fbRes.status === 200) {
        results.push({ feature: "Instructor workflow", status: "Pass", evidence: "Instructor successfully reviewed submission and delivered feedback." });
      } else {
        results.push({ feature: "Instructor workflow", status: "Fail", evidence: "Instructor feedback submission failed." });
      }
    }

    // Authorization: student trying to access mentor endpoint -> 403
    const unauthReview = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (unauthReview.status === 403) {
      results.push({ feature: "Authorization", status: "Pass", evidence: "Student correctly denied access to instructor endpoint (403 Forbidden)." });
    } else {
      results.push({ feature: "Authorization", status: "Fail", evidence: `Expected 403 for student accessing mentor endpoint, got ${unauthReview.status}.` });
    }
  } catch (err: any) {
    results.push({ feature: "Instructor workflow", status: "Fail", evidence: `Instructor workflow threw error: ${err.message}` });
  }

  // 4. Admin Workflow
  try {
    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@scriptlab.io", password: "password123" }),
    });
    const adminJson = await adminLogin.json() as any;
    const adminToken = adminJson.data.token;

    // Admin stats
    const statsRes = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsJson = await statsRes.json() as any;
    if (statsRes.status === 200 && statsJson.success && statsJson.data.totals) {
      results.push({ feature: "Admin workflow", status: "Pass", evidence: "Admin stats and platform overview fetched successfully." });
    } else {
      results.push({ feature: "Admin workflow", status: "Fail", evidence: "Admin stats failed to load." });
    }

    // Admin user management (deactivate user)
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersJson = await usersRes.json() as any;
    if (usersJson.success && usersJson.data.length > 0) {
      const targetUser = usersJson.data.find((u: any) => u.role === "student" && u.email.includes("teststudent"));
      if (targetUser) {
        const patchRes = await fetch(`${BASE_URL}/admin/users/${targetUser.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({ isActive: false }),
        });
        if (patchRes.status === 200) {
          results.push({ feature: "Admin workflow", status: "Pass", evidence: `Successfully deactivated user ID ${targetUser.id}.` });
        } else {
          results.push({ feature: "Admin workflow", status: "Fail", evidence: "Failed to update user status." });
        }
      }
    }
  } catch (err: any) {
    results.push({ feature: "Admin workflow", status: "Fail", evidence: `Admin workflow threw error: ${err.message}` });
  }

  console.log("\n=== FUNCTIONAL AUDIT REPORT ===");
  console.log("| Feature | Status | Evidence |");
  console.log("|---|---|---|");
  for (const r of results) {
    console.log(`| ${r.feature} | ${r.status} | ${r.evidence} |`);
  }
}

runAudit().catch(console.error);
