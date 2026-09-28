const bcrypt = require("bcryptjs");
const User = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// In-memory fallback users for offline demonstration
const FALLBACK_USERS = [
  {
    id: "u1",
    name: "Admin Yönetici",
    email: "admin@miniecom.com",
    role: "admin",
    phone: "+905551112233",
    createdAt: new Date().toISOString(),
  },
  {
    id: "u2",
    name: "Demo Müşteri",
    email: "musteri@miniecom.com",
    role: "user",
    phone: "+905554445566",
    createdAt: new Date().toISOString(),
  },
];

/**
 * Authentication Controller
 */
const AuthController = {
  /**
   * POST /api/auth/register
   * Registers a new user with password hashing and duplicate check.
   */
  async register(req, res, next) {
    try {
      const { name, email, password, phone } = req.body;

      // 1. Check if user already exists in DB
      try {
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
          return errorResponse(res, {
            statusCode: 409,
            message: "Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.",
            errors: [{ field: "email", message: "E-posta adresi kullanımda." }],
          });
        }
      } catch (dbErr) {
        // Fallback check in memory
        const inMemUser = FALLBACK_USERS.find((u) => u.email.toLowerCase() === email.toLowerCase());
        if (inMemUser) {
          return errorResponse(res, {
            statusCode: 409,
            message: "Bu e-posta adresi ile kayıtlı bir hesap zaten bulunmaktadır.",
            errors: [{ field: "email", message: "E-posta adresi kullanımda." }],
          });
        }
      }

      // 2. Hash password with bcrypt salt rounds = 10
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // 3. Persist new user
      try {
        const newUser = await User.create({
          name,
          email,
          passwordHash,
          role: "user",
          phone: phone || null,
        });

        return successResponse(res, {
          statusCode: 201,
          message: "Kullanıcı kaydı başarıyla oluşturuldu.",
          data: newUser,
        });
      } catch (dbErr) {
        // Fallback: store in memory
        const mockNewUser = {
          id: `usr-${Date.now()}`,
          name,
          email,
          role: "user",
          phone: phone || null,
          createdAt: new Date().toISOString(),
        };
        FALLBACK_USERS.push(mockNewUser);

        return successResponse(res, {
          statusCode: 201,
          message: "Kullanıcı kaydı başarıyla oluşturuldu (fallback mod).",
          data: mockNewUser,
        });
      }
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;
