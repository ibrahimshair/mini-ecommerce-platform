/**
 * Milestone 7 - Day 33 CI/CD Pipeline & GitHub Actions Verification Suite (#58)
 * Validates CI/CD workflow definition, jobs, triggers, postgres service container,
 * test commands, and artifact caching.
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

function runCICDTests() {
  console.log("==================================================================");
  console.log("🚀 Starting Milestone 7 - Day 33 CI/CD Pipeline Verification Suite");
  console.log("==================================================================\n");

  const rootDir = path.resolve(__dirname, "../../..");
  const ciPath = path.resolve(rootDir, ".github/workflows/ci.yml");

  testStep(".github/workflows/ci.yml exists", () => {
    if (!fs.existsSync(ciPath)) {
      throw new Error(".github/workflows/ci.yml not found");
    }
  });

  const content = fs.readFileSync(ciPath, "utf-8");

  testStep("Workflow defines push and pull_request trigger filters", () => {
    if (!content.includes("push:") || !content.includes("pull_request:")) {
      throw new Error("Missing push or pull_request triggers");
    }
    if (!content.includes("main") || !content.includes("feature/**")) {
      throw new Error("Missing branch pattern filters in triggers");
    }
  });

  testStep("Backend test job configures PostgreSQL service container and npm test", () => {
    if (!content.includes("backend-test:") || !content.includes("postgres:16-alpine")) {
      throw new Error("Missing backend-test job or postgres:16-alpine service container");
    }
    if (!content.includes("npm test") || !content.includes("npm ci")) {
      throw new Error("Missing npm ci or npm test steps in backend job");
    }
  });

  testStep("Frontend build job configures npm run build and artifact archiving", () => {
    if (!content.includes("frontend-build:") || !content.includes("npm run build")) {
      throw new Error("Missing frontend-build job or npm run build execution");
    }
    if (!content.includes("actions/upload-artifact@v4")) {
      throw new Error("Missing upload-artifact step for frontend build output");
    }
  });

  testStep("Security audit and Docker validation jobs configured", () => {
    if (!content.includes("security-audit:") || !content.includes("npm audit")) {
      throw new Error("Missing security audit job");
    }
    if (!content.includes("docker-validation:") || !content.includes("docker compose config")) {
      throw new Error("Missing docker validation job");
    }
  });

  // Summary
  console.log("\n==================================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 Milestone 7 - Day 33 CI/CD verification passed successfully!\n");
  } else {
    throw new Error(`CI/CD tests failed (${totalTests - passedTests} failures)`);
  }
}

if (require.main === module) {
  runCICDTests();
}

module.exports = runCICDTests;
