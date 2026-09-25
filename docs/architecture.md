# Mini E-Commerce Platform — Sistem Mimarisi & Dizin Standardı

Bu doküman, Mini E-Commerce Platform projesinin mimari katmanlarını, dizin hiyerarşisini, katmanlar arası veri akışını ve kurumsal kodlama standartlarını tanımlar.

---

## 1. Yüksek Seviye Sistem Mimarisi

Proje modern **3 Katmanlı (3-Tier)** web mimarisi üzerinde tasarlanmıştır:

```text
+-----------------------------------------------------------------------+
|                         KULLANICI KATMANI                             |
|               Modern Web Tarayıcıları (Desktop & Mobile)              |
+-----------------------------------------------------------------------+
                                   │
                                   ▼  (HTTPS / REST API JSON)
+-----------------------------------------------------------------------+
|                       SUNUM KATMANI (FRONTEND)                        |
|                  React 19 + Vite + Modern Vanilla CSS                 |
|  - Sayfalar (Pages): HomePage, ProductsPage, Cart, Auth               |
|  - Bileşenler (Components): Navbar, Footer, ProductCard, Modals      |
|  - İstemci Servisleri (Services): Centralized API Client (Fetch)      |
|  - Durum Yönetimi (Context & Hooks): AuthContext, CartContext        |
|  - Yardımcılar (Utils): Formatters, Constants                         |
+-----------------------------------------------------------------------+
                                   │
                                   ▼  (JSON Endpoints / HTTP REST)
+-----------------------------------------------------------------------+
|                        İŞ MANTIĞI (BACKEND)                           |
|                         Node.js + Express.js                          |
|  - Sunucu Başlatıcı: server.js (Port dinleme, Graceful Shutdown)      |
|  - Uygulama Yapılandırması: app.js (Middleware zinciri, Test hazır)   |
|  - Yönlendirme (Routes): /api/health, /api/auth, /api/products        |
|  - Denetleyiciler (Controllers): HTTP istek ve yanıt yönetimi         |
|  - İş Servisleri (Services): İş kuralları ve veri işleme              |
|  - Ara Yazılımlar (Middleware): CORS, Morgan, ErrorHandler, Auth      |
|  - Konfigürasyon (Config): Ortam değişkenleri, DB havuz ayarları       |
|  - Yardımcılar (Utils): apiResponse standartlaştırıcılar              |
+-----------------------------------------------------------------------+
                                   │
                                   ▼  (SQL Bağlantı Havuzu / pg)
+-----------------------------------------------------------------------+
|                       VERİ KATMANI (DATABASE)                         |
|                             PostgreSQL                                |
|  - Kullanıcılar (Users), Ürünler (Products), Kategoriler (Categories) |
|  - Sepet ve Kalemleri (Carts, CartItems)                              |
|  - Siparişler ve Yorumlar (Orders, OrderItems, Reviews)               |
+-----------------------------------------------------------------------+
```

---

## 2. Detaylı Proje Dizin Ağacı

```text
mini-ecommerce-platform/
├── backend/                        # Node.js / Express REST API Servisi
│   ├── src/
│   │   ├── config/                 # Merkezi konfigürasyon & DB havuz arayüzü
│   │   │   ├── index.js            # Dotenv & çevre değişkenleri
│   │   │   └── db.js               # PostgreSQL bağlantı arayüzü
│   │   ├── controllers/            # İstek denetleyicileri (Controller Katmanı)
│   │   │   └── health.controller.js# Sistem sağlık durumu controller'ı
│   │   ├── middleware/             # Özel ara yazılımlar
│   │   │   └── errorHandler.js     # 404 ve merkezi hata yakalama
│   │   ├── models/                 # Veritabanı modelleri & şemaları (Gelecek)
│   │   ├── routes/                 # Modüler API yönlendiricileri
│   │   │   ├── index.js            # Ana API kök yönlendiricisi (/api)
│   │   │   └── health.routes.js    # Sağlık kontrol rotası (/api/health)
│   │   ├── services/               # İş mantığı servis katmanı
│   │   ├── utils/                  # Yardımcı araçlar
│   │   │   └── apiResponse.js      # Standart JSON başarı/hata yanıtları
│   │   ├── app.js                  # Express uygulaması & middleware montajı
│   │   └── server.js               # HTTP sunucu başlatıcı (app.listen)
│   ├── .env.example                # Örnek çevre değişkenleri şablonu
│   ├── package.json                # Bağımlılıklar (cors, express, morgan, dotenv)
│   └── README.md                   # Backend kurulum ve çalıştırma dokümanı
│
├── frontend/                       # React 19 + Vite İstemci Uygulaması
│   ├── public/                     # Statik varlıklar (favicon vb.)
│   ├── src/
│   │   ├── assets/                 # Görsel ve ikon varlıkları
│   │   ├── components/             # Yeniden kullanılabilir UI bileşenleri
│   │   │   ├── Navbar.jsx & .css   # Duyarlı üst gezinme çubuğu
│   │   │   ├── Footer.jsx & .css   # Çok sütunlu alt bilgi alanı
│   │   │   ├── ProductCard.jsx & .css # Modüler ürün kartı bileşeni
│   │   │   └── ProductDetailModal.jsx # Ürün detay & hızlı bakış popup modalı
│   │   ├── context/                # Global durum yönetimi (Auth, Cart Context)
│   │   ├── hooks/                  # Özel React hook'ları
│   │   ├── pages/                  # Sayfa görünümleri
│   │   │   ├── HomePage.jsx & .css # Karşılama ve öne çıkanlar ana sayfası
│   │   │   └── ProductsPage.jsx    # Filtrelemeli ürün kataloğu sayfası
│   │   ├── services/               # API haberleşme katmanı
│   │   │   └── api.js              # Merkezi Fetch / REST API istemcisi
│   │   ├── utils/                  # Yardımcı araçlar
│   │   │   └── formatters.js       # Para birimi, tarih ve metin formatlayıcılar
│   │   ├── App.jsx                 # Ana sayfa yönlendirici & layout birleştirici
│   │   ├── index.css               # CSS değişkenleri & global tasarım sistemi
│   │   └── main.jsx                # React DOM kök render noktası
│   ├── package.json                # Frontend paketleri ve scriptleri
│   ├── vite.config.js              # Vite derleyici yapılandırması
│   └── README.md
│
├── database/                       # Veritabanı dosyaları
│   └── migrations/                 # SQL migration betikleri (Milestone 4/5)
├── docs/                           # Proje dokümantasyonu
│   ├── architecture.md             # Sistem mimarisi ve standartlar (Bu doküman)
│   ├── api.md                      # REST API kılavuzu ve uç nokta tanımları
│   └── git-workflow.md             # Git dal yönetimi ve PR kuralları
├── tests/                          # Entegrasyon ve birim testleri (Milestone 7)
├── IMPLEMENTATION_PLAN.md          # 35 günlük Agile geliştirme planı
├── README.md                       # Ana proje tanıtımı ve kurulum rehberi
└── .gitignore                      # Git takip dışı dosyalar listesi
```

---

## 3. İstek Yaşam Döngüsü (Request Lifecycle)

Bir kullanıcı tarayıcı üzerinden işlem yaptığında veri akışı şu sırayı takip eder:

```text
[Kullanıcı Tarayıcısı]
         │
         ▼ (HTTP GET /api/health)
[server.js] ➔ Port dinlenir, istek karşılanır.
         │
         ▼
[app.js]    ➔ 1. CORS denetimi yapılır.
            ➔ 2. Morgan HTTP logger ile istek terminale yazılır.
            ➔ 3. JSON body-parser isteği ayrıştırır.
         │
         ▼
[routes/index.js] ➔ İstek /api önekine göre yönlendirilir.
         │
         ▼
[routes/health.routes.js] ➔ İlgili HTTP metodu ve uç nokta eşleşir.
         │
         ▼
[controllers/health.controller.js] ➔ İş mantığı işletilir, sistem metrikleri toplanır.
         │
         ▼
[utils/apiResponse.js] ➔ Standart { success: true, message, data } JSON oluşturulur.
         │
         ▼
[İstemciye Yanıt] ➔ 200 OK ile standart JSON döner.
```

---

## 4. Uygulanan Tasarım Desenleri ve Mimari Prensipler

1. **Separation of Concerns (Sorumlulukların Ayrımı):**
   - Sunucunun ağ portunu dinlemesi (`server.js`) ile Express middleware/rota konfigürasyonu (`app.js`) birbirinden ayrılmıştır. Bu ayrım, ileride yazılacak `Supertest` testlerinin sunucu portu açmadan çalışabilmesini sağlar.
2. **Controller-Service-Route Mimarisi:**
   - Rota dosyaları sadece uç noktaları tanımlar, iş mantığını içermez.
   - Denetleyiciler (Controllers) HTTP isteklerini alır ve yanıt döner.
   - Servisler (Services) karmaşık iş kurallarını işletir.
3. **Merkezi Konfigürasyon (Singleton Config):**
   - Kod içinde dağınık `process.env` çağrıları yerine tek bir `config/index.js` modülü üzerinden doğrulanmış parametreler tüketilir.
4. **Merkezi Hata Yakalama (Centralized Error Handling):**
   - Hatalar controller içinde `next(err)` ile global `errorHandler` middleware'ine devredilir. İstemciye her zaman tutarlı `{ success: false, message: ... }` formatında yanıt gider.
