# Mini E-Commerce Platform — Sistem Mimarisi

Bu doküman, Mini E-Commerce Platform projesinin sistem mimarisini, katmanlar arası veri akışını ve temel bileşen ilişkilerini açıklar.

---

## 1. Yüksek Seviye Mimari

Proje modern **3 Katmanlı (3-Tier)** web mimarisi üzerinde tasarlanmıştır:

```text
+-----------------------------------------------------------+
|                   KULLANICI KATMANI                       |
|           Modern Tarayıcılar (Desktop & Mobile)           |
+-----------------------------------------------------------+
                             │
                             ▼  (HTTPS / REST API)
+-----------------------------------------------------------+
|                  SUNUM KATMANI (FRONTEND)                 |
|              React.js + Vite + Modern Vanilla CSS         |
|  - Sayfalar (Home, Product, Cart, Profile, Admin)         |
|  - Yeniden Kullanılabilir Bileşenler (Navbar, Footer...)  |
|  - State Yönetimi & API Servis İstemcisi                 |
+-----------------------------------------------------------+
                             │
                             ▼  (JSON / RESTful Endpoints)
+-----------------------------------------------------------+
|                   İŞ MANTIĞI (BACKEND)                    |
|                    Node.js + Express.js                   |
|  - Routing & Controller Katmanı                           |
|  - Middleware (Auth/JWT, Error Handling, CORS)           |
|  - İş Servisleri (Auth, Ürün, Sepet, Sipariş)            |
+-----------------------------------------------------------+
                             │
                             ▼  (SQL Queries / Connection Pool)
+-----------------------------------------------------------+
|                    VERİ KATMANI (DATABASE)                |
|                          PostgreSQL                       |
|  - Kullanıcılar, Ürünler, Kategoriler                     |
|  - Sepet ve Sepet Kalemleri                               |
|  - Siparişler, Yorumlar ve Değerlendirmeler               |
+-----------------------------------------------------------+
```

---

## 2. Modüller ve Klasör Sorumlulukları

### Frontend (`/frontend`)
- `src/components/`: Sayfalar arasında paylaşılan görsel bileşenler (`Navbar`, `Footer`, `ProductCard` vb.).
- `src/pages/`: Tekil sayfa görünümleri (`HomePage`, `ProductsPage`, `LoginPage` vb.).
- `src/services/`: Backend REST API uç noktaları ile iletişim kuran Axios/Fetch servisleri.
- `src/context/`: Sepet, kullanıcı oturumu ve tema gibi global durumları yöneten React Context yapıları.

### Backend (`/backend`)
- `src/config/`: Ortam değişkenleri (`dotenv`), veritabanı bağlantı parametreleri.
- `src/controllers/`: HTTP isteklerini karşılayan ve servis mantığını çağıran işleyiciler.
- `src/routes/`: Endpoint tanımlamaları (`/api/auth`, `/api/products`, `/api/cart`, `/api/orders`).
- `src/middleware/`: Yetkilendirme (JWT), istek doğrulama ve merkezi hata yakalama mekanizmaları.
- `src/models/`: Veritabanı sorguları ve şema tanımları.

---

## 3. Güvenlik ve İletişim İlkeleri

1. **CORS (Cross-Origin Resource Sharing):** Frontend portu (`http://localhost:5173`) yetkilendirilmiş kaynak olarak tanımlanır.
2. **Stateless Kimlik Doğrulama:** Kullanıcı oturumları JSON Web Token (JWT) ile Authorization başlığı (`Bearer <token>`) üzerinden iletilir.
3. **Merkezi Hata Yönetimi:** Tüm backend hataları tek bir hata yakalama middleware'i üzerinden standart bir JSON şablonuyla (`{ success: false, error: "..." }`) döndürülür.
