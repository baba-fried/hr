// Shared HR Dashboard UI utilities: sidebar + logout modal + layout spacing

(function () {
  if (window.__hrUiInitialized) return;
  window.__hrUiInitialized = true;

  function ensureBaseStyles() {
    if (document.getElementById('hr-ui-style')) return;
    // Load Josefin Sans
    const linkId = 'hr-ui-font-josefin';
    if (!document.getElementById(linkId)) {
      const link1 = document.createElement('link');
      link1.rel = 'preconnect';
      link1.href = 'https://fonts.googleapis.com';
      document.head.appendChild(link1);
      const link2 = document.createElement('link');
      link2.rel = 'preconnect';
      link2.href = 'https://fonts.gstatic.com';
      link2.crossOrigin = 'anonymous';
      document.head.appendChild(link2);
      const link3 = document.createElement('link');
      link3.id = linkId;
      link3.rel = 'stylesheet';
      link3.href = 'https://fonts.googleapis.com/css2?family=Josefin+Sans:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link3);
    }
    const style = document.createElement('style');
    style.id = 'hr-ui-style';
    style.textContent = `
      body { font-family: 'Josefin Sans', system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
      .sidebar { background-color: #000; color: #fff; width: 240px; height: 100vh; position: fixed; top: 0; left: 0; padding: 2rem 1rem; display: flex; flex-direction: column; box-shadow: 12px 0 30px rgba(0,0,0,0.25); }
      .sidebar a { color: #fff; padding: 0.75rem 1rem; margin-bottom: 0.5rem; border-radius: 0.5rem; transition: background 0.3s; text-decoration: none; }
      .sidebar a:hover { background-color: #1e232b; }
      .sidebar a.active { background-color: #374151; color: white; }
      .main-content { margin-left: 260px; padding: 2rem; }
      /* Elevated containers */
      .main-content .bg-white, .content .bg-white { box-shadow: 0 16px 40px rgba(0,0,0,0.12), 0 6px 12px rgba(0,0,0,0.06); border: 1px solid rgba(0,0,0,0.06); }
      /* Stronger modal elevation */
      .modal .modal-content { box-shadow: 0 24px 64px rgba(0,0,0,0.32), 0 12px 24px rgba(0,0,0,0.18) !important; }
      /* Utility class to opt-in anywhere */
      .elevate-3d { box-shadow: 0 18px 44px rgba(0,0,0,0.14), 0 8px 18px rgba(0,0,0,0.08); border: 1px solid rgba(0,0,0,0.06); }
    `;
    document.head.appendChild(style);
  }

  function renderSidebar(active) {
    const existing = document.querySelector('.sidebar');
    const html = `
      <img src="/components/posspolelogo.png" alt="Posspole Logo" class="h-6 mb-8 mx-auto">
      <a href="/HR-dashboard/hr.html" class="hover:bg-gray-700 hover:text-white" data-key="candidates">Candidate Section</a>
      <a href="/HR-dashboard/test.html" class="hover:bg-gray-700 hover:text-white" data-key="examinations">Assessment Section</a>
      <a href="/HR-dashboard/report.html" class="hover:bg-gray-700 hover:text-white" data-key="report">Result Section</a>
      <a href="/login-page/login.html" id="logoutBtn" class="mt-auto hover:bg-gray-700 hover:text-white">Logout</a>
    `;
    if (existing) {
      existing.innerHTML = html;
    } else {
      const sidebar = document.createElement('div');
      sidebar.className = 'sidebar';
      sidebar.innerHTML = html;
      document.body.insertBefore(sidebar, document.body.firstChild);
    }
    markActive(active);
  }

  function ensureMainContentWrapper() {
    let main = document.querySelector('.main-content') || document.querySelector('.content');
    if (!main) {
      // Wrap all content except the sidebar
      const wrapper = document.createElement('div');
      wrapper.className = 'main-content';
      // Move all nodes except the sidebar into wrapper
      const nodes = Array.from(document.body.childNodes).filter(n => !(n.nodeType === 1 && n.classList && n.classList.contains('sidebar')));
      nodes.forEach(n => wrapper.appendChild(n));
      document.body.appendChild(wrapper);
      main = wrapper;
    } else {
      // Normalize class name to main-content to keep spacing consistent
      if (!main.classList.contains('main-content')) main.classList.add('main-content');
    }
  }

  function markActive(active) {
    document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
    const link = document.querySelector(`.sidebar a[data-key="${active}"]`);
    if (link) link.classList.add('active');
  }

  function setupLogoutButton() {
    const btn = document.getElementById('logoutBtn');
    if (!btn || btn.__hrUiBound) return;
    btn.__hrUiBound = true;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      if (document.getElementById('logout-modal')) return;
      const modal = document.createElement('div');
      modal.id = 'logout-modal';
      Object.assign(modal.style, {
        position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh',
        background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: '9999'
      });
      modal.innerHTML = `
        <div style="background:#fff;padding:2rem 2.5rem;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.18);max-width:350px;text-align:center;">
          <h2 class="text-xl font-bold mb-4">Log out?</h2>
          <p class="mb-6">Are you sure you want to log out?</p>
          <div style="display:flex;gap:1rem;justify-content:center;">
            <button id="cancel-logout" style="padding:0.5rem 1.5rem;border-radius:8px;background:#e5e7eb;color:#222;border:none;font-weight:500;cursor:pointer;">Cancel</button>
            <button id="confirm-logout" style="padding:0.5rem 1.5rem;border-radius:8px;background:#000;color:#fff;border:none;font-weight:500;cursor:pointer;">Logout</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      document.getElementById('cancel-logout').onclick = () => modal.remove();
      document.getElementById('confirm-logout').onclick = () => {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login-page/login.html';
      };
    });
  }

  // Public API
  window.initHrLayout = function initHrLayout(active) {
    ensureBaseStyles();
    renderSidebar(active || 'candidates');
    ensureMainContentWrapper();
    setupLogoutButton();
  };
})();


