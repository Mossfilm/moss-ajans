# Moss saatlik görev talimatı (Claude için)

Bu talimat, Claude'un zamanlanmış görevinde her saat başı uygulanır. Amaç: Moss Ajans uygulamasında
ekibin sıraya aldığı işleri **ücretsiz** yapmak ve sonuçları uygulamaya koymak. Ücretli API kullanma.

## Kurulum (her çalışmada)
1. `worker/moss.mjs` dosyasını al (site: `<SITE>/worker/moss.mjs`) ve `node moss.mjs durum` çalıştır.
   - `FIREBASE_SERVICE_ACCOUNT` yoksa ya da Google'a ulaşılamıyorsa: dur, hiçbir şey yazma.
2. `node moss.mjs liste > liste.json` ile bekleyen işleri oku. `isler` boşsa sessizce bitir.
3. Her iş için önce `node moss.mjs al <jobId>`, bitince `node moss.mjs bitir <jobId>`
   (yapılamazsa `node moss.mjs bitir <jobId> "<kısa, Türkçe neden>"`).

## İş türleri

### soru (asistan sorusu)
- `sonSohbet` ve `firmalar` / `yaklasanIsler` bağlamıyla soruyu Türkçe, kısa, samimi cevapla.
- Gerekirse post (şablonlu) ya da takvim işi ekle (`ekle gallery|tasks`), eklediklerini `done.json` ile mesaja bağla:
  `[{"kind":"post","id":"<galeriId>","firmId":"..","title":".."}]` (kind: post | video | task | project).
- `node moss.mjs mesaj <jobId> cevap.txt [done.json]`

### post (özel tasarım)
- Firmanın sektörüne ve marka rengine uygun özgün bir tasarımı HTML/CSS ile yap, Playwright ile
  1080×1080 (dikey: 1080×1350, hikâye: 1080×1920) JPEG olarak çek (kalite ~82, 600 KB altı).
- Görseli `data:image/jpeg;base64,...` olarak `spec.imageUrl` alanına koy, `spec.template` = `gorsel`.
  - `galleryId` varsa: `guncelle gallery/<id>` ile `{"spec": {...eski spec, "template":"gorsel","imageUrl":"data:..."}, "imageStatus":"hazir"}`
  - yoksa: `ekle gallery` ile yeni post (kind: post, title, caption, tags, firmId, spec).
- Logo çizme: uygulama logoyu köşeye kendisi ekler. Gerçek kişi yüzü, telifli karakter ya da başka marka kullanma.
  Bilinmeyen fiyat/adres/telefon için [FİYAT] gibi yer tutucu bırak.
- Sohbete kısa bir not düş: `mesaj <jobId>`.

### video (montaj)
`project.sources` = ham video linkleri (çoğunlukla Google Drive), `project.brief` = tarif,
`project.opts` = `{ length: saniye, captions: bool, music: link }`, `project.revisionNote` varsa önceki versiyona göre revize.
1. Her kaynağı indir: `node moss.mjs indir <url> ham/<n>.mp4`. İndirilemeyen linki hata nedeni olarak yaz.
2. `ffprobe` ile süreleri al; her videodan ~1 sn aralıkla küçük kareler çıkar (`ffmpeg -vf fps=1,scale=480:-2`),
   kareleri **kendin incele**, en güzel/net/hareketli anları seç. Bulanık, karanlık, sarsıntılı anları atla.
3. Plan yap: toplam süre `opts.length` (±2 sn), ilk 2 saniye dikkat çekici, sahne başına 1.5–4 sn, hızlı ama okunur kesmeler.
4. Montaj: tüm klipleri 1080×1920 dikey (gerekirse ortadan kırp/blur arka plan), 30 fps, H.264 `-preset veryfast -crf 26`,
   AAC 128k. Kısa ekran yazıları (Türkçe, büyük, kalın, gölgeli) `drawtext` ile.
5. Altyazı (`opts.captions`): konuşma varsa sesi çıkar (`-vn -ac 1 -ar 16000`), `pip install faster-whisper`
   ile `small` model, `language="tr"` → SRT → `subtitles` filtresiyle göm (alt-orta, beyaz, siyah kontur).
   Model indirilemezse altyazısız devam et ve notta belirt.
6. Müzik (`opts.music`): linki indir, videonun sesini %25'e indirip müziği altına koy, sonda 1.5 sn fade-out.
   Link yoksa videonun kendi sesi kalsın. İnternetten telifli müzik indirme.
7. Kapanış: son 1.5 sn firma adı ya da tarifteki çağrı (ör. "Hemen sipariş ver").
8. Çıkan dosya 40 MB altında olsun. Plan dosyası:
   `{"summary":"Ekibe 2–3 cümle","duration":<sn>,"note":"altyazı: tr / müzik: kendi sesi","clips":[{"sourceId":"<sources[i].id>","trim":3.2,"length":2.5,"what":"kısa açıklama","text":"ekran yazısı"}]}`
9. `node moss.mjs video-yukle <projectId> cikti.mp4 plan.json`, sonra `bitir <jobId>`.
   İşi isteyen kişi sohbette sormuşsa `mesaj` ile `[{"kind":"project","id":"<projectId>","title":".."}]` düş.

### diger
Analiz/öneri gibi işler: cevabı `mesaj <jobId>` ile sohbete yaz.

## Kurallar
- Sadece sıradaki işleri yap; istenmeyen içerik üretme. Pasif firmalar (active=false) için içerik üretme, nedenini yaz.
- Her işi bir kez yap; hata olursa `bitir <id> "<neden>"` ile kapat ki ekip görsün.
- Hiçbir ücretli servis, API anahtarı ya da kart gerektiren araç kullanma.
- Çalışma sonunda ham dosyaları sil.
