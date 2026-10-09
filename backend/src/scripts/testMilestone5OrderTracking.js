/**
 * Milestone 5 Order History & Cargo Tracking Integration Test Suite
 * Day 23 Verification Script (Issue #48)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("../app");

async function runOrderTrackingTestSuite() {
  console.log("==================================================================");
  console.log("📦 Starting Milestone 5 - Day 23 Order Tracking & History Suite");
  console.log("==================================================================\n");

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

  const rootDir = path.resolve(__dirname, "../../..");

  // Group A: Frontend File Artifacts Verification
  console.log("[Group A: Frontend File Artifacts & UI Routes]");

  await testStep("OrdersPage.jsx exists in frontend/src/pages", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/OrdersPage.jsx");
    if (!fs.existsSync(filePath)) throw new Error("OrdersPage.jsx not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("STATUS_STEPS") || !content.includes("handleExecuteCancel")) {
      throw new Error("OrdersPage.jsx missing tracking stepper or cancel logic");
    }
  });

  await testStep("OrdersPage.css exists in frontend/src/pages", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/OrdersPage.css");
    if (!fs.existsSync(filePath)) throw new Error("OrdersPage.css not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes(".order-stepper-track") || !content.includes(".cargo-tracking-card")) {
      throw new Error("OrdersPage.css missing tracking styles");
    }
  });

  await testStep("App.jsx mounts /orders and /orders/:id protected routes", async () => {
    const filePath = path.join(rootDir, "frontend/src/App.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes('path="/orders"') || !content.includes('path="/orders/:id"')) {
      throw new Error("/orders routes not mounted in App.jsx");
    }
    if (!content.includes('import OrdersPage from "./pages/OrdersPage"')) {
      throw new Error("OrdersPage import missing in App.jsx");
    }
  });

  await testStep("Navbar.jsx contains Siparişlerim button in user menu", async () => {
    const filePath = path.join(rootDir, "frontend/src/components/Navbar.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes('to="/orders"') || !content.includes("Siparişlerim")) {
      throw new Error("Siparişlerim link missing in Navbar.jsx");
    }
  });

  await testStep("ProfilePage.jsx integrates live order history in Tab 3", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/ProfilePage.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("api.getOrders()") || !content.includes("profileOrders")) {
      throw new Error("ProfilePage missing live orders integration in Tab 3");
    }
  });

  // Group B: Order Lifecycle, Live Tracking & Cancellation
  console.log("\n[Group B: Live Order Lifecycle, Stepper Tracking & Cancellation]");

  let authToken = null;
  let testProduct = null;
  let initialStock = 0;
  let order1 = null;
  let order2 = null;

  const testEmail = `tracker_user_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  await testStep("Authenticate test customer for order tracking", async () => {
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Ali Demir",
        email: testEmail,
        password: testPassword,
        phone: "05559998877",
      }),
    });
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    const loginData = await loginRes.json();
    authToken = loginData.data.token;
    if (!authToken) throw new Error("Token missing");
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  await testStep("Fetch sample product and note initial stock", async () => {
    const res = await fetch(`${baseUrl}/products`);
    const data = await res.json();
    testProduct = data.data.find((p) => Number(p.stock) >= 5) || data.data[0];
    initialStock = Number(testProduct.stock);
  });

  await testStep("Create Order #1 and verify initial pending status", async () => {
    await fetch(`${baseUrl}/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct.id, quantity: 2 }),
    });

    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress: {
          title: "Ev",
          fullName: "Ali Demir",
          phone: "05559998877",
          city: "Bursa",
          district: "Nilüfer",
          address: "FSM Bulvarı No: 20",
          postalCode: "16140",
        },
        paymentMethod: "credit_card",
        notes: "Kapıcıya bırakınız.",
      }),
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    order1 = data.data;
    if (order1.status !== "pending") throw new Error(`Expected pending, got ${order1.status}`);
    if (!order1.orderNumber) throw new Error("Order number missing");
  });

  await testStep("GET /api/orders/:id - Fetch Order #1 details and verify address/items", async () => {
    const res = await fetch(`${baseUrl}/orders/${order1.id}`, { headers: authHeaders });
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    const fetched = data.data;
    if (fetched.id !== order1.id) throw new Error("ID mismatch");
    if (!Array.isArray(fetched.items) || fetched.items.length === 0) {
      throw new Error("Items array empty");
    }
  });

  await testStep("PATCH /api/orders/:id/cancel - Cancel Order #1 and verify stock restoration", async () => {
    const res = await fetch(`${baseUrl}/orders/${order1.id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (!res.ok) throw new Error(`Expected 200, got ${res.status}`);
    const data = await res.json();
    if (data.data.status !== "cancelled") throw new Error("Status was not updated to cancelled");

    // Check product stock restored
    const prodRes = await fetch(`${baseUrl}/products/${testProduct.id}`);
    const prodData = await prodRes.json();
    if (Number(prodData.data.stock) !== initialStock) {
      throw new Error(`Stock not restored: expected ${initialStock}, got ${prodData.data.stock}`);
    }
  });

  await testStep("Reject cancelling an already cancelled order", async () => {
    const res = await fetch(`${baseUrl}/orders/${order1.id}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
  });

  await testStep("Create Order #2 and verify multiple orders history list", async () => {
    await fetch(`${baseUrl}/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
    });

    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress: "Ankara Kızılay Meydanı No: 12",
        paymentMethod: "cash_on_delivery",
      }),
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    order2 = data.data;

    // Fetch user orders list
    const listRes = await fetch(`${baseUrl}/orders`, { headers: authHeaders });
    const listData = await listRes.json();
    if (listData.data.orders.length < 2) {
      throw new Error(`Expected at least 2 orders, got ${listData.data.orders.length}`);
    }
  });

  await testStep("Reject accessing non-existent order with 404", async () => {
    const res = await fetch(`${baseUrl}/orders/non-existent-order-id-12345`, {
      headers: authHeaders,
    });
    if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
  });

  server.close();

  console.log("\n==================================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==================================================================");

  if (passedTests === totalTests && totalTests > 0) {
    console.log("🎉 All Milestone 5 Day 23 Order Tracking tests passed successfully!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runOrderTrackingTestSuite();
