// Telefon bildirimi aboneliği için herkese açık VAPID anahtarını döndürür.
export default async () => {
  if (!process.env.VAPID_PUBLIC_KEY) return Response.json({ error: 'not_configured' }, { status: 503 });
  return Response.json({ key: process.env.VAPID_PUBLIC_KEY });
};
