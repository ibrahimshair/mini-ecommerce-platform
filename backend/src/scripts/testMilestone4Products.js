/**
 * Milestone 4 Product Management Integration Test Suite
 * Day 16 Verification Script (Issue #41)
 */

const app = require("../app");
const http = require("http");

async function runTestSuite() {
  console.log("==========================================================");
  console.log("🚀 Starting Milestone 4 Product CRUD API Verification");
  console.log("==========================================================\n");

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
    }
  }

  let createdProductId = null;
  const uniqueProductName = `Ergonomik Akıllı Saat V${Date.now()}`;

  try {
    // 1. List products
    await testStep("Retrieve Product List (/api/products)", async () => {
      const res = await fetch(`${baseUrl}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error("Expected array of products in data field");
      }
    });

    // 2. Reject Invalid Product Creation
    await testStep("Reject Invalid Product Creation (Negative Price / Short Name)", async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "A",
          price: -50,
          stock: -10,
        }),
      });

      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400 but got ${res.status}`);
      }
      const data = await res.json();
      if (!data.errors || data.errors.length === 0) {
        throw new Error("Expected validation errors array in response");
      }
    });

    // 3. Create Valid Product
    await testStep("Create New Product (/api/products POST)", async () => {
      const res = await fetch(`${baseUrl}/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: uniqueProductName,
          price: 1899.99,
          stock: 25,
          description: "Gelişmiş AMOLED ekranlı akıllı saat ve nabız sensörü.",
          isFeatured: true,
        }),
      });

      if (res.status !== 201 && res.status !== 200) {
        throw new Error(`Expected 201/200 but got HTTP ${res.status}`);
      }
      const data = await res.json();
      if (!data.data?.id) throw new Error("Created product does not have an ID");
      createdProductId = data.data.id;
    });

    // 4. Retrieve Created Product Details
    await testStep("Retrieve Product by ID (/api/products/:id)", async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.data.name !== uniqueProductName) {
        throw new Error("Retrieved product name does not match created name");
      }
      if (Number(data.data.price) !== 1899.99) {
        throw new Error(`Price mismatch: expected 1899.99, got ${data.data.price}`);
      }
    });

    // 5. Update Product Details
    await testStep("Update Product Details (/api/products/:id PUT)", async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${uniqueProductName} (Pro Sürüm)`,
          price: 2199.99,
          stock: 40,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (Number(data.data.price) !== 2199.99) {
        throw new Error(`Updated price mismatch: got ${data.data.price}`);
      }
    });

    // 6. Adjust Stock via PATCH
    await testStep("Adjust Stock Quantity (/api/products/:id/stock PATCH)", async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta: 5 }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.data.stock !== 45) {
        throw new Error(`Expected updated stock 45, got ${data.data.stock}`);
      }
    });

    // 7. Delete Product
    await testStep("Delete Product (/api/products/:id DELETE)", async () => {
      const res = await fetch(`${baseUrl}/products/${createdProductId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error("Delete returned success: false");
    });
  } finally {
    server.close();
  }

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==========================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
