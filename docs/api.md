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

### Sağlık Kontrolü (Health Check)
- **Metod:** `GET`
- **Uç Nokta:** `/api/health`
- **Açıklama:** API servisinin ayakta olduğunu, bellek kullanımını ve çalışma süresini raporlar.
- **Örnek Yanıt:**
```json
{
  "success": true,
  "message": "System is healthy and operational",
  "data": {
    "service": "Mini E-Commerce Backend API",
    "status": "UP",
    "version": "1.0.0",
    "timestamp": "2026-09-25T07:25:11.226Z",
    "uptime": "10s",
    "environment": "development",
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

### Kök API Haritası
- **Metod:** `GET`
- **Uç Nokta:** `/api`
- **Açıklama:** API versiyonu ve gelecek modüllerin haritasını döndürür.
