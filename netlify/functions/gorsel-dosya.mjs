// Kaydedilmiş post görselini döndürür. Anahtar galeri kaydının rastgele kimliğini içerir.
import { getStore } from '@netlify/blobs';

export default async (req) => {
  const k = new URL(req.url).searchParams.get('k') || '';
  if (!/^[A-Za-z0-9_-]+-\d+\.png$/.test(k)) return new Response('Bulunamadı', { status: 404 });
  const data = await getStore('gorseller').get(k, { type: 'arrayBuffer' });
  if (!data) return new Response('Bulunamadı', { status: 404 });
  return new Response(data, { headers: { 'content-type': 'image/png', 'cache-control': 'public, max-age=31536000, immutable' } });
};
