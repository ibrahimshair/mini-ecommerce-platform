/**
 * Milestone 5 Order System Integration Test Suite
 * Day 21 Verification Script (Issue #46)
 */

const http = require("http");
const app = require("../app");

async function runOrdersTestSuite() {
  console.log("==========================================================");
  console.log("📦 Starting Milestone 5 Order System Backend API Verification");
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

  let authToken = null;
  let testUser = null;
  let testProduct = null;
  let createdOrderId = null;
  let initialStock = 0;
  const orderQuantity = 2;

  const testEmail = `order_tester_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  try {
    // 1. Reject unauthenticated access to GET /api/orders
    await testStep("Reject Unauthorized access to GET /api/orders without token", async () => {
      const res = await fetch(`${baseUrl}/orders`);
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
      const data = await res.json();
      if (data.success) throw new Error("Expected failure response");
    });

    // 2. Reject unauthenticated access to POST /api/orders
    await testStep("Reject Unauthorized access to POST /api/orders without token", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shippingAddress: "Atatürk Cad. No: 12 Kadıköy" }),
      });
      if (res.status !== 401) throw new Error(`Expected HTTP 401, got ${res.status}`);
    });

    // 3. User Registration & Login to obtain JWT
    await testStep("Register and authenticate user for order testing", async () => {
      const regRes = await fetch(`${baseUrl}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Sipariş Test Kullanıcısı",
          email: testEmail,
          password: testPassword,
          phone: "05553334455",
        }),
      });
      if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);

      const loginRes = await fetch(`${baseUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
      const loginData = await loginRes.json();
      authToken = loginData.data.token;
      testUser = loginData.data.user;
      if (!authToken) throw new Error("Token missing from auth response");
    });

    const authHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    // 4. Reject order creation with empty cart
    await testStep("Reject order creation when cart is empty", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          shippingAddress: "Örnek Mahallesi Güneş Sokak No: 4/2 Üsküdar İstanbul",
          paymentMethod: "credit_card",
        }),
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      const data = await res.json();
      if (data.success) throw new Error("Expected failure response");
    });

    // 5. Reject order creation when shippingAddress is missing or too short
    await testStep("Reject order creation with missing/invalid shipping address", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          shippingAddress: "Ev", // < 5 chars
          items: [{ productId: "p1", quantity: 1, price: 100 }],
        }),
      });
      if (res.status !== 400) throw new Error(`Expected 400 Bad Request, got ${res.status}`);
    });

    // 6. Get sample product and check initial stock
    await testStep("Retrieve test product and check available stock", async () => {
      const res = await fetch(`${baseUrl}/products`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data || data.data.length === 0) {
        throw new Error("No products available to test");
      }
      testProduct = data.data.find((p) => Number(p.stock) >= 5) || data.data[0];
      initialStock = Number(testProduct.stock);
      if (initialStock < orderQuantity) {
        throw new Error(`Insufficient stock on product for testing: ${initialStock}`);
      }
    });

    // 7. Add product to user's cart
    await testStep("Add product to cart before placing order", async () => {
      const res = await fetch(`${baseUrl}/cart/items`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          productId: testProduct.id,
          quantity: orderQuantity,
        }),
      });
      if (!res.ok) throw new Error(`Failed to add item to cart: ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error("Failed response when adding to cart");
    });

    // 8. Place order (POST /api/orders) from cart
    await testStep("POST /api/orders - Successfully create order from cart", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          shippingAddress: {
            title: "Ev Adresim",
            address: "Barbaros Bulvarı No: 45 D: 8",
            city: "İstanbul",
            district: "Beşiktaş",
            fullName: "Sipariş Test Kullanıcısı",
            phone: "05553334455",
          },
          paymentMethod: "credit_card",
          notes: "Lütfen zile basmadan kapıya bırakınız.",
        }),
      });
      if (res.status !== 201) throw new Error(`Expected 201 Created, got ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data) throw new Error("No order data returned");
      const order = data.data;

      if (!order.orderNumber || !order.orderNumber.startsWith("ORD-")) {
        throw new Error(`Invalid order number format: ${order.orderNumber}`);
      }
      if (order.status !== "pending") {
        throw new Error(`Expected pending status, got: ${order.status}`);
      }
      if (!Array.isArray(order.items) || order.items.length === 0) {
        throw new Error("Order items array is empty");
      }
      if (Number(order.totalPrice) <= 0) {
        throw new Error(`Invalid total price: ${order.totalPrice}`);
      }

      createdOrderId = order.id;
    });

    // 9. Verify product stock was automatically deducted
    await testStep("Verify stock deduction on product after order placement", async () => {
      const res = await fetch(`${baseUrl}/products/${testProduct.id}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const updatedStock = Number(data.data.stock);
      const expectedStock = initialStock - orderQuantity;
      if (updatedStock !== expectedStock) {
        throw new Error(
          `Stock mismatch! Expected ${expectedStock}, but got ${updatedStock}`
        );
      }
    });

    // 10. Verify shopping cart was cleared
    await testStep("Verify shopping cart is cleared after order creation", async () => {
      const res = await fetch(`${baseUrl}/cart`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.data.items && data.data.items.length > 0) {
        throw new Error(
          `Cart was not cleared! Still has ${data.data.items.length} items`
        );
      }
      if (data.data.summary.itemCount !== 0) {
        throw new Error("Cart summary item count should be 0");
      }
    });

    // 11. Retrieve user's order history (GET /api/orders)
    await testStep("GET /api/orders - Retrieve authenticated user's order history", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !Array.isArray(data.data.orders)) {
        throw new Error("Invalid orders list returned");
      }
      const found = data.data.orders.find((o) => o.id === createdOrderId);
      if (!found) {
        throw new Error(`Newly created order ${createdOrderId} not found in order list`);
      }
    });

    // 12. Retrieve single order details (GET /api/orders/:id)
    await testStep("GET /api/orders/:id - Retrieve order details by ID", async () => {
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}`, {
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || !data.data) {
        throw new Error("Failed to get order details");
      }
      const order = data.data;
      if (order.id !== createdOrderId) {
        throw new Error(`Order ID mismatch: ${order.id} vs ${createdOrderId}`);
      }
      if (!Array.isArray(order.items) || order.items.length === 0) {
        throw new Error("Order details items array is empty");
      }
    });

    // 13. Reject order creation if direct items exceed product stock
    await testStep("Reject order creation when item quantity exceeds available stock", async () => {
      const res = await fetch(`${baseUrl}/orders`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          shippingAddress: "Deneme Adresi Sokak No: 1",
          items: [
            {
              productId: testProduct.id,
              quantity: 99999, // Exceeds stock
              price: testProduct.price,
            },
          ],
        }),
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
      const data = await res.json();
      if (data.success) throw new Error("Expected failure response");
    });

    // 14. Cancel order and verify stock restoration (PATCH /api/orders/:id/cancel)
    await testStep("PATCH /api/orders/:id/cancel - Cancel order and restore product stock", async () => {
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}/cancel`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success || data.data.status !== "cancelled") {
        throw new Error("Order status was not updated to 'cancelled'");
      }

      // Check stock restored
      const prodRes = await fetch(`${baseUrl}/products/${testProduct.id}`);
      const prodData = await prodRes.json();
      const restoredStock = Number(prodData.data.stock);
      if (restoredStock !== initialStock) {
        throw new Error(
          `Stock was not restored! Expected ${initialStock}, got ${restoredStock}`
        );
      }
    });

    // 15. Reject cancelling an already cancelled order
    await testStep("Reject cancelling an already cancelled order", async () => {
      const res = await fetch(`${baseUrl}/orders/${createdOrderId}/cancel`, {
        method: "PATCH",
        headers: authHeaders,
      });
      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got ${res.status}`);
      }
    });

  } catch (globalErr) {
    console.error("\n💥 Unexpected suite failure:", globalErr);
  } finally {
    server.close();
  }

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log("==========================================================");

  if (passedTests === totalTests && totalTests > 0) {
    console.log("🎉 All Milestone 5 Day 21 Order System tests passed successfully!\n");
    process.exit(0);
  } else {
    console.error("❌ Some tests failed. Please review output above.\n");
    process.exit(1);
  }
}

runOrdersTestSuite();
