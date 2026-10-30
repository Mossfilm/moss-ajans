// Firebase giriş jetonunu doğrular ve ekip listesinde mi diye bakar.
export async function verify(idToken) {
  const key = process.env.FIREBASE_API_KEY;
  if (!key || !idToken) return null;
  const r = await fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + key, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ idToken })
  });
  if (!r.ok) return null;
  const j = await r.json();
  const email = j.users && j.users[0] && (j.users[0].email || '').toLowerCase();
  const allowed = (process.env.ALLOWED_EMAILS || '').toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  return email && allowed.includes(email) ? email : null;
}
