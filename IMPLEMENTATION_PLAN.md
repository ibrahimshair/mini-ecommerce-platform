# Mini E-Commerce Platform — Ana Uygulama Planı

**Proje Adı:** Mini E-Commerce Platform
**Proje Türü:** Web Tabanlı E-Ticaret Uygulaması
**Süre:** 35 İş Günü
**Geliştirme Yaklaşımı:** Agile → Scrumban / Kanban
**Frontend:** React.js
**Backend:** Node.js + Express.js
**Veritabanı:** PostgreSQL
**API:** REST API
**Versiyon Kontrol:** Git + GitHub
**Dokümantasyon:** Markdown
**Dağıtım:** Docker / uygun hosting ortamı

---

## 1. Yönetici Özeti

Mini E-Commerce Platform, kullanıcıların ürünleri inceleyebildiği, kategorilere göre ürün arayabildiği, sepete ürün ekleyebildiği ve sipariş oluşturabildiği web tabanlı bir e-ticaret uygulamasıdır.

Projenin amacı, gerçek bir e-ticaret sisteminin temel çalışma mantığını öğrenmek ve uygulamaktır.

Proje geliştirme sürecinde frontend, backend, veritabanı, REST API, kullanıcı yönetimi, ürün yönetimi, sepet, sipariş ve yönetici işlemleri gibi temel e-ticaret bileşenleri geliştirilecektir.

Proje 35 iş günü boyunca aşamalı olarak geliştirilecek ve her aşamanın sonunda çalışan bir bölüm ortaya çıkarılacaktır.

---

# 2. Problem, Amaç ve Başarı Kriterleri

## 2.1 Problem

Kullanıcıların ürünleri tek bir platform üzerinden görüntüleyebildiği, arayabildiği, sepete ekleyebildiği ve sipariş oluşturabildiği bütünleşik bir e-ticaret sistemine ihtiyaç vardır.

Ayrıca proje kapsamında modern web uygulamalarında kullanılan frontend, backend, API ve veritabanı teknolojilerinin birlikte nasıl çalıştığının öğrenilmesi amaçlanmaktadır.

## 2.2 Amaç

Projenin temel amaçları:

* Modern bir frontend geliştirmek
* REST API geliştirmek
* Backend ve frontend arasında iletişim kurmak
* Veritabanı tasarlamak
* Kullanıcı kayıt ve giriş sistemi oluşturmak
* Ürün ve kategori yönetimi yapmak
* Sepet sistemi geliştirmek
* Sipariş sistemi oluşturmak
* Admin paneli geliştirmek
* Git ve GitHub kullanarak düzenli geliştirme yapmak
* Test ve hata kontrolü yapmak
* Projeyi çalıştırılabilir şekilde teslim etmek

## 2.3 Başarı Kriterleri

Proje sonunda:

* [ ] Kullanıcı kayıt olabilir.
* [ ] Kullanıcı giriş yapabilir.
* [ ] Kullanıcı ürünleri görüntüleyebilir.
* [ ] Ürün arayabilir ve filtreleyebilir.
* [ ] Kategorilere göre ürünleri listeleyebilir.
* [ ] Ürün detayını görüntüleyebilir.
* [ ] Ürünleri sepete ekleyebilir.
* [ ] Sepet miktarını değiştirebilir.
* [ ] Sepetten ürün çıkarabilir.
* [ ] Sipariş oluşturabilir.
* [ ] Kullanıcı geçmiş siparişlerini görebilir.
* [ ] Admin ürün ekleyebilir.
* [ ] Admin ürün güncelleyebilir.
* [ ] Admin ürün silebilir.
* [ ] Admin kategori yönetebilir.
* [ ] Frontend REST API ile haberleşebilir.
* [ ] Veriler kalıcı olarak veritabanında tutulabilir.
* [ ] Temel testler çalışır durumda olabilir.
* [ ] Proje başka bir bilgisayarda kurulup çalıştırılabilir.

---

# 3. Proje Kapsamı

## 3.1 Kapsam Dahilinde

### Kullanıcı

* Kayıt olma
* Giriş yapma
* Çıkış yapma
* Profil görüntüleme
* Profil güncelleme
* Sipariş geçmişi

### Ürün

* Ürün listeleme
* Ürün detay
* Ürün arama
* Ürün filtreleme
* Kategoriye göre listeleme
* Ürün oluşturma
* Ürün güncelleme
* Ürün silme

### Sepet

* Sepete ürün ekleme
* Ürün miktarı değiştirme
* Ürün silme
* Toplam fiyat hesaplama

### Sipariş

* Sipariş oluşturma
* Sipariş detayını görüntüleme
* Sipariş geçmişi
* Sipariş durumu

### Admin

* Admin giriş
* Ürün yönetimi
* Kategori yönetimi
* Kullanıcı görüntüleme
* Sipariş yönetimi

## 3.2 Kapsam Dışında

İlk sürümde:

* Gerçek banka ödeme entegrasyonu
* Gerçek kargo API entegrasyonu
* Native mobil uygulama
* Mikroservis mimarisi
* Kubernetes
* Gerçek zamanlı gelişmiş bildirim sistemi
* Büyük ölçekli öneri sistemi
* Üretim seviyesinde gelişmiş analitik sistem

yer almayacaktır.

---

# 4. Geliştirme Yaklaşımı

Proje **Agile** yaklaşımıyla geliştirilecektir.

Çalışma sürecinde Kanban/Scrumban mantığı kullanılacaktır.

## 4.1 Board

GitHub Projects üzerinde aşağıdaki kolonlar kullanılacaktır:

* Backlog
* Ready
* In Progress
* Review
* Blocked
* Done

## 4.2 WIP Limiti

Aynı anda en fazla **2 görev In Progress** durumunda tutulacaktır.

Yeni görev açmak yerine mevcut görev tamamlanmaya çalışılacaktır.

## 4.3 Pull Prensibi

Yeni görev, mevcut görev tamamlandıktan ve kapasite açıldıktan sonra Ready listesinden alınacaktır.

## 4.4 Definition of Ready

Bir görev geliştirmeye başlamadan önce:

* Amacı belli olmalı
* Kabul kriterleri bulunmalı
* Bağımlılıkları belirtilmeli
* Yapılabilecek büyüklükte olmalı
* Test yöntemi belli olmalı

## 4.5 Definition of Done

Bir görev:

* Kodlandı
* Lokal olarak çalıştırıldı
* Temel test yapıldı
* Hata kontrol edildi
* Git commit oluşturuldu
* Gerekirse dokümantasyon güncellendi
* GitHub'a gönderildi

durumunda Done olarak kabul edilir.

---

# 5. Teknoloji Yığını

| Katman                | Teknoloji                       |
| --------------------- | ------------------------------- |
| Frontend              | React.js                        |
| Styling               | CSS / gerektiğinde Tailwind CSS |
| Backend               | Node.js                         |
| API                   | Express.js                      |
| Database              | PostgreSQL                      |
| Authentication        | JWT                             |
| API Test              | Postman                         |
| Unit/Integration Test | Jest / Supertest                |
| Version Control       | Git                             |
| Repository            | GitHub                          |
| Container             | Docker                          |
| Package Manager       | npm                             |

Teknoloji seçimleri proje ilerledikçe ihtiyaçlara göre küçük değişiklikler gösterebilir.

---

# 6. Sistem Mimarisi

Proje temel olarak üç ana katmandan oluşacaktır:

```text
                    USER
                     |
                     v
              React Frontend
                     |
                     | REST API
                     v
             Node.js / Express
                     |
          +----------+----------+
          |          |          |
          v          v          v
       Auth       Products    Orders
          |          |          |
          +----------+----------+
                     |
                     v
                 PostgreSQL
```

Frontend kullanıcı arayüzünü oluşturacaktır.

Backend iş kurallarını ve API işlemlerini yönetecektir.

PostgreSQL ise kullanıcı, ürün, kategori, sepet ve sipariş gibi kalıcı verileri saklayacaktır.

---

# 7. Temel Veri Modeli

## 7.1 Users

| Kolon      | Tip       | Açıklama           |
| ---------- | --------- | ------------------ |
| id         | UUID      | Primary Key        |
| name       | VARCHAR   | Kullanıcı adı      |
| email      | VARCHAR   | E-posta            |
| password   | VARCHAR   | Hashlenmiş şifre   |
| role       | VARCHAR   | user/admin         |
| created_at | TIMESTAMP | Oluşturulma tarihi |

## 7.2 Categories

| Kolon      | Tip       | Açıklama           |
| ---------- | --------- | ------------------ |
| id         | UUID      | Primary Key        |
| name       | VARCHAR   | Kategori adı       |
| created_at | TIMESTAMP | Oluşturulma tarihi |

## 7.3 Products

| Kolon       | Tip       | Açıklama           |
| ----------- | --------- | ------------------ |
| id          | UUID      | Primary Key        |
| category_id | UUID      | Kategori FK        |
| name        | VARCHAR   | Ürün adı           |
| description | TEXT      | Ürün açıklaması    |
| price       | DECIMAL   | Ürün fiyatı        |
| stock       | INTEGER   | Stok               |
| image_url   | TEXT      | Ürün görseli       |
| created_at  | TIMESTAMP | Oluşturulma tarihi |

## 7.4 Cart

| Kolon      | Tip       | Açıklama           |
| ---------- | --------- | ------------------ |
| id         | UUID      | Primary Key        |
| user_id    | UUID      | Kullanıcı FK       |
| created_at | TIMESTAMP | Oluşturulma tarihi |

## 7.5 Cart Items

| Kolon      | Tip     | Açıklama    |
| ---------- | ------- | ----------- |
| id         | UUID    | Primary Key |
| cart_id    | UUID    | Sepet FK    |
| product_id | UUID    | Ürün FK     |
| quantity   | INTEGER | Miktar      |

## 7.6 Orders

| Kolon       | Tip       | Açıklama       |
| ----------- | --------- | -------------- |
| id          | UUID      | Primary Key    |
| user_id     | UUID      | Kullanıcı FK   |
| total_price | DECIMAL   | Toplam fiyat   |
| status      | VARCHAR   | Sipariş durumu |
| created_at  | TIMESTAMP | Sipariş tarihi |

## 7.7 Order Items

| Kolon      | Tip     | Açıklama               |
| ---------- | ------- | ---------------------- |
| id         | UUID    | Primary Key            |
| order_id   | UUID    | Sipariş FK             |
| product_id | UUID    | Ürün FK                |
| quantity   | INTEGER | Miktar                 |
| price      | DECIMAL | Sipariş anındaki fiyat |

---

# 8. REST API Planı

## Authentication

| Method | Endpoint             | Açıklama          |
| ------ | -------------------- | ----------------- |
| POST   | `/api/auth/register` | Kullanıcı kayıt   |
| POST   | `/api/auth/login`    | Kullanıcı giriş   |
| GET    | `/api/auth/me`       | Kullanıcı bilgisi |

## Products

| Method | Endpoint            | Açıklama         |
| ------ | ------------------- | ---------------- |
| GET    | `/api/products`     | Ürünleri listele |
| GET    | `/api/products/:id` | Ürün detay       |
| POST   | `/api/products`     | Ürün oluştur     |
| PUT    | `/api/products/:id` | Ürün güncelle    |
| DELETE | `/api/products/:id` | Ürün sil         |

## Categories

| Method | Endpoint              | Açıklama             |
| ------ | --------------------- | -------------------- |
| GET    | `/api/categories`     | Kategorileri listele |
| POST   | `/api/categories`     | Kategori oluştur     |
| PUT    | `/api/categories/:id` | Kategori güncelle    |
| DELETE | `/api/categories/:id` | Kategori sil         |

## Cart

| Method | Endpoint              | Açıklama         |
| ------ | --------------------- | ---------------- |
| GET    | `/api/cart`           | Sepeti getir     |
| POST   | `/api/cart/items`     | Sepete ürün ekle |
| PUT    | `/api/cart/items/:id` | Miktar güncelle  |
| DELETE | `/api/cart/items/:id` | Ürün çıkar       |

## Orders

| Method | Endpoint                 | Açıklama                  |
| ------ | ------------------------ | ------------------------- |
| POST   | `/api/orders`            | Sipariş oluştur           |
| GET    | `/api/orders`            | Kullanıcı siparişleri     |
| GET    | `/api/orders/:id`        | Sipariş detay             |
| PUT    | `/api/orders/:id/status` | Sipariş durumunu güncelle |

---

# 9. Proje Dizin Yapısı

```text
mini-ecommerce-platform/
│
├── README.md
├── IMPLEMENTATION_PLAN.md
├── .gitignore
├── docker-compose.yml
│
├── frontend/
│   ├── package.json
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   ├── hooks/
│   │   └── App.jsx
│   └── public/
│
├── backend/
│   ├── package.json
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── middleware/
│       ├── services/
│       ├── config/
│       └── app.js
│
├── database/
│   └── migrations/
│
├── tests/
│
└── docs/
    ├── architecture.md
    ├── api.md
    └── database.md
```

---

# 10. 35 Günlük Takvim

| Gün | Faz | Ana Görev                                   |
| --- | --- | ------------------------------------------- |
| 1   | B1  | G1 Proje ve GitHub iskeleti                 |
| 2   | B1  | G2 Scrumban/Kanban kurulumu                 |
| 3   | B1  | G3 React frontend kurulumu                  |
| 4   | B1  | G4 Backend kurulumu                         |
| 5   | B1  | G5 PostgreSQL kurulumu                      |
| 6   | B1  | G6 Veritabanı modelleri                     |
| 7   | B1  | G7 Backend-DB bağlantısı                    |
| 8   | B2  | G8 Kullanıcı kayıt sistemi                  |
| 9   | B2  | G9 Login + JWT                              |
| 10  | B2  | G10 Authentication middleware               |
| 11  | B2  | G11 Frontend routing                        |
| 12  | B2  | G12 Login/Register UI                       |
| 13  | B2  | G13 Kullanıcı profil sistemi                |
| 14  | B2  | G14 Authentication entegrasyonu             |
| 15  | B2  | Review + hata düzeltmeleri                  |
| 16  | B3  | G15 Kategori sistemi                        |
| 17  | B3  | G16 Ürün listeleme                          |
| 18  | B3  | G17 Ürün detay                              |
| 19  | B3  | G18 Ürün arama/filtreleme                   |
| 20  | B3  | G19 Admin ürün yönetimi                     |
| 21  | B3  | G20 Admin kategori yönetimi                 |
| 22  | B3  | G21 Sepet backend                           |
| 23  | B3  | G22 Sepet frontend                          |
| 24  | B3  | G23 Sepet hesaplama/stok kontrolü           |
| 25  | B3  | Review + entegrasyon                        |
| 26  | B4  | G24 Sipariş oluşturma                       |
| 27  | B4  | G25 Sipariş geçmişi                         |
| 28  | B4  | G26 Admin sipariş yönetimi                  |
| 29  | B4  | G27 Ana sayfa ve genel UI                   |
| 30  | B4  | G28 Responsive tasarım                      |
| 31  | B4  | G29 API hata yönetimi                       |
| 32  | B4  | G30 Güvenlik kontrolleri                    |
| 33  | B4  | G31 Testler                                 |
| 34  | B4  | G32 Docker + deployment                     |
| 35  | B4  | G33–G35 Final test, dokümantasyon ve teslim |

> Not: Günlük plan rehber niteliğindedir. Görevlerin tamamlanma durumuna göre günler arasında küçük değişiklikler yapılabilir.

---

# 11. Fazlar ve Görevler

## Faz 1 — Foundation

**Gün 1–7**

Amaç:

* Geliştirme ortamını hazırlamak
* GitHub repository oluşturmak
* Proje yapısını kurmak
* Frontend ve backend'i başlatmak
* PostgreSQL bağlantısını oluşturmak

### G1 — Proje iskeleti

**Amaç:** Projenin temel klasör ve Git yapısını oluşturmak.

**Teslimatlar:**

* Git repository
* README
* `.gitignore`
* Frontend
* Backend
* Docs klasörü

**Kabul kriterleri:**

* [ ] Proje çalışıyor
* [ ] Git repository hazır
* [ ] İlk commit oluşturuldu

---

### G2 — Scrumban/Kanban

**Amaç:** Geliştirme sürecini GitHub Projects üzerinden takip etmek.

**Teslimatlar:**

* Board
* Backlog
* Ready
* In Progress
* Review
* Done

**Kabul kriterleri:**

* [ ] Görevler board üzerinde
* [ ] Milestone'lar oluşturuldu
* [ ] WIP limiti belirlendi

---

### G3 — React kurulumu

**Amaç:** Frontend geliştirme ortamını oluşturmak.

**Kabul kriterleri:**

* [ ] React çalışıyor
* [ ] Ana sayfa görüntüleniyor
* [ ] GitHub'a commit gönderildi

---

### G4 — Express backend

**Amaç:** REST API geliştirme ortamını hazırlamak.

**Kabul kriterleri:**

* [ ] Express çalışıyor
* [ ] `/api/health` endpoint'i çalışıyor
* [ ] Server başlatılabiliyor

---

### G5 — PostgreSQL

**Amaç:** Kalıcı veritabanını hazırlamak.

**Kabul kriterleri:**

* [ ] PostgreSQL bağlantısı çalışıyor
* [ ] Database oluşturuldu
* [ ] Connection test edildi

---

### G6 — Database modelleri

**Amaç:** Kullanıcı, ürün, kategori, sepet ve sipariş tablolarını oluşturmak.

**Kabul kriterleri:**

* [ ] Tablolar oluşturuldu
* [ ] Foreign key ilişkileri çalışıyor
* [ ] Temel CRUD test edildi

---

### G7 — Backend-DB entegrasyonu

**Amaç:** Express API'nin veritabanıyla haberleşmesini sağlamak.

**Kabul kriterleri:**

* [ ] API üzerinden DB'ye veri yazılabiliyor
* [ ] DB'den veri okunabiliyor

---

# Faz 2 — Authentication & User

**Gün 8–15**

Amaç:

* Kullanıcı sistemi
* JWT
* Login/Register
* Frontend authentication
* Profil

Görevler:

* **G8:** Register
* **G9:** Login + JWT
* **G10:** Auth middleware
* **G11:** React Router
* **G12:** Login/Register UI
* **G13:** Profile
* **G14:** Frontend authentication entegrasyonu

**Faz çıkış kriteri:**

Kullanıcı kayıt olabilir, giriş yapabilir ve korumalı sayfalara erişebilir.

---

# Faz 3 — Product, Cart & Admin

**Gün 16–25**

Amaç:

* Kategori
* Ürün
* Arama
* Filtreleme
* Admin
* Sepet

Görevler:

* **G15:** Category API
* **G16:** Product API
* **G17:** Product Detail
* **G18:** Search & Filter
* **G19:** Admin Product Management
* **G20:** Admin Category Management
* **G21:** Cart Backend
* **G22:** Cart Frontend
* **G23:** Cart calculation & stock
* **G24:** Integration improvements

**Faz çıkış kriteri:**

Kullanıcı ürünleri inceleyebilir, arayabilir ve sepete ekleyebilir. Admin ürün ve kategori yönetebilir.

---

# Faz 4 — Orders, UI, Test & Deployment

**Gün 26–35**

Amaç:

* Sipariş sistemi
* Kullanıcı sipariş geçmişi
* Admin sipariş yönetimi
* Responsive UI
* Test
* Docker
* Final teslim

Görevler:

* **G25:** Order creation
* **G26:** Order history
* **G27:** Admin order management
* **G28:** Homepage/UI
* **G29:** Responsive design
* **G30:** Error handling
* **G31:** Security checks
* **G32:** Automated tests
* **G33:** Docker
* **G34:** Deployment
* **G35:** Final documentation & delivery

**Faz çıkış kriteri:**

Kullanıcı baştan sona alışveriş akışını tamamlayabilir ve proje başka bir ortamda kurulup çalıştırılabilir.

---

# 12. Güvenlik

Minimum güvenlik gereksinimleri:

* Şifreler düz metin tutulmayacak.
* Password hashing kullanılacak.
* JWT doğrulaması yapılacak.
* Admin endpointleri rol kontrolünden geçirilecek.
* Kullanıcı sadece kendi siparişlerini görebilecek.
* SQL injection'a karşı parametreli sorgular/ORM kullanılacak.
* Secret bilgiler GitHub'a gönderilmeyecek.
* `.env` dosyası `.gitignore` içerisinde olacak.
* Kullanıcıdan gelen veriler doğrulanacak.

---

# 13. Test Stratejisi

## Unit Test

Temel fonksiyonlar:

* Fiyat hesaplama
* Sepet toplamı
* Stok kontrolü
* Authentication yardımcı fonksiyonları

## Integration Test

* Register
* Login
* Product API
* Cart API
* Order API

## API Test

Postman ile:

* GET
* POST
* PUT
* DELETE

endpointleri kontrol edilecektir.

## Minimum Testler

* [ ] Register çalışıyor
* [ ] Login çalışıyor
* [ ] JWT doğrulaması çalışıyor
* [ ] Product CRUD çalışıyor
* [ ] Cart işlemleri çalışıyor
* [ ] Order oluşturuluyor
* [ ] Admin yetkilendirmesi çalışıyor

---

# 14. Git ve GitHub Çalışma Standardı

Commit mesajları mümkün olduğunca anlamlı tutulacaktır.

Örnek:

```text
feat: add product listing
feat: implement user login
fix: resolve cart total calculation
docs: update api documentation
test: add order integration tests
refactor: improve auth middleware
```

Branch örnekleri:

```text
main
develop
feature/auth
feature/products
feature/cart
feature/orders
fix/cart-total
```

Her önemli görev tamamlandıktan sonra commit oluşturulacak ve GitHub'a push edilecektir.

---

# 15. Risk Kaydı

| ID | Risk                                  | Olasılık | Etki   | Önlem                            |
| -- | ------------------------------------- | -------- | ------ | -------------------------------- |
| R1 | Backend öğrenme süresi                | Yüksek   | Yüksek | Görevleri küçük parçalara bölmek |
| R2 | Database bağlantı problemleri         | Orta     | Orta   | Erken bağlantı testi             |
| R3 | JWT/Auth hataları                     | Orta     | Yüksek | Önce backend testleri            |
| R4 | Kapsamın büyümesi                     | Yüksek   | Yüksek | MVP kapsamına bağlı kalmak       |
| R5 | Frontend/backend entegrasyon hataları | Orta     | Orta   | API'leri Postman ile test etmek  |
| R6 | Deployment problemleri                | Orta     | Orta   | Deployment'ı son güne bırakmamak |
| R7 | Git merge problemleri                 | Düşük    | Orta   | Küçük commit ve branch kullanımı |

---

# 16. MoSCoW Önceliklendirme

## Must

* Proje kurulumu
* React
* Express
* Database
* Register/Login
* JWT
* Ürün sistemi
* Kategori sistemi
* Sepet
* Sipariş
* Admin
* REST API
* Temel testler
* GitHub
* Dokümantasyon

## Should

* Gelişmiş filtreleme
* Responsive tasarım
* Gelişmiş admin paneli
* Daha kapsamlı testler
* Docker

## Could

* Favoriler
* Ürün yorumları
* Gelişmiş arama
* Basit dashboard
* Dark mode

## Won't

İlk sürümde:

* Gerçek ödeme sistemi
* Native mobil uygulama
* Mikroservis
* Kubernetes
* Gerçek kargo entegrasyonu

---

# 17. İlerleme Panosu

| Faz   | Görevler | Durum |
| ----- | -------- | ----- |
| Faz 1 | G1–G7    | [ ]   |
| Faz 2 | G8–G14   | [ ]   |
| Faz 3 | G15–G24  | [ ]   |
| Faz 4 | G25–G35  | [ ]   |

## Görev Durumları

* [ ] G1 — Proje iskeleti
* [ ] G2 — Scrumban/Kanban
* [ ] G3 — React
* [ ] G4 — Express
* [ ] G5 — PostgreSQL
* [ ] G6 — Database modelleri
* [ ] G7 — DB entegrasyonu
* [ ] G8 — Register
* [ ] G9 — Login/JWT
* [ ] G10 — Auth middleware
* [ ] G11 — Frontend routing
* [ ] G12 — Login/Register UI
* [ ] G13 — Profile
* [ ] G14 — Auth entegrasyonu
* [ ] G15 — Categories
* [ ] G16 — Products
* [ ] G17 — Product detail
* [ ] G18 — Search/filter
* [ ] G19 — Admin products
* [ ] G20 — Admin categories
* [ ] G21 — Cart backend
* [ ] G22 — Cart frontend
* [ ] G23 — Cart calculation
* [ ] G24 — Integration
* [ ] G25 — Order creation
* [ ] G26 — Order history
* [ ] G27 — Admin orders
* [ ] G28 — Homepage/UI
* [ ] G29 — Responsive design
* [ ] G30 — Error handling
* [ ] G31 — Security
* [ ] G32 — Tests
* [ ] G33 — Docker
* [ ] G34 — Deployment
* [ ] G35 — Final delivery

---

# 18. Final Demo Senaryosu

Proje tesliminde aşağıdaki akış gösterilecektir:

1. Proje çalıştırılır.
2. Ana sayfa açılır.
3. Kullanıcı kayıt olur.
4. Kullanıcı giriş yapar.
5. Ürünler görüntülenir.
6. Ürün detayına girilir.
7. Ürün sepete eklenir.
8. Sepet görüntülenir.
9. Sipariş oluşturulur.
10. Sipariş geçmişi görüntülenir.
11. Admin hesabıyla giriş yapılır.
12. Admin ürün ekler/günceller/siler.
13. API endpointleri gösterilir.
14. Veritabanı ilişkileri gösterilir.
15. Testler çalıştırılır.

---

# 19. Teslim Kontrol Listesi

* [ ] GitHub repository güncel
* [ ] README tamamlandı
* [ ] IMPLEMENTATION_PLAN.md güncel
* [ ] Frontend çalışıyor
* [ ] Backend çalışıyor
* [ ] Database çalışıyor
* [ ] Authentication çalışıyor
* [ ] Product sistemi çalışıyor
* [ ] Cart sistemi çalışıyor
* [ ] Order sistemi çalışıyor
* [ ] Admin sistemi çalışıyor
* [ ] API testleri tamamlandı
* [ ] Automated tests tamamlandı
* [ ] Responsive kontrol yapıldı
* [ ] Security kontrolü yapıldı
* [ ] Docker/deployment kontrolü yapıldı
* [ ] Demo senaryosu hazırlandı

---

# 20. Belge Geçmişi

| Sürüm | Tarih   | Açıklama                                     |
| ----- | ------- | -------------------------------------------- |
| 1.0   | 2026-09 | İlk 35 günlük uygulama planı                 |
| 1.1   | —       | Proje yapısı ve görevlerin detaylandırılması |
| 1.2   | —       | Geliştirme ilerlemesine göre güncellenecek   |

---

**Mini E-Commerce Platform — 35 İş Günlük Implementation Plan**

Bu belge projenin ana geliştirme referansıdır. Proje sırasında görev sırası veya kapsam değişirse öncelikle bu dosya güncellenecektir.
