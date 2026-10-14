/**
 * Milestone 7 - Day 32 Docker Containerization Verification Suite (#57)
 * Validates Dockerfiles, .dockerignore files, Nginx configuration,
 * and Docker Compose orchestration definitions.
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

function runDockerTests() {
  console.log("==================================================================");
  console.log("🐳 Starting Milestone 7 - Day 32 Docker Verification Suite");
  console.log("==================================================================\n");

  const rootDir = path.resolve(__dirname, "../../..");

  // 1. Backend Dockerfile verification
  testStep("backend/Dockerfile exists and defines multi-stage/production build", () => {
    const filePath = path.resolve(rootDir, "backend/Dockerfile");
    if (!fs.existsSync(filePath)) throw new Error("backend/Dockerfile not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("FROM node:") || !content.includes("EXPOSE 5000")) {
      throw new Error("backend/Dockerfile missing node base image or port 5000 expose");
    }
    if (!content.includes("HEALTHCHECK")) {
      throw new Error("backend/Dockerfile missing HEALTHCHECK instruction");
    }
    if (!content.includes("USER node")) {
      throw new Error("backend/Dockerfile must run as non-root 'USER node'");
    }
  });

  // 2. Backend .dockerignore verification
  testStep("backend/.dockerignore exists and excludes node_modules and env files", () => {
    const filePath = path.resolve(rootDir, "backend/.dockerignore");
    if (!fs.existsSync(filePath)) throw new Error("backend/.dockerignore not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("node_modules") || !content.includes(".env")) {
      throw new Error("backend/.dockerignore must exclude node_modules and .env");
    }
  });

  // 3. Frontend Dockerfile verification
  testStep("frontend/Dockerfile exists and implements multi-stage build with Nginx", () => {
    const filePath = path.resolve(rootDir, "frontend/Dockerfile");
    if (!fs.existsSync(filePath)) throw new Error("frontend/Dockerfile not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("AS builder") || !content.includes("FROM nginx:")) {
      throw new Error("frontend/Dockerfile must implement multi-stage build (Node builder -> Nginx server)");
    }
    if (!content.includes("EXPOSE 80")) {
      throw new Error("frontend/Dockerfile must expose port 80");
    }
    if (!content.includes("HEALTHCHECK")) {
      throw new Error("frontend/Dockerfile missing HEALTHCHECK instruction");
    }
  });

  // 4. Frontend Nginx configuration
  testStep("frontend/nginx.conf exists and defines SPA routing fallback & API reverse proxy", () => {
    const filePath = path.resolve(rootDir, "frontend/nginx.conf");
    if (!fs.existsSync(filePath)) throw new Error("frontend/nginx.conf not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("try_files $uri $uri/ /index.html;")) {
      throw new Error("frontend/nginx.conf missing SPA try_files directive");
    }
    if (!content.includes("proxy_pass http://backend:5000/api/;")) {
      throw new Error("frontend/nginx.conf missing /api/ reverse proxy to backend container");
    }
    if (!content.includes("gzip on;")) {
      throw new Error("frontend/nginx.conf missing gzip compression directive");
    }
  });

  // 5. Frontend .dockerignore verification
  testStep("frontend/.dockerignore exists and excludes node_modules and dist", () => {
    const filePath = path.resolve(rootDir, "frontend/.dockerignore");
    if (!fs.existsSync(filePath)) throw new Error("frontend/.dockerignore not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("node_modules") || !content.includes("dist")) {
      throw new Error("frontend/.dockerignore must exclude node_modules and dist");
    }
  });

  // 6. Root docker-compose.yml verification
  testStep("docker-compose.yml defines db, backend and frontend with health dependencies", () => {
    const filePath = path.resolve(rootDir, "docker-compose.yml");
    if (!fs.existsSync(filePath)) throw new Error("docker-compose.yml not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("postgres:16-alpine") || !content.includes("mini_ecommerce_db")) {
      throw new Error("docker-compose.yml missing PostgreSQL 16 database service");
    }
    if (!content.includes("mini_ecommerce_backend") || !content.includes("mini_ecommerce_frontend")) {
      throw new Error("docker-compose.yml missing backend or frontend services");
    }
    if (!content.includes("condition: service_healthy")) {
      throw new Error("docker-compose.yml missing service_healthy dependency condition");
    }
    if (!content.includes("ecommerce-network") || !content.includes("postgres_data:")) {
      throw new Error("docker-compose.yml missing bridge network or persistent volume definitions");
    }
  });

  // 7. docker-compose.dev.yml verification
  testStep("docker-compose.dev.yml defines local development overrides", () => {
    const filePath = path.resolve(rootDir, "docker-compose.dev.yml");
    if (!fs.existsSync(filePath)) throw new Error("docker-compose.dev.yml not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("mini_ecommerce_dev_db") || !content.includes("mini_ecommerce_dev_backend")) {
      throw new Error("docker-compose.dev.yml missing dev container names");
    }
  });

  // Summary
  console.log("\n==================================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  if (passedTests === totalTests) {
    console.log("🎉 Milestone 7 - Day 32 Docker verification passed successfully!\n");
  } else {
    throw new Error(`Docker tests failed (${totalTests - passedTests} failures)`);
  }
}

if (require.main === module) {
  runDockerTests();
}

module.exports = runDockerTests;
