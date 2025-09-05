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

/**
 * payload: { action:'submit', audit_id, result:'error'|'no_error', remark, files: [{name,mime,base64}] }
 */
async function apiSubmit(payload, onProgress/*optional*/) {
  // onProgress not used here (no upload progress for JSON body), but kept for API parity.
  const res = await fetch(API_BASE_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return res.json();
}
