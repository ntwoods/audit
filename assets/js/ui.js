/**
 * ui.js
 * Contains UI helpers: create cards, show modal, toasts, file preview controls.
 */

// escapeHtml — prevents XSS when injecting strings into innerHTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(s) {
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[s];
  });
}

// Toasts
function showToast(message, opts = {}) {
  const root = document.getElementById('toastRoot');
  const div = document.createElement('div');
  div.className = 'toast';
  div.textContent = message;
  root.appendChild(div);
  setTimeout(() => {
    div.style.transition = 'opacity 250ms';
    div.style.opacity = '0';
    setTimeout(()=> div.remove(), 260);
  }, opts.duration || 3500);
}

// Create a single card element for audit
function createCard(audit) {
  const div = document.createElement('div');
  div.className = 'card';
  div.dataset.auditId = audit.audit_id;

  div.innerHTML = `
    <div class="flex items-start justify-between">
      <div>
        <h3 class="font-semibold text-lg text-blue-700">${escapeHtml(audit.category)}</h3>
        <p class="text-sm text-gray-600 mt-1">
          Date: ${escapeHtml(
              new Date(audit.date).toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
              }).replace(/ /g, '-')
          )}
        </p>
        <p class="text-xs text-gray-500 mt-1">ID: ${escapeHtml(audit.audit_id)}</p>
      </div>
      <div class="text-right text-xs text-gray-400">Pending</div>
    </div>
    <div class="mt-3 flex gap-3">
      <button class="btn-3d btn-red px-3 py-2 rounded" data-action="error">Error Found</button>
      <button class="btn-3d btn-green px-3 py-2 rounded" data-action="no_error">No Error</button>
    </div>
  `;
  return div;
}

/**
 * showModal: mode = 'error' | 'no_error'
 * Builds modal DOM with remark textarea and file input (multiple).
 * Handles file preview, remove, validation, and submit.
 */
function showModal({ auditId, category, mode, onSuccess }) {
  const root = document.getElementById('modalRoot');
  root.innerHTML = ''; // clear previous

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';

  // Modal content
  const modal = document.createElement('div');
  modal.className = 'modal';

  const title = mode === 'error' ? 'Error Found' : 'No Error';
  modal.innerHTML = `
    <div class="flex items-center justify-between mb-3">
      <div>
        <h2 class="text-xl font-semibold">${escapeHtml(title)}</h2>
        <div class="text-sm text-gray-600 mt-1">${escapeHtml(category)}</div>
        <div class="text-xs text-gray-400 mt-1">ID: ${escapeHtml(auditId)}</div>
      </div>
      <div>
        <button id="closeModalBtn" class="text-sm text-gray-500">✕</button>
      </div>
    </div>

    <div>
      <label class="block text-sm font-medium text-gray-700 mb-1">Remark</label>
      <textarea id="modalRemark" rows="4" class="w-full p-2 border rounded" placeholder="Enter remark..."></textarea>
    </div>

    <div class="mt-3">
      <label class="block text-sm font-medium text-gray-700 mb-1">Attachments (optional)</label>
      <input id="modalFilesInput" type="file" multiple />
      <div id="filePreviewArea" class="mt-2 flex flex-wrap"></div>
      <div id="fileNote" class="text-xs text-gray-500 mt-2">Max single file: ${bytesToHuman(MAX_FILE_SIZE_BYTES)}. Max total: ${bytesToHuman(MAX_TOTAL_PAYLOAD_BYTES)}.</div>
    </div>

    <div class="mt-5 flex justify-end gap-3">
      <button id="cancelBtn" class="px-3 py-2 rounded border">Cancel</button>
      <button id="submitBtn" class="px-3 py-2 rounded bg-blue-600 text-white">Submit</button>
    </div>
  `;

  overlay.appendChild(modal);
  root.appendChild(overlay);

  // Wire up controls
  document.getElementById('closeModalBtn').addEventListener('click', () => root.innerHTML = '');
  document.getElementById('cancelBtn').addEventListener('click', () => root.innerHTML = '');

  const filesInput = document.getElementById('modalFilesInput');
  const previewArea = document.getElementById('filePreviewArea');
  let selectedFiles = []; // array of File objects

  filesInput.addEventListener('change', (ev) => {
    selectedFiles = Array.from(ev.target.files || []);
    renderFilePreviews();
  });

  function renderFilePreviews() {
    previewArea.innerHTML = '';
    selectedFiles.forEach((f, idx) => {
      const el = document.createElement('div');
      el.className = 'file-preview';
      const short = f.name.length > 28 ? f.name.slice(0,18) + '...' + f.name.slice(-8) : f.name;
      el.innerHTML = `<span title="${escapeHtml(f.name)}">${escapeHtml(short)}</span> <button data-idx="${idx}" class="text-xs text-red-500 ml-2">Remove</button>`;
      previewArea.appendChild(el);
    });
    // attach remove handlers
    previewArea.querySelectorAll('button[data-idx]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = Number(e.target.dataset.idx);
        selectedFiles.splice(idx, 1);
        filesInput.value = ''; // clear input to allow reselect same name later
        renderFilePreviews();
      });
    });
  }

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.addEventListener('click', async () => {
    const remark = document.getElementById('modalRemark').value.trim();
    // Remark is optional but good to have — you can enforce if you want:
    // if (!remark) { showToast('Please enter a remark'); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Submitting...';

    try {
      // Convert selectedFiles -> base64 objects
      const filesPayload = await filesToBase64Array(selectedFiles);
      const payload = {
        action: 'submit',
        audit_id: auditId,
        result: mode === 'error' ? 'error' : 'no_error',
        remark: remark,
        files: filesPayload
      };

      const res = await apiSubmit(payload);
      if (res && res.ok) {
        showToast('Submitted successfully');
        // Remove card from UI
        const card = document.querySelector(`[data-audit-id="${auditId}"]`);
        if (card) card.remove();
        root.innerHTML = '';
        if (typeof onSuccess === 'function') onSuccess({ auditId });
      } else {
        const err = (res && res.error) ? res.error : 'Unknown server error';
        showToast('Submit failed: ' + err);
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit';
      }
    } catch (err) {
      console.error('Submit error', err);
      showToast('Submit error: ' + err.message);
      submitBtn.disabled = false;
      submitBtn.textContent = 'Submit';
    }
  });

  // initial render (if any preselected files)
  renderFilePreviews();
}
            
