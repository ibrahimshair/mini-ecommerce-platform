# Mini E-Commerce Platform — REST API Kılavuzu

Bu doküman, Mini E-Commerce Platform REST API servisinin tasarım ilkelerini, uç nokta standartlarını, HTTP durum kodlarını ve yanıt formatlarını açıklar.

---

## 1. Temel İlkeler

- **Taban URL:** `http://localhost:5000/api`
- **Veri Formatı:** Tüm istek ve yanıtlarda `Content-Type: application/json` kullanılır.
- **Tarih Formatı:** ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`).
- **Kimlik Doğrulama:** JWT tabanlı Bearer Token (Milestone 3'te aktif olacaktır).

---

## 2. Standart JSON Yanıt Şablonları

Tüm API yanıtları tekdüze bir şablon kullanır:

### Başarılı Yanıt (Success Response)
```json
{
  "success": true,
  "message": "İşlem başarıyla tamamlandı",
  "data": {
    "id": "1",
    "name": "Örnek Veri"
  },
  "meta": {
    "total": 1,
    "page": 1
  }
}
```

### Hata Yanıtı (Error Response)
```json
{
  "success": false,
  "message": "Kaynak bulunamadı",
  "errors": [
    {
      "field": "email",
      "message": "Geçerli bir e-posta adresi giriniz"
    }
  ]
}
```

---

## 3. HTTP Durum Kodları Standartları

| Durum Kodu | Açıklama | Kullanım Yeri |
| :--- | :--- | :--- |
| `200 OK` | İstek başarıyla karşılandı | Veri getirme, güncelleme işlemleri |
| `201 Created` | Yeni kaynak oluşturuldu | Kayıt olma, sipariş oluşturma, ürün ekleme |
| `400 Bad Request` | Geçersiz istek parametresi | Doğrulama (Validation) hataları |
| `401 Unauthorized` | Kimlik doğrulama başarısız | Giriş yapılmamış veya token geçersiz |
| `403 Forbidden` | Yetki yetersiz | Admin sayfasına normal kullanıcının erişmesi |
| `404 Not Found` | İstenen kaynak bulunamadı | Olmayan ürün, sayfa veya endpoint |
| `500 Server Error` | Sunucu içi beklenmedik hata | Veritabanı arızası, kod istisnası |

---

## 4. Mevcut Uç Noktalar (Milestone 1)

### Sağlık ve Veritabanı Kontrolü (Health Check)
- **Metod:** `GET`
- **Uç Nokta:** `/api/health`
- **Açıklama:** API servisinin ve PostgreSQL bağlantı havuzunun durumunu, ping gecikmesini ve sistem bellek kullanımını raporlar.
- **Örnek Yanıt:**
```json
{
  "success": true,
  "message": "System and database are healthy and operational",
  "data": {
    "service": "Mini E-Commerce Backend API",
    "status": "UP",
    "version": "1.0.0",
    "timestamp": "2026-09-28T12:00:00.000Z",
    "uptime": "42s",
    "environment": "development",
    "database": {
      "status": "UP",
      "connected": true,
      "latency": "4ms",
      "database": "mini_ecommerce"
    },
    "system": {
      "nodeVersion": "v24.18.0",
      "platform": "win32",
      "memory": {
        "rss": "54 MB",
        "heapUsed": "7 MB"
      }
    }
  }
}
```

---

## 5. Ürün ve Katalog Uç Noktaları (Milestone 2)

### Ürünleri Listele & Filtrele
- **Metod:** `GET`
- **Uç Nokta:** `/api/products`
- **Sorgu Parametreleri:** `category`, `minPrice`, `maxPrice`, `search`, `inStock`, `sortBy`, `sortOrder`
- **Açıklama:** Belirtilen filtrelere ve sıralama ölçütlerine göre ürün kataloğunu listeler.

### Tekil Ürün Detayı
- **Metod:** `GET`
- **Uç Nokta:** `/api/products/:id`
- **Açıklama:** ID veya slug parametresine göre tekil ürün detayını getirir.

---

## 6. Kategori Uç Noktaları (Milestone 2 / Day 7)

### Tüm Kategorileri Listele
- **Metod:** `GET`
- **Uç Nokta:** `/api/categories`
- **Açıklama:** Sistemdeki aktif kategorileri ürün adetleriyle (`productCount`) birlikte döner.

### Kategori Detayı
- **Metod:** `GET`
- **Uç Nokta:** `/api/categories/:slug`
- **Açıklama:** Verilen slug'a sahip kategoriyi döner.

### Kategoriye Ait Ürünleri Listele
- **Metod:** `GET`
- **Uç Nokta:** `/api/categories/:slug/products`
- **Açıklama:** Seçilen kategorinin tüm aktif ürünlerini döner.

### Yeni Kategori Ekle
- **Metod:** `POST`
- **Uç Nokta:** `/api/categories`
- **Gövde (Body):**
```json
{
  "name": "Kitap & Kırtasiye",
  "description": "Romanlar, ders kitapları ve ofis gereçleri",
  "icon": "book"
}
```
- **Yanıt:** `201 Created`

### Kategori Güncelle & Sil
- `PUT /api/categories/:id`
- `DELETE /api/categories/:id` (Soft-delete)

---

## 7. Kimlik Doğrulama Uç Noktaları (Milestone 3 / Day 8)

### Kullanıcı Kaydı (Register)
- **Metod:** `POST`
- **Uç Nokta:** `/api/auth/register`
- **Gövde (Body):**
```json
{
  "name": "Ahmet Yılmaz",
  "email": "ahmet@ornek.com",
  "password": "GuvenliSifre123",
  "phone": "05551234567"
}
```
- **Başarılı Yanıt (`201 Created`):**
```json
{
  "success": true,
  "message": "Kullanıcı kaydı başarıyla oluşturuldu.",
  "data": {
    "id": "usr-1790598836605",
    "name": "Ahmet Yılmaz",
    "email": "ahmet@ornek.com",
    "role": "user",
    "phone": "05551234567",
    "createdAt": "2026-09-28T12:35:00.000Z"
  }
}
```
- **Hata Durumları:**
  - `400 Bad Request`: Form alanları eksik veya geçersiz (ad < 2 karakter, hatalı email, şifre < 6 karakter).
  - `409 Conflict`: Belirtilen e-posta adresi ile kayıtlı bir hesap zaten var.

### Kullanıcı Girişi & JWT Üretimi (Login - Day 9)
- **Metod:** `POST`
- **Uç Nokta:** `/api/auth/login`
- **Gövde (Body):**
```json
{
  "email": "ahmet@ornek.com",
  "password": "GuvenliSifre123"
}
```
- **Başarılı Yanıt (`200 OK`):**
```json
{
  "success": true,
  "message": "Giriş işlemi başarıyla gerçekleştirildi.",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "u0000000-0000-0000-0000-000000000001",
      "name": "Ahmet Yılmaz",
      "email": "ahmet@ornek.com",
      "role": "user",
      "phone": "05551234567",
      "avatarUrl": null
    }
  }
}
```
- **Hata Durumları:**
  - `400 Bad Request`: Form alanları eksik veya geçersiz format (boş e-posta veya şifre).
  - `401 Unauthorized`: Geçersiz e-posta adresi veya yanlış şifre.
  - `403 Forbidden`: Hesap askıya alınmış veya pasif durumda.

### Mevcut Kullanıcı Profili (Get Current User / Profile - Day 10)
- **Metod:** `GET`
- **Uç Nokta:** `/api/auth/me`
- **Yetkilendirme:** `Bearer <token>` (`authenticate` middleware)
- **Başarılı Yanıt (`200 OK`):**
```json
{
  "success": true,
  "message": "Kullanıcı profili başarıyla getirildi.",
  "data": {
    "id": "u0000000-0000-0000-0000-000000000001",
    "name": "Admin Yönetici",
    "email": "admin@miniecom.com",
    "role": "admin",
    "phone": "+905551112233",
    "avatarUrl": null,
    "createdAt": "2026-09-29T12:00:00.000Z"
  }
}
```
- **Hata Durumları:**
  - `401 Unauthorized`: Token eksik, geçersiz veya süresi dolmuş.

---

## 8. Güvenlik & Korumalı Rotalar (Day 10)

Platformda iki temel güvenlik middleware'i kullanılmaktadır:
1. **`authenticate`:** Gelen istekteki `Authorization: Bearer <token>` başlığını çözerek kullanıcının kimliğini ve oturum geçerliliğini doğrular.
2. **`authorizeRoles(...roles)`:** Kullanıcının rolünü (`req.user.role`) denetler. Örneğin kategori oluşturma, güncelleme ve silme işlemleri (`POST`, `PUT`, `DELETE /api/categories`) yalnızca `admin` rolüne sahip kullanıcılara açıktır; yetkisiz erişimlerde `403 Forbidden` yanıtı döner.


