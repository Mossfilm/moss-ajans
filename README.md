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
- Yayın: Vercel (GitHub'a her gönderimde otomatik güncellenir)

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
Hiçbir ücretli API kullanılmaz.

- **Anlık asistan:** `netlify/functions/asistan.mjs` Google Gemini'nin ücretsiz katmanını kullanır. Sohbet, fikir, şablonlu post, reels senaryosu ve takvim işi anında yapılır. Anahtar yoksa ya da günlük kota dolduysa soru otomatik olarak Claude'un sırasına (`jobs`) düşer.
- **Claude'un saatlik işi:** Zamanlanmış görev her saat `public/worker/moss.mjs` ile `jobs` sırasını okur; `public/worker/TALIMAT.md` talimatına göre cevap yazar, özel post tasarlar, Drive linklerinden video indirip ffmpeg ile reels montajlar (altyazı: faster-whisper, müzik: ekibin verdiği link) ve sonucu uygulamaya koyar.
- **Video depolama:** Bitmiş reels Firestore'da (`videoParcalar`) ~700 KB'lık parçalar halinde durur; uygulama birleştirip oynatır ve indirir. Firebase Storage (kart isteyen Blaze planı) gerekmez. Ham videolar ekibin kendi Google Drive'ında kalır.
- **Sohbet:** `chat` koleksiyonu tüm ekipte ortaktır; `via` alanı cevabın kaynağını gösterir (gemini / claude / sistem).

| Netlify ortam değişkeni | Değer |
|---|---|
| `GEMINI_API_KEY` | aistudio.google.com → Get API key (ücretsiz, kart gerekmez) |
| `GEMINI_MODEL` (isteğe bağlı) | Varsayılan `gemini-flash-latest` |
| `FIREBASE_API_KEY` | `src/firebase-config.js` içindeki apiKey |
| `ALLOWED_EMAILS` | `hello@mossfilmagency.com,ebru27@gmail.com,bertan27@gmail.com` |

Claude'un zamanlanmış görev ortamında gerekenler: `FIREBASE_SERVICE_ACCOUNT` gizli değişkeni ve ağ izni (`googleapis.com`, `drive.google.com`, `drive.usercontent.google.com`, `huggingface.co`, sitenin `netlify.app` adresi).

## Telefon bildirimleri ve Instagram sayaçları
- `netlify/functions/hatirlatma.mjs` (saatlik): sabah özeti, çekim sabahı, “Yaptın mı?”, yarınki işler, özel günler, haftalık çekim planı. 22:00–08:00 sessiz.
- `netlify/functions/instagram.mjs` (her gün 06:15): Meta Business Discovery ile takipçi ve son paylaşım sayıları → `insta/{firmaId}`.
- Abonelik: uygulamada Bildirimler → Telefon bildirimleri → Aç. iPhone'da uygulama ana ekrana eklenmiş olmalı (iOS 16.4+).

| Ad | Değer |
|---|---|
| `FIREBASE_SERVICE_ACCOUNT` | Firebase → Proje ayarları → Hizmet hesapları → Yeni özel anahtar (JSON'un tamamı) |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | `npx web-push generate-vapid-keys` çıktısı |
| `META_ACCESS_TOKEN` | Meta uzun ömürlü kullanıcı jetonu (instagram_basic, pages_show_list izinleri) |
| `META_IG_USER_ID` | Moss'un Instagram işletme hesabının kimliği |
| `META_GRAPH_VERSION` (isteğe bağlı) | Varsayılan `v23.0` |

## Test
- `npx vite -c vite.test.config.js`: Firebase ve sunucu fonksiyonları bellekte taklit edilerek uygulama yerelde açılır (`test/fake/`).
- Uçtan uca mobil test senaryosu 35 kontrol: kayıt, iş, yorum, revize, firma, takvim, üretim, çekim planı, Instagram, asistan, galeri, edit + revize, bildirimler, çıkış.
