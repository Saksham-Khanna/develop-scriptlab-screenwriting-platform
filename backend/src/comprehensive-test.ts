const BASE_URL = "http://localhost:5000/api";

interface TestSuite {
  category: string;
  testName: string;
  status: "PASS" | "FAIL" | "PARTIAL" | "NOT IMPLEMENTED";
  evidence: string;
}

const report: TestSuite[] = [];

async function runComprehensiveTests() {
  console.log("Running ScriptLab Comprehensive Feature Testing...\n");

  let studentToken = "";
  let studentId = 0;
  let mentorToken = "";
  let adminToken = "";
  let courseId = 1;
  let lessonId = 1;
  let assignmentId = 1;

  // 1. Authentication & Registration
  try {
    const email = `audit_student_${Date.now()}@scriptlab.io`;
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Audit Student", email, password: "password123", role: "student" }),
    });
    const regData = await regRes.json() as any;
    if (regRes.status === 201 && regData.success) {
      studentToken = regData.data.token;
      studentId = regData.data.user.id;
      report.push({ category: "Authentication", testName: "Student Registration", status: "PASS", evidence: `Registered student ID ${studentId}` });
    } else {
      report.push({ category: "Authentication", testName: "Student Registration", status: "FAIL", evidence: regData.error || "Failed" });
    }

    // Duplicate email validation
    const dupRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Duplicate", email, password: "password123", role: "student" }),
    });
    if (dupRes.status === 409) {
      report.push({ category: "Authentication", testName: "Duplicate Email Validation", status: "PASS", evidence: "Correctly returned 409 Conflict" });
    } else {
      report.push({ category: "Authentication", testName: "Duplicate Email Validation", status: "FAIL", evidence: `Status ${dupRes.status}` });
    }

    // Login with valid credentials
    const loginRes = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "password123" }),
    });
    const loginData = await loginRes.json() as any;
    if (loginRes.status === 200 && loginData.success) {
      report.push({ category: "Authentication", testName: "Login Valid Credentials", status: "PASS", evidence: "Login successful" });
    } else {
      report.push({ category: "Authentication", testName: "Login Valid Credentials", status: "FAIL", evidence: loginData.error || "Failed" });
    }

    // Invalid password handling
    const badLogin = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "wrongpassword" }),
    });
    if (badLogin.status === 401) {
      report.push({ category: "Authentication", testName: "Invalid Password Handling", status: "PASS", evidence: "Returned 401 Unauthorized" });
    } else {
      report.push({ category: "Authentication", testName: "Invalid Password Handling", status: "FAIL", evidence: `Status ${badLogin.status}` });
    }

    // Session persistence (/auth/me)
    const meRes = await fetch(`${BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const meData = await meRes.json() as any;
    if (meRes.status === 200 && meData.data.user?.id === studentId) {
      report.push({ category: "Authentication", testName: "Session Persistence (/auth/me)", status: "PASS", evidence: "Session verified" });
    } else {
      report.push({ category: "Authentication", testName: "Session Persistence (/auth/me)", status: "FAIL", evidence: "Failed" });
    }

    // Logout
    const logoutRes = await fetch(`${BASE_URL}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (logoutRes.status === 200) {
      report.push({ category: "Authentication", testName: "Logout", status: "PASS", evidence: "Logout successful" });
    } else {
      report.push({ category: "Authentication", testName: "Logout", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ category: "Authentication", testName: "Auth Suite", status: "FAIL", evidence: err.message });
  }

  // Login as Mentor and Admin for subsequent tests
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
    console.error("Failed to login mentor/admin for testing", e);
  }

  // 2. Course Catalog & Student Enrollment
  try {
    const coursesRes = await fetch(`${BASE_URL}/courses`);
    const coursesData = await coursesRes.json() as any;
    if (coursesRes.status === 200 && coursesData.success && coursesData.data.length > 0) {
      courseId = coursesData.data[0].id;
      report.push({ category: "Course Catalog", testName: "Display Published Courses", status: "PASS", evidence: `Fetched ${coursesData.data.length} courses` });
    } else {
      report.push({ category: "Course Catalog", testName: "Display Published Courses", status: "FAIL", evidence: "Failed" });
    }

    // Search and filter
    const searchRes = await fetch(`${BASE_URL}/courses?q=commercial`);
    const searchData = await searchRes.json() as any;
    if (searchRes.status === 200 && searchData.success) {
      report.push({ category: "Course Catalog", testName: "Search Courses", status: "PASS", evidence: "Search query successful" });
    } else {
      report.push({ category: "Course Catalog", testName: "Search Courses", status: "FAIL", evidence: "Failed" });
    }

    // Enroll
    const enrollRes = await fetch(`${BASE_URL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (enrollRes.status === 201 || enrollRes.status === 200) {
      report.push({ category: "Course Catalog", testName: "Course Enrollment & Persistence", status: "PASS", evidence: "Enrolled successfully" });
    } else {
      report.push({ category: "Course Catalog", testName: "Course Enrollment & Persistence", status: "FAIL", evidence: "Failed" });
    }

    // Duplicate enrollment check
    const dupEnroll = await fetch(`${BASE_URL}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (dupEnroll.status === 200) {
      report.push({ category: "Course Catalog", testName: "Duplicate Enrollment Prevention", status: "PASS", evidence: "Handled gracefully (already enrolled)" });
    } else {
      report.push({ category: "Course Catalog", testName: "Duplicate Enrollment Prevention", status: "FAIL", evidence: `Status ${dupEnroll.status}` });
    }
  } catch (err: any) {
    report.push({ category: "Course Catalog", testName: "Catalog Suite", status: "FAIL", evidence: err.message });
  }

  // 3. Learning Interface & Progress
  try {
    const detailRes = await fetch(`${BASE_URL}/courses/${courseId}`);
    const detailData = await detailRes.json() as any;
    if (detailData.success && detailData.data.curriculum?.length > 0) {
      lessonId = detailData.data.curriculum[0].lessons[0].id;
      report.push({ category: "Learning Interface", testName: "Course Details & Curriculum", status: "PASS", evidence: "Curriculum loaded" });
    } else {
      report.push({ category: "Learning Interface", testName: "Course Details & Curriculum", status: "FAIL", evidence: "Failed" });
    }

    const lessonRes = await fetch(`${BASE_URL}/lessons/${lessonId}`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const lessonData = await lessonRes.json() as any;
    if (lessonRes.status === 200 && lessonData.success) {
      report.push({ category: "Learning Interface", testName: "Lesson Content & Navigation", status: "PASS", evidence: "Lesson fetched successfully" });
    } else {
      report.push({ category: "Learning Interface", testName: "Lesson Content & Navigation", status: "FAIL", evidence: "Failed" });
    }

    // Mark complete
    const compRes = await fetch(`${BASE_URL}/lessons/${lessonId}/complete`, {
      method: "POST",
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (compRes.status === 200) {
      report.push({ category: "Learning Interface", testName: "Mark Lesson Complete & Progress", status: "PASS", evidence: "Marked complete" });
    } else {
      report.push({ category: "Learning Interface", testName: "Mark Lesson Complete & Progress", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ category: "Learning Interface", testName: "Learning Suite", status: "FAIL", evidence: err.message });
  }

  // 4. Assignments & Submissions
  try {
    const asgnRes = await fetch(`${BASE_URL}/assignments?courseId=${courseId}`);
    const asgnData = await asgnRes.json() as any;
    if (asgnData.success && asgnData.data.length > 0) {
      assignmentId = asgnData.data[0].id;
      report.push({ category: "Assignments", testName: "Display Assignments", status: "PASS", evidence: "Assignments listed" });
    } else {
      report.push({ category: "Assignments", testName: "Display Assignments", status: "FAIL", evidence: "Failed" });
    }

    // Submit text and file
    const subRes = await fetch(`${BASE_URL}/submissions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify({
        assignmentId,
        content: "Here is my final act 1 screenplay submission.",
        fileName: "screenplay_act1.pdf",
        fileData: "data:application/pdf;base64,JVBERi0xLjcK...",
      }),
    });
    const subData = await subRes.json() as any;
    if (subRes.status === 201 && subData.success) {
      report.push({ category: "Assignments", testName: "Text & File Submission", status: "PASS", evidence: "Submission created successfully" });
    } else {
      report.push({ category: "Assignments", testName: "Text & File Submission", status: "FAIL", evidence: subData.error || "Failed" });
    }
  } catch (err: any) {
    report.push({ category: "Assignments", testName: "Assignment Suite", status: "FAIL", evidence: err.message });
  }

  // 5. Instructor Dashboard & Mentor Feedback
  try {
    const instDash = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const instData = await instDash.json() as any;
    if (instDash.status === 200 && instData.success) {
      report.push({ category: "Instructor Dashboard", testName: "Instructor Statistics & Courses", status: "PASS", evidence: "Dashboard loaded" });
    } else {
      report.push({ category: "Instructor Dashboard", testName: "Instructor Statistics & Courses", status: "FAIL", evidence: "Failed" });
    }

    // Review submission & feedback
    const subsRes = await fetch(`${BASE_URL}/submissions`, {
      headers: { Authorization: `Bearer ${mentorToken}` },
    });
    const subsData = await subsRes.json() as any;
    if (subsData.success && subsData.data.length > 0) {
      const subId = subsData.data[0].id;
      const fbRes = await fetch(`${BASE_URL}/submissions/${subId}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
        body: JSON.stringify({ score: 94, comments: "Outstanding spec structure!", suggestions: "Strengthen protagonist arc." }),
      });
      if (fbRes.status === 200) {
        report.push({ category: "Mentor Feedback", testName: "Review Submission & Save Feedback", status: "PASS", evidence: "Feedback delivered" });
      } else {
        report.push({ category: "Mentor Feedback", testName: "Review Submission & Save Feedback", status: "FAIL", evidence: "Failed" });
      }
    }
  } catch (err: any) {
    report.push({ category: "Instructor Dashboard", testName: "Instructor Suite", status: "FAIL", evidence: err.message });
  }

  // 6. Admin Dashboard & Management
  try {
    const adminStats = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsData = await adminStats.json() as any;
    if (adminStats.status === 200 && statsData.success) {
      report.push({ category: "Admin Dashboard", testName: "Admin Statistics & Activity Log", status: "PASS", evidence: "Stats loaded" });
    } else {
      report.push({ category: "Admin Dashboard", testName: "Admin Statistics & Activity Log", status: "FAIL", evidence: "Failed" });
    }

    const usersRes = await fetch(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersData = await usersRes.json() as any;
    if (usersRes.status === 200 && usersData.success) {
      report.push({ category: "Admin Dashboard", testName: "User Management Listing", status: "PASS", evidence: "Users listed" });
    } else {
      report.push({ category: "Admin Dashboard", testName: "User Management Listing", status: "FAIL", evidence: "Failed" });
    }
  } catch (err: any) {
    report.push({ category: "Admin Dashboard", testName: "Admin Suite", status: "FAIL", evidence: err.message });
  }

  // 7. Security & Authorization
  try {
    // Student accessing instructor endpoint -> 403
    const unauth1 = await fetch(`${BASE_URL}/dashboard/instructor`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (unauth1.status === 403) {
      report.push({ category: "Security & Authorization", testName: "Student Blocked from Instructor Dashboard", status: "PASS", evidence: "Returned 403 Forbidden" });
    } else {
      report.push({ category: "Security & Authorization", testName: "Student Blocked from Instructor Dashboard", status: "FAIL", evidence: `Status ${unauth1.status}` });
    }

    // Student accessing admin stats -> 403
    const unauth2 = await fetch(`${BASE_URL}/admin/stats`, {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (unauth2.status === 403) {
      report.push({ category: "Security & Authorization", testName: "Student Blocked from Admin Stats", status: "PASS", evidence: "Returned 403 Forbidden" });
    } else {
      report.push({ category: "Security & Authorization", testName: "Student Blocked from Admin Stats", status: "FAIL", evidence: `Status ${unauth2.status}` });
    }
  } catch (err: any) {
    report.push({ category: "Security & Authorization", testName: "Auth Security Suite", status: "FAIL", evidence: err.message });
  }

  console.log("\n============================================================");
  console.log("             COMPLETE SCRIPTLAB FUNCTIONAL REPORT           ");
  console.log("============================================================");
  console.log("| Category | Feature Tested | Status | Evidence |");
  console.log("|---|---|---|---|");
  for (const r of report) {
    console.log(`| ${r.category} | ${r.testName} | **${r.status}** | ${r.evidence} |`);
  }
  console.log("============================================================");
}

runComprehensiveTests().catch(console.error);
