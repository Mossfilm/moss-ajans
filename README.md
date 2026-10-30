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

## Sonraki adımlar
- Telefona düşen bildirimler (Firebase Cloud Messaging + zamanlanmış hatırlatmalar)
- Uygulama içi yapay zekâ asistanı (Claude API)
- Instagram takipçi ve izlenme sayaçları

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
