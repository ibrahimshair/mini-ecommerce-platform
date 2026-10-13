/**
 * Central API Client Service with Request & Response Interceptors
 * Handles communication with the Express.js Backend REST API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "mini_ecommerce_token";
const USER_KEY = "mini_ecommerce_user";
const SESSION_KEY = "mini_ecommerce_session_id";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.unauthorizedHandlers = new Set();

    // Register default built-in JWT Authorization and Guest Session request interceptor
    this.addRequestInterceptor(async (config) => {
      const token = this.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // Provide guest session identifier so non-authenticated carts persist across requests
      const sessionId = this.getSessionId();
      if (sessionId) {
        config.headers = {
          ...config.headers,
          "x-session-id": sessionId,
        };
      }

      return config;
    });

    // Register default built-in response interceptor (401 Auth & 429 Rate Limit)
    this.addResponseInterceptor(
      async (response) => response,
      async (error) => {
        if (error.status === 401) {
          console.warn("[Auth Interceptor] 401 Unauthorized detected. Clearing session.");
          this.logout();
          this.notifyUnauthorized(error);
        } else if (error.status === 429) {
          console.warn("[Security Interceptor] 429 Rate Limit exceeded.");
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("api:ratelimit", {
                detail: {
                  message: error.message || "Çok fazla istek gönderildi. Lütfen bekleyiniz.",
                  retryAfter: error.data?.errors?.[0]?.retryAfterSeconds || 60,
                },
              })
            );
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Interceptor Registration Methods
  addRequestInterceptor(interceptor) {
    this.requestInterceptors.push(interceptor);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((fn) => fn !== interceptor);
    };
  }

  addResponseInterceptor(onFulfilled, onRejected) {
    const interceptor = { onFulfilled, onRejected };
    this.responseInterceptors.push(interceptor);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((item) => item !== interceptor);
    };
  }

  onUnauthorized(handler) {
    this.unauthorizedHandlers.add(handler);
    return () => {
      this.unauthorizedHandlers.delete(handler);
    };
  }

  notifyUnauthorized(error) {
    this.unauthorizedHandlers.forEach((handler) => {
      try {
        handler(error);
      } catch (err) {
        console.error("Error in unauthorized handler:", err);
      }
    });

    // Dispatch global custom event for browser-wide notification
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("auth:unauthorized", {
          detail: { message: "Oturum süreniz doldu, lütfen tekrar giriş yapın." },
        })
      );
    }
  }

  // Token & Session Storage Management
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  getSessionId() {
    try {
      let sid = localStorage.getItem(SESSION_KEY);
      if (!sid) {
        sid = "guest_" + Math.random().toString(36).substring(2, 9) + "_" + Date.now();
        localStorage.setItem(SESSION_KEY, sid);
      }
      return sid;
    } catch {
      return "guest_default";
    }
  }

  setToken(token) {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
  }

  getCurrentUser() {
    try {
      const data = localStorage.getItem(USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }

  setCurrentUser(user) {
    try {
      if (user) {
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(USER_KEY);
      }
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
  }

  logout() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn("LocalStorage access failed:", e);
    }
  }

  /**
   * Helper to determine if an error or HTTP status code is retryable
   */
  isRetryable(error, status) {
    // Transient HTTP server status codes
    if (status === 502 || status === 503 || status === 504) {
      return true;
    }
    // Network failures (no response, connection refused, offline)
    if (error && (error.isNetworkError || !status || error.name === "TypeError" || error.message?.includes("fetch"))) {
      return true;
    }
    // Request timeout (if not manually aborted by client)
    if (error && error.isTimeout) {
      return true;
    }
    return false;
  }

  /**
   * Translates error details into user-friendly Turkish messages
   */
  formatErrorMessage(error) {
    if (!error) return "Bilinmeyen bir hata oluştu.";
    if (error.data?.message) return error.data.message;
    if (error.message && !error.message.startsWith("HTTP error!")) return error.message;

    switch (error.status) {
      case 400:
        return "Gönderilen istek geçersiz veya eksik bilgi içeriyor.";
      case 401:
        return "Oturum süreniz doldu veya giriş yapmanız gerekiyor.";
      case 403:
        return "Bu işlem için yetkiniz bulunmamaktadır.";
      case 404:
        return "Aradığınız kaynak bulunamadı.";
      case 409:
        return "İşlem sırasında bir veri çakışması meydana geldi.";
      case 422:
        return "Doğrulama hatası. Lütfen girdiğiniz bilgileri kontrol edin.";
      case 429:
        return "Çok fazla istek gönderildi. Lütfen bir süre bekleyip tekrar deneyin.";
      case 500:
        return "Sunucu tarafında beklenmeyen bir hata oluştu.";
      case 502:
      case 503:
      case 504:
        return "Sunucu geçici olarak yanıt veremiyor. Lütfen tekrar deneyin.";
      default:
        if (error.isTimeout) return "İstek zaman aşımına uğradı. Sunucu yanıt vermiyor.";
        if (error.isNetworkError) return "Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.";
        return error.message || "Beklenmeyen bir hata oluştu.";
    }
  }

  /**
   * Proactively checks backend API availability
   */
  async checkHealth() {
    try {
      return await this.get("/health", { retries: 0, timeout: 3500 });
    } catch {
      return null;
    }
  }

  // Core Request Method with Interceptor Chain, Exponential Backoff & Timeout Handling
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const maxRetries = options.retries !== undefined ? options.retries : 2;
    const baseRetryDelay = options.retryDelay !== undefined ? options.retryDelay : 500;
    const timeoutMs = options.timeout !== undefined ? options.timeout : 10000;

    let attempt = 0;

    while (true) {
      // Setup timeout controller if no custom signal is provided
      let controller = null;
      let timeoutId = null;
      let effectiveSignal = options.signal;

      if (!effectiveSignal && timeoutMs > 0) {
        controller = new AbortController();
        effectiveSignal = controller.signal;
        timeoutId = setTimeout(() => {
          controller.abort(new Error(`İstek zaman aşımına uğradı (${timeoutMs}ms)`));
        }, timeoutMs);
      }

      let config = {
        ...options,
        signal: effectiveSignal,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...options.headers,
        },
      };

      // Execute Request Interceptors
      for (const interceptor of this.requestInterceptors) {
        try {
          config = await interceptor(config);
        } catch (interceptErr) {
          if (timeoutId) clearTimeout(timeoutId);
          return Promise.reject(interceptErr);
        }
      }

      try {
        const response = await fetch(url, config);
        if (timeoutId) clearTimeout(timeoutId);

        // Handle non-JSON response safely
        let data = null;
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          data = await response.json();
        } else {
          const text = await response.text();
          data = text ? { message: text } : {};
        }

        if (!response.ok) {
          const error = new Error(data?.message || `HTTP error! Status: ${response.status}`);
          error.status = response.status;
          error.data = data;
          error.response = response;
          error.retryAttempts = attempt;
          error.isNetworkError = false;
          error.isTimeout = false;
          error.friendlyMessage = this.formatErrorMessage(error);

          // Check if this error is retryable and retry quota remains
          if (attempt < maxRetries && this.isRetryable(error, response.status)) {
            attempt++;
            const backoff = baseRetryDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 50);
            console.warn(
              `[API Resilience] Retrying ${endpoint} (attempt ${attempt}/${maxRetries}) in ${backoff}ms due to HTTP ${response.status}...`
            );
            if (typeof window !== "undefined") {
              window.dispatchEvent(
                new CustomEvent("api:retry", {
                  detail: {
                    endpoint,
                    attempt,
                    maxRetries,
                    delay: backoff,
                    status: response.status,
                  },
                })
              );
            }
            await new Promise((resolve) => setTimeout(resolve, backoff));
            continue; // Retry loop
          }

          // Run through rejection interceptors
          for (const { onRejected } of this.responseInterceptors) {
            if (typeof onRejected === "function") {
              try {
                await onRejected(error);
              } catch (handledErr) {
                return Promise.reject(handledErr);
              }
            }
          }

          throw error;
        }

        // Run through success interceptors
        let finalData = data;
        for (const { onFulfilled } of this.responseInterceptors) {
          if (typeof onFulfilled === "function") {
            finalData = await onFulfilled(finalData);
          }
        }

        return finalData;
      } catch (error) {
        if (timeoutId) clearTimeout(timeoutId);

        // Classify network and timeout errors
        const isTimeout =
          error.name === "AbortError" ||
          (error.message && error.message.includes("zaman aşımı"));
        const isNetwork =
          !error.status &&
          (error.name === "TypeError" ||
            isTimeout ||
            (typeof navigator !== "undefined" && !navigator.onLine));

        error.isTimeout = Boolean(isTimeout);
        error.isNetworkError = Boolean(isNetwork);
        error.retryAttempts = attempt;
        error.friendlyMessage = this.formatErrorMessage(error);

        // Notify global offline listeners if it's a network disconnect
        if (isNetwork && typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("api:offline", {
              detail: { endpoint, error: error.message },
            })
          );
        }

        // Check if error is retryable and attempt retry
        if (attempt < maxRetries && this.isRetryable(error, error.status)) {
          attempt++;
          const backoff = baseRetryDelay * Math.pow(2, attempt - 1) + Math.floor(Math.random() * 50);
          console.warn(
            `[API Resilience] Retrying ${endpoint} (attempt ${attempt}/${maxRetries}) in ${backoff}ms due to ${error.message}...`
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("api:retry", {
                detail: {
                  endpoint,
                  attempt,
                  maxRetries,
                  delay: backoff,
                  error: error.message,
                },
              })
            );
          }
          await new Promise((resolve) => setTimeout(resolve, backoff));
          continue; // Retry loop
        }

        // If error wasn't already caught by rejection interceptors
        if (!error.status) {
          console.error(`[API Network Error] Request failed on ${endpoint}:`, error.message);
        }
        throw error;
      }
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: "GET", ...options });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    });
  }

  patch(endpoint, body = {}, options = {}) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }

  // Health check helper
  async checkHealth() {
    return this.get("/health");
  }

  // Security Hardening & Audit status
  async getSecurityStatus() {
    return this.get("/health/security");
  }

  // Catalog & Product Endpoints
  async getProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const endpoint = queryString ? `/products?${queryString}` : "/products";
    return this.get(endpoint);
  }

  async getProductById(id) {
    return this.get(`/products/${id}`);
  }

  async getCategories() {
    return this.get("/categories");
  }

  async getCategoryBySlug(slug) {
    return this.get(`/categories/${slug}`);
  }

  async getCategoryProducts(slug) {
    return this.get(`/categories/${slug}/products`);
  }

  async createProduct(productData) {
    return this.post("/products", productData);
  }

  async updateProduct(id, productData) {
    return this.put(`/products/${id}`, productData);
  }

  async deleteProduct(id) {
    return this.delete(`/products/${id}`);
  }

  async updateProductStock(id, { delta, stock }) {
    return this.request(`/products/${id}/stock`, {
      method: "PATCH",
      body: JSON.stringify({ delta, stock }),
    });
  }

  // Authentication Endpoints
  async register(userData) {
    const response = await this.post("/auth/register", userData);
    return response;
  }

  async login(credentials) {
    const response = await this.post("/auth/login", credentials);
    if (response?.data?.token) {
      this.setToken(response.data.token);
      if (response?.data?.user) {
        this.setCurrentUser(response.data.user);
      }
    }
    return response;
  }

  async getMe() {
    return this.get("/auth/me");
  }

  async updateProfile(profileData) {
    const response = await this.put("/auth/me", profileData);
    if (response?.data) {
      this.setCurrentUser(response.data);
    }
    return response;
  }

  // Shopping Cart Endpoints
  async getCart() {
    return this.get("/cart");
  }

  async addToCart(productId, quantity = 1) {
    return this.post("/cart/items", { productId, quantity });
  }

  async updateCartItem(itemId, quantity) {
    return this.put(`/cart/items/${itemId}`, { quantity });
  }

  async removeCartItem(itemId) {
    return this.delete(`/cart/items/${itemId}`);
  }

  async clearCart() {
    return this.delete("/cart");
  }

  async validateCart() {
    return this.post("/cart/validate", {});
  }

  // Orders API Methods
  async createOrder(orderData) {
    return this.post("/orders", orderData);
  }

  async getOrders() {
    return this.get("/orders");
  }

  async getOrderById(orderId) {
    return this.get(`/orders/${orderId}`);
  }

  async cancelOrder(orderId) {
    return this.patch(`/orders/${orderId}/cancel`, {});
  }

  // Admin Management Endpoints
  async getAdminStats() {
    return this.get("/admin/stats");
  }

  async getAdminOrders(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const endpoint = queryString ? `/admin/orders?${queryString}` : "/admin/orders";
    return this.get(endpoint);
  }

  async updateAdminOrderStatus(orderId, status) {
    return this.patch(`/admin/orders/${orderId}/status`, { status });
  }

  async getAdminProducts(params = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== "") {
        query.append(key, val);
      }
    });
    const queryString = query.toString();
    const endpoint = queryString ? `/admin/products?${queryString}` : "/admin/products";
    return this.get(endpoint);
  }

  // Address Management Helpers (Persisted in localStorage per user)
  getAddresses(userId = "default") {
    try {
      const key = `ministore_addresses_${userId}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        return JSON.parse(saved);
      }
      const initial = [
        {
          id: "addr-1",
          title: "Ev",
          fullName: "Ahmet Yılmaz",
          phone: "0555 123 45 67",
          city: "İstanbul",
          district: "Kadıköy",
          detailedAddress: "Moda Cad. No: 14 Daire: 5",
          postalCode: "34710",
          isDefault: true,
        },
      ];
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    } catch {
      return [];
    }
  }

  saveAddresses(addresses, userId = "default") {
    try {
      const key = `ministore_addresses_${userId}`;
      localStorage.setItem(key, JSON.stringify(addresses));
    } catch (e) {
      console.warn("Adresler kaydedilemedi:", e);
    }
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
