# Moss Ajans

Moss Film Agency ekibinin iş takip uygulaması. Telefona "ana ekrana ekle" ile kurulan bir web uygulaması (PWA).

## Neler var (1. sürüm)
- **Akış:** Bugün / bu hafta, geciken işler, müşteri onayı bekleyenler, yaklaşan özel günler
- **Takvim:** Aylık görünüm, firmaya göre filtre, özel günler
- **Üretim hattı:** Fikir → Senaryo → Çekim → Kurgu → Müşteri onayı → Yayına hazır
- **Firmalar:** Logo, sektör, aylık paket takibi, bilgiler, fikir havuzu, firma sohbeti
- **İş detayı:** Aşama, kontrol listesi, müşteri onayı ve revize, yorumlar
- **Bildirimler:** Ekipteki tüm hareketler

## Teknoloji
- React + Vite, `vite-plugin-pwa`
- Firebase Authentication (e-posta/şifre) ve Cloud Firestore
- Yayın: GitHub Pages (`.github/workflows/yayin.yml`, main dalına her gönderimde otomatik) → https://mossfilm.github.io/moss-ajans/

## Ayarlar
- `src/firebase-config.js`: Firebase web uygulaması ayarları ve ekip e-posta listesi
- `firestore.rules`: Firebase konsolunda Firestore kurallarına yapıştırılır (aynı e-posta listesi)

## Geliştirme
```
npm install
npm run dev
npm run build
```


## Asistan ve Edit (ücretsiz düzen)
Hiçbir ücretli servis ya da sunucu kullanılmaz; her şey GitHub (Pages + Actions) ve Firebase'in ücretsiz planında çalışır.

- **Anlık asistan:** `src/ai.js` Google Gemini'nin ücretsiz katmanını doğrudan uygulamadan çağırır. Anahtar uygulamada Bildirimler → Anlık asistan bölümünden girilir ve `config/app.geminiKey` alanında (yalnızca ekip okuyabilir) durur. Anahtar yoksa ya da kota dolduysa soru Claude'un sırasına (`jobs`) düşer.
- **Claude'un saatlik işi:** Zamanlanmış görev her saat `public/worker/moss.mjs` ile `jobs` sırasını okur; `public/worker/TALIMAT.md` talimatına göre cevap yazar, özel post tasarlar, Drive linklerinden video indirip ffmpeg ile reels montajlar ve sonucu uygulamaya koyar.
- **Video depolama:** Bitmiş reels Firestore'da (`videoParcalar`) ~700 KB'lık parçalar halinde durur; uygulama birleştirip oynatır ve indirir. Ham videolar ekibin Google Drive'ında kalır.
- **Telefon hatırlatmaları:** `.github/workflows/hatirlatma.yml` her saat `scripts/hatirlatma.mjs`'i çalıştırır. Bildirim anahtarları ilk çalışmada üretilip `config/push` / `config/pushSecret` içine yazılır.
- **Instagram sayaçları:** `.github/workflows/instagram.yml` her gün 06:15'te `scripts/instagram.mjs`.

| GitHub → Settings → Secrets and variables → Actions | Değer |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Proje ayarları → Hizmet hesapları → Yeni özel anahtar (JSON'un tamamı) |
| `META_ACCESS_TOKEN`, `META_IG_USER_ID` (isteğe bağlı) | Instagram sayaçları için Meta bilgileri |

Claude'un zamanlanmış görev ortamında da `FIREBASE_SERVICE_ACCOUNT` ve ağ izni (`googleapis.com`, `drive.google.com`, `drive.usercontent.google.com`, `huggingface.co`) gerekir.

## Test
- `npx vite -c vite.test.config.js`: Firebase ve sunucu fonksiyonları bellekte taklit edilerek uygulama yerelde açılır (`test/fake/`).
- Uçtan uca mobil test senaryosu 39 kontrol: kayıt, iş, yorum, revize, firma, takvim, üretim, çekim planı, Instagram, asistan, galeri, edit + revize, bildirimler, çıkış.
