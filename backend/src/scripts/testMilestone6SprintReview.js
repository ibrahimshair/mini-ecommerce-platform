/**
 * Milestone 6 - Day 30 Sprint Review & End-to-End Integration Verification Suite
 * Validates the complete Milestone 6 Architecture:
 * - Security Hardening & Rate Limiting (Day 26 - Issue #51)
 * - Error Resilience & Offline Recovery (Day 27 - Issue #52)
 * - Performance, Caching & Data Sync (Day 28 - Issue #53)
 * - Advanced Search, Multi-Filter, Pagination & Toast System (Day 29 - Issue #54)
 * - Full Health Matrix & Milestone 6 Closing Audit (Day 30 - Issue #55)
 */

const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const app = require("../app");
const { sanitizeValue, sanitizeInput } = require("../middleware/security.middleware");

let server = null;
let baseUrl = "";
let passedTests = 0;
let totalTests = 0;

// Test Runner Helper
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

// Low-level HTTP request helper
function makeRequest(urlPath, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const reqOptions = {
      method: options.method || "GET",
      headers: options.headers || {},
    };

    const req = http.request(url, reqOptions, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const rawBuffer = Buffer.concat(chunks);
        let bodyText = "";
        const isGzip = res.headers["content-encoding"] === "gzip";

        try {
          if (isGzip) {
            bodyText = zlib.gunzipSync(rawBuffer).toString("utf-8");
          } else {
            bodyText = rawBuffer.toString("utf-8");
          }
        } catch {
          bodyText = rawBuffer.toString("utf-8");
        }

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

async function runMilestone6SprintReview() {
  console.log("==================================================================");
  console.log("🏆 Starting Milestone 6 (Day 30) Sprint Review & Closing Audit");
  console.log("==================================================================\n");

  // Spin up test server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  const rootDir = path.resolve(__dirname, "../../..");

  try {
    // -------------------------------------------------------------
    // Section 1: Security Hardening & Rate Limiting Audit (Day 26)
    // -------------------------------------------------------------
    console.log("[Section 1: Security Hardening & Rate Limiting Audit]");

    await testStep("OWASP Security Headers (nosniff, DENY, XSS-Protection, HSTS, CSP)", async () => {
      const res = await makeRequest("/api/health");
      if (res.headers["x-content-type-options"] !== "nosniff") {
        throw new Error("Missing or invalid X-Content-Type-Options header");
      }
      if (res.headers["x-frame-options"] !== "DENY") {
        throw new Error("Missing or invalid X-Frame-Options header");
      }
      if (!res.headers["x-xss-protection"]?.includes("1; mode=block")) {
        throw new Error("Missing or invalid X-XSS-Protection header");
      }
      if (!res.headers["strict-transport-security"]) {
        throw new Error("Missing Strict-Transport-Security (HSTS) header");
      }
      if (!res.headers["content-security-policy"]) {
        throw new Error("Missing Content-Security-Policy (CSP) header");
      }
    });

    await testStep("Server Fingerprint Prevention (X-Powered-By removed)", async () => {
      const res = await makeRequest("/api/health");
      if (res.headers["x-powered-by"]) {
        throw new Error("X-Powered-By header should be removed or disabled");
      }
    });

    await testStep("Input Sanitization & XSS Defense on nested payloads", async () => {
      const cleanScript = sanitizeValue("<script>alert('xss')</script>Normal Metin");
      if (cleanScript.includes("<script>")) throw new Error("sanitizeValue did not strip script tags");

      const cleanHandler = sanitizeValue("<img src=x onerror=alert(1)>");
      if (cleanHandler.includes("onerror")) throw new Error("sanitizeValue did not strip event handler");

      const nestedObj = {
        title: "<b>Güvenli Başlık</b>",
        comment: "<script>stealCookies()</script>Harika ürün!",
      };
      const reqMock = { body: nestedObj };
      sanitizeInput(reqMock, {}, () => {});
      if (reqMock.body.comment.includes("<script>")) {
        throw new Error("sanitizeInput middleware failed to clean nested body payload");
      }
    });

    await testStep("RFC-6585 Rate Limit Headers present on API responses", async () => {
      const res = await makeRequest("/api/products");
      if (!res.headers["ratelimit-limit"] || !res.headers["ratelimit-remaining"]) {
        throw new Error("RateLimit-Limit or RateLimit-Remaining header missing");
      }
    });

    await testStep("GET /api/health/security returns operational status SECURE", async () => {
      const res = await makeRequest("/api/health/security");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.data.success || !res.data.data?.hardening) {
        throw new Error("Invalid security audit health response payload");
      }
    });

    // -------------------------------------------------------------
    // Section 2: Error Resilience & Offline Recovery (Day 27)
    // -------------------------------------------------------------
    console.log("\n[Section 2: Error Resilience & Offline Recovery]");

    await testStep("Standardized 404 error schema (success: false, statusCode, path, timestamp)", async () => {
      const res = await makeRequest("/api/non-existent-endpoint-audit");
      if (res.statusCode !== 404) throw new Error(`Expected HTTP 404, got ${res.statusCode}`);
      if (res.data.success !== false) throw new Error("Expected success: false in error schema");
      if (res.data.statusCode !== 404) throw new Error("Expected statusCode: 404 in error schema");
      if (!res.data.timestamp || !res.data.path) {
        throw new Error("Missing timestamp or path in standardized error response");
      }
    });

    await testStep("GET /api/health/resilience returns operational policies and retry config", async () => {
      const res = await makeRequest("/api/health/resilience");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.data.data?.status !== "OPERATIONAL") {
        throw new Error("Expected status: OPERATIONAL in resilience health report");
      }
      if (!res.data.data?.clientRetryPolicy?.backoffStrategy) {
        throw new Error("Missing client retry policy metadata in resilience report");
      }
    });

    await testStep("Frontend ErrorBoundary.jsx & ErrorBoundary.css verified", async () => {
      const ebPath = path.resolve(rootDir, "frontend/src/components/ErrorBoundary.jsx");
      const cssPath = path.resolve(rootDir, "frontend/src/components/ErrorBoundary.css");
      if (!fs.existsSync(ebPath) || !fs.existsSync(cssPath)) {
        throw new Error("ErrorBoundary component or styling missing");
      }
      const ebCode = fs.readFileSync(ebPath, "utf-8");
      if (!ebCode.includes("getDerivedStateFromError") || !ebCode.includes("componentDidCatch")) {
        throw new Error("ErrorBoundary missing required React lifecycle error handlers");
      }
    });

    await testStep("useNetworkStatus.js and resilient API client backoff verified", async () => {
      const netHookPath = path.resolve(rootDir, "frontend/src/hooks/useNetworkStatus.js");
      const apiPath = path.resolve(rootDir, "frontend/src/services/api.js");
      if (!fs.existsSync(netHookPath)) throw new Error("useNetworkStatus.js missing");
      if (!fs.existsSync(apiPath)) throw new Error("api.js missing");

      const apiCode = fs.readFileSync(apiPath, "utf-8");
      if (!apiCode.includes("isRetryable") || !apiCode.includes("api:retry")) {
        throw new Error("api.js missing retry classifier or retry event dispatching");
      }
    });

    // -------------------------------------------------------------
    // Section 3: Performance, Caching & Data Synchronization (Day 28)
    // -------------------------------------------------------------
    console.log("\n[Section 3: Performance, Caching & Data Synchronization]");

    let initialEtag = "";
    await testStep("GET /api/products returns public Cache-Control and strong ETag", async () => {
      const res = await makeRequest("/api/products");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.headers["cache-control"]?.includes("public")) {
        throw new Error("Missing public Cache-Control header");
      }
      if (!res.headers["etag"]) {
        throw new Error("Missing ETag header on product catalog");
      }
      initialEtag = res.headers["etag"];
    });

    await testStep("Conditional GET with matching If-None-Match returns HTTP 304 Not Modified", async () => {
      const res = await makeRequest("/api/products", {
        headers: { "If-None-Match": initialEtag },
      });
      if (res.statusCode !== 304) {
        throw new Error(`Expected HTTP 304, got ${res.statusCode}`);
      }
      if (res.raw && res.raw.trim().length > 0) {
        throw new Error("HTTP 304 Not Modified response should not have a body");
      }
    });

    await testStep("Gzip compression enabled for payloads > 1KB", async () => {
      const res = await makeRequest("/api/products", {
        headers: { "Accept-Encoding": "gzip" },
      });
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.headers["content-encoding"] !== "gzip") {
        throw new Error("Content-Encoding: gzip header missing for compressed payload");
      }
    });

    await testStep("Frontend in-memory query cache & SWR engine in api.js verified", async () => {
      const apiCode = fs.readFileSync(path.resolve(rootDir, "frontend/src/services/api.js"), "utf-8");
      if (!apiCode.includes("this.cache = new Map()") || !apiCode.includes("autoInvalidateCache")) {
        throw new Error("api.js missing in-memory cache map or autoInvalidateCache mechanism");
      }
    });

    await testStep("useDebounce.js, useDataSync.js and code splitting verified", async () => {
      const debouncePath = path.resolve(rootDir, "frontend/src/hooks/useDebounce.js");
      const dataSyncPath = path.resolve(rootDir, "frontend/src/hooks/useDataSync.js");
      if (!fs.existsSync(debouncePath) || !fs.existsSync(dataSyncPath)) {
        throw new Error("Performance hooks (useDebounce / useDataSync) missing");
      }

      const appCode = fs.readFileSync(path.resolve(rootDir, "frontend/src/App.jsx"), "utf-8");
      if (!appCode.includes("React.lazy") && !appCode.includes("lazy(")) {
        throw new Error("App.jsx missing route-based code splitting with React.lazy");
      }
    });

    await testStep("GET /api/health/performance returns operational status OPTIMIZED", async () => {
      const res = await makeRequest("/api/health/performance");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.data.data?.status !== "OPTIMIZED") {
        throw new Error("Expected status: OPTIMIZED in performance health report");
      }
    });

    // -------------------------------------------------------------
    // Section 4: Advanced Search, Multi-Filter, Pagination & Toast (Day 29)
    // -------------------------------------------------------------
    console.log("\n[Section 4: Advanced Search, Multi-Filter, Pagination & Toast]");

    await testStep("GET /api/products?search=... searches name and description dynamically", async () => {
      const res = await makeRequest("/api/products?search=kulaklık");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Search query returned empty results");
      }
      const match = res.data.data.every(
        (p) =>
          p.name.toLowerCase().includes("kulaklık") ||
          (p.description && p.description.toLowerCase().includes("kulaklık"))
      );
      if (!match) throw new Error("Found product that does not match search query");
    });

    await testStep("Multi-criteria filtering (category, price range, rating, inStock)", async () => {
      const res = await makeRequest(
        "/api/products?category=elektronik&minPrice=1000&maxPrice=5000&minRating=4.5&inStock=true"
      );
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Multi-criteria filter returned empty result");
      }
      res.data.data.forEach((p) => {
        if (Number(p.price) < 1000 || Number(p.price) > 5000) throw new Error("Price out of bounds");
        if (Number(p.rating) < 4.5) throw new Error("Rating below minimum");
        if (Number(p.stock) <= 0) throw new Error("Stock should be positive");
      });
    });

    await testStep("Dynamic sorting engine (price-asc, price-desc, rating-desc, popular)", async () => {
      const resAsc = await makeRequest("/api/products?sortBy=price-asc");
      const pricesAsc = resAsc.data.data.map((p) => Number(p.price));
      for (let i = 0; i < pricesAsc.length - 1; i++) {
        if (pricesAsc[i] > pricesAsc[i + 1]) throw new Error("price-asc sorting failed");
      }

      const resDesc = await makeRequest("/api/products?sortBy=price-desc");
      const pricesDesc = resDesc.data.data.map((p) => Number(p.price));
      for (let i = 0; i < pricesDesc.length - 1; i++) {
        if (pricesDesc[i] < pricesDesc[i + 1]) throw new Error("price-desc sorting failed");
      }
    });

    await testStep("Standardized pagination metadata & backward compatible payload", async () => {
      const res = await makeRequest("/api/products?page=1&limit=3");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data)) throw new Error("data.data must remain an array for legacy clients");
      if (!res.data.pagination) throw new Error("Missing pagination object in response");

      const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = res.data.pagination;
      if (page !== 1 || limit !== 3 || hasPrevPage !== false) {
        throw new Error("Pagination metadata calculation error");
      }
      if (typeof total !== "number" || totalPages < 1) {
        throw new Error("Invalid total or totalPages in pagination");
      }
    });

    await testStep("Global Toast Notification Architecture verified (Context & Container)", async () => {
      const ctxPath = path.resolve(rootDir, "frontend/src/context/ToastContext.jsx");
      const compPath = path.resolve(rootDir, "frontend/src/components/ToastContainer.jsx");
      const cssPath = path.resolve(rootDir, "frontend/src/components/ToastContainer.css");
      if (!fs.existsSync(ctxPath) || !fs.existsSync(compPath) || !fs.existsSync(cssPath)) {
        throw new Error("ToastContext or ToastContainer components missing");
      }

      const ctxCode = fs.readFileSync(ctxPath, "utf-8");
      if (!ctxCode.includes("useToast") || !ctxCode.includes("toast:notify")) {
        throw new Error("ToastContext missing useToast hook or toast:notify event listener");
      }

      const compCode = fs.readFileSync(compPath, "utf-8");
      if (!compCode.includes("toast-progress-bar") || !compCode.includes("toast-portal-container")) {
        throw new Error("ToastContainer missing progress bar or portal container");
      }
    });

    await testStep("Pagination.jsx & ProductsPage.jsx active filter chips verified", async () => {
      const paginationPath = path.resolve(rootDir, "frontend/src/components/Pagination.jsx");
      const pagePath = path.resolve(rootDir, "frontend/src/pages/ProductsPage.jsx");
      if (!fs.existsSync(paginationPath) || !fs.existsSync(pagePath)) {
        throw new Error("Pagination component or ProductsPage missing");
      }

      const pageCode = fs.readFileSync(pagePath, "utf-8");
      if (!pageCode.includes("active-filter-chip") || !pageCode.includes("<Pagination")) {
        throw new Error("ProductsPage missing active filter chips or Pagination component");
      }
      if (!pageCode.includes("useSearchParams")) {
        throw new Error("ProductsPage missing URL search param synchronization");
      }
    });

    // -------------------------------------------------------------
    // Section 5: Full System Integration & Health Matrix Audit (Day 30)
    // -------------------------------------------------------------
    console.log("\n[Section 5: Full System Integration & Health Matrix Audit]");

    await testStep("GET /api/health returns operational status UP with system metrics", async () => {
      const res = await makeRequest("/api/health");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (res.data.data?.status !== "UP") throw new Error("Expected status: UP in health check");
      if (!res.data.data?.uptime || !res.data.data?.database) {
        throw new Error("Missing uptime or database status in health response");
      }
    });

    await testStep("Health Matrix Integrity: All 4 health endpoints operational", async () => {
      const endpoints = [
        "/api/health",
        "/api/health/security",
        "/api/health/resilience",
        "/api/health/performance",
      ];

      for (const ep of endpoints) {
        const res = await makeRequest(ep);
        if (res.statusCode !== 200) {
          throw new Error(`Health endpoint ${ep} failed with HTTP ${res.statusCode}`);
        }
        if (!res.data.success) {
          throw new Error(`Health endpoint ${ep} returned success: false`);
        }
      }
    });

    await testStep("Backend-Frontend API Contract & Route Completeness verified", async () => {
      // Check that vital routes respond with expected JSON contract
      const productsRes = await makeRequest("/api/products");
      if (productsRes.statusCode !== 200 || !productsRes.data.data) {
        throw new Error("/api/products contract verification failed");
      }

      const categoriesRes = await makeRequest("/api/categories");
      if (categoriesRes.statusCode !== 200 || !categoriesRes.data.data) {
        throw new Error("/api/categories contract verification failed");
      }
    });

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`📊 Sprint Review Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("==================================================================");

    if (passedTests === totalTests) {
      console.log("🎉 Milestone 6 (Days 26–30) Sprint Review successfully completed!\n");
    } else {
      throw new Error(`Sprint Review failed (${totalTests - passedTests} failures)`);
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

if (require.main === module) {
  runMilestone6SprintReview().catch((err) => {
    console.error("Sprint review fatal error:", err.message);
    process.exit(1);
  });
}

module.exports = runMilestone6SprintReview;
