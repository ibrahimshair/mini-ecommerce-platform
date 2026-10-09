/**
 * Milestone 5 Checkout Frontend & Order Workflow Integration Test Suite
 * Day 22 Verification Script (Issue #47)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const app = require("../app");

async function runCheckoutTestSuite() {
  console.log("==========================================================");
  console.log("💳 Starting Milestone 5 - Day 22 Checkout Frontend Verification");
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

  const rootDir = path.resolve(__dirname, "../../..");

  // Group A: Frontend Code & Routing Artifacts Verification
  console.log("[Group A: Frontend File Artifacts & Routing Verification]");

  await testStep("CheckoutPage.jsx exists in frontend/src/pages", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/CheckoutPage.jsx");
    if (!fs.existsSync(filePath)) throw new Error("CheckoutPage.jsx not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("handlePlaceOrder") || !content.includes("createdOrder")) {
      throw new Error("CheckoutPage.jsx missing core order submission logic");
    }
  });

  await testStep("CheckoutPage.css exists in frontend/src/pages", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/CheckoutPage.css");
    if (!fs.existsSync(filePath)) throw new Error("CheckoutPage.css not found");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes(".virtual-card-preview") || !content.includes(".checkout-success-view")) {
      throw new Error("CheckoutPage.css missing virtual card or success styles");
    }
  });

  await testStep("App.jsx imports CheckoutPage and mounts /checkout protected route", async () => {
    const filePath = path.join(rootDir, "frontend/src/App.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes('import CheckoutPage from "./pages/CheckoutPage"')) {
      throw new Error("CheckoutPage import missing in App.jsx");
    }
    if (!content.includes('path="/checkout"') || !content.includes("<ProtectedRoute>")) {
      throw new Error("/checkout protected route missing in App.jsx");
    }
  });

  await testStep("CartPage.jsx directs to /checkout on checkout start", async () => {
    const filePath = path.join(rootDir, "frontend/src/pages/CartPage.jsx");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes('navigate("/checkout")')) {
      throw new Error("CartPage does not navigate to /checkout");
    }
  });

  await testStep("api.js provides createOrder and address helpers", async () => {
    const filePath = path.join(rootDir, "frontend/src/services/api.js");
    const content = fs.readFileSync(filePath, "utf-8");
    if (!content.includes("createOrder(orderData)") || !content.includes("getAddresses")) {
      throw new Error("api.js missing createOrder or getAddresses methods");
    }
  });

  // Group B: Live Checkout Order Submission & Payment Methods
  console.log("\n[Group B: Live Checkout Order Submission & Payment Flows]");

  let authToken = null;
  let testProduct = null;
  const testEmail = `checkout_user_${Date.now()}@example.com`;
  const testPassword = "Password123!";

  // 6. User registration & login
  await testStep("Authenticate test customer for checkout workflow", async () => {
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Merve Kaya",
        email: testEmail,
        password: testPassword,
        phone: "05554443322",
      }),
    });
    if (!regRes.ok) throw new Error(`Registration failed: ${regRes.status}`);

    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: testPassword }),
    });
    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    authToken = loginData.data.token;
  });

  const authHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${authToken}`,
  };

  // 7. Get product & prepare cart
  await testStep("Retrieve product with available stock", async () => {
    const res = await fetch(`${baseUrl}/products`);
    const data = await res.json();
    testProduct = data.data.find((p) => Number(p.stock) >= 10) || data.data[0];
    if (!testProduct) throw new Error("No products available");
  });

  // 8. Place order with Credit Card & structured address
  await testStep("Submit checkout order with Credit Card (3D Secure)", async () => {
    // Add to cart first
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
          title: "Evim",
          fullName: "Merve Kaya",
          phone: "05554443322",
          city: "İstanbul",
          district: "Kadıköy",
          address: "Bağdat Cad. No: 120 Daire: 4",
          postalCode: "34728",
        },
        paymentMethod: "credit_card",
        notes: "Kapıda zile basılmasın lütfen.",
      }),
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (!data.success || !data.data.orderNumber) throw new Error("Order number not generated");
    if (data.data.paymentMethod !== "credit_card") throw new Error("Payment method mismatch");
  });

  // 9. Place order with Cash on Delivery
  await testStep("Submit checkout order with Cash on Delivery (Kapıda Ödeme)", async () => {
    await fetch(`${baseUrl}/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
    });

    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress: {
          title: "İşyeri",
          fullName: "Merve Kaya",
          phone: "05554443322",
          city: "Ankara",
          district: "Çankaya",
          address: "Tunalı Hilmi Cad. No: 45",
          postalCode: "06680",
        },
        paymentMethod: "cash_on_delivery",
      }),
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (data.data.paymentMethod !== "cash_on_delivery") {
      throw new Error("Payment method mismatch for cash_on_delivery");
    }
  });

  // 10. Place order with Bank Transfer
  await testStep("Submit checkout order with Bank Transfer (Havale/EFT)", async () => {
    await fetch(`${baseUrl}/cart/items`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({ productId: testProduct.id, quantity: 1 }),
    });

    const res = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        shippingAddress: "İzmir Konak Atatürk Meydanı No: 5",
        paymentMethod: "bank_transfer",
      }),
    });

    if (res.status !== 201) throw new Error(`Expected 201, got ${res.status}`);
    const data = await res.json();
    if (data.data.paymentMethod !== "bank_transfer") {
      throw new Error("Payment method mismatch for bank_transfer");
    }
  });

  // 11. Verify user can list all submitted checkout orders
  await testStep("Verify all submitted orders appear in user history", async () => {
    const res = await fetch(`${baseUrl}/orders`, { headers: authHeaders });
    const data = await res.json();
    if (!data.success || !Array.isArray(data.data.orders) || data.data.orders.length < 3) {
      throw new Error("Expected at least 3 orders in user history");
    }
  });

  server.close();

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log("==========================================================");

  if (passedTests === totalTests && totalTests > 0) {
    console.log("🎉 All Milestone 5 Day 22 Checkout Frontend verifications passed!\n");
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runCheckoutTestSuite();
