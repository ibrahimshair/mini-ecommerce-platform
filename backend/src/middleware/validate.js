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

module.exports = {
  validateRegister,
  validateLogin,
};

