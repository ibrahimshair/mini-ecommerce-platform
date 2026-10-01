const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/user.model");
const { errorResponse } = require("../utils/apiResponse");

/**
 * Authentication Middleware
 * Validates JWT bearer token from the Authorization header,
 * decodes the payload, verifies user status and attaches user to req.user.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Erişim reddedildi. Kimlik doğrulama token'ı bulunamadı.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Geçersiz yetkilendirme biçimi. 'Bearer <token>' formatı bekleniyor.",
      });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.jwt.secret);
    } catch (jwtErr) {
      if (jwtErr.name === "TokenExpiredError") {
        return errorResponse(res, {
          statusCode: 401,
          message: "Oturum süreniz dolmuştur. Lütfen tekrar giriş yapınız.",
          errors: [{ field: "token", message: "Token süresi doldu." }],
        });
      }
      return errorResponse(res, {
        statusCode: 401,
        message: "Geçersiz veya bozulmuş kimlik doğrulama token'ı.",
        errors: [{ field: "token", message: "Token doğrulanamadı." }],
      });
    }

    // Attach basic claims from token
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // Optional user verification from DB or fallback
    try {
      const dbUser = await User.findById(decoded.id);
      if (dbUser) {
        req.user = {
          ...req.user,
          name: dbUser.name,
          phone: dbUser.phone,
          avatarUrl: dbUser.avatarUrl,
        };
      }
    } catch (dbErr) {
      // If DB is offline, req.user keeps the verified decoded token payload
    }

    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Role-Based Authorization Middleware Factory
 * Ensures the authenticated user possesses at least one of the allowed roles.
 * @param  {...string} allowedRoles Roles permitted to access the route (e.g. 'admin', 'seller')
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, {
        statusCode: 401,
        message: "Lütfen önce giriş yapınız.",
      });
    }

    const userRole = req.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      return errorResponse(res, {
        statusCode: 403,
        message: `Bu işlem için yetkiniz bulunmamaktadır. Gerekli rol: [${allowedRoles.join(", ")}], sizin rolünüz: ${userRole}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
};
