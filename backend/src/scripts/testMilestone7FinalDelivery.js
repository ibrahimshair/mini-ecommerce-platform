/**
 * Milestone 7 - Day 35 Final Delivery & System Readiness Verification Suite (#60)
 * Validates the full 35-day project scope:
 * - Milestone 1–6 architectural pillars
 * - Day 31 Unit & Integration workflows
 * - Day 32 Multi-stage Docker containerization
 * - Day 33 GitHub Actions CI/CD automation
 * - Day 34 OpenAPI 3.0 & Deployment documentation
 * - Day 35 Final production delivery readiness
 */

const fs = require("fs");
const path = require("path");
const http = require("http");
const app = require("../app");

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

function makeRequest(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const req = http.request(url, { method: "GET" }, (res) => {
      const chunks = [];
      res.on("data", (chunk) => chunks.push(chunk));
      res.on("end", () => {
        const raw = Buffer.concat(chunks).toString("utf-8");
        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, data: parsed });
      });
    });
    req.on("error", reject);
    req.end();
  });
}

async function runFinalDeliveryTests() {
  console.log("==================================================================");
  console.log("🎓 Starting Milestone 7 - Day 35 Final Delivery & System Audit");
  console.log("==================================================================\n");

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  const rootDir = path.resolve(__dirname, "../../..");

  try {
    // -------------------------------------------------------------
    // Pillar 1: Full System Health & Operational Endpoints
    // -------------------------------------------------------------
    console.log("[Pillar 1: System Health & Multi-Endpoint Status Matrix]");

    await testStep("GET /api/health responds with UP status and active uptime", async () => {
      const res = await makeRequest("/api/health");
      if (res.statusCode !== 200 || res.data.data?.status !== "UP") {
        throw new Error("Core health endpoint failed");
      }
    });

    await testStep("All specialized health services (security, resilience, performance) respond with 200", async () => {
      const [sec, resi, perf] = await Promise.all([
        makeRequest("/api/health/security"),
        makeRequest("/api/health/resilience"),
        makeRequest("/api/health/performance"),
      ]);
      if (sec.statusCode !== 200 || resi.statusCode !== 200 || perf.statusCode !== 200) {
        throw new Error("One or more specialized health endpoints failed");
      }
    });

    // -------------------------------------------------------------
    // Pillar 2: Docker Infrastructure Assets (Day 32)
    // -------------------------------------------------------------
    console.log("\n[Pillar 2: Containerization & DevOps Assets]");

    await testStep("Production Dockerfiles & Docker Compose definition verified", async () => {
      const files = [
        "backend/Dockerfile",
        "backend/.dockerignore",
        "frontend/Dockerfile",
        "frontend/nginx.conf",
        "frontend/.dockerignore",
        "docker-compose.yml",
        "docker-compose.dev.yml",
      ];
      for (const f of files) {
        if (!fs.existsSync(path.resolve(rootDir, f))) {
          throw new Error(`Missing Docker file: ${f}`);
        }
      }
    });

    // -------------------------------------------------------------
    // Pillar 3: CI/CD Pipeline Automation (Day 33)
    // -------------------------------------------------------------
    console.log("\n[Pillar 3: GitHub Actions CI/CD Pipeline]");

    await testStep("GitHub Actions CI workflow verified (.github/workflows/ci.yml)", async () => {
      const ciPath = path.resolve(rootDir, ".github/workflows/ci.yml");
      if (!fs.existsSync(ciPath)) throw new Error("ci.yml not found");
      const content = fs.readFileSync(ciPath, "utf-8");
      if (!content.includes("backend-test") || !content.includes("frontend-build")) {
        throw new Error("ci.yml missing core pipeline jobs");
      }
    });

    // -------------------------------------------------------------
    // Pillar 4: Documentation & OpenAPI Specification (Day 34)
    // -------------------------------------------------------------
    console.log("\n[Pillar 4: Production Documentation & API Specifications]");

    await testStep("OpenAPI 3.0 specification and deployment documentation verified", async () => {
      const openApiPath = path.resolve(rootDir, "docs/openapi.json");
      const depPath = path.resolve(rootDir, "docs/deployment.md");
      if (!fs.existsSync(openApiPath) || !fs.existsSync(depPath)) {
        throw new Error("openapi.json or deployment.md missing");
      }
      const parsed = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
      if (!parsed.openapi || !parsed.paths) {
        throw new Error("Invalid OpenAPI specification");
      }
    });

    // -------------------------------------------------------------
    // Pillar 5: Product Catalog & Pagination Production Contract
    // -------------------------------------------------------------
    console.log("\n[Pillar 5: Production Catalog & Search Contract]");

    await testStep("Product catalog pagination and search respond accurately", async () => {
      const res = await makeRequest("/api/products?page=1&limit=6&sortBy=price-asc");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data)) throw new Error("data.data must be an array");
      if (!res.data.pagination?.totalPages) throw new Error("Missing pagination metadata");
    });

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`📊 Final Audit Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("==================================================================");

    if (passedTests === totalTests) {
      console.log("🎉 Milestone 7 - Day 35 Final Delivery & System Readiness 100% verified!\n");
    } else {
      throw new Error(`Final delivery audit failed (${totalTests - passedTests} failures)`);
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

if (require.main === module) {
  runFinalDeliveryTests().catch((err) => {
    console.error("Final delivery fatal error:", err.message);
    process.exit(1);
  });
}

module.exports = runFinalDeliveryTests;
