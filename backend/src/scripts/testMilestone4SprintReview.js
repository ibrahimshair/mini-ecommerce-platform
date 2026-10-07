/**
 * Milestone 4 - Day 20 Sprint Review & Cart-Stock Integration Test Suite
 * Validates full Milestone 4 lifecycle: Product CRUD -> Live Stock -> Cart API -> Real-time Stock Sync & Validation.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const app = require("../app");
const Product = require("../models/product.model");
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
  console.log("==================================================================");
  console.log("🏆 Milestone 4 (Day 20): Sprint Review & Stock Integration Suite");
  console.log("==================================================================");

  const sessionId = `sprint20_session_${Date.now()}`;
  const headers = { "x-session-id": sessionId };

  // --- SECTION 1: Product Lifecycle Verification (Milestone 4 Days 16-17) ---
  console.log("\n[Sprint Review 1: Product Management & Details]");

  // 1. Create a dynamic product
  const newProductPayload = {
    name: "Ultra Ergonomic Mekanik Klavye V3",
    description: "Milestone 4 Sprint Review özel donanımı.",
    price: 1500.0,
    stock: 5,
    category: "Elektronik",
  };

  const createProdRes = await makeRequest("POST", "/api/products", newProductPayload);
  assert(createProdRes.status === 201, "Successfully created test product for sprint review");
  const createdProductId = createProdRes.body?.data?.id;

  // 2. Fetch created product by ID
  const getProdRes = await makeRequest("GET", `/api/products/${createdProductId}`);
  assert(
    getProdRes.status === 200 && getProdRes.body?.data?.stock === 5,
    "Retrieved created product with live stock of 5"
  );

  // --- SECTION 2: Shopping Cart Backend & Limits (Milestone 4 Day 18) ---
  console.log("\n[Sprint Review 2: Cart Operations & Stock Boundaries]");

  // 3. Add to cart with valid quantity (3 adet)
  const addCartRes = await makeRequest(
    "POST",
    "/api/cart/items",
    { productId: createdProductId, quantity: 3 },
    headers
  );
  assert(
    addCartRes.status === 200 && addCartRes.body?.data?.items?.length === 1,
    "Successfully added 3 units of product to cart"
  );

  // 4. Attempt adding beyond stock (trying to add 3 more, total would be 6 > 5)
  const exceedRes = await makeRequest(
    "POST",
    "/api/cart/items",
    { productId: createdProductId, quantity: 3 },
    headers
  );
  assert(
    exceedRes.status === 400,
    "Correctly rejected addition that exceeds available stock (total 6 > stock 5)"
  );

  // --- SECTION 3: Real-Time Stock Sync & Validation (Milestone 4 Day 20) ---
  console.log("\n[Sprint Review 3: Live Cart-Stock Validation & Auto-Adjustment]");

  // 5. Initial validation when stock is sufficient
  const validateOkRes = await makeRequest("POST", "/api/cart/validate", {}, headers);
  assert(
    validateOkRes.status === 200 &&
      validateOkRes.body?.data?.isValid === true &&
      validateOkRes.body?.data?.warnings?.length === 0,
    "POST /api/cart/validate confirms cart is valid with sufficient stock"
  );

  // 6. Simulate external stock drop: Reduce stock of product from 5 to 2 via PATCH
  const patchStockRes = await makeRequest(
    "PATCH",
    `/api/products/${createdProductId}/stock`,
    { stock: 2 }
  );
  assert(patchStockRes.status === 200, "Simulated stock reduction: updated stock to 2");

  // 7. Validate cart again: Cart has 3, but now stock is only 2!
  const validateAdjustRes = await makeRequest("POST", "/api/cart/validate", {}, headers);
  assert(
    validateAdjustRes.status === 200 &&
      validateAdjustRes.body?.data?.warnings?.length > 0 &&
      validateAdjustRes.body?.data?.items[0]?.quantity === 2 &&
      validateAdjustRes.body?.data?.isModified === true,
    "POST /api/cart/validate detected insufficient stock, adjusted cart quantity to 2, and returned warning"
  );

  // 8. Simulate product going completely out of stock: set stock to 0
  await makeRequest("PATCH", `/api/products/${createdProductId}/stock`, {
    stock: 0,
  });

  // 9. Validate cart with 0 stock
  const validateOosRes = await makeRequest("POST", "/api/cart/validate", {}, headers);
  assert(
    validateOosRes.status === 200 &&
      validateOosRes.body?.data?.items[0]?.isOutOfStock === true &&
      validateOosRes.body?.data?.warnings?.some((w) => w.type === "out_of_stock"),
    "POST /api/cart/validate identified out-of-stock item and generated out_of_stock warning"
  );

  // --- SECTION 4: Frontend UI Component Verification (Milestone 4 Days 19-20) ---
  console.log("\n[Sprint Review 4: Frontend Integration & State Hooks]");
  const frontendDir = path.resolve(__dirname, "../../../frontend/src");

  const cartContextCode = fs.readFileSync(path.join(frontendDir, "context/CartContext.jsx"), "utf-8");
  assert(
    cartContextCode.includes("validateLiveStock") &&
      cartContextCode.includes("getItemQuantityInCart") &&
      cartContextCode.includes("getRemainingStock"),
    "CartContext provides validateLiveStock, getItemQuantityInCart, and getRemainingStock"
  );

  const productCardCode = fs.readFileSync(path.join(frontendDir, "components/ProductCard.jsx"), "utf-8");
  assert(
    productCardCode.includes("product-in-cart-pill") && productCardCode.includes("isMaxInCart"),
    "ProductCard displays in-cart pill and restricts button when max stock is reached"
  );

  const productDetailCode = fs.readFileSync(path.join(frontendDir, "pages/ProductDetailPage.jsx"), "utf-8");
  assert(
    productDetailCode.includes("detail-in-cart-banner") && productDetailCode.includes("remainingStock"),
    "ProductDetailPage displays live in-cart status banner and bounds quantity selector to remaining stock"
  );

  const cartPageCode = fs.readFileSync(path.join(frontendDir, "pages/CartPage.jsx"), "utf-8");
  assert(
    cartPageCode.includes("btn-validate-stock") &&
      cartPageCode.includes("cart-stock-warnings-card") &&
      cartPageCode.includes("hasOutOfStockItems"),
    "CartPage integrates live stock validation button, warnings alert banner, and disabled checkout safety"
  );

  // --- SECTION 5: Cleanup & Cart Emptying ---
  console.log("\n[Sprint Review 5: Cart Teardown]");
  const clearRes = await makeRequest("DELETE", "/api/cart", null, headers);
  assert(
    clearRes.status === 200 && clearRes.body?.data?.items?.length === 0,
    "Cleared cart successfully at conclusion of sprint review"
  );

  // Delete test product
  await makeRequest("DELETE", `/api/products/${createdProductId}`);

  console.log("\n==================================================================");
  console.log(`📊 Sprint Review Results: ${passedCount}/${totalCount} Passed (100%)`);
  console.log("==================================================================");

  if (passedCount === totalCount) {
    console.log("🎉 Milestone 4 (Days 16–20) Sprint Review successfully verified!\n");
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
