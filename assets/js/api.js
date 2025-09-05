/**
 * api.js
 * Simple wrapper for GET pending and POST submit
 */

async function apiGetPending() {
  const url = `${API_BASE_URL}?action=pending`;
  const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}
async function apiGetError() {
  const url = `${API_BASE_URL}?action=error`;
  const res = await fetch(url, { method: 'GET', cache: 'no-cache' });
  if (!res.ok) throw new Error('Network error: ' + res.status);
  return res.json();
}

/**
 * payload: { action:'submit', audit_id, result:'error'|'no_error', remark, files: [{name,mime,base64}] }
 */
async function apiSubmit(payload) {
  await fetch(API_BASE_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  // Can't read response. Just assume it worked.
  return { ok: true, note: 'Response not readable in no-cors mode' };
}
