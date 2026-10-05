/**
 * Central API Client Service with Request & Response Interceptors
 * Handles communication with the Express.js Backend REST API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "mini_ecommerce_token";
const USER_KEY = "mini_ecommerce_user";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.requestInterceptors = [];
    this.responseInterceptors = [];
    this.unauthorizedHandlers = new Set();

    // Register default built-in JWT Authorization request interceptor
    this.addRequestInterceptor(async (config) => {
      const token = this.getToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return config;
    });

    // Register default built-in 401 Unauthorized response interceptor
    this.addResponseInterceptor(
      async (response) => response,
      async (error) => {
        if (error.status === 401) {
          console.warn("[Auth Interceptor] 401 Unauthorized detected. Clearing session.");
          this.logout();
          this.notifyUnauthorized(error);
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

  // Core Request Method with Interceptor Chain Execution
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;

    let config = {
      ...options,
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
        return Promise.reject(interceptErr);
      }
    }

    try {
      const response = await fetch(url, config);

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
        const error = new Error(data.message || `HTTP error! Status: ${response.status}`);
        error.status = response.status;
        error.data = data;
        error.response = response;

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
      // If error wasn't already caught by rejection interceptors
      if (!error.status) {
        console.error(`[API Network Error] Request failed on ${endpoint}:`, error.message);
      }
      throw error;
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

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: "DELETE", ...options });
  }

  // Health check helper
  async checkHealth() {
    return this.get("/health");
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
