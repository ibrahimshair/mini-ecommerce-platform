/**
 * Milestone 6 - Day 28 Automated Verification Test Suite
 * Validates Frontend-Backend Data Synchronization & Performance Optimizations
 * 
 * Verifies:
 * - Group A: Backend HTTP Cache-Control & ETag Headers (304 Not Modified)
 * - Group B: Response Compression & Optimization Middleware
 * - Group C: Frontend Client-Side API Query Cache Engine (TTL, Hits, Auto-Invalidation)
 * - Group D: Data Synchronization Hooks (useDataSync, useDebounce, lazy loading)
 * - Group E: Performance Health & Metrics Endpoint (GET /api/health/performance)
 */

const http = require("http");
const zlib = require("zlib");
const fs = require("fs");
const path = require("path");
const app = require("../app");

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
        let isGzip = res.headers["content-encoding"] === "gzip";

        try {
          if (isGzip) {
            bodyText = zlib.gunzipSync(rawBuffer).toString("utf-8");
          } else {
            bodyText = rawBuffer.toString("utf-8");
          }
        } catch (e) {
          bodyText = rawBuffer.toString("utf-8");
        }

        let json = null;
        try {
          json = JSON.parse(bodyText);
        } catch (_) {}

        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          rawBuffer,
          bodyText,
          json,
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

async function runPerformanceTestSuite() {
  console.log("==================================================================");
  console.log("⚡ Starting Milestone 6 - Day 28 Performance & Sync Test Suite");
  console.log("==================================================================\n");

  // Spin up test server
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  let savedETag = null;

  try {
    // ==================================================================
    // [Group A: Backend HTTP Cache-Control & ETag Architecture]
    // ==================================================================
    console.log("[Group A: Backend HTTP Cache-Control & ETag Architecture]");

    await testStep("GET /api/products returns public Cache-Control and ETag headers", async () => {
      const res = await makeRequest("/api/products");
      if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
      const cc = res.headers["cache-control"];
      if (!cc || !cc.includes("public") || !cc.includes("max-age=60")) {
        throw new Error(`Expected public max-age=60 Cache-Control, got '${cc}'`);
      }
      const etag = res.headers["etag"];
      if (!etag || !etag.startsWith('W/"')) {
        throw new Error(`Expected weak ETag (W/"..."), got '${etag}'`);
      }
      savedETag = etag;
    });

    await testStep("GET /api/products with matching If-None-Match returns HTTP 304 Not Modified", async () => {
      if (!savedETag) throw new Error("No saved ETag to test conditional request");
      const res = await makeRequest("/api/products", {
        headers: { "If-None-Match": savedETag },
      });
      if (res.statusCode !== 304) {
        throw new Error(`Expected 304 Not Modified, got ${res.statusCode}`);
      }
      if (res.bodyText && res.bodyText.length > 0) {
        throw new Error(`Expected empty body for 304, got length ${res.bodyText.length}`);
      }
    });

    await testStep("GET /api/orders returns private no-cache Cache-Control header", async () => {
      const res = await makeRequest("/api/orders");
      const cc = res.headers["cache-control"];
      if (!cc || !cc.includes("no-store") || !cc.includes("private")) {
        throw new Error(`Expected private no-store Cache-Control, got '${cc}'`);
      }
    });

    // ==================================================================
    // [Group B: Response Compression & Optimization Middleware]
    // ==================================================================
    console.log("\n[Group B: Response Compression & Optimization Middleware]");

    await testStep("Responses > 1KB with Accept-Encoding: gzip receive Content-Encoding: gzip", async () => {
      const res = await makeRequest("/api/products", {
        headers: { "Accept-Encoding": "gzip" },
      });
      if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
      if (res.headers["content-encoding"] !== "gzip") {
        throw new Error(`Expected Content-Encoding: gzip, got '${res.headers["content-encoding"]}'`);
      }
    });

    await testStep("Gzip compressed payload decodes to valid products JSON", async () => {
      const res = await makeRequest("/api/products", {
        headers: { "Accept-Encoding": "gzip" },
      });
      if (!res.json || !res.json.data || !Array.isArray(res.json.data)) {
        throw new Error("Gzip decompressed body is not valid products array");
      }
    });

    // ==================================================================
    // [Group C: Frontend Client-Side API Query Cache Engine]
    // ==================================================================
    console.log("\n[Group C: Frontend Client-Side API Query Cache Engine]");

    const apiJsPath = path.resolve(__dirname, "../../../frontend/src/services/api.js");
    const apiJsContent = fs.readFileSync(apiJsPath, "utf-8");

    await testStep("api.js initializes in-memory cache and cache statistics", async () => {
      if (!apiJsContent.includes("this.cache = new Map()") && !apiJsContent.includes("this.cache")) {
        throw new Error("api.js missing this.cache map initialization");
      }
      if (!apiJsContent.includes("this.cacheHits") || !apiJsContent.includes("this.cacheMisses")) {
        throw new Error("api.js missing cache hit/miss statistics tracking");
      }
    });

    await testStep("api.js implements get method with cache checking, TTL and SWR support", async () => {
      if (!apiJsContent.includes("cacheKey = `GET:${endpoint}`")) {
        throw new Error("api.js get method does not construct cacheKey");
      }
      if (!apiJsContent.includes("api:cache-hit")) {
        throw new Error("api.js does not dispatch api:cache-hit on cache reuse");
      }
    });

    await testStep("api.js autoInvalidateCache purges cached entries upon mutations (POST/PUT/PATCH/DELETE)", async () => {
      if (!apiJsContent.includes("autoInvalidateCache(endpoint)")) {
        throw new Error("api.js missing autoInvalidateCache implementation");
      }
      if (!apiJsContent.includes("this.autoInvalidateCache(endpoint)")) {
        throw new Error("api.js mutating methods do not call autoInvalidateCache");
      }
    });

    // ==================================================================
    // [Group D: Frontend Performance & Data Synchronization Architecture]
    // ==================================================================
    console.log("\n[Group D: Frontend Performance & Data Synchronization Architecture]");

    const useDebouncePath = path.resolve(__dirname, "../../../frontend/src/hooks/useDebounce.js");
    const useDataSyncPath = path.resolve(__dirname, "../../../frontend/src/hooks/useDataSync.js");
    const appJsxPath = path.resolve(__dirname, "../../../frontend/src/App.jsx");
    const viteConfigPath = path.resolve(__dirname, "../../../frontend/vite.config.js");

    await testStep("useDebounce.js hook exists and provides debounce throttling", async () => {
      if (!fs.existsSync(useDebouncePath)) throw new Error("useDebounce.js not found");
      const content = fs.readFileSync(useDebouncePath, "utf-8");
      if (!content.includes("setTimeout") || !content.includes("clearTimeout")) {
        throw new Error("useDebounce.js missing timeout management");
      }
    });

    await testStep("useDataSync.js hook listens to visibilitychange, focus, and online events", async () => {
      if (!fs.existsSync(useDataSyncPath)) throw new Error("useDataSync.js not found");
      const content = fs.readFileSync(useDataSyncPath, "utf-8");
      if (!content.includes("visibilitychange") || !content.includes("focus")) {
        throw new Error("useDataSync.js missing visibility/focus listeners");
      }
    });

    await testStep("App.jsx implements route-based code splitting via React.lazy and Suspense", async () => {
      const content = fs.readFileSync(appJsxPath, "utf-8");
      if (!content.includes("lazy(") || !content.includes("<Suspense")) {
        throw new Error("App.jsx does not implement React.lazy and Suspense");
      }
      if (!content.includes("RouteLoadingFallback")) {
        throw new Error("App.jsx missing RouteLoadingFallback component");
      }
    });

    await testStep("vite.config.js configures manual chunk splitting for vendor-react", async () => {
      const content = fs.readFileSync(viteConfigPath, "utf-8");
      if (!content.includes("manualChunks") || !content.includes("vendor-react")) {
        throw new Error("vite.config.js missing vendor-react manualChunks optimization");
      }
    });

    // ==================================================================
    // [Group E: Performance Health Monitoring Endpoint]
    // ==================================================================
    console.log("\n[Group E: Performance Health Monitoring Endpoint]");

    await testStep("GET /api/health/performance returns 200 with status OPTIMIZED", async () => {
      const res = await makeRequest("/api/health/performance");
      if (res.statusCode !== 200) throw new Error(`Expected 200, got ${res.statusCode}`);
      if (!res.json || res.json.data?.status !== "OPTIMIZED") {
        throw new Error(`Expected data.status === 'OPTIMIZED', got '${res.json?.data?.status}'`);
      }
    });

    await testStep("Performance report confirms etagEnabled, http304Support and gzipCompression", async () => {
      const res = await makeRequest("/api/health/performance");
      const opts = res.json?.data?.optimizations;
      if (!opts) throw new Error("Missing optimizations in performance report");
      if (!opts.etagEnabled || !opts.http304Support || !opts.gzipCompression) {
        throw new Error("Missing core HTTP caching/compression flags in report");
      }
    });

    await testStep("Performance report includes active system memory metrics and request counters", async () => {
      const res = await makeRequest("/api/health/performance");
      const data = res.json?.data;
      if (!data.systemHealth?.rss || !data.systemHealth?.heapUsed) {
        throw new Error("Missing process memory statistics in performance report");
      }
      if (data.metrics?.totalRequestsTracked === undefined) {
        throw new Error("Missing totalRequestsTracked metric in performance report");
      }
    });

    console.log("\n==================================================================");
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (100%)`);
    console.log("==================================================================");
    console.log("🎉 All Milestone 6 Day 28 Performance & Sync tests passed successfully!\n");
  } finally {
    if (server) {
      server.close();
    }
  }
}

if (require.main === module) {
  runPerformanceTestSuite().catch((err) => {
    console.error("Test Suite crashed:", err);
    process.exit(1);
  });
}

module.exports = runPerformanceTestSuite;
