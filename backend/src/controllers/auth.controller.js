const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/user.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// Pre-computed bcrypt hash for 'Password123!' (salt rounds 10)
const DEMO_PASSWORD_HASH = "$2b$10$58THfDfcxvYS1NbvbEpqZ.djyNBT5x7QfV7tdcjUqTkPUC4JZCZt2";

// In-memory fallback users for offline demonstration
const FALLBACK_USERS = [
  {
    id: "u0000000-0000-0000-0000-000000000001",
    name: "Admin Yönetici",
    email: "admin@miniecom.com",
    password_hash: DEMO_PASSWORD_HASH,
    role: "admin",
    phone: "+905551112233",
    is_active: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "u0000000-0000-0000-0000-000000000002",
    name: "Demo Müşteri",
    email: "musteri@miniecom.com",
    password_hash: DEMO_PASSWORD_HASH,
    role: "user",
    phone: "+905554445566",
    is_active: true,
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
        const inMemUser = FALLBACK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
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
        // Fallback: store in memory with hash for login compatibility
        const mockNewUser = {
          id: `usr-${Date.now()}`,
          name,
          email,
          password_hash: passwordHash,
          role: "user",
          phone: phone || null,
          is_active: true,
          createdAt: new Date().toISOString(),
        };
        FALLBACK_USERS.push(mockNewUser);

        return successResponse(res, {
          statusCode: 201,
          message: "Kullanıcı kaydı başarıyla oluşturuldu (fallback mod).",
          data: {
            id: mockNewUser.id,
            name: mockNewUser.name,
            email: mockNewUser.email,
            role: mockNewUser.role,
            phone: mockNewUser.phone,
            createdAt: mockNewUser.createdAt,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/login
   * Authenticates user with email and password, returning JWT token.
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      let user = null;

      // 1. Try finding user in database
      try {
        user = await User.findByEmail(email);
      } catch (dbErr) {
        user = null;
      }

      // If database is inactive or user not found in DB, check in-memory fallback
      if (!user) {
        user = FALLBACK_USERS.find(
          (u) => u.email.toLowerCase() === email.toLowerCase()
        );
      }

      // 2. User existence check
      if (!user) {
        return errorResponse(res, {
          statusCode: 401,
          message: "Geçersiz e-posta adresi veya şifre.",
          errors: [{ field: "email", message: "E-posta veya şifre hatalı." }],
        });
      }

      // 3. Check account active status
      const isActive =
        user.is_active !== undefined
          ? user.is_active
          : user.isActive !== undefined
          ? user.isActive
          : true;

      if (!isActive) {
        return errorResponse(res, {
          statusCode: 403,
          message: "Hesabınız askıya alınmıştır. Lütfen yönetici ile iletişime geçiniz.",
        });
      }

      // 4. Verify password with bcrypt
      const passwordHash = user.password_hash || user.passwordHash;
      if (!passwordHash) {
        return errorResponse(res, {
          statusCode: 401,
          message: "Geçersiz e-posta adresi veya şifre.",
        });
      }

      const isPasswordValid = await bcrypt.compare(password, passwordHash);
      if (!isPasswordValid) {
        return errorResponse(res, {
          statusCode: 401,
          message: "Geçersiz e-posta adresi veya şifre.",
          errors: [{ field: "password", message: "E-posta veya şifre hatalı." }],
        });
      }

      // 5. Generate JWT token
      const tokenPayload = {
        id: user.id,
        email: user.email,
        role: user.role || "user",
      };

      const token = jwt.sign(tokenPayload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn,
      });

      // 6. Return response with sanitized user data and JWT token
      const sanitizedUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
        phone: user.phone || null,
        avatarUrl: user.avatar_url || user.avatarUrl || null,
      };

      return successResponse(res, {
        statusCode: 200,
        message: "Giriş işlemi başarıyla gerçekleştirildi.",
        data: {
          token,
          user: sanitizedUser,
        },
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = AuthController;

