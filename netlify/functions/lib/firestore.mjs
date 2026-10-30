// Firestore REST: bir belgenin seçili alanlarını, isteği yapan kullanıcının kendi jetonuyla günceller.
// Güvenlik kuralları aynen uygulanır (yalnızca ekip e-postaları yazabilir).
const PROJECT = process.env.FIREBASE_PROJECT_ID || 'moss-ajans';

function toValue(v) {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === 'boolean') return { booleanValue: v };
  if (typeof v === 'number') return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toValue) } };
  if (typeof v === 'object') return { mapValue: { fields: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, toValue(x)])) } };
  return { stringValue: String(v) };
}

export async function patchDoc(collection, id, idToken, fields) {
  const mask = Object.keys(fields).map((k) => 'updateMask.fieldPaths=' + encodeURIComponent(k)).join('&');
  const body = { fields: {} };
  Object.entries(fields).forEach(([k, v]) => {
    const parts = k.split('.');
    let node = body.fields;
    parts.forEach((p, i) => {
      if (i === parts.length - 1) node[p] = toValue(v);
      else { node[p] = node[p] || { mapValue: { fields: {} } }; node = node[p].mapValue.fields; }
    });
  });
  const r = await fetch('https://firestore.googleapis.com/v1/projects/' + PROJECT + '/databases/(default)/documents/' + collection + '/' + id + '?' + mask, {
    method: 'PATCH', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + idToken }, body: JSON.stringify(body)
  });
  return r.ok;
}
