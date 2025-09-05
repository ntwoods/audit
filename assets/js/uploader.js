/**
 * uploader.js
 * Converts FileList -> [{name,mime,base64}] with checks.
 * Uses FileReader.readAsDataURL and returns base64 (without prefix).
 */

function bytesToHuman(bytes) {
  const units = ['B','KB','MB','GB'];
  let i = 0;
  while (bytes >= 1024 && i < units.length-1) { bytes /= 1024; i++; }
  return Math.round(bytes*10)/10 + ' ' + units[i];
}

function filesToBase64Array(fileList, { maxFileSize = MAX_FILE_SIZE_BYTES, maxTotal = MAX_TOTAL_PAYLOAD_BYTES } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const files = Array.from(fileList || []);
      // validate sizes first
      let total = 0;
      for (const f of files) {
        total += f.size;
        if (f.size > maxFileSize) {
          return reject(new Error(`File "${f.name}" is too large (${bytesToHuman(f.size)}). Limit is ${bytesToHuman(maxFileSize)}.`));
        }
      }
      if (total > maxTotal) {
        return reject(new Error(`Total attachments size ${bytesToHuman(total)} exceeds limit ${bytesToHuman(maxTotal)}.`));
      }
      if (files.length === 0) return resolve([]);
      const results = [];
      let done = 0;
      files.forEach((f, idx) => {
        const reader = new FileReader();
        reader.onload = function(e) {
          // dataURL format: data:<mime>;base64,XXXXX
          const parts = e.target.result.split(',');
          const base64 = parts.length > 1 ? parts[1] : parts[0];
          results.push({ name: f.name, mime: f.type || 'application/octet-stream', base64: base64 });
          done++;
          if (done === files.length) resolve(results);
        };
        reader.onerror = function(err) {
          done++;
          // push a placeholder without base64 to keep order; we'll filter later
          console.warn('FileReader error for', f.name, err);
          if (done === files.length) resolve(results);
        };
        reader.readAsDataURL(f);
      });
    } catch (e) {
      reject(e);
    }
  });
}
