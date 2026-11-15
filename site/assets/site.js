// Theme toggle (system default, remembered per browser) + one cookieless pageview per session.

(() => {
  const root = document.documentElement;

  const currentTheme = () => {
    const set = root.getAttribute('data-theme');
    if (set) return set;
    return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  const label = () => {
    document.querySelectorAll('.theme-toggle').forEach((btn) => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      const shape = next === 'light'
        ? '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>'
        : '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>';
      btn.innerHTML = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${shape}</svg>`;
      btn.setAttribute('aria-label', `Switch to ${next} theme`);
      btn.title = `Switch to ${next} theme`;
    });
  };

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.theme-toggle')) return;
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (_) {}
    label();
  });

  label();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', label);

  try {
    if (!sessionStorage.getItem('visited')) {
      sessionStorage.setItem('visited', '1');
      fetch('/api/visitors', { method: 'POST' }).catch(() => {});
    }
  } catch (_) {}
})();
