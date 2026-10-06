/**
 * Milestone 4 Shopping Cart Integration Test Suite
 * Day 18 Verification Script (Issue #43)
 */

const http = require("http");
const app = require("../app");

async function runCartTestSuite() {
  console.log("==========================================================");
  console.log("🛒 Starting Milestone 4 Cart Backend & API Verification");
  console.log("==========================================================\n");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api`;
  const sessionHeader = { "x-session-id": `test-cart-session-${Date.now()}` };

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

  let sampleProduct = null;
  let cartItemId = null;

  try {
    // 0. Get a product to test with
    await testStep("Retrieve available products for cart testing", async () => {
      const res = await fetch(`${baseUrl}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data) || data.data.length === 0) {
        throw new Error("No products found to run cart tests");
      }
      sampleProduct = data.data[0];
    });

    // 1. GET /api/cart initially empty
    await testStep("GET /api/cart - Fetch empty cart with summary totals", async () => {
      const res = await fetch(`${baseUrl}/cart`, {
        headers: { ...sessionHeader },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data || !Array.isArray(data.data.items)) {
        throw new Error("Invalid cart structure returned");
      }
      const summary = data.data.summary;
      if (summary.itemCount !== 0 || summary.subtotal !== 0 || summary.grandTotal !== 0) {
        throw new Error(`Unexpected initial summary: ${JSON.stringify(summary)}`);
      }
    });

    // 2. Reject POST /api/cart/items without productId
    await testStep("POST /api/cart/items - Reject request missing productId", async () => {
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ quantity: 1 }),
      });
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400, received ${res.status}`);
      }
    });

    // 3. Reject POST /api/cart/items with non-existent product
    await testStep("POST /api/cart/items - Reject non-existent product", async () => {
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ productId: "non-existent-product-id-99999", quantity: 1 }),
      });
      if (res.status !== 404) {
        throw new Error(`Expected HTTP 404, received ${res.status}`);
      }
    });

    // 4. Reject POST /api/cart/items with quantity exceeding stock
    await testStep("POST /api/cart/items - Reject quantity exceeding available stock", async () => {
      const excessiveQty = (sampleProduct.stock || 50) + 1000;
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ productId: sampleProduct.id, quantity: excessiveQty }),
      });
      if (res.status !== 400) {
        throw new Error(`Expected HTTP 400, received ${res.status}`);
      }
    });

    // 5. Add valid item to cart
    await testStep("POST /api/cart/items - Successfully add product to cart", async () => {
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ productId: sampleProduct.id, quantity: 1 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || data.data.items.length === 0) {
        throw new Error("Item was not added to cart items");
      }
      const item = data.data.items[0];
      cartItemId = item.id;
      if (item.productId !== sampleProduct.id) {
        throw new Error(`Item productId mismatch: expected ${sampleProduct.id}, got ${item.productId}`);
      }
    });

    // 6. Verify cart summary totals after adding
    await testStep("GET /api/cart - Verify subtotal and shipping calculation", async () => {
      const res = await fetch(`${baseUrl}/cart`, {
        headers: { ...sessionHeader },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const { summary } = data.data;
      if (summary.itemCount < 1) {
        throw new Error(`itemCount should be >= 1, got ${summary.itemCount}`);
      }
      if (summary.subtotal <= 0) {
        throw new Error(`subtotal should be > 0, got ${summary.subtotal}`);
      }
      if (summary.subtotal >= 150) {
        if (summary.shippingCost !== 0 || !summary.isFreeShipping) {
          throw new Error("Free shipping not applied for subtotal >= 150");
        }
      } else {
        if (summary.shippingCost !== 29.9) {
          throw new Error(`Standard shipping 29.9 not applied, got ${summary.shippingCost}`);
        }
      }
    });

    // 7. Update item quantity
    await testStep("PUT /api/cart/items/:id - Update item quantity to 2", async () => {
      const res = await fetch(`${baseUrl}/cart/items/${cartItemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ quantity: 2 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const item = data.data.items.find((i) => i.id === cartItemId || i.productId === sampleProduct.id);
      if (!item || item.quantity !== 2) {
        throw new Error(`Expected item quantity 2, got ${item?.quantity}`);
      }
    });

    // 8. Remove item from cart
    await testStep("DELETE /api/cart/items/:id - Remove item from cart", async () => {
      const res = await fetch(`${baseUrl}/cart/items/${cartItemId}`, {
        method: "DELETE",
        headers: { ...sessionHeader },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) {
        throw new Error("Item deletion failed");
      }
      const item = data.data.items.find((i) => i.id === cartItemId);
      if (item) {
        throw new Error("Item still present in cart after deletion");
      }
    });

    // 9. Clear cart
    await testStep("DELETE /api/cart - Clear entire cart", async () => {
      // First re-add an item
      await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...sessionHeader },
        body: JSON.stringify({ productId: sampleProduct.id, quantity: 1 }),
      });

      // Now clear
      const res = await fetch(`${baseUrl}/cart`, {
        method: "DELETE",
        headers: { ...sessionHeader },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || data.data.items.length !== 0) {
        throw new Error("Cart not empty after clearCart");
      }
    });

  } finally {
    server.close();
  }

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed`);
  console.log("==========================================================");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runCartTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
