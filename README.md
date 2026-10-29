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
