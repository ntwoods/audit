document.addEventListener('DOMContentLoaded', initPage);

async function initPage() {
  const container = document.getElementById('cardsContainer');
  const emptyState = document.getElementById('emptyState');
  const summary = document.getElementById('summary');
  const refreshBtn = document.getElementById('refreshBtn');

  refreshBtn.addEventListener('click', () => loadError());

  // initial load
  await loadError();  
