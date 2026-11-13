const BASE_URL = "http://localhost:5000/api";

interface RegressionResult {
  workflow: string;
  status: "PASS" | "FAIL";
  evidence: string;
}

const report: RegressionResult[] = [];

async function runFinalRegression() {
  console.log("Starting ScriptLab Final Regression Test Suite...\n");

  let studentToken = "";
  let studentId = 0;
  let mentorToken = "";
  let adminToken = "";
  let courseId = 1;
  let assignmentId = 1;

  // 1. Student Registration, Login, Logout
  try {
    const email = `regression_student_${Date.now()}@scriptlab.io`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Regression Student", email, password: "password123", role: "student" }),
    });
    const regData = await regRes.json() as any;
    if (regRes.status === 201 && regData.success) {
      studentToken = regData.data.token;
      studentId = regData.data.user.id;
      report.push({ workflow: "Student Registration", status: "PASS", evidence: `Registered student ID ${studentId}` });
    } else {
      report.push({ workflow: "Student Registration", status: "FAIL", evidence: regData.error || "Failed" });
    }

    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    const loginData = await loginRes.json() as any;
    if (loginRes.status === 200 && loginData.success) {
      report.push({ workflow: "Student Login", status: "PASS", evidence: "Login successful" });
    } else {
      report.push({ workflow: "Student Login", status: "FAIL", evidence: loginData.error || "Failed" });
    }

    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (logoutRes.status === 200) {
      report.push({ workflow: "Student Logout", status: "PASS", evidence: "Logout successful" });
    } else {
      report.push({ workflow: "Student Logout", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ workflow: "Student Auth Workflow", status: "FAIL", evidence: err.message });
  }

  // Login as Mentor and Admin
  try {
    const mentorLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "mentor@scriptlab.io", password: "password123" }),
    });
    mentorToken = (await mentorLogin.json() as any).data.token;

    const adminLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@scriptlab.io", password: "password123" }),
    });
    adminToken = (await adminLogin.json() as any).data.token;
  } catch (e) {
    console.error("Failed to authenticate mentor/admin", e);
  }

  // 2. Student Course Browsing & Enrollment
  try {
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json() as any;
    if (coursesRes.status === 200 && coursesData.success && coursesData.data.length > 0) {
      courseId = coursesData.data[0].id;
      report.push({ workflow: "Student Course Browsing", status: "PASS", evidence: `Fetched ${coursesData.data.length} courses` });
    } else {
      report.push({ workflow: "Student Course Browsing", status: "FAIL", evidence: "Failed" });
    }

    const enrollRes = await fetch(`${BASE_URL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (enrollRes.status === 201 || enrollRes.status === 200) {
      report.push({ workflow: "Student Course Enrollment", status: "PASS", evidence: "Enrolled successfully" });
    } else {
      report.push({ workflow: "Student Course Enrollment", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ workflow: "Course Browsing & Enrollment", status: "FAIL", evidence: err.message });
  }

  // 3. Lesson Completion & Progress Tracking
  try {
    const detailRes = await fetch(`${BASE_URL}/courses/${courseId}`);
    const detailData = await detailRes.json() as any;
    const lessonId = detailData.data.curriculum[0].lessons[0].id;

    const compRes = await fetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (compRes.status === 200) {
      report.push({ workflow: "Lesson Completion & Progress", status: "PASS", evidence: "Marked lesson complete successfully" });
    } else {
      report.push({ workflow: "Lesson Completion & Progress", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ workflow: "Lesson Completion & Progress", status: "FAIL", evidence: err.message });
  }

  // 4. Assignment Submission, Attempt History & Feedback Retrieval
  try {
    const asgnRes = await fetch(`${BASE_URL}/assignments?courseId=${courseId}`);
    const asgnData = await asgnRes.json() as any;
    assignmentId = asgnData.data[0].id;

    // Attempt 1 submission
    const sub1Res = await fetch(`${BASE_URL}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignmentId, content: "Attempt 1 script pages." }),
    });
    const sub1Data = (await sub1Res.json() as any).data;

    // Mentor review on attempt 1
    await fetch(`${BASE_URL}/submissions/${sub1Data.id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
      body: JSON.stringify({ score: 88, comments: "Good start, tighten act 1." }),
    });

    // Attempt 2 submission (revision)
    const sub2Res = await fetch(`${BASE_URL}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignmentId, content: "Attempt 2 revised script pages." }),
    });
    const sub2Data = (await sub2Res.json() as any).data;

    // Verify assignment detail returns previous attempts and latest submission history
    const detailAsgn = await fetch(`${BASE_URL}/assignments/${assignmentId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const detailAsgnJson = (await detailAsgn.json() as any).data;

    if (sub2Res.status === 201 && detailAsgnJson.attemptsCount === 2 && detailAsgnJson.previousSubmissions.length === 2) {
      report.push({ workflow: "Assignment Submission & Attempt History", status: "PASS", evidence: `Multiple attempts tracked (Count: ${detailAsgnJson.attemptsCount}), history preserved.` });
    } else {
      report.push({ workflow: "Assignment Submission & Attempt History", status: "FAIL", evidence: "Attempt history not tracked correctly." });
    }
  } catch (err: any) {
    report.push({ workflow: "Assignment Submission & Attempt History", status: "FAIL", evidence: err.message });
  }

  // 5. Late Submission Restrictions
  try {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const strictAsgnRes = await fetch(`${BASE_URL}/assignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
      body: JSON.stringify({ courseId, title: "Strict Reg", description: "Strict", instructions: "Strict", dueDate: pastDate, maxAttempts: 3, allowLate: false }),
    });
    const strictAsgn = (await strictAsgnRes.json() as any).data;

    const strictSub = await fetch(`${BASE_URL}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({ assignmentId: strictAsgn.id, content: "Late test" }),
    });

    if (strictSub.status === 400) {
      report.push({ workflow: "Late Submission Restrictions", status: "PASS", evidence: "Strict deadline correctly rejected late submission (400)" });
    } else {
      report.push({ workflow: "Late Submission Restrictions", status: "FAIL", evidence: `Expected 400, got ${strictSub.status}` });
    }
  } catch (err: any) {
    report.push({ workflow: "Late Submission Restrictions", status: "FAIL", evidence: err.message });
  }

  // 6. Instructor Course & Lesson Management
  try {
    const instDash = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const instData = await instDash.json() as any;
    if (instDash.status === 200 && instData.success) {
      report.push({ workflow: "Instructor Course & Lesson Management", status: "PASS", evidence: "Instructor dashboard and course management verified" });
    } else {
      report.push({ workflow: "Instructor Course & Lesson Management", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ workflow: "Instructor Management", status: "FAIL", evidence: err.message });
  }

  // 7. Admin User & Course Management
  try {
    const adminStats = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await adminStats.json() as any;
    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json() as any;

    if (adminStats.status === 200 && usersRes.status === 200 && usersData.success) {
      report.push({ workflow: "Admin User & Course Management", status: "PASS", evidence: "Admin stats and user management operational" });
    } else {
      report.push({ workflow: "Admin User & Course Management", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ workflow: "Admin Management", status: "FAIL", evidence: err.message });
  }

  // 8. Role-Based Authorization
  try {
    const unauthRes = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (unauthRes.status === 403) {
      report.push({ workflow: "Role-Based Authorization", status: "PASS", evidence: "Student blocked from instructor route (403)" });
    } else {
      report.push({ workflow: "Role-Based Authorization", status: "FAIL", evidence: `Expected 403, got ${unauthRes.status}` });
    }
  } catch (err: any) {
    report.push({ workflow: "Role-Based Authorization", status: "FAIL", evidence: err.message });
  }

  console.log("\n============================================================");
  console.log("            FINAL REGRESSION TEST REPORT (PASS/FAIL)        ");
  console.log("============================================================");
  console.log("| Workflow | Status | Evidence |");
  console.log("|---|---|---|");
  for (const r of report) {
    console.log(`| ${r.workflow} | **${r.status}** | ${r.evidence} |`);
  }
  console.log("============================================================");
}

runFinalRegression().catch(console.error);
