/**
 * startAudit.js
 * Page initialization and event wiring
 */

document.addEventListener('DOMContentLoaded', initPage);

async function initPage() {
  const container = document.getElementById('cardsContainer');
  const emptyState = document.getElementById('emptyState');
  const summary = document.getElementById('summary');
  const refreshBtn = document.getElementById('refreshBtn');

  refreshBtn.addEventListener('click', () => loadPending());

  // initial load
  await loadPending();
  await loadError();  
  
  async function loadPending() {
    container.innerHTML = '<div class="col-span-full p-8 text-center text-gray-400">Loading...</div>';
    emptyState.classList.add('hidden');
    summary.textContent = '';
    try {
      const res = await apiGetPending();
      container.innerHTML = '';
      if (!res.ok) throw new Error(res.error || 'Failed to fetch');

      const pending = res.pending || [];
      if (pending.length === 0) {
        emptyState.classList.remove('hidden');
        summary.textContent = 'No pending audits for today.';
        return;
      }
      summary.textContent = `Pending audits: ${pending.length}`;

      pending.forEach(audit => {
        const card = createCard(audit);
        container.appendChild(card);
      });

      // Event delegation for buttons inside cards
      container.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action; // 'error' or 'no_error'
        const card = btn.closest('[data-audit-id]');
        if (!card) return;
        const auditId = card.dataset.auditId;
        const category = card.querySelector('h3') ? card.querySelector('h3').textContent : '';

        showModal({
          auditId,
          category,
          mode: action === 'error' ? 'error' : 'no_error',
          onSuccess: () => {
            // optional: update summary count
            const left = container.querySelectorAll('.card').length;
            summary.textContent = `Pending audits: ${left}`;
            if (left === 0) {
              document.getElementById('emptyState').classList.remove('hidden');
            }
          }
        });
      }, { once: false });

    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Error loading data: ${escapeHtml(err.message || err)}</div>`;
    }
  }
}



  async function loadError() {
    container.innerHTML = '<div class="col-span-full p-8 text-center text-gray-400">Loading...</div>';
    emptyState.classList.add('hidden');
    summary.textContent = '';
    try {
      const res = await apiGetError();
      container.innerHTML = '';
      if (!res.ok) throw new Error(res.error || 'Failed to fetch');

      const error = res.errorData || [];
      if (error.length === 0) {
        emptyState.classList.remove('hidden');
        summary.textContent = 'No audits have error for today.';
        return;
      }
      summary.textContent = `Audits with error: ${error.length}`;

      error.forEach(audit => {
        const card = createCard(audit);
        container.appendChild(card);
      });

      // Event delegation for buttons inside cards
      container.addEventListener('click', async (ev) => {
        const btn = ev.target.closest('button[data-action]');
        if (!btn) return;
        const action = btn.dataset.action; // 'error' or 'no_error'
        const card = btn.closest('[data-audit-id]');
        if (!card) return;
        const auditId = card.dataset.auditId;
        const category = card.querySelector('h3') ? card.querySelector('h3').textContent : '';

        showModal({
          auditId,
          category,
          mode: action === 'error' ? 'error' : 'no_error',
          onSuccess: () => {
            // optional: update summary count
            const left = container.querySelectorAll('.card').length;
            summary.textContent = `Pending audits: ${left}`;
            if (left === 0) {
              document.getElementById('emptyState').classList.remove('hidden');
            }
          }
        });
      }, { once: false });

    } catch (err) {
      console.error(err);
      container.innerHTML = `<div class="col-span-full p-8 text-center text-red-500">Error loading data: ${escapeHtml(err.message || err)}</div>`;
    }
  }
