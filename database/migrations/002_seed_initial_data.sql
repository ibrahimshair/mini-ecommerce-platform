-- ==============================================================================
-- Mini E-Commerce Platform — Migration 002: Seed Initial Data
-- Milestone 2 / Day 6 Database Seed Data
-- ==============================================================================

-- 1. SEED CATEGORIES
INSERT INTO categories (id, name, slug, description, icon, is_active) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'Elektronik', 'elektronik', 'En yeni akıllı cihazlar, bilgisayarlar ve aksesuarlar', 'cpu', true),
    ('c0000000-0000-0000-0000-000000000002', 'Giyim & Moda', 'giyim-moda', 'Erkek, kadın ve çocuk giyim koleksiyonları', 'shirt', true),
    ('c0000000-0000-0000-0000-000000000003', 'Spor & Outdoor', 'spor-outdoor', 'Kamp malzemeleri, spor giyim ve antrenman ekipmanları', 'activity', true),
    ('c0000000-0000-0000-0000-000000000004', 'Ev & Yaşam', 'ev-yasam', 'Ev dekorasyonu, aydınlatma ve pratik ev gereçleri', 'home', true),
    ('c0000000-0000-0000-0000-000000000005', 'Aksesuar', 'aksesuar', 'Saatler, çantalar, gözlükler ve takılar', 'watch', true)
ON CONFLICT (id) DO NOTHING;

-- 2. SEED DEMO USERS
-- (password hashes are sample bcrypt hashes for 'Password123!')
INSERT INTO users (id, name, email, password_hash, role, phone, is_active) VALUES
    ('u0000000-0000-0000-0000-000000000001', 'Admin Yönetici', 'admin@miniecom.com', '$2b$10$ep5YdF7hS2/2QjHw0e2Uq.d7aW4dDq9r4M7jX5sF2.f3Y.4yK4yOe', 'admin', '+905551112233', true),
    ('u0000000-0000-0000-0000-000000000002', 'Demo Müşteri', 'musteri@miniecom.com', '$2b$10$ep5YdF7hS2/2QjHw0e2Uq.d7aW4dDq9r4M7jX5sF2.f3Y.4yK4yOe', 'user', '+905554445566', true)
ON CONFLICT (id) DO NOTHING;

-- 3. SEED PRODUCTS
INSERT INTO products (id, category_id, name, slug, description, price, old_price, stock, rating, review_count, image_url, is_featured, is_active) VALUES
    (
        'p0000000-0000-0000-0000-000000000001',
        'c0000000-0000-0000-0000-000000000001',
        'Kablosuz ANC Kulak Üstü Kulaklık Pro',
        'kablosuz-anc-kulak-ustu-kulaklik-pro',
        'Aktif gürültü engelleme (ANC), 40 saat pil ömrü, yüksek çözünürlüklü ses kalitesi ve ultra rahat hafızalı sünger yastıklar.',
        2499.00,
        3199.00,
        24,
        4.8,
        142,
        'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80',
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000002',
        'c0000000-0000-0000-0000-000000000001',
        'Akıllı GPS Spor Saati V2',
        'akilli-gps-spor-saati-v2',
        'AMOLED ekran, nabız ve kandaki oksijen ölçümü, dahili GPS, 50m su geçirmezlik ve 14 gün pil ömrü ile kusursuz antrenman takibi.',
        3899.00,
        4500.00,
        15,
        4.9,
        89,
        'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80',
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000002',
        'Minimalist Su Geçirmez Laptop Sırt Çantası',
        'minimalist-su-gecirmez-laptop-sirt-cantasi',
        '16 inç korumalı laptop bölmesi, su itici kumaş dokusu, ergonomik omuz askıları ve gizli hırsızlık önleyici pasaport cebi.',
        1299.00,
        1650.00,
        40,
        4.7,
        64,
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80',
        true,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000004',
        'c0000000-0000-0000-0000-000000000001',
        'Mekanik RGB Kompakt Klavye (%75)',
        'mekanik-rgb-kompakt-klavye-75',
        'Hot-swappable mekanik kırmızı anahtarlar, PBT tuş kapakları, alüminyum gövde ve kablosuz Bluetooth/2.4Ghz çoklu cihaz desteği.',
        1899.00,
        2299.00,
        18,
        4.6,
        110,
        'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&q=80',
        false,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000003',
        'c0000000-0000-0000-0000-000000000003',
        'Ergonomik Yalıtımlı Çelik Termos (750ml)',
        'ergonomik-yalitimli-celik-termos-750ml',
        'Çift duvarlı vakumlu 18/8 paslanmaz çelik, 24 saat soğuk ve 12 saat sıcak tutma performansı, sızdırmaz emniyetli kapak.',
        649.00,
        799.00,
        50,
        4.8,
        76,
        'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&q=80',
        false,
        true
    ),
    (
        'p0000000-0000-0000-0000-000000000005',
        'c0000000-0000-0000-0000-000000000005',
        'Polarize Klasik Tasarım Güneş Gözlüğü',
        'polarize-klasik-tasarim-gunes-gozlugu',
        'UV400 tam koruma filtreli polarize camlar, hafif asetat çerçeve, darbelere dayanıklı menteşe yapısı ve koruyucu deri kılıf.',
        899.00,
        1150.00,
        25,
        4.5,
        52,
        'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&q=80',
        false,
        true
    )
ON CONFLICT (id) DO NOTHING;
