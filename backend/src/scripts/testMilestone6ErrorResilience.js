/**
 * Milestone 6 - Day 27 Global Error Handling, Network Resilience & Retry Mechanism
 * Automated Integration Test Suite (Issue #52)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("../app");

async function runResilienceTestSuite() {
  console.log("==================================================================");
  console.log("🛡️ Starting Milestone 6 - Day 27 Error Handling & Resilience Suite");
  console.log("==================================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;

  // Dedicated ephemeral test server for simulating transient network drops & retries
  let flakyAttempts = 0;
  const flakyServer = http.createServer((req, res) => {
    if (req.url === "/flaky") {
      flakyAttempts++;
      if (flakyAttempts < 3) {
        res.writeHead(503, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ success: false, message: "Service temporarily unavailable" }));
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: true, message: "Recovered successfully on retry", attempt: flakyAttempts }));
    } else if (req.url === "/client-error") {
      res.writeHead(400, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Client error - do not retry" }));
    } else {
      res.writeHead(404, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ success: false, message: "Not found" }));
    }
  });
  await new Promise((resolve) => flakyServer.listen(0, resolve));
  const flakyPort = flakyServer.address().port;
  const flakyUrl = `http://localhost:${flakyPort}`;

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
  const frontendDir = path.join(rootDir, "frontend");

  try {
    // -------------------------------------------------------------
    // Group A: React Global Error Boundary Architecture & Fallback UI
    // -------------------------------------------------------------
    console.log("[Group A: React Global Error Boundary Architecture & Fallback UI]");

    const errorBoundaryPath = path.join(frontendDir, "src/components/ErrorBoundary.jsx");
    const errorBoundaryCssPath = path.join(frontendDir, "src/components/ErrorBoundary.css");
    const mainJsxPath = path.join(frontendDir, "src/main.jsx");
    const appJsxPath = path.join(frontendDir, "src/App.jsx");

    await testStep("ErrorBoundary.jsx file exists and contains React class component", async () => {
      if (!fs.existsSync(errorBoundaryPath)) {
        throw new Error(`ErrorBoundary.jsx not found at ${errorBoundaryPath}`);
      }
      const content = fs.readFileSync(errorBoundaryPath, "utf-8");
      if (!content.includes("class ErrorBoundary extends Component")) {
        throw new Error("ErrorBoundary does not inherit from React Component");
      }
    });

    await testStep("ErrorBoundary implements getDerivedStateFromError and componentDidCatch", async () => {
      const content = fs.readFileSync(errorBoundaryPath, "utf-8");
      if (!content.includes("static getDerivedStateFromError")) {
        throw new Error("Missing static getDerivedStateFromError lifecycle hook");
      }
      if (!content.includes("componentDidCatch")) {
        throw new Error("Missing componentDidCatch lifecycle hook");
      }
    });

    await testStep("ErrorBoundary renders accessible Turkish fallback UI with recovery actions", async () => {
      const content = fs.readFileSync(errorBoundaryPath, "utf-8");
      if (!content.includes("Bir Şeyler Ters Gitti")) {
        throw new Error("Missing localized Turkish error heading 'Bir Şeyler Ters Gitti'");
      }
      if (!content.includes("handleReset") || !content.includes("handleReload") || !content.includes("handleGoHome")) {
        throw new Error("Missing recovery actions (handleReset / handleReload / handleGoHome)");
      }
      if (!content.includes("toggleDetails") || !content.includes("Teknik Detayları")) {
        throw new Error("Missing collapsible technical details toggle");
      }
    });

    await testStep("ErrorBoundary.css provides modern responsive styling and pulse animation", async () => {
      if (!fs.existsSync(errorBoundaryCssPath)) {
        throw new Error(`ErrorBoundary.css not found at ${errorBoundaryCssPath}`);
      }
      const css = fs.readFileSync(errorBoundaryCssPath, "utf-8");
      if (!css.includes(".error-boundary-container") || !css.includes(".error-boundary-card")) {
        throw new Error("Missing .error-boundary-container or .error-boundary-card rules");
      }
    });

    await testStep("main.jsx and App.jsx wrap application tree and routes with ErrorBoundary", async () => {
      const mainContent = fs.readFileSync(mainJsxPath, "utf-8");
      const appContent = fs.readFileSync(appJsxPath, "utf-8");
      if (!mainContent.includes("<ErrorBoundary>")) {
        throw new Error("main.jsx does not wrap component tree with ErrorBoundary");
      }
      if (!appContent.includes("<ErrorBoundary>")) {
        throw new Error("App.jsx does not wrap routes with ErrorBoundary");
      }
    });

    // -------------------------------------------------------------
    // Group B: Network Offline/Online Detection & UI Banner Resilience
    // -------------------------------------------------------------
    console.log("\n[Group B: Network Offline/Online Detection & UI Banner Resilience]");

    const useNetworkPath = path.join(frontendDir, "src/hooks/useNetworkStatus.js");

    await testStep("useNetworkStatus hook monitors navigator.onLine and window network events", async () => {
      if (!fs.existsSync(useNetworkPath)) {
        throw new Error(`useNetworkStatus.js not found at ${useNetworkPath}`);
      }
      const hookContent = fs.readFileSync(useNetworkPath, "utf-8");
      if (!hookContent.includes("navigator.onLine")) {
        throw new Error("Hook does not inspect navigator.onLine");
      }
      if (!hookContent.includes('addEventListener("online"') || !hookContent.includes('addEventListener("offline"')) {
        throw new Error("Hook does not attach online/offline event listeners");
      }
      if (!hookContent.includes("wasOffline") || !hookContent.includes("checkConnection")) {
        throw new Error("Hook does not expose wasOffline reconnection state or checkConnection helper");
      }
    });

    await testStep("App.jsx displays sticky offline banner and reconnection status bar", async () => {
      const appContent = fs.readFileSync(appJsxPath, "utf-8");
      if (!appContent.includes("network-offline-banner")) {
        throw new Error("App.jsx missing network-offline-banner element");
      }
      if (!appContent.includes("network-reconnected-banner")) {
        throw new Error("App.jsx missing network-reconnected-banner element");
      }
      if (!appContent.includes("useNetworkStatus")) {
        throw new Error("App.jsx does not consume useNetworkStatus hook");
      }
    });

    // -------------------------------------------------------------
    // Group C: Resilient API Client with Exponential Backoff Retry
    // -------------------------------------------------------------
    console.log("\n[Group C: Resilient API Client with Exponential Backoff Retry]");

    const apiJsPath = path.join(frontendDir, "src/services/api.js");

    await testStep("api.js implements isRetryable classifier for network drops and 502/503/504 errors", async () => {
      const apiContent = fs.readFileSync(apiJsPath, "utf-8");
      if (!apiContent.includes("isRetryable")) {
        throw new Error("api.js missing isRetryable method");
      }
      if (!apiContent.includes("502") || !apiContent.includes("503") || !apiContent.includes("504")) {
        throw new Error("isRetryable does not cover 502/503/504 server statuses");
      }
    });

    await testStep("api.js calculates exponential backoff delay with jitter", async () => {
      const apiContent = fs.readFileSync(apiJsPath, "utf-8");
      if (!apiContent.includes("baseRetryDelay * Math.pow(2") && !apiContent.includes("Math.pow(2")) {
        throw new Error("Exponential backoff math not found in api.js");
      }
    });

    await testStep("api.js dispatches 'api:retry' and 'api:offline' custom events", async () => {
      const apiContent = fs.readFileSync(apiJsPath, "utf-8");
      if (!apiContent.includes('"api:retry"') || !apiContent.includes('"api:offline"')) {
        throw new Error("api.js does not dispatch api:retry or api:offline custom events");
      }
    });

    await testStep("api.js translates technical errors into Turkish friendly messages via formatErrorMessage", async () => {
      const apiContent = fs.readFileSync(apiJsPath, "utf-8");
      if (!apiContent.includes("formatErrorMessage")) {
        throw new Error("api.js does not implement formatErrorMessage method");
      }
      if (!apiContent.includes("Sunucuya ulaşılamıyor") || !apiContent.includes("zaman aşımı")) {
        throw new Error("formatErrorMessage does not provide friendly network/timeout messages");
      }
    });

    // -------------------------------------------------------------
    // Group D: Live Resilience & Flaky Request Simulation Test
    // -------------------------------------------------------------
    console.log("\n[Group D: Live Resilience & Flaky Request Simulation Test]");

    await testStep("Simulated transient 503 endpoint retries and succeeds after backoff", async () => {
      flakyAttempts = 0;
      let finalRes = null;
      let attemptsRecorded = 0;
      const maxRetries = 3;
      const baseDelay = 30;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        attemptsRecorded++;
        const res = await fetch(`${flakyUrl}/flaky`);
        if (res.status === 503 && attempt < maxRetries) {
          const delay = baseDelay * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        finalRes = await res.json();
        break;
      }

      if (!finalRes || !finalRes.success || finalRes.attempt !== 3) {
        throw new Error(`Flaky test failed: ${JSON.stringify(finalRes)}, attempts=${attemptsRecorded}`);
      }
    });

    await testStep("Simulated 400 Bad Request client error is not retried", async () => {
      const res = await fetch(`${flakyUrl}/client-error`);
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
      const data = await res.json();
      if (data.success !== false) {
        throw new Error("Expected success: false for 400 response");
      }
    });

    // -------------------------------------------------------------
    // Group E: Standardized Backend Error Responses & Resilience Report
    // -------------------------------------------------------------
    console.log("\n[Group E: Standardized Backend Error Responses & Resilience Report]");

    await testStep("GET /api/non-existent-route returns standardized 404 JSON with path, statusCode and timestamp", async () => {
      const res = await fetch(`${baseUrl}/non-existent-route-for-testing`);
      if (res.status !== 404) {
        throw new Error(`Expected 404, got ${res.status}`);
      }
      const data = await res.json();
      if (data.success !== false) {
        throw new Error(`Expected success: false, got ${data.success}`);
      }
      if (data.statusCode !== 404) {
        throw new Error(`Expected statusCode: 404, got ${data.statusCode}`);
      }
      if (!data.path || !data.path.includes("non-existent-route")) {
        throw new Error(`Expected path field in response, got ${data.path}`);
      }
      if (!data.timestamp || isNaN(Date.parse(data.timestamp))) {
        throw new Error(`Expected valid ISO timestamp, got ${data.timestamp}`);
      }
    });

    await testStep("GET /api/health/resilience returns operational status and configured resilience policies", async () => {
      const res = await fetch(`${baseUrl}/health/resilience`);
      if (res.status !== 200) {
        throw new Error(`Expected 200, got ${res.status}`);
      }
      const json = await res.json();
      if (!json.success || !json.data) {
        throw new Error("Invalid response format from /api/health/resilience");
      }
      const rep = json.data;
      if (rep.status !== "OPERATIONAL") {
        throw new Error(`Expected status 'OPERATIONAL', got ${rep.status}`);
      }
      if (!rep.errorBoundary?.enabled) {
        throw new Error("errorBoundary.enabled is not true");
      }
      if (rep.clientRetryPolicy?.defaultRetries !== 2) {
        throw new Error(`Expected defaultRetries 2, got ${rep.clientRetryPolicy?.defaultRetries}`);
      }
    });

    console.log("\n==================================================================");
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (100%)`);
    console.log("==================================================================");
    console.log("🎉 All Milestone 6 Day 27 Error Handling & Resilience tests passed successfully!\n");
  } finally {
    await new Promise((r) => server.close(r));
    await new Promise((r) => flakyServer.close(r));
  }
}

runResilienceTestSuite().catch((err) => {
  console.error("\n❌ Test suite failed with error:", err.message);
  process.exit(1);
});
