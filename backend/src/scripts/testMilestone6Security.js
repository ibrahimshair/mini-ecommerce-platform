/**
 * Milestone 6 - Day 26 API Security Hardening & Rate Limiting Integration Test Suite
 * Day 26 Verification Script (Issue #51)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const express = require("express");
const app = require("../app");
const {
  securityHeaders,
  createRateLimiter,
  sanitizeValue,
  sanitizeInput,
  getSecurityAuditReport,
} = require("../middleware/security.middleware");

async function runSecurityTestSuite() {
  console.log("==================================================================");
  console.log("🛡️ Starting Milestone 6 - Day 26 Security Hardening & Rate Limit Suite");
  console.log("==================================================================\n");

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
      throw err;
    }
  }

  const rootDir = path.resolve(__dirname, "../../..");

  // Group A: OWASP HTTP Security Headers Verification
  console.log("[Group A: OWASP HTTP Security Headers Verification]");

  const probeRes = await fetch(`${baseUrl}/health`);
  const headers = probeRes.headers;

  await testStep("X-Content-Type-Options is set to 'nosniff'", async () => {
    const val = headers.get("x-content-type-options");
    if (val !== "nosniff") throw new Error(`Expected 'nosniff', got '${val}'`);
  });

  await testStep("X-Frame-Options is set to 'DENY' (Clickjacking protection)", async () => {
    const val = headers.get("x-frame-options");
    if (val !== "DENY") throw new Error(`Expected 'DENY', got '${val}'`);
  });

  await testStep("X-XSS-Protection is set to '1; mode=block'", async () => {
    const val = headers.get("x-xss-protection");
    if (!val || !val.includes("1; mode=block")) {
      throw new Error(`Expected '1; mode=block', got '${val}'`);
    }
  });

  await testStep("Strict-Transport-Security (HSTS) is enabled", async () => {
    const val = headers.get("strict-transport-security");
    if (!val || !val.includes("max-age=")) {
      throw new Error(`Expected HSTS max-age, got '${val}'`);
    }
  });

  await testStep("Content-Security-Policy (CSP) is configured", async () => {
    const val = headers.get("content-security-policy");
    if (!val || !val.includes("default-src")) {
      throw new Error(`Expected CSP policy, got '${val}'`);
    }
  });

  await testStep("X-Powered-By technology fingerprint header is disabled/removed", async () => {
    const val = headers.get("x-powered-by");
    if (val) throw new Error(`Found x-powered-by '${val}' - should be removed`);
  });

  // Group B: Input Sanitization & XSS Defense
  console.log("\n[Group B: Input Sanitization & XSS Defense]");

  await testStep("sanitizeValue strips <script>...</script> injection payload", async () => {
    const malicious = "Harika Kulaklık <script>alert('pwned')</script> ANC";
    const cleaned = sanitizeValue(malicious);
    if (cleaned.includes("<script>") || cleaned.includes("alert")) {
      throw new Error(`XSS script not stripped: ${cleaned}`);
    }
    if (!cleaned.includes("Harika Kulaklık") || !cleaned.includes("ANC")) {
      throw new Error(`Clean content damaged: ${cleaned}`);
    }
  });

  await testStep("sanitizeValue strips dangerous event handlers (onerror, onload)", async () => {
    const malicious = 'Ürün Yorumu <img src="x" onerror="alert(1)"> çok iyi!';
    const cleaned = sanitizeValue(malicious);
    if (cleaned.includes("onerror") || cleaned.includes("alert(1)")) {
      throw new Error(`Inline handler not stripped: ${cleaned}`);
    }
  });

  await testStep("sanitizeValue preserves Turkish characters, pricing and legitimate symbols", async () => {
    const input = "Şık & Zarif Çanta - 1.250,50 ₺ (Özel İndirimli)";
    const cleaned = sanitizeValue(input);
    if (cleaned !== input) {
      throw new Error(`Safe content altered: expected '${input}', got '${cleaned}'`);
    }
  });

  await testStep("sanitizeInput middleware recursively cleans nested body objects", async () => {
    const reqMock = {
      body: {
        product: {
          title: "Test <script>alert(1)</script> Ürün",
          specs: ["Özellik 1", "<iframe src='evil.com'></iframe>Özellik 2"],
        },
      },
    };
    sanitizeInput(reqMock, {}, () => {});
    if (reqMock.body.product.title.includes("<script>")) {
      throw new Error("Nested object string was not sanitized");
    }
    if (reqMock.body.product.specs[1].includes("<iframe")) {
      throw new Error("Array nested string was not sanitized");
    }
  });

  // Group C: Rate Limiting & RFC-6585 Headers
  console.log("\n[Group C: Rate Limiting & RFC-6585 Headers]");

  await testStep("API responses include RateLimit-Limit, RateLimit-Remaining, and RateLimit-Reset headers", async () => {
    const res = await fetch(`${baseUrl}/products`);
    const limit = res.headers.get("ratelimit-limit");
    const remaining = res.headers.get("ratelimit-remaining");
    const reset = res.headers.get("ratelimit-reset");
    if (!limit || remaining === null || !reset) {
      throw new Error(`Missing rate limit headers: limit=${limit}, rem=${remaining}, reset=${reset}`);
    }
  });

  await testStep("Rate limiter returns 429 Too Many Requests when threshold exceeded", async () => {
    // Spin up test server with low threshold (3 requests)
    const testApp = express();
    const testLimiter = createRateLimiter({
      windowMs: 5000,
      maxRequests: 3,
      message: "Test limit exceeded",
    });
    testApp.use(testLimiter);
    testApp.get("/test-limit", (req, res) => res.json({ ok: true }));

    const testServer = http.createServer(testApp);
    await new Promise((resolve) => testServer.listen(0, resolve));
    const testPort = testServer.address().port;

    const r1 = await fetch(`http://localhost:${testPort}/test-limit`);
    const r2 = await fetch(`http://localhost:${testPort}/test-limit`);
    const r3 = await fetch(`http://localhost:${testPort}/test-limit`);
    const r4 = await fetch(`http://localhost:${testPort}/test-limit`);

    testServer.close();

    if (r1.status !== 200 || r2.status !== 200 || r3.status !== 200) {
      throw new Error(`Expected first 3 requests to succeed, got ${r1.status}, ${r2.status}, ${r3.status}`);
    }

    if (r4.status !== 429) {
      throw new Error(`Expected 4th request to return 429, got ${r4.status}`);
    }

    const retryAfter = r4.headers.get("retry-after");
    if (!retryAfter) {
      throw new Error("429 response missing 'Retry-After' header");
    }

    const r4Data = await r4.json();
    if (r4Data.success !== false || !r4Data.message.includes("Test limit exceeded")) {
      throw new Error(`Unexpected 429 body format: ${JSON.stringify(r4Data)}`);
    }
  });

  // Group D: Security Audit & Health Endpoint
  console.log("\n[Group D: Security Audit & Health Endpoint]");

  await testStep("GET /api/health/security returns 200 with security status report", async () => {
    const res = await fetch(`${baseUrl}/health/security`);
    if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data?.hardening) {
      throw new Error("Invalid security audit report format");
    }
    const hardening = data.data.hardening;
    if (!hardening.securityHeaders || !hardening.rateLimiting || !hardening.sanitization) {
      throw new Error("Missing security policies in audit report");
    }
  });

  // Group E: Frontend Security Interceptor & Notification Integration
  console.log("\n[Group E: Frontend Security Interceptor & Client Integration]");

  await testStep("api.js contains 429 rate limit interceptor and dispatches api:ratelimit event", async () => {
    const apiPath = path.join(rootDir, "frontend/src/services/api.js");
    const content = fs.readFileSync(apiPath, "utf-8");
    if (!content.includes("error.status === 429") || !content.includes("api:ratelimit")) {
      throw new Error("api.js missing 429 interceptor or api:ratelimit event dispatch");
    }
    if (!content.includes("getSecurityStatus")) {
      throw new Error("api.js missing getSecurityStatus helper");
    }
  });

  await testStep("App.jsx listens to api:ratelimit and displays rateLimitNotice warning banner", async () => {
    const appPath = path.join(rootDir, "frontend/src/App.jsx");
    const content = fs.readFileSync(appPath, "utf-8");
    if (!content.includes("api:ratelimit") || !content.includes("rateLimitNotice")) {
      throw new Error("App.jsx does not handle api:ratelimit or rateLimitNotice");
    }
  });

  await testStep("app.js applies securityHeaders, sanitizeInput, and globalRateLimiter", async () => {
    const appPath = path.join(rootDir, "backend/src/app.js");
    const content = fs.readFileSync(appPath, "utf-8");
    if (!content.includes("securityHeaders") || !content.includes("sanitizeInput")) {
      throw new Error("app.js missing securityHeaders or sanitizeInput middleware");
    }
    if (!content.includes("globalRateLimiter") || !content.includes("x-powered-by")) {
      throw new Error("app.js missing globalRateLimiter or x-powered-by disablement");
    }
  });

  server.close();

  console.log("\n==================================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (100%)`);
  console.log("==================================================================");
  console.log("🎉 All Milestone 6 Day 26 Security Hardening tests passed successfully!\n");
}

if (require.main === module) {
  runSecurityTestSuite().catch((err) => {
    console.error("Security test suite aborted:", err);
    process.exit(1);
  });
}

module.exports = runSecurityTestSuite;
