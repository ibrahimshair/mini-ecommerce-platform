# Mini E-Commerce Platform — Backend Service

Node.js ve Express.js tabanlı REST API sunucusu.

---

## 🛠️ Özellikler

- **Express.js (v5):** Yüksek performanslı ve modüler RESTful mimari.
- **CORS:** Güvenli çapraz kaynak erişimi yönetimi.
- **Morgan:** Geliştirme ortamında HTTP istek izleme ve loglama.
- **Dotenv & Config:** Çevre değişkenleri üzerinden merkezi konfigürasyon.
- **Merkezi Hata Yönetimi:** Standart JSON hata yanıtları ve 404 yakalayıcı.
- **Sağlık Kontrolü (Health Check):** Bellek kullanımı, çalışma süresi ve sistem metrikleri raporu.

---

## 📁 Klasör Yapısı

```text
backend/
├── src/
│   ├── config/             # Çevre değişkenleri ve DB konfigürasyonu
│   ├── controllers/        # İstek işleyicileri (Controller katmanı)
│   ├── middleware/         # Hata yönetimi, Auth, CORS ara yazılımları
│   ├── models/             # Veritabanı modelleri ve şemalar
│   ├── routes/             # API yönlendirme tanımları (/api/health, /api/auth...)
│   ├── services/           # İş mantığı servisleri
│   └── app.js              # Sunucu ana giriş noktası
├── .env.example            # Örnek çevre değişkenleri şablonu
├── package.json            # Paket ve script tanımları
└── README.md
```

---

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükleyin
```bash
npm install
```

### 2. Çevre Değişkenlerini Tanımlayın
```bash
cp .env.example .env
```

### 3. Sunucuyu Başlatın
- **Geliştirme Modu (İzleme etkin):**
  ```bash
  npm run dev
  ```
- **Prodüksiyon Modu:**
  ```bash
  npm start
  ```

---

## 📡 API Uç Noktaları

| Metod | Uç Nokta | Açıklama |
| :--- | :--- | :--- |
| `GET` | `/` | API kök karşılama mesajı |
| `GET` | `/api` | API versiyon ve modül haritası |
| `GET` | `/api/health` | Sunucu sağlık, bellek ve uptime durumu |

---

## 🧪 Test
Sunucunun çalıştığını doğrulamak için tarayıcıda veya terminalde:
```bash
curl http://localhost:5000/api/health
```
