/**
 * Milestone 4 - Day 19 Shopping Cart Frontend, Calculation & Integration Verification Suite
 * Tests client-side calculation rules, coupon discounts, free shipping thresholds, and API integration.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const app = require("../app");
const { FALLBACK_PRODUCTS } = require("../utils/dummyData");

let server;
let baseUrl = "";
let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exitCode = 1;
  } else {
    passedCount++;
    console.log(`✅ PASSED: ${message}`);
  }
}

// Local cart calculation replica matching frontend CartContext
function calculateCartTotals(items = [], activeCoupon = null) {
  const itemCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const subtotal = items.reduce(
    (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
    0
  );

  const roundedSubtotal = Math.round(subtotal * 100) / 100;
  const FREE_SHIPPING_THRESHOLD = 150;
  const standardShipping = 29.9;

  let shippingCost =
    roundedSubtotal >= FREE_SHIPPING_THRESHOLD || roundedSubtotal === 0 ? 0 : standardShipping;

  if (activeCoupon?.type === "free_shipping" && roundedSubtotal > 0) {
    shippingCost = 0;
  }

  let discountAmount = 0;
  if (activeCoupon && roundedSubtotal >= (activeCoupon.minSubtotal || 0)) {
    if (activeCoupon.type === "percent") {
      discountAmount = Math.round(roundedSubtotal * activeCoupon.rate * 100) / 100;
    } else if (activeCoupon.type === "fixed") {
      discountAmount = Math.min(roundedSubtotal, activeCoupon.amount);
    }
  }

  const grandTotal = Math.max(0, Math.round((roundedSubtotal - discountAmount + shippingCost) * 100) / 100);
  const remainingForFreeShipping = Math.max(
    0,
    Math.round((FREE_SHIPPING_THRESHOLD - roundedSubtotal) * 100) / 100
  );

  return {
    itemCount,
    subtotal: roundedSubtotal,
    shippingCost,
    discountAmount,
    freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
    remainingForFreeShipping,
    isFreeShipping: shippingCost === 0 && roundedSubtotal > 0,
    grandTotal,
  };
}

function makeRequest(method, endpoint, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(baseUrl + endpoint);
    const bodyStr = data ? JSON.stringify(data) : null;

    const reqHeaders = {
      ...headers,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (bodyStr) {
      reqHeaders["Content-Length"] = Buffer.byteLength(bodyStr);
    }

    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: reqHeaders,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, body: parsed });
        } catch {
          resolve({ status: res.statusCode, body });
        }
      });
    });

    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

async function runTests() {
  console.log("==========================================================");
  console.log("🛒 Starting Milestone 4 - Day 19 Cart Frontend Verification");
  console.log("==========================================================");

  // SECTION 1: Local Calculation Logic
  console.log("\n[Group A: Cart Calculation & Business Rules]");
  const emptyTotals = calculateCartTotals([]);
  assert(
    emptyTotals.itemCount === 0 && emptyTotals.subtotal === 0 && emptyTotals.shippingCost === 0 && emptyTotals.grandTotal === 0,
    "Empty cart calculates 0 items, 0 subtotal, 0 shipping, and 0 grand total"
  );

  const underThresholdItems = [{ price: 80, quantity: 1 }];
  const underThresholdTotals = calculateCartTotals(underThresholdItems);
  assert(
    underThresholdTotals.shippingCost === 29.9 &&
      underThresholdTotals.remainingForFreeShipping === 70 &&
      underThresholdTotals.grandTotal === 109.9,
    "Cart under 150 TL threshold charges 29.90 TL shipping and tracks remaining 70 TL"
  );

  const aboveThresholdItems = [{ price: 200, quantity: 1 }];
  const aboveThresholdTotals = calculateCartTotals(aboveThresholdItems);
  assert(
    aboveThresholdTotals.shippingCost === 0 &&
      aboveThresholdTotals.isFreeShipping === true &&
      aboveThresholdTotals.grandTotal === 200,
    "Cart above 150 TL threshold activates free shipping (0 TL shipping)"
  );

  const couponPercent = { code: "INDIRIM10", rate: 0.1, type: "percent", minSubtotal: 0 };
  const percentTotals = calculateCartTotals(aboveThresholdItems, couponPercent);
  assert(
    percentTotals.discountAmount === 20 && percentTotals.grandTotal === 180,
    "Promotional coupon INDIRIM10 (%10) deducts 20 TL from 200 TL subtotal"
  );

  const couponFixed = { code: "HOSGELDIN", amount: 50, type: "fixed", minSubtotal: 100 };
  const fixedTotals = calculateCartTotals(aboveThresholdItems, couponFixed);
  assert(
    fixedTotals.discountAmount === 50 && fixedTotals.grandTotal === 150,
    "Promotional coupon HOSGELDIN (50 TL) deducts 50 TL from 200 TL subtotal"
  );

  // SECTION 2: Frontend Files Verification
  console.log("\n[Group B: Frontend File Artifacts Verification]");
  const frontendDir = path.resolve(__dirname, "../../../frontend/src");
  const cartContextPath = path.join(frontendDir, "context/CartContext.jsx");
  const cartPagePath = path.join(frontendDir, "pages/CartPage.jsx");
  const cartPageCssPath = path.join(frontendDir, "pages/CartPage.css");
  const cartToastPath = path.join(frontendDir, "components/CartToast.jsx");
  const cartToastCssPath = path.join(frontendDir, "components/CartToast.css");

  assert(fs.existsSync(cartContextPath), "CartContext.jsx exists in frontend/src/context");
  assert(fs.existsSync(cartPagePath), "CartPage.jsx exists in frontend/src/pages");
  assert(fs.existsSync(cartPageCssPath), "CartPage.css exists in frontend/src/pages");
  assert(fs.existsSync(cartToastPath), "CartToast.jsx exists in frontend/src/components");
  assert(fs.existsSync(cartToastCssPath), "CartToast.css exists in frontend/src/components");

  const appJsx = fs.readFileSync(path.join(frontendDir, "App.jsx"), "utf-8");
  assert(appJsx.includes("/cart") && appJsx.includes("CartPage"), "App.jsx mounts /cart route with CartPage");

  const navbarJsx = fs.readFileSync(path.join(frontendDir, "components/Navbar.jsx"), "utf-8");
  assert(
    navbarJsx.includes("useCart") && navbarJsx.includes('to="/cart"'),
    "Navbar.jsx connects to useCart and links cart button to /cart"
  );

  // SECTION 3: Guest Session Backend API Verification
  console.log("\n[Group C: Guest Session Cart API Communication]");
  const testSessionId = `test_session_${Date.now()}`;
  const sessionHeaders = { "x-session-id": testSessionId };

  // 1. Initial cart check
  const getRes = await makeRequest("GET", "/api/cart", null, sessionHeaders);
  assert(getRes.status === 200 && getRes.body?.data?.items?.length === 0, "Initial guest cart is empty");

  // 2. Add product to cart
  const testProduct = FALLBACK_PRODUCTS[0];
  const addRes = await makeRequest("POST", "/api/cart/items", { productId: testProduct.id, quantity: 2 }, sessionHeaders);
  assert(
    addRes.status === 200 && addRes.body?.data?.items?.length === 1 && addRes.body.data.items[0].quantity === 2,
    `Added product ${testProduct.name} with quantity 2 to guest session cart`
  );

  const cartItemId = addRes.body.data.items[0].id;

  // 3. Update quantity
  const updateRes = await makeRequest("PUT", `/api/cart/items/${cartItemId}`, { quantity: 3 }, sessionHeaders);
  assert(
    updateRes.status === 200 && updateRes.body?.data?.items[0]?.quantity === 3,
    "Updated item quantity to 3 via PUT /api/cart/items/:id"
  );

  // 4. Delete item
  const delItemRes = await makeRequest("DELETE", `/api/cart/items/${cartItemId}`, null, sessionHeaders);
  assert(
    delItemRes.status === 200 && delItemRes.body?.data?.items?.length === 0,
    "Removed item from cart via DELETE /api/cart/items/:id"
  );

  // 5. Clear cart
  await makeRequest("POST", "/api/cart/items", { productId: testProduct.id, quantity: 1 }, sessionHeaders);
  const clearRes = await makeRequest("DELETE", "/api/cart", null, sessionHeaders);
  assert(
    clearRes.status === 200 && clearRes.body?.data?.items?.length === 0,
    "Cleared cart via DELETE /api/cart"
  );

  console.log("\n==========================================================");
  console.log(`📊 Test Results: ${passedCount}/${totalCount} Passed`);
  console.log("==========================================================");

  if (passedCount === totalCount) {
    console.log("🎉 All Milestone 4 Day 19 Cart Frontend verifications passed successfully!\n");
  } else {
    process.exitCode = 1;
  }
}

server = http.createServer(app);
server.listen(0, async () => {
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
  try {
    await runTests();
  } catch (err) {
    console.error("Test execution error:", err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
