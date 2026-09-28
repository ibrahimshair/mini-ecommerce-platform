const Product = require("../models/product.model");
const Category = require("../models/category.model");
const { successResponse, errorResponse } = require("../utils/apiResponse");

// In-memory fallback dataset in case PostgreSQL service is not yet running locally
const FALLBACK_CATEGORIES = [
  { id: "c1", name: "Elektronik", slug: "elektronik", icon: "cpu" },
  { id: "c2", name: "Giyim & Moda", slug: "giyim-moda", icon: "shirt" },
  { id: "c3", name: "Spor & Outdoor", slug: "spor-outdoor", icon: "activity" },
  { id: "c4", name: "Ev & Yaşam", slug: "ev-yasam", icon: "home" },
  { id: "c5", name: "Aksesuar", slug: "aksesuar", icon: "watch" },
];

const FALLBACK_PRODUCTS = [
  {
    id: "p1",
    name: "Kablosuz ANC Kulak Üstü Kulaklık Pro",
    slug: "kablosuz-anc-kulak-ustu-kulaklik-pro",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 2499.0,
    oldPrice: 3199.0,
    discount: 22,
    rating: 4.8,
    reviewCount: 142,
    stock: 24,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
    isFeatured: true,
    description: "Aktif gürültü engelleme (ANC), 40 saat pil ömrü, yüksek çözünürlüklü ses kalitesi ve ultra rahat hafızalı sünger yastıklar.",
  },
  {
    id: "p2",
    name: "Akıllı GPS Spor Saati V2",
    slug: "akilli-gps-spor-saati-v2",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 3899.0,
    oldPrice: 4500.0,
    discount: 13,
    rating: 4.9,
    reviewCount: 89,
    stock: 15,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
    isFeatured: true,
    description: "AMOLED ekran, nabız ve kandaki oksijen ölçümü, dahili GPS, 50m su geçirmezlik ve 14 gün pil ömrü ile kusursuz antrenman takibi.",
  },
  {
    id: "p3",
    name: "Minimalist Su Geçirmez Laptop Sırt Çantası",
    slug: "minimalist-su-gecirmez-laptop-sirt-cantasi",
    category: "Giyim & Moda",
    categorySlug: "giyim-moda",
    price: 1299.0,
    oldPrice: 1650.0,
    discount: 21,
    rating: 4.7,
    reviewCount: 64,
    stock: 40,
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80",
    isFeatured: true,
    description: "16 inç korumalı laptop bölmesi, su itici kumaş dokusu, ergonomik omuz askıları ve gizli hırsızlık önleyici pasaport cebi.",
  },
  {
    id: "p4",
    name: "Mekanik RGB Kompakt Klavye (%75)",
    slug: "mekanik-rgb-kompakt-klavye-75",
    category: "Elektronik",
    categorySlug: "elektronik",
    price: 1899.0,
    oldPrice: 2299.0,
    discount: 17,
    rating: 4.6,
    reviewCount: 110,
    stock: 18,
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80",
    isFeatured: false,
    description: "Hot-swappable mekanik kırmızı anahtarlar, PBT tuş kapakları, alüminyum gövde ve kablosuz Bluetooth/2.4Ghz çoklu cihaz desteği.",
  },
  {
    id: "p5",
    name: "Ergonomik Yalıtımlı Çelik Termos (750ml)",
    slug: "ergonomik-yalitimli-celik-termos-750ml",
    category: "Spor & Outdoor",
    categorySlug: "spor-outdoor",
    price: 649.0,
    oldPrice: 799.0,
    discount: 18,
    rating: 4.8,
    reviewCount: 76,
    stock: 50,
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80",
    isFeatured: false,
    description: "Çift duvarlı vakumlu 18/8 paslanmaz çelik, 24 saat soğuk ve 12 saat sıcak tutma performansı, sızdırmaz emniyetli kapak.",
  },
  {
    id: "p6",
    name: "Polarize Klasik Tasarım Güneş Gözlüğü",
    slug: "polarize-klasik-tasarim-gunes-gozlugu",
    category: "Aksesuar",
    categorySlug: "aksesuar",
    price: 899.0,
    oldPrice: 1150.0,
    discount: 22,
    rating: 4.5,
    reviewCount: 52,
    stock: 25,
    image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80",
    isFeatured: false,
    description: "UV400 tam koruma filtreli polarize camlar, hafif asetat çerçeve, darbelere dayanıklı menteşe yapısı ve koruyucu deri kılıf.",
  },
];

/**
 * Controller handling product listings, single product details and category queries.
 */
const ProductController = {
  /**
   * GET /api/products
   */
  async getProducts(req, res, next) {
    try {
      const { category, minPrice, maxPrice, search, inStock, sortBy, sortOrder } = req.query;

      try {
        const products = await Product.findAll({
          categorySlug: category,
          minPrice: minPrice ? Number(minPrice) : undefined,
          maxPrice: maxPrice ? Number(maxPrice) : undefined,
          search,
          inStock: inStock === "true",
          sortBy,
          sortOrder,
        });

        if (products && products.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: "Products retrieved successfully from database",
            data: products,
            meta: { total: products.length, source: "database" },
          });
        }
      } catch (dbErr) {
        // Fallback to in-memory dataset when DB connection is pending
      }

      // Filter fallback dataset
      let filtered = [...FALLBACK_PRODUCTS];

      if (category && category !== "all" && category !== "Tümü") {
        filtered = filtered.filter(
          (p) =>
            p.categorySlug === category.toLowerCase() ||
            p.category.toLowerCase() === category.toLowerCase()
        );
      }

      if (maxPrice) {
        filtered = filtered.filter((p) => p.price <= Number(maxPrice));
      }

      if (minPrice) {
        filtered = filtered.filter((p) => p.price >= Number(minPrice));
      }

      if (inStock === "true") {
        filtered = filtered.filter((p) => p.stock > 0);
      }

      if (search && search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (p) => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }

      if (sortBy === "price-asc") filtered.sort((a, b) => a.price - b.price);
      else if (sortBy === "price-desc") filtered.sort((a, b) => b.price - a.price);
      else if (sortBy === "rating-desc") filtered.sort((a, b) => b.rating - a.rating);

      return successResponse(res, {
        statusCode: 200,
        message: "Products retrieved successfully",
        data: filtered,
        meta: { total: filtered.length, source: "application-memory" },
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/products/:id
   */
  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      try {
        const product = await Product.findById(id);
        if (product) {
          return successResponse(res, {
            statusCode: 200,
            message: "Product details retrieved",
            data: product,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      const fallback = FALLBACK_PRODUCTS.find((p) => p.id === id || p.slug === id);
      if (!fallback) {
        return errorResponse(res, {
          statusCode: 404,
          message: "Product not found",
        });
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Product details retrieved",
        data: fallback,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/products/categories
   */
  async getCategories(req, res, next) {
    try {
      try {
        const categories = await Category.findAll();
        if (categories && categories.length > 0) {
          return successResponse(res, {
            statusCode: 200,
            message: "Categories retrieved from database",
            data: categories,
          });
        }
      } catch (dbErr) {
        // Fallback
      }

      return successResponse(res, {
        statusCode: 200,
        message: "Categories retrieved",
        data: FALLBACK_CATEGORIES,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = ProductController;
