# Mini E-Commerce Platform — Git & GitHub Çalışma Kuralları

Bu doküman, staj süresince Faruk hoca ve şirket standartlarına uygun Git kullanımı, dal (branch) yönetimi ve Pull Request (PR) süreçlerini tanımlar.

---

## 1. Temel İlkeler

- **Doğrudan `main` dalına push atmak kesinlikle yasaktır.**
- `main` dalı her zaman çalışan, test edilmiş ve onaylanmış stabil sürümü temsil eder.
- Tüm geliştirmeler amaca uygun dallarda (feature branch) yapılır ve **Pull Request (PR)** açılarak şirket mentorunun onayına sunulur.

---

## 2. Dal (Branch) İsimlendirme Standardı

| Tür | Şablon | Örnek |
| :--- | :--- | :--- |
| Yeni Özellik | `feature/<gun>-<ozellik-adi>` veya `feature/issue-<no>-<ad>` | `feature/day-03-homepage-layout` |
| Hata Düzeltme | `fix/<hata-tanimi>` | `fix/navbar-mobile-toggle` |
| Dokümantasyon | `docs/<belge-adi>` | `docs/git-workflow` |
| Düzenleme / Altyapı | `chore/<gorev-adi>` | `chore/update-dependencies` |

---

## 3. Günlük Geliştirme ve PR Döngüsü

### Adım 1: Güncel Kodu Çekme ve Dal Açma
```bash
git checkout main
git pull origin main
git checkout -b feature/day-03-homepage-layout
```

### Adım 2: Geliştirme ve Commit Atma
Commit mesajları **Conventional Commits** standartlarına uygun, açıklayıcı olmalıdır:
- `feat: ...` -> Yeni bir özellik eklendiğinde
- `fix: ...` -> Bir hata giderildiğinde
- `docs: ...` -> Dokümantasyon güncellendiğinde
- `style: ...` -> CSS veya biçimlendirme değişikliklerinde
- `refactor: ...` -> İşlev değiştirmeden kod temizlendiğinde
- `chore: ...` -> Paket güncelleme, konfigürasyon değişikliklerinde

```bash
git add .
git commit -m "feat(frontend): create responsive homepage layout"
```

### Adım 3: Uzak Sunucuya Gönderme ve PR Açma
```bash
git push origin feature/day-03-homepage-layout
```
GitHub arayüzünden `main` dalına doğru PR açılır. PR açıklamasına ilgili issue numarası eklenir (örn: `Closes #31`).

### Adım 4: İnceleme ve Merge
Mentor incelemesini tamamlayıp onayladıktan sonra kod `main` dalına merge edilir ve issue otomatik olarak **Done** statüsüne geçer.
