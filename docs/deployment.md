# 🚀 Canlıya Alma ve Dağıtım Kılavuzu (Production Deployment Guide)

Bu doküman, **Mini E-Commerce Platform** uygulamasının yerel geliştirme, Docker ortamı ve canlı Linux/VPS (Ubuntu/Debian) sunucularında güvenli ve ölçeklenebilir şekilde ayağa kaldırılması için gereken tüm adımları içerir.

---

## 📋 Gereksinimler

- **Docker:** v24.0+ & **Docker Compose:** v2.20+
- **Node.js:** v20.x LTS (Eğer konteyner dışı çalıştırılacaksa)
- **PostgreSQL:** v16.x
- **Nginx:** Ters vekil (Reverse Proxy) & SSL sonlandırma
- **Domain & SSL Sertifikası:** Let's Encrypt (Certbot)

---

## 🐳 1. Docker ile Hızlı Kurulum ve Dağıtım (Önerilen)

Sistem; veritabanı (PostgreSQL 16), backend REST API (Express.js) ve frontend istemcisi (Nginx + React) olmak üzere 3 bağımsız servis olarak konteynerize edilmiştir.

### 1.1 Projeyi Klonlayın
```bash
git clone https://github.com/ibrahimshair/mini-ecommerce-platform.git
cd mini-ecommerce-platform
```

### 1.2 Ortam Değişkenlerini Tanımlayın
```bash
cp backend/.env.example backend/.env
```
`backend/.env` dosyasında `JWT_SECRET` ve güvenli veritabanı şifrelerini belirleyin:
```env
PORT=5000
NODE_ENV=production
DB_HOST=db
DB_PORT=5432
DB_NAME=mini_ecommerce
DB_USER=postgres
DB_PASSWORD=GuvEnli_DB_Sifresi_2026!
JWT_SECRET=super_secret_jwt_key_production_token
CLIENT_URL=https://eticaret.example.com
```

### 1.3 Konteynerleri Başlatın
```bash
docker compose up -d --build
```

### 1.4 Durum ve Log Kontrolü
```bash
# Servislerin sağlık durumunu inceleyin
docker compose ps

# Canlı log akışını takip edin
docker compose logs -f backend
```

- **Frontend:** `http://localhost:80`
- **Backend API:** `http://localhost:5000/api`
- **PostgreSQL:** `localhost:5432`

---

## 🔒 2. Üretim Ortamı (VPS/Cloud) Nginx & SSL/TLS Kurulumu

Canlı ortamda port 80 ve 443 trafiğini yönetmek için sunucunun ana Nginx servisi kullanılır.

### 2.1 Let's Encrypt ile Ücretsiz SSL Sertifikası Alın
```bash
sudo apt update && sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d eticaret.example.com -d api.eticaret.example.com
```

### 2.2 Ana Sunucu Nginx Yapılandırması (`/etc/nginx/sites-available/mini-ecommerce`)
```nginx
# Frontend SPA & API Reverse Proxy
server {
    listen 80;
    server_name eticaret.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name eticaret.example.com;

    ssl_certificate /etc/letsencrypt/live/eticaret.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/eticaret.example.com/privkey.pem;

    # Güvenlik Başlıkları
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # API Trafiğini Backend Konteynerine Yönlendirme
    location /api/ {
        proxy_pass http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }

    # Frontend Statik İçerik (veya Konteyner Proxy)
    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mini-ecommerce /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

## 💾 3. Veritabanı Yedekleme ve Geri Yükleme (PostgreSQL)

### Otomatik Günlük Yedek Alma:
```bash
docker exec -t mini_ecommerce_db pg_dump -U postgres mini_ecommerce | gzip > /backups/db_backup_$(date +%Y%m%d).sql.gz
```

### Yedekten Geri Yükleme:
```bash
gunzip < /backups/db_backup_20261014.sql.gz | docker exec -i mini_ecommerce_db psql -U postgres -d mini_ecommerce
```

---

## 🩺 4. Canlı Sistem İzleme ve Sağlık Kontrolleri

Backend API; otomatik izleme araçları (Prometheus, Datadog, Uptime Kuma) için 4 farklı JSON sağlık denetim rotası sunar:

| Uç Nokta | Amaç | Beklenen HTTP Kodu |
|---|---|---|
| `GET /api/health` | Uptime & PostgreSQL Bağlantısı | `200 OK` (status: `UP`) |
| `GET /api/health/security` | OWASP Başlıkları & Rate Limit Kotaları | `200 OK` (status: `healthy`) |
| `GET /api/health/resilience` | Hata Yakalama & Yeniden Deneme Politikası | `200 OK` (status: `OPERATIONAL`) |
| `GET /api/health/performance` | ETag, HTTP 304 & Gzip Sıkıştırma | `200 OK` (status: `OPTIMIZED`) |
