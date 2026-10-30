// Arka plan görevi: ChatGPT'nin görsel modeliyle (OpenAI gpt-image) post görseli çizer,
// Netlify Blobs'a kaydeder ve galeri kaydını kullanıcının kendi jetonuyla günceller.
// Arka plan fonksiyonu olduğu için 15 dakikaya kadar çalışabilir; uygulama sonucu Firestore'dan canlı görür.
// Ortam değişkenleri: OPENAI_API_KEY, FIREBASE_API_KEY, ALLOWED_EMAILS
// İsteğe bağlı: OPENAI_IMAGE_MODEL (varsayılan gpt-image-2), OPENAI_IMAGE_QUALITY (varsayılan medium), FIREBASE_PROJECT_ID
import { getStore } from '@netlify/blobs';
import { verify } from './lib/auth.mjs';

const PROJECT = process.env.FIREBASE_PROJECT_ID || 'moss-ajans';
const SIZES = { kare: '1024x1024', dikey: '1024x1536', hikaye: '1024x1536' };

async function patchGallery(id, idToken, fields) {
  const mask = Object.keys(fields).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const toValue = (v) => ({ stringValue: String(v) });
  const body = { fields: {} };
  Object.entries(fields).forEach(([k, v]) => {
    const parts = k.split('.');
    let node = body.fields;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) node[p] = toValue(v);
      else { node[p] = node[p] || { mapValue: { fields: {} } }; node = node[p].mapValue.fields; }
    });
  });
  await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/gallery/' + id + '?' + mask, {
    method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + idToken }, body: JSON.stringify(body)
  });
}

export default async (req) => {
  let input;
  try { input = await req.json(); } catch (e) { return; }
  const { galleryId, prompt, format, idToken } = input || {};
  if (!galleryId || !prompt || !idToken) return;
  const email = await verify(idToken);
  if (!email) return;
  if (!process.env.OPENAI_API_KEY) { await patchGallery(galleryId, idToken, { imageStatus: 'hata', imageError: 'OpenAI anahtarı tanımlı değil' }); return; }

  try {
    const r = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: 'Bearer ' + process.env.OPENAI_API_KEY },
      body: JSON.stringify({
        model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2',
        prompt: String(prompt).slice(0, 30000),
        size: SIZES[format] || SIZES.kare,
        quality: process.env.OPENAI_IMAGE_QUALITY || 'medium',
        n: 1
      })
    });
    const j = await r.json();
    if (!r.ok) throw new Error((j.error && j.error.message) || 'OpenAI hatası ' + r.status);
    const b64 = j.data && j.data[0] && j.data[0].b64_json;
    if (!b64) throw new Error('Görsel dönmedi');
    const key = galleryId + '-' + Date.now() + '.png';
    await getStore('gorseller').set(key, Buffer.from(b64, 'base64'), { metadata: { by: email } });
    await patchGallery(galleryId, idToken, { 'spec.imageUrl': '/.netlify/functions/gorsel-dosya?k=' + encodeURIComponent(key), imageStatus: 'hazir', imageError: '' });
  } catch (e) {
    await patchGallery(galleryId, idToken, { imageStatus: 'hata', imageError: String(e.message || e).slice(0, 300) });
  }
};
