const { errorResponse } = require("../utils/apiResponse");

/**
 * Validation middleware for User Registration
 */
const validateRegister = (req, res, next) => {
  const { name, email, password, phone } = req.body || {};
  const errors = [];

  // Name validation
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Ad ve soyad alanı en az 2 karakter olmalıdır.",
    });
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.push({
      field: "email",
      message: "Lütfen geçerli bir e-posta adresi giriniz.",
    });
  }

  // Password validation
  if (!password || typeof password !== "string" || password.length < 6) {
    errors.push({
      field: "password",
      message: "Şifre en az 6 karakter uzunluğunda olmalıdır.",
    });
  }

  // Phone validation (optional)
  if (phone && typeof phone === "string" && phone.trim().length > 0) {
    const phoneRegex = /^(\+90|0)?[1-9][0-9]{9}$/;
    const cleanPhone = phone.replace(/[\s()-]/g, "");
    if (!phoneRegex.test(cleanPhone)) {
      errors.push({
        field: "phone",
        message: "Lütfen geçerli bir telefon numarası giriniz (örn: 05551234567).",
      });
    }
  }

  if (errors.length > 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Kayıt formu doğrulanamadı",
      errors,
    });
  }

  // Sanitize trimmed inputs
  req.body.name = name.trim();
  req.body.email = email.trim().toLowerCase();
  req.body.password = password;
  if (phone) req.body.phone = phone.trim();

  next();
};

/**
 * Validation middleware for User Login
 */
const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  const errors = [];

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
    errors.push({
      field: "email",
      message: "Lütfen geçerli bir e-posta adresi giriniz.",
    });
  }

  // Password validation
  if (!password || typeof password !== "string" || password.length === 0) {
    errors.push({
      field: "password",
      message: "Lütfen şifrenizi giriniz.",
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Giriş bilgileri doğrulanamadı.",
      errors,
    });
  }

  // Sanitize inputs
  req.body.email = email.trim().toLowerCase();
  req.body.password = password;

  next();
};

/**
 * Validation middleware for Product Creation
 */
const validateCreateProduct = (req, res, next) => {
  const { name, price, stock, description } = req.body || {};
  const errors = [];

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    errors.push({
      field: "name",
      message: "Ürün adı en az 2 karakter olmalıdır.",
    });
  }

  if (price === undefined || price === null || isNaN(Number(price)) || Number(price) <= 0) {
    errors.push({
      field: "price",
      message: "Ürün fiyatı sıfırdan büyük bir sayı olmalıdır.",
    });
  }

  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
    errors.push({
      field: "stock",
      message: "Stok miktarı sıfır veya daha büyük bir sayı olmalıdır.",
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Ürün bilgileri doğrulanamadı.",
      errors,
    });
  }

  req.body.name = name.trim();
  req.body.price = Number(price);
  if (stock !== undefined) req.body.stock = Number(stock);
  if (description) req.body.description = String(description).trim();

  next();
};

/**
 * Validation middleware for Product Updates
 */
const validateUpdateProduct = (req, res, next) => {
  const { name, price, stock } = req.body || {};
  const errors = [];

  if (name !== undefined && (typeof name !== "string" || name.trim().length < 2)) {
    errors.push({
      field: "name",
      message: "Ürün adı en az 2 karakter olmalıdır.",
    });
  }

  if (price !== undefined && (isNaN(Number(price)) || Number(price) <= 0)) {
    errors.push({
      field: "price",
      message: "Ürün fiyatı sıfırdan büyük bir sayı olmalıdır.",
    });
  }

  if (stock !== undefined && (isNaN(Number(stock)) || Number(stock) < 0)) {
    errors.push({
      field: "stock",
      message: "Stok miktarı sıfır veya daha büyük bir sayı olmalıdır.",
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Ürün güncelleme bilgileri doğrulanamadı.",
      errors,
    });
  }

  if (name) req.body.name = name.trim();
  if (price !== undefined) req.body.price = Number(price);
  if (stock !== undefined) req.body.stock = Number(stock);

  next();
};

/**
 * Validation middleware for Order Creation
 */
const validateCreateOrder = (req, res, next) => {
  const { shippingAddress, paymentMethod } = req.body || {};
  const errors = [];

  if (!shippingAddress) {
    errors.push({
      field: "shippingAddress",
      message: "Teslimat adresi zorunludur.",
    });
  } else if (typeof shippingAddress === "string" && shippingAddress.trim().length < 5) {
    errors.push({
      field: "shippingAddress",
      message: "Teslimat adresi en az 5 karakter uzunluğunda olmalıdır.",
    });
  } else if (typeof shippingAddress === "object") {
    if (!shippingAddress.address && !shippingAddress.addressLine && !shippingAddress.title) {
      errors.push({
        field: "shippingAddress",
        message: "Lütfen geçerli bir teslimat adresi belirtiniz.",
      });
    }
  }

  const validPaymentMethods = ["credit_card", "bank_transfer", "cash_on_delivery"];
  if (paymentMethod && !validPaymentMethods.includes(paymentMethod)) {
    errors.push({
      field: "paymentMethod",
      message: "Geçersiz ödeme yöntemi. İzin verilenler: credit_card, bank_transfer, cash_on_delivery.",
    });
  }

  if (errors.length > 0) {
    return errorResponse(res, {
      statusCode: 400,
      message: "Sipariş bilgileri doğrulanamadı.",
      errors,
    });
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateCreateProduct,
  validateUpdateProduct,
  validateCreateOrder,
};


