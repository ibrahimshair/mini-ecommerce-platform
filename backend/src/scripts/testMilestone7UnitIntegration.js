/**
 * Milestone 7 - Day 31 Comprehensive Unit & Integration Test Suite (#56)
 * Validates core business logic, utility functions, security helpers,
 * and end-to-end integration workflows across the application stack.
 */

const http = require("http");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const app = require("../app");
const config = require("../config");
const { sanitizeValue } = require("../middleware/security.middleware");

let server = null;
let baseUrl = "";
let passedTests = 0;
let totalTests = 0;

async function testStep(name, fn) {
  totalTests++;
  process.stdout.write(`[Test ${totalTests}] ${name} ... `);
  try {
    await fn();
    console.log("✅ PASSED");
    passedTests++;
  } catch (error) {
    console.log("❌ FAILED");
    console.error(`   Error: ${error.message}`);
    process.exitCode = 1;
  }
}

// Low-level HTTP helper
function makeRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const headers = { ...(options.headers || {}) };
    if (options.body && !headers["Content-Type"] && !headers["content-type"]) {
      headers["Content-Type"] = "application/json";
    }

    const reqOptions = {
      method: options.method || "GET",
      headers,
    };

    const req = http.request(url, reqOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const rawBuffer = Buffer.concat(chunks);
        const bodyText = rawBuffer.toString("utf-8");
        let parsed = null;
        try {
          parsed = JSON.parse(bodyText);
        } catch {
          parsed = bodyText;
        }

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
          raw: bodyText,
        });
      });
    });

    req.on("error", reject);
    if (options.body) {
      req.write(typeof options.body === "string" ? options.body : JSON.stringify(options.body));
    }
    req.end();
  });
}

// In-memory cart calculation test helper mirroring CartContext logic
function calculateTestTotals(items = [], coupon = null) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );
  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const FREE_SHIPPING_THRESHOLD = 150;
  const standardShipping = 29.9;

  let shippingCost =
    roundedSubtotal >= FREE_SHIPPING_THRESHOLD || roundedSubtotal === 0 ? 0 : standardShipping;

  if (coupon?.type === "free_shipping" && roundedSubtotal > 0) {
    shippingCost = 0;
  }

  let discountAmount = 0;
  if (coupon && roundedSubtotal >= (coupon.minSubtotal || 0)) {
    if (coupon.type === "percent") {
      discountAmount = Math.round(roundedSubtotal * coupon.rate * 100) / 100;
    } else if (coupon.type === "fixed") {
      discountAmount = Math.min(roundedSubtotal, coupon.amount);
    }
  }

  const grandTotal = Math.max(0, Math.round((roundedSubtotal - discountAmount + shippingCost) * 100) / 100);

  return {
    itemCount,
    subtotal: roundedSubtotal,
    shippingCost,
    discountAmount,
    grandTotal,
    isFreeShipping: shippingCost === 0 && roundedSubtotal > 0,
  };
}

async function runUnitIntegrationTests() {
  console.log("==================================================================");
  console.log("🧪 Starting Milestone 7 - Day 31 Unit & Integration Test Suite");
  console.log("==================================================================\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // -------------------------------------------------------------
    // Part A: Core Unit Logic & Algorithms
    // -------------------------------------------------------------
    console.log("[Part A: Core Business Logic & Security Unit Tests]");

    await testStep("Bcrypt password hashing and constant-time comparison", async () => {
      const password = "SuperSecretPassword123!";
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);
      if (hash === password) throw new Error("Hash equals plaintext password");
      const isMatch = await bcrypt.compare(password, hash);
      if (!isMatch) throw new Error("Bcrypt comparison failed for valid password");
      const isWrong = await bcrypt.compare("WrongPassword!", hash);
      if (isWrong) throw new Error("Bcrypt comparison succeeded for invalid password");
    });

    await testStep("JWT token signature and claims verification", async () => {
      const payload = { userId: "user-123", email: "test@example.com", role: "customer" };
      const secret = config.jwt?.secret || "default_jwt_secret_dev";
      const token = jwt.sign(payload, secret, { expiresIn: "1h" });
      const decoded = jwt.verify(token, secret);
      if (decoded.userId !== payload.userId || decoded.role !== payload.role) {
        throw new Error("JWT decoded claims mismatch");
      }
    });

    await testStep("Input sanitization: strips complex XSS and DOM-based vectors", async () => {
      const vectors = [
        "<script>window.location='http://attacker.com'</script>Normal Metin",
        "<a href='javascript:alert(1)'>Bağlantı</a>",
        "<div onmouseover='stealData()'>İçerik</div>",
      ];
      for (const vec of vectors) {
        const clean = sanitizeValue(vec);
        if (clean.includes("<script>") || clean.includes("javascript:") || clean.includes("onmouseover")) {
          throw new Error(`Sanitization failed on vector: ${vec}`);
        }
      }
    });

    await testStep("Cart calculation math: subtotal, shipping threshold and coupon discounts", async () => {
      const sampleItems = [
        { price: 100, quantity: 1 },
        { price: 30, quantity: 1 },
      ];
      // Subtotal = 130 (< 150 threshold), shipping = 29.9
      const calc1 = calculateTestTotals(sampleItems);
      if (calc1.subtotal !== 130) throw new Error(`Expected subtotal 130, got ${calc1.subtotal}`);
      if (calc1.shippingCost !== 29.9) throw new Error(`Expected shipping 29.9, got ${calc1.shippingCost}`);
      if (calc1.grandTotal !== 159.9) throw new Error(`Expected grandTotal 159.9, got ${calc1.grandTotal}`);

      // Apply 10% coupon
      const coupon10 = { code: "INDIRIM10", rate: 0.1, type: "percent", minSubtotal: 0 };
      const calc2 = calculateTestTotals(sampleItems, coupon10);
      if (calc2.discountAmount !== 13) throw new Error(`Expected discount 13, got ${calc2.discountAmount}`);
      if (calc2.grandTotal !== 146.9) throw new Error(`Expected grandTotal 146.9, got ${calc2.grandTotal}`);

      // Over threshold (160 TL), free shipping
      const itemsOverThreshold = [{ price: 160, quantity: 1 }];
      const calc3 = calculateTestTotals(itemsOverThreshold);
      if (calc3.shippingCost !== 0) throw new Error("Expected free shipping over 150 TL");
    });

    // -------------------------------------------------------------
    // Part B: API Integration Workflows
    // -------------------------------------------------------------
    console.log("\n[Part B: Multi-Layer API Integration Workflows]");

    const testEmail = `integration_tester_${Date.now()}@example.com`;
    let userToken = "";
    let userId = "";

    await testStep("User Registration API (/api/auth/register)", async () => {
      const res = await makeRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Entegrasyon Test Kullanıcısı",
          email: testEmail,
          password: "Password123!",
          phone: "05551234567",
        },
      });
      if (res.statusCode !== 201 && res.statusCode !== 200) {
        throw new Error(`Expected HTTP 201/200, got ${res.statusCode}: ${JSON.stringify(res.data)}`);
      }
      if (!res.data.success) throw new Error("Registration response success !== true");
    });

    await testStep("User Authentication & Session Issuance (/api/auth/login)", async () => {
      const res = await makeRequest("/api/auth/login", {
        method: "POST",
        body: { email: testEmail, password: "Password123!" },
      });
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.data.data?.token) throw new Error("Login did not return JWT token");
      userToken = res.data.data.token;
      userId = res.data.data.user.id;
    });

    await testStep("Authenticated Profile Check (/api/auth/me)", async () => {
      const res = await makeRequest("/api/auth/me", {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.data.data.email !== testEmail) {
        throw new Error(`Profile email ${res.data.data.email} does not match ${testEmail}`);
      }
    });

    await testStep("Product Catalog Query with Advanced Filtering & Pagination", async () => {
      const res = await makeRequest("/api/products?page=1&limit=4&sortBy=price-asc");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data)) throw new Error("Expected data.data to be an array");
      if (!res.data.pagination) throw new Error("Missing pagination metadata in products response");
      if (res.data.data.length > 4) throw new Error("Returned more items than limit 4");
    });

    await testStep("System Health Endpoints Integrity (/api/health, /api/health/security)", async () => {
      const [hRes, sRes] = await Promise.all([
        makeRequest("/api/health"),
        makeRequest("/api/health/security"),
      ]);
      if (hRes.statusCode !== 200 || sRes.statusCode !== 200) {
        throw new Error("One or more health check endpoints failed");
      }
      if (hRes.data.data.status !== "UP") throw new Error("Expected health status UP");
      if (!sRes.data.data?.hardening) throw new Error("Expected security hardening report");
    });

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("==================================================================");

    if (passedTests === totalTests) {
      console.log("🎉 Milestone 7 - Day 31 Unit & Integration tests passed successfully!\n");
    } else {
      throw new Error(`Unit/Integration tests failed (${totalTests - passedTests} failures)`);
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

if (require.main === module) {
  runUnitIntegrationTests().catch((err) => {
    console.error("Test execution fatal error:", err.message);
    process.exit(1);
  });
}

module.exports = runUnitIntegrationTests;
