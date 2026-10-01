/**
 * Central API Client Service
 * Handles communication with the Express.js Backend REST API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "mini_ecommerce_token";
const USER_KEY = "mini_ecommerce_user";

class ApiService {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
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

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && token) {
          // Token expired or invalidated on server
          this.logout();
        }
        throw new Error(data.message || `HTTP error! Status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`[API Error] Request failed on ${endpoint}:`, error.message);
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
    return this.post("/auth/register", userData);
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
}

export const api = new ApiService(API_BASE_URL);
export default api;

