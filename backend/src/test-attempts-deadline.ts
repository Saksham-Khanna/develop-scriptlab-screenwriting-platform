const BASE_URL = "http://localhost:5000/api";

async function testAttemptsAndDeadlines() {
  console.log("Testing Assignment Maximum Attempts & Late Submission Rules...\n");

  // 1. Register test student & mentor
  const studentEmail = `student_test_${Date.now()}@scriptlab.io`;
  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Attempt Test Student", email: studentEmail, password: "password123", role: "student" }),
  });
  const regJson = await regRes.json() as any;
  const studentToken = regJson.data.token;

  // Login as mentor
  const mentorLogin = await fetch(`${BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "mentor@scriptlab.io", password: "password123" }),
  });
  const mentorJson = await mentorLogin.json() as any;
  const mentorToken = mentorJson.data.token;

  // Fetch a course to create test assignment
  const coursesRes = await fetch(`${BASE_URL}/courses`);
  const coursesJson = await coursesRes.json() as any;
  const courseId = coursesJson.data[0].id;

  // Create strict assignment (allowLate: false, maxAttempts: 2, past due date)
  const pastDate = new Date(Date.now() - 86400000).toISOString(); // 1 day ago
  const asgnRes1 = await fetch(`${BASE_URL}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
    body: JSON.stringify({
      courseId,
      title: "Strict Deadline Assignment",
      description: "Test strict deadline",
      instructions: "Do not submit late",
      dueDate: pastDate,
      maxAttempts: 2,
      allowLate: false,
    }),
  });
  const asgn1 = (await asgnRes1.json() as any).data;

  // Test Case 1: Submit after deadline when allowLate is false -> should fail (400)
  const sub1 = await fetch(`${BASE_URL}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ assignmentId: asgn1.id, content: "Late submission test." }),
  });
  const sub1Json = await sub1.json() as any;
  console.log(`[Test 1] Submit past deadline (allowLate=false): Status ${sub1.status} (Expected 400). Error: ${sub1Json.error}`);
  assert(sub1.status === 400, "Should reject past deadline when allowLate is false");

  // Create lenient assignment (allowLate: true, maxAttempts: 2, past due date)
  const asgnRes2 = await fetch(`${BASE_URL}/assignments`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${mentorToken}` },
    body: JSON.stringify({
      courseId,
      title: "Lenient Deadline Assignment",
      description: "Test lenient deadline",
      instructions: "Late allowed",
      dueDate: pastDate,
      maxAttempts: 2,
      allowLate: true,
    }),
  });
  const asgn2 = (await asgnRes2.json() as any).data;

  // Test Case 2: Submit after deadline when allowLate is true -> should succeed with isLate=true
  const sub2 = await fetch(`${BASE_URL}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ assignmentId: asgn2.id, content: "Late attempt 1." }),
  });
  const sub2Data = (await sub2.json() as any).data;
  console.log(`[Test 2] Submit past deadline (allowLate=true): Status ${sub2.status} (Expected 201). isLate: ${sub2Data.isLate}, Attempt: ${sub2Data.attemptNumber}`);
  assert(sub2.status === 201 && sub2Data.isLate === true && sub2Data.attemptNumber === 1, "Should accept late submission with isLate=true");

  // Test Case 3: Maximum attempts validation (maxAttempts: 2)
  // Attempt 2 (valid)
  const sub3 = await fetch(`${BASE_URL}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ assignmentId: asgn2.id, content: "Late attempt 2." }),
  });
  const sub3Data = (await sub3.json() as any).data;
  console.log(`[Test 3] Submit attempt 2 (maxAttempts=2): Status ${sub3.status} (Expected 201). Attempt: ${sub3Data.attemptNumber}`);
  assert(sub3.status === 201 && sub3Data.attemptNumber === 2, "Should accept attempt 2");

  // Attempt 3 (exceeds maxAttempts: 2) -> should fail (400)
  const sub4 = await fetch(`${BASE_URL}/submissions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${studentToken}` },
    body: JSON.stringify({ assignmentId: asgn2.id, content: "Exceeds max attempts attempt 3." }),
  });
  const sub4Json = await sub4.json() as any;
  console.log(`[Test 4] Submit attempt 3 (exceeds maxAttempts=2): Status ${sub4.status} (Expected 400). Error: ${sub4Json.error}`);
  assert(sub4.status === 400, "Should reject attempt 3 when maxAttempts is 2");

  console.log("\nAll Assignment Attempt & Late Submission Rules verified successfully!");
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
}

testAttemptsAndDeadlines().catch(console.error);
