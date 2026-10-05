/**
 * Milestone 3 Authentication & User Profile Integration Test Suite
 * Sprint Review Verification Script (Day 15 - Issue #40)
 */

const app = require("../app");
const http = require("http");

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🚀 Starting Milestone 3 Auth & Profile E2E Verification");
  console.log("==========================================================\n");

  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  let passedTests = 0;
  let totalTests = 0;

  async function testStep(name, fn) {
    totalTests++;
    process.stdout.write(`[Test ${totalTests}] ${name} ... `);
    try {
      await fn();
      console.log("✅ PASSED");
      passedTests++;
    } catch (err) {
      console.log(`❌ FAILED: ${err.message}`);
    }
  }

  let authToken = null;
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = "Password123!";
  const newPassword = "NewPassword123!";

  try {
    // 1. Health check
    await testStep("API Health Check (/api/health)", async () => {
      const res = await fetch(`${baseUrl}/health`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error("Health check returned failure");
    });

    // 2. User Registration
    await testStep("User Registration (/api/auth/register)", async () => {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Test Kullanıcı",
          email: testEmail,
          password: testPassword,
          phone: "05551112233",
        }),
      });

      const data = await res.json();
      if (res.status !== 201 && res.status !== 200) {
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      if (!data.data || !data.data.email) {
        throw new Error("User data missing from response");
      }
    });

    // 3. User Login
    await testStep("User Login (/api/auth/login)", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (!data.data?.token) throw new Error("JWT token was not issued");
      authToken = data.data.token;
    });

    // 4. Access Protected Route with JWT Bearer token
    await testStep("Protected Route Access (/api/auth/me) with JWT", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (data.data.email.toLowerCase() !== testEmail.toLowerCase()) {
        throw new Error("Returned user does not match authenticated token");
      }
    });

    // 5. Reject Request with Invalid Token
    await testStep("Reject Unauthorized Access without valid token", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        headers: {
          Authorization: "Bearer invalid.jwt.token",
        },
      });

      if (res.status !== 401 && res.status !== 403) {
        throw new Error(`Expected 401/403 but got ${res.status}`);
      }
    });

    // 6. Update Profile Information (name, phone)
    await testStep("Update User Profile (/api/auth/me PUT)", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: "Güncel Test Kullanıcı",
          phone: "05559998877",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (data.data.name !== "Güncel Test Kullanıcı") {
        throw new Error("Updated name did not persist");
      }
    });

    // 7. Password Change - Reject Wrong Current Password
    await testStep("Reject Password Change with Incorrect Current Password", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: "WrongPassword999!",
          newPassword: newPassword,
        }),
      });

      if (res.status !== 400 && res.status !== 401) {
        throw new Error(`Expected 400 error but got HTTP ${res.status}`);
      }
    });

    // 8. Password Change - Successful
    await testStep("Change Password with Correct Credentials", async () => {
      const res = await fetch(`${baseUrl}/auth/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    });

    // 9. Login with New Password
    await testStep("Verify Login with Updated Password", async () => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
      if (!data.data?.token) throw new Error("Login failed with new password");
    });
  } finally {
    server.close();
  }

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==========================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
