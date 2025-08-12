// Shared User Dashboard UI utilities: logout modal + minor layout helpers

(function () {
  if (window.__userUiInitialized) return;
  window.__userUiInitialized = true;

  // Load Josefin Sans globally for user pages
  if (!document.getElementById('user-ui-font-josefin')) {
    const l1 = document.createElement('link');
    l1.rel = 'preconnect';
    l1.href = 'https://fonts.googleapis.com';
    document.head.appendChild(l1);
    const l2 = document.createElement('link');
    l2.rel = 'preconnect';
    l2.href = 'https://fonts.gstatic.com';
    l2.crossOrigin = 'anonymous';
    document.head.appendChild(l2);
    const l3 = document.createElement('link');
    l3.id = 'user-ui-font-josefin';
    l3.rel = 'stylesheet';
    l3.href = 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l3);
    const fontOverride = document.createElement('style');
    fontOverride.textContent = `body { font-family: 'Josefin Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }`;
    document.head.appendChild(fontOverride);
  }

  // Base 3D elevation for common cards/containers on user pages
  if (!document.getElementById('user-ui-style')) {
    const style = document.createElement('style');
    style.id = 'user-ui-style';
    style.textContent = `
      .content-area .bg-white { box-shadow: 0 16px 40px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); }
      .sidebar { box-shadow: 12px 0 30px rgba(0,0,0,0.25); }
      .elevate-3d { box-shadow: 0 18px 44px rgba(0,0,0,0.14), 0 8px 18px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); }
      #mockTestModal .bg-white, #mockTestResultModal .bg-white { box-shadow: 0 24px 64px rgba(0,0,0,0.32), 0 12px 24px rgba(0,0,0,0.18); }
    `;
    document.head.appendChild(style);
  }

  function setupLogoutModal() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn || logoutBtn.__bound) return;
    logoutBtn.__bound = true;
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      if (document.getElementById('user-logout-modal')) return;
      const modal = document.createElement('div');
      modal.id = 'user-logout-modal';
      Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '9999'
      });
      modal.innerHTML = `
        <div style="background:#fff;padding:2rem 2.5rem;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.18);max-width:350px;text-align:center;">
          <h2 class="text-xl font-bold mb-4">Log out?</h2>
          <p class="mb-6">Are you sure you want to log out?</p>
          <div style="display:flex;gap:1rem;justify-content:center;">
            <button id="user-cancel-logout" style="padding:0.5rem 1.5rem;border-radius:8px;background:#e5e7eb;color:#222;border:none;font-weight:500;cursor:pointer;">Cancel</button>
            <button id="user-confirm-logout" style="padding:0.5rem 1.5rem;border-radius:8px;background:#000;color:#fff;border:none;font-weight:500;cursor:pointer;">Logout</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('user-cancel-logout').onclick = () => modal.remove();
      document.getElementById('user-confirm-logout').onclick = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login-page/login.html';
      };
    });
  }

  window.initUserLayout = function initUserLayout() {
    setupLogoutModal();
  };
})();


