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


## Claude + ChatGPT
- **Claude** (`netlify/functions/asistan.mjs`): sohbet, fikir, metin, senaryo; uygulamada iş ve galeri kaydı oluşturur.
- **ChatGPT görselleri** (`netlify/functions/gorsel-background.mjs`): Claude'un yazdığı tasarım tarifini OpenAI görsel modeline (varsayılan `gpt-image-2`, orta kalite) çizdirir, görseli Netlify Blobs'a kaydeder ve galeri kaydına bağlar. Firma logosu görselin köşesine uygulama tarafından eklenir.

### Netlify ortam değişkenleri
| Ad | Değer |
|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `OPENAI_API_KEY` | platform.openai.com → API keys |
| `FIREBASE_API_KEY` | `src/firebase-config.js` içindeki apiKey |
| `ALLOWED_EMAILS` | `hello@mossfilmagency.com,ebru27@gmail.com,bertan27@gmail.com` |
| `OPENAI_IMAGE_QUALITY` (isteğe bağlı) | `low`, `medium` (varsayılan) ya da `high` |

Fonksiyonlar sürükle-bırak yüklemede çalışmaz; site GitHub bağlantısı ya da Netlify CLI ile yüklenmelidir.

## Edit (video kurgu)
- Alt menüde **Edit**: montaj projeleri + kütüphane (galeri).
- Ham dosyalar Firebase Storage'a yüklenir (`storage.rules` kurallarıyla; Storage için Firebase Blaze planı gerekir).
- `netlify/functions/kurgu.mjs`: Claude, montaj tarifinden zaman çizelgesi (kurgu planı) çıkarır.
- `netlify/functions/render-background.mjs`: planı Shotstack'e gönderir, MP4 adresini projeye yazar.
- Revize: yeni versiyon belgesi açılır, ad biçimi `Proje Adı (Etiket Vol N)`; önceki plan ve revize notu Claude'a verilir.

| Ad | Değer |
|---|---|
| `SHOTSTACK_API_KEY` | shotstack.io panelindeki API anahtarı |
| `SHOTSTACK_BASE` (isteğe bağlı) | Varsayılan `https://api.shotstack.io/stage` (filigranlı deneme); canlı için paneldeki üretim adresi |

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
