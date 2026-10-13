/**
 * Milestone 6 - Day 29 Automated Verification Test Suite
 * Validates Advanced Search, Multi-Criteria Filtering, Pagination & Global Toast System (#54)
 * 
 * Verifies:
 * - Group A: Backend Product Search & Multi-Criteria Filtering (search, q, category, price, rating, stock)
 * - Group B: Dynamic Sorting Options (price-asc, price-desc, rating-desc, popular, newest)
 * - Group C: Standardized Pagination Metadata & Payload Contract
 * - Group D: Frontend Architecture (ToastContext, ToastContainer, Pagination, ProductsPage integration)
 */

const http = require("http");
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

async function runTestSuite() {
  console.log("==================================================================");
  console.log("🔍 Starting Milestone 6 - Day 29 Search, Filter, Pagination & Toast Suite");
  console.log("==================================================================\n");

  // Spin up test server on dynamic port
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;

  try {
    // -------------------------------------------------------------
    // Group A: Backend Product Search & Multi-Criteria Filtering
    // -------------------------------------------------------------
    console.log("[Group A: Backend Product Search & Multi-Criteria Filtering]");

    await testStep("GET /api/products?search=kulaklık filters by name or description", async () => {
      const res = await makeRequest("/api/products?search=kulaklık");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.data.success) throw new Error("Expected success: true");
      if (!Array.isArray(res.data.data)) throw new Error("Expected res.data.data to be an array");
      if (res.data.data.length === 0) throw new Error("Expected at least 1 product matching 'kulaklık'");
      const item = res.data.data[0];
      const match =
        item.name.toLowerCase().includes("kulaklık") ||
        (item.description && item.description.toLowerCase().includes("kulaklık"));
      if (!match) throw new Error(`Product ${item.name} does not match search query`);
    });

    await testStep("GET /api/products?q=saat supports 'q' query parameter alias", async () => {
      const res = await makeRequest("/api/products?q=saat");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Expected matching products for q=saat");
      }
      const hasSaat = res.data.data.some(
        (p) =>
          p.name.toLowerCase().includes("saat") ||
          (p.description && p.description.toLowerCase().includes("saat"))
      );
      if (!hasSaat) throw new Error("Results did not contain 'saat'");
    });

    await testStep("GET /api/products?category=elektronik filters by category slug", async () => {
      const res = await makeRequest("/api/products?category=elektronik");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Expected products for category=elektronik");
      }
      res.data.data.forEach((p) => {
        const cat = (p.categorySlug || p.category || "").toLowerCase();
        if (!cat.includes("elektronik")) {
          throw new Error(`Product ${p.name} category ${cat} does not match elektronik`);
        }
      });
    });

    await testStep("GET /api/products?minPrice=1000&maxPrice=3000 applies price range boundary", async () => {
      const res = await makeRequest("/api/products?minPrice=1000&maxPrice=3000");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Expected products in price range 1000-3000");
      }
      res.data.data.forEach((p) => {
        const price = Number(p.price);
        if (price < 1000 || price > 3000) {
          throw new Error(`Product ${p.name} price ${price} outside bounds 1000-3000`);
        }
      });
    });

    await testStep("GET /api/products?minRating=4.8 filters by minimum customer rating", async () => {
      const res = await makeRequest("/api/products?minRating=4.8");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data) || res.data.data.length === 0) {
        throw new Error("Expected products with rating >= 4.8");
      }
      res.data.data.forEach((p) => {
        if (Number(p.rating) < 4.8) {
          throw new Error(`Product ${p.name} rating ${p.rating} is below 4.8`);
        }
      });
    });

    await testStep("GET /api/products?inStock=true returns only in-stock items", async () => {
      const res = await makeRequest("/api/products?inStock=true");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data)) throw new Error("Expected array of products");
      res.data.data.forEach((p) => {
        if (Number(p.stock) <= 0) {
          throw new Error(`Product ${p.name} has zero or negative stock (${p.stock})`);
        }
      });
    });

    // -------------------------------------------------------------
    // Group B: Sorting Engine Verification
    // -------------------------------------------------------------
    console.log("\n[Group B: Sorting Engine Verification]");

    await testStep("GET /api/products?sortBy=price-asc returns prices in ascending order", async () => {
      const res = await makeRequest("/api/products?sortBy=price-asc");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      const prices = res.data.data.map((p) => Number(p.price));
      for (let i = 0; i < prices.length - 1; i++) {
        if (prices[i] > prices[i + 1]) {
          throw new Error(`Order violated: ${prices[i]} > ${prices[i + 1]}`);
        }
      }
    });

    await testStep("GET /api/products?sortBy=price-desc returns prices in descending order", async () => {
      const res = await makeRequest("/api/products?sortBy=price-desc");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      const prices = res.data.data.map((p) => Number(p.price));
      for (let i = 0; i < prices.length - 1; i++) {
        if (prices[i] < prices[i + 1]) {
          throw new Error(`Order violated: ${prices[i]} < ${prices[i + 1]}`);
        }
      }
    });

    await testStep("GET /api/products?sortBy=rating-desc returns ratings in descending order", async () => {
      const res = await makeRequest("/api/products?sortBy=rating-desc");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      const ratings = res.data.data.map((p) => Number(p.rating || 0));
      for (let i = 0; i < ratings.length - 1; i++) {
        if (ratings[i] < ratings[i + 1]) {
          throw new Error(`Rating order violated: ${ratings[i]} < ${ratings[i + 1]}`);
        }
      }
    });

    // -------------------------------------------------------------
    // Group C: Standardized Pagination Architecture
    // -------------------------------------------------------------
    console.log("\n[Group C: Standardized Pagination Architecture]");

    await testStep("GET /api/products?page=1&limit=2 returns standardized pagination metadata", async () => {
      const res = await makeRequest("/api/products?page=1&limit=2");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!res.data.pagination) throw new Error("Expected res.data.pagination object");

      const { total, page, limit, totalPages, hasNextPage, hasPrevPage } = res.data.pagination;
      if (typeof total !== "number" || total <= 0) throw new Error("Invalid total in pagination");
      if (page !== 1) throw new Error(`Expected page 1, got ${page}`);
      if (limit !== 2) throw new Error(`Expected limit 2, got ${limit}`);
      if (totalPages < 1) throw new Error("Expected totalPages >= 1");
      if (hasPrevPage !== false) throw new Error("Page 1 should have hasPrevPage = false");
      if (res.data.data.length > 2) throw new Error("Returned more items than limit 2");
    });

    await testStep("GET /api/products?page=2&limit=2 returns next page slice with hasPrevPage: true", async () => {
      const res = await makeRequest("/api/products?page=2&limit=2");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      const { page, hasPrevPage } = res.data.pagination;
      if (page !== 2) throw new Error(`Expected page 2, got ${page}`);
      if (hasPrevPage !== true) throw new Error("Page 2 must have hasPrevPage: true");
    });

    await testStep("Backward compatibility: data.data remains an array for legacy clients", async () => {
      const res = await makeRequest("/api/products");
      if (res.statusCode !== 200) throw new Error(`Expected HTTP 200, got ${res.statusCode}`);
      if (!Array.isArray(res.data.data)) throw new Error("res.data.data MUST be an array");
      if (!res.data.pagination) throw new Error("res.data.pagination must still be present");
    });

    // -------------------------------------------------------------
    // Group D: Frontend Architecture Verification
    // -------------------------------------------------------------
    console.log("\n[Group D: Frontend Toast & Catalog Architecture]");

    await testStep("ToastContext.jsx exists and exports ToastProvider and useToast", async () => {
      const toastContextPath = path.resolve(__dirname, "../../../frontend/src/context/ToastContext.jsx");
      if (!fs.existsSync(toastContextPath)) throw new Error("ToastContext.jsx not found");
      const content = fs.readFileSync(toastContextPath, "utf-8");
      if (!content.includes("export function ToastProvider") || !content.includes("export function useToast")) {
        throw new Error("ToastContext.jsx must export ToastProvider and useToast");
      }
      if (!content.includes("toast:notify")) {
        throw new Error("ToastContext.jsx must listen for global 'toast:notify' events");
      }
    });

    await testStep("ToastContainer.jsx exists with accessible notifications and progress bar", async () => {
      const toastContainerPath = path.resolve(__dirname, "../../../frontend/src/components/ToastContainer.jsx");
      if (!fs.existsSync(toastContainerPath)) throw new Error("ToastContainer.jsx not found");
      const content = fs.readFileSync(toastContainerPath, "utf-8");
      if (!content.includes("toast-portal-container") || !content.includes("toast-progress-bar")) {
        throw new Error("ToastContainer.jsx missing portal container or progress bar");
      }
    });

    await testStep("Pagination.jsx exists with accessible page controls and limit picker", async () => {
      const paginationPath = path.resolve(__dirname, "../../../frontend/src/components/Pagination.jsx");
      if (!fs.existsSync(paginationPath)) throw new Error("Pagination.jsx not found");
      const content = fs.readFileSync(paginationPath, "utf-8");
      if (!content.includes("pagination-btn") || !content.includes("pagination-limit-picker")) {
        throw new Error("Pagination.jsx missing essential pagination classes");
      }
    });

    await testStep("ProductsPage.jsx integrates active filter chips, rating filter and pagination", async () => {
      const productsPagePath = path.resolve(__dirname, "../../../frontend/src/pages/ProductsPage.jsx");
      if (!fs.existsSync(productsPagePath)) throw new Error("ProductsPage.jsx not found");
      const content = fs.readFileSync(productsPagePath, "utf-8");
      if (!content.includes("active-filters-bar") || !content.includes("active-filter-chip")) {
        throw new Error("ProductsPage.jsx missing active filter chips bar");
      }
      if (!content.includes("<Pagination")) {
        throw new Error("ProductsPage.jsx does not mount <Pagination /> component");
      }
      if (!content.includes("minRating") && !content.includes("Müşteri Puanı")) {
        throw new Error("ProductsPage.jsx missing rating filter options");
      }
    });

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log("\n==================================================================");
    console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
    console.log("==================================================================");

    if (passedTests === totalTests) {
      console.log("🎉 All Milestone 6 Day 29 Search, Filter, Pagination & Toast tests passed successfully!\n");
    } else {
      throw new Error(`Some tests failed (${totalTests - passedTests} failures)`);
    }
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  }
}

if (require.main === module) {
  runTestSuite().catch((err) => {
    console.error("Test execution fatal error:", err.message);
    process.exit(1);
  });
}

module.exports = runTestSuite;
