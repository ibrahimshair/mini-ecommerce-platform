/**
 * Milestone 7 - Day 34 Documentation & OpenAPI Specification Verification Suite (#59)
 * Validates OpenAPI 3.0 specification syntax, deployment documentation,
 * and endpoint reference guides.
 */

const fs = require("fs");
const path = require("path");

let passedTests = 0;
let totalTests = 0;

function testStep(name, fn) {
  totalTests++;
  process.stdout.write(`[Test ${totalTests}] ${name} ... `);
  try {
    fn();
    console.log("✅ PASSED");
    passedTests++;
  } catch (error) {
    console.log("❌ FAILED");
    console.error(`   Error: ${error.message}`);
    process.exitCode = 1;
  }
}

function runDocsTests() {
  console.log("==================================================================");
  console.log("📚 Starting Milestone 7 - Day 34 Documentation Verification Suite");
  console.log("==================================================================\n");

  const rootDir = path.resolve(__dirname, "../../..");
  const openApiPath = path.resolve(rootDir, "docs/openapi.json");
  const deploymentPath = path.resolve(rootDir, "docs/deployment.md");
  const apiDocPath = path.resolve(rootDir, "docs/api.md");

  // 1. OpenAPI 3.0 specification validity
  testStep("docs/openapi.json exists and contains valid JSON", () => {
    if (!fs.existsSync(openApiPath)) throw new Error("docs/openapi.json not found");
    const raw = fs.readFileSync(openApiPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.openapi || !parsed.openapi.startsWith("3.")) {
      throw new Error("Invalid OpenAPI version (expected 3.x)");
    }
    if (!parsed.info?.title || !parsed.paths) {
      throw new Error("OpenAPI specification missing info or paths section");
    }
  });

  // 2. OpenAPI path coverage
  testStep("docs/openapi.json covers Authentication, Products, Cart, Orders, Admin, and Health", () => {
    const parsed = JSON.parse(fs.readFileSync(openApiPath, "utf-8"));
    const requiredPaths = [
      "/auth/register",
      "/auth/login",
      "/products",
      "/categories",
      "/cart",
      "/orders",
      "/admin/stats",
      "/health",
      "/health/security",
      "/health/resilience",
      "/health/performance",
    ];

    for (const p of requiredPaths) {
      if (!parsed.paths[p]) {
        throw new Error(`OpenAPI specification missing path: ${p}`);
      }
    }
  });

  // 3. Deployment guide verification
  testStep("docs/deployment.md exists and covers Docker, Nginx, SSL, and Backups", () => {
    if (!fs.existsSync(deploymentPath)) throw new Error("docs/deployment.md not found");
    const content = fs.readFileSync(deploymentPath, "utf-8");
    if (!content.includes("docker compose") || !content.includes("Nginx")) {
      throw new Error("docs/deployment.md missing Docker or Nginx instructions");
    }
    if (!content.includes("Let's Encrypt") || !content.includes("pg_dump")) {
      throw new Error("docs/deployment.md missing SSL or PostgreSQL backup commands");
    }
  });

  // 4. API Reference documentation verification
  testStep("docs/api.md exists and provides endpoint documentation", () => {
    if (!fs.existsSync(apiDocPath)) throw new Error("docs/api.md not found");
    const content = fs.readFileSync(apiDocPath, "utf-8");
    if (!content.includes("/api/products") || !content.includes("/api/auth")) {
      throw new Error("docs/api.md missing core endpoint references");
    }
  });

  // Summary
  console.log("\n==================================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 Milestone 7 - Day 34 Documentation verification passed successfully!\n");
  } else {
    throw new Error(`Documentation tests failed (${totalTests - passedTests} failures)`);
  }
}

if (require.main === module) {
  runDocsTests();
}

module.exports = runDocsTests;
