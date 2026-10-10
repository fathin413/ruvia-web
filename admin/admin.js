/**
 * RUVIA FURNITURE MAKASSAR - ADMIN CMS CONTROLLER
 * Mengelola sinkronisasi data backend, live preview, dan katalog produk
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Helper for dynamic API endpoints (works seamlessly across localhost:3000, Live Server, and file://)
  function getApiUrl(endpoint) {
    if ((window.location.protocol === 'http:' || window.location.protocol === 'https:') && window.location.port === '3000') {
      return endpoint;
    }
    return 'http://localhost:3000' + endpoint;
  }

  // Sanitizer helper for safe table rendering
  function escapeHtml(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 0. Modular Admin Components (Header & Sidebar Loader) ---
  const ADMIN_HEADER_TEMPLATE = `<header class="admin-topbar">
  <div class="brand-area">
    <a href="../index.html" class="brand-logo-text" target="_blank" title="Buka Website Ruvia Makassar">
      ruvia<span>.</span>
    </a>
    <span class="admin-badge">Backend CMS</span>
    <div class="server-status">
      <span class="status-indicator" id="server-indicator"></span>
      <span id="server-status-text">Server Aktif</span>
    </div>
  </div>

  <div class="topbar-actions">
    <a href="../index.html" target="_blank" class="btn-adm btn-adm-outline" title="Lihat Website di Tab Baru">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
      <span>Lihat Website</span>
    </a>
    <button type="button" class="btn-adm btn-adm-primary" id="btn-save-all" title="Simpan Perubahan Konten ke Server">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
      <span>Simpan Perubahan</span>
    </button>
    <button type="button" class="btn-adm btn-adm-outline" id="btn-logout" title="Keluar dari Admin">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
      <span>Logout</span>
    </button>
  </div>
</header>`;

  const ADMIN_SIDEBAR_TEMPLATE = `<aside class="admin-sidebar" id="admin-sidebar">
  <div class="sidebar-heading">Konten Halaman</div>
  <a href="index.html" class="nav-tab-btn" data-page="index">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
    <span>Hero Section (Utama)</span>
  </a>
  <a href="promo.html" class="nav-tab-btn" data-page="promo">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
    <span>Pop-Up Promo &amp; Diskon</span>
  </a>
  <a href="produk.html" class="nav-tab-btn" data-page="produk">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
    <span>Katalog &amp; Produk</span>
  </a>

  <div class="sidebar-heading">Pelanggan &amp; CRM</div>
  <a href="members.html" class="nav-tab-btn" data-page="members">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
    <span>Daftar Member</span>
    <span id="badge-member-count" style="margin-left: auto; background: var(--admin-blue-primary); color: #fff; font-size: 0.725rem; font-weight: 700; padding: 0.15rem 0.55rem; border-radius: 6px;">0</span>
  </a>

  <div class="sidebar-heading">Pengaturan Sistem</div>
  <a href="kontak.html" class="nav-tab-btn" data-page="kontak">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
    <span>Kontak &amp; Showroom</span>
  </a>
  <a href="backup.html" class="nav-tab-btn" data-page="backup">
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
    <span>Backup &amp; Restore Data</span>
  </a>
</aside>`;

  let componentsLoaded = false;
  async function loadAdminComponents() {
    if (componentsLoaded) return;

    const headerPlaceholder = document.getElementById('admin-header-placeholder');
    if (headerPlaceholder && !headerPlaceholder.children.length) {
      try {
        const res = await fetch('header.html');
        if (!res.ok) throw new Error('Failed to fetch header.html');
        headerPlaceholder.innerHTML = await res.text();
      } catch (e) {
        headerPlaceholder.innerHTML = ADMIN_HEADER_TEMPLATE;
      }
    }

    const sidebarPlaceholder = document.getElementById('admin-sidebar-placeholder');
    if (sidebarPlaceholder && !sidebarPlaceholder.children.length) {
      try {
        const res = await fetch('sidebar.html');
        if (!res.ok) throw new Error('Failed to fetch sidebar.html');
        sidebarPlaceholder.innerHTML = await res.text();
      } catch (e) {
        sidebarPlaceholder.innerHTML = ADMIN_SIDEBAR_TEMPLATE;
      }
    }

    componentsLoaded = true;
    initHeaderAndSidebar();
  }

  function initHeaderAndSidebar() {
    const path = (window.location.pathname || '').toLowerCase();

    // Hide or show 'Simpan Perubahan' button
    const btnSave = document.getElementById('btn-save-all');
    if (btnSave) {
      if (path.includes('members.html') || path.includes('backup.html')) {
        btnSave.style.display = 'none';
      } else {
        btnSave.style.display = 'inline-flex';
        btnSave.onclick = saveAllData;
      }
    }

    // Bind Logout (Point 1: pastikan hanya 1 handler terdaftar)
    const btnLogout = document.getElementById('btn-logout');
    if (btnLogout) {
      btnLogout.onclick = logoutAdmin;
    }

    // Set active navigation link
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.classList.remove('active');
      const page = btn.getAttribute('data-page');
      const href = (btn.getAttribute('href') || '').toLowerCase();

      if (page === 'index' && (path.endsWith('index.html') || path.endsWith('/admin') || path.endsWith('/admin/'))) {
        btn.classList.add('active');
      } else if (page && path.includes(page)) {
        btn.classList.add('active');
      } else if (href && path.endsWith(href)) {
        btn.classList.add('active');
      }
    });

    // Sync member count badge
    const badge = document.getElementById('badge-member-count');
    if (badge && typeof membersList !== 'undefined') {
      badge.textContent = membersList.length;
    }
  }

  // --- 1. State Management ---
  let siteData = null;
  const API_ENDPOINT = getApiUrl('/api/data');

  // --- 2. Auth Controller (Halaman Login Terpisah) ---
  function redirectToLogin() {
    try {
      sessionStorage.removeItem('ruvia_admin_token');
    } catch (e) {}
    const path = (window.location.pathname || '').toLowerCase();
    if (!path.endsWith('login.html')) {
      window.location.replace('login.html');
    }
  }

  function getAdminHeaders(extraHeaders = {}) {
    const headers = { ...extraHeaders };
    try {
      const token = sessionStorage.getItem('ruvia_admin_token');
      if (token) {
        headers['x-admin-token'] = token;
      }
    } catch (e) {}
    return headers;
  }

  async function checkAuth() {
    const path = (window.location.pathname || '').toLowerCase();
    if (path.endsWith('login.html')) return;

    try {
      const res = await fetch(getApiUrl('/api/admin/check'), {
        credentials: 'include',
        headers: getAdminHeaders()
      });
      if (res.ok) {
        initDashboard();
        return;
      }
    } catch (err) {
      console.warn('Gagal memeriksa otentikasi admin di server:', err);
    }
    redirectToLogin();
  }

  async function logoutAdmin() {
    try {
      await fetch(getApiUrl('/api/admin/logout'), {
        method: 'POST',
        headers: getAdminHeaders(),
        credentials: 'include'
      });
    } catch (e) {}
    redirectToLogin();
  }

  // --- 3. Toast Helper ---
  let toastTimer = null;

  function showToast(msg) {
    const toast = document.getElementById('admin-toast');
    const toastMessage = document.getElementById('toast-message');
    if (!toast || !toastMessage) return;
    toastMessage.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 3200);
  }

  // --- 4. Tab Navigation (Supports multi-page links & single-page tab switches) ---
  const tabButtons = document.querySelectorAll('.nav-tab-btn');
  const tabPanels = document.querySelectorAll('.tab-panel');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.tagName === 'A' && btn.getAttribute('href')) {
        return; // Allow standard multi-page navigation
      }
      const targetId = btn.getAttribute('data-tab');
      if (!targetId) return;
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(targetId);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  // Setelan data awal default toko Ruvia (Point 6: Reset benar-benar mengembalikan data awal)
  const DEFAULT_SITE_DATA = {
    hero: {
      badge: "Showroom Furnitur Kekinian & Sofa Minimalis • Makassar",
      headlinePrefix: "Pusat Furnitur Kekinian & ",
      headlineHighlight: "Sofa Minimalis Estetik",
      headlineSuffix: " untuk Hunian Modern Anda",
      subtext: "ruvia menghadirkan koleksi sofa minimalis dan furnitur kekinian berstandar estetik tinggi di Makassar. Mulai dari sofa lengkung kontemporer, model Japandi, hingga set ruang tamu yang bikin rumah terasa lega, elegan, dan nyaman setiap hari tanpa perlu bayar mahal.",
      pills: [
        { title: "Sofa Minimalis Modern", desc: "Desain Clean & Estetik Hunian" },
        { title: "Furnitur Kekinian", desc: "Tren Ruang Tamu Kontemporer" },
        { title: "Kenyamanan Maksimal", desc: "Busa Empuk & Awet Bergaransi" }
      ]
    },
    promo: {
      active: true,
      topBadge: "Promo Eksklusif Member • Kuota Terbatas",
      titlePrefix: "Spesial Member: ",
      titleHighlight: "Potongan Harga Eksklusif",
      visualBadgeTag: "Flash Event Member",
      visualDiscountNum: "Diskon Spesial Member",
      desc: "Daftar Member GRATIS sekarang dan nikmati potongan harga eksklusif untuk koleksi lemari, rak dapur, dan credenza. Kuota terbatas untuk 20 pendaftar pertama!",
      urgency: "Kuota diskon khusus 20 pendaftar pertama bulan ini!",
      perks: [
        "Potongan Harga Eksklusif untuk 14 koleksi promo pilihan",
        "Gratis Antar & Rakit Rapi ke seluruh area Makassar",
        "Member Digital Instan 100% gratis tanpa biaya bulanan"
      ],
      waText: "Halo ruvia Makassar, saya ingin daftar member gratis dan klaim harga promo eksklusif."
    },
    storeInfo: {
      brandName: "Ruvia Furniture",
      city: "Makassar",
      whatsapp: "628114500888",
      whatsappDisplay: "+62 811-4500-888",
      address: "Jl. Gunung Latimojong No.78, Lariang Bangi, Kec. Makassar, Kota Makassar, Sulawesi Selatan 90224",
      hours: "Setiap Hari: 08.00 - 18.00 WITA",
      googleMapsUrl: "https://share.google/Jd3qGqJP3vN8w0Hi9",
      email: "halo@ruviafurniture.com"
    },
    products: [
      {
        id: "aurelia",
        title: "Aurelia Curved Sofa",
        category: "Sofa & Ruang Tamu",
        categoryKey: "living",
        image: "../assets/images/catalog-sofa.jpg",
        priceEstimate: "Mulai Rp 3.800.000",
        badge: "Bestseller Kekinian",
        desc: "Sofa lengkung minimalis kontemporer yang empuk dan estetik. Siluet lengkungnya memberikan kesan ruang tamu modern yang lega dan elegan, dengan busa high resilience bergaransi.",
        waText: "Halo ruvia Makassar, saya tertarik info harga dan pilihan warna untuk Aurelia Curved Sofa Minimalis."
      },
      {
        id: "verona",
        title: "Verona Marble Dining Suite",
        category: "Set Meja Makan",
        categoryKey: "dining",
        image: "../assets/images/catalog-dining.jpg",
        priceEstimate: "Mulai Rp 4.200.000",
        badge: "Desain Mewah Hemat",
        desc: "Set meja makan modern bernuansa minimalis elegan. Permukaan top motif marmer mewah berpadu kaki ramping modern dan kursi makan ergonomis empuk.",
        waText: "Halo ruvia Makassar, saya ingin tanya info harga untuk Verona Dining Suite."
      },
      {
        id: "celeste",
        title: "Celeste Modern Bed Suite",
        category: "Tempat Tidur",
        categoryKey: "bedroom",
        image: "../assets/images/catalog-bedroom.jpg",
        priceEstimate: "Mulai Rp 3.500.000",
        badge: "Favorit Kamar Utama",
        desc: "Dipan tempat tidur minimalis modern dengan sandaran headboard empuk berlapis material premium, memberikan kenyamanan beristirahat maksimal setiap malam.",
        waText: "Halo ruvia Makassar, saya ingin tanya harga dan ukuran untuk Celeste Bed Suite."
      },
      {
        id: "elysian",
        title: "Elysian Fluted Credenza",
        category: "Credenza & Lemari",
        categoryKey: "storage",
        image: "../assets/images/catalog-credenza.jpg",
        priceEstimate: "Mulai Rp 2.400.000",
        badge: "Aksen Estetik",
        desc: "Credenza TV dan kabinet penyimpanan dengan aksen kisi kayu minimalis kekinian. Dilengkapi pintu mekanisme soft-close yang halus dan elegan.",
        waText: "Halo ruvia Makassar, saya ingin tanya harga untuk Elysian Fluted Credenza."
      }
    ]
  };

  // --- 5. Fetch Data from Backend ---
  async function loadData() {
    const indicator = document.getElementById('server-indicator');
    const statusText = document.getElementById('server-status-text');

    try {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) throw new Error('API response not ok');
      siteData = await res.json();
      if (indicator) indicator.classList.remove('offline');
      if (statusText) statusText.textContent = 'Server Aktif';
    } catch (err) {
      console.warn('Backend API tidak merespons, memuat dari localStorage atau fallback...', err);
      if (indicator) indicator.classList.add('offline');
      if (statusText) statusText.textContent = 'Mode Offline (Lokal)';

      const cached = localStorage.getItem('ruvia_site_data');
      if (cached) {
        try { siteData = JSON.parse(cached); } catch (e) {}
      }
    }

    if (!siteData) {
      siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
    }

    populateFormFields();
    renderProductsList();
  }

  // --- 6. Form Fields Population ---
  function populateFormFields() {
    if (!siteData) return;

    // Hero Section
    const h = siteData.hero || {};
    setVal('hero-badge', h.badge || '');
    setVal('hero-head-prefix', h.headlinePrefix || '');
    setVal('hero-head-highlight', h.headlineHighlight || '');
    setVal('hero-head-suffix', h.headlineSuffix || '');
    setVal('hero-subtext', h.subtext || '');

    const pills = h.pills || [];
    setVal('pill-1-title', pills[0]?.title || '');
    setVal('pill-1-desc', pills[0]?.desc || '');
    setVal('pill-2-title', pills[1]?.title || '');
    setVal('pill-2-desc', pills[1]?.desc || '');
    setVal('pill-3-title', pills[2]?.title || '');
    setVal('pill-3-desc', pills[2]?.desc || '');

    updateHeroPreview();

    // Promo Section
    const p = siteData.promo || {};
    const toggle = document.getElementById('promo-active-toggle');
    if (toggle) toggle.checked = p.active !== false;

    setVal('promo-top-badge', p.topBadge || '');
    setVal('promo-badge-tag', p.visualBadgeTag || '');
    setVal('promo-discount-num', p.visualDiscountNum || '');
    setVal('promo-urgency', p.urgency || '');
    setVal('promo-title-prefix', p.titlePrefix || '');
    setVal('promo-title-highlight', p.titleHighlight || '');
    setVal('promo-desc', p.desc || '');

    const perks = p.perks || [];
    setVal('promo-perk-1', perks[0] || '');
    setVal('promo-perk-2', perks[1] || '');
    setVal('promo-perk-3', perks[2] || '');
    setVal('promo-watext', p.waText || '');

    // Store Info
    const s = siteData.storeInfo || {};
    setVal('store-wa-raw', s.whatsapp || '628114500888');
    setVal('store-wa-disp', s.whatsappDisplay || '+62 811-4500-888');
    setVal('store-address', s.address || '');
    setVal('store-hours', s.hours || '');
    setVal('store-email', s.email || '');
  }

  function setVal(id, val) {
    const el = document.getElementById(id);
    if (el) el.value = val;
  }

  function getVal(id) {
    const el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  // Live Hero Preview Listener
  ['hero-head-prefix', 'hero-head-highlight', 'hero-head-suffix'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateHeroPreview);
  });

  function updateHeroPreview() {
    const prefix = document.getElementById('prev-head-prefix');
    const highlight = document.getElementById('prev-head-highlight');
    const suffix = document.getElementById('prev-head-suffix');

    if (prefix) prefix.textContent = getVal('hero-head-prefix') || 'Pusat Furnitur Kekinian & ';
    if (highlight) highlight.textContent = getVal('hero-head-highlight') || 'Sofa Minimalis Estetik';
    if (suffix) suffix.textContent = getVal('hero-head-suffix') || ' untuk Hunian Modern Anda';
  }

  // --- 7. Product Management ---
  const productsContainer = document.getElementById('admin-products-list');
  const prodModal = document.getElementById('product-modal-overlay');
  const prodForm = document.getElementById('product-form');
  const btnCloseProdModal = document.getElementById('btn-close-prod-modal');
  const btnCancelProd = document.getElementById('btn-cancel-prod');
  const btnAddProduct = document.getElementById('btn-add-product');
  const prodModalTitle = document.getElementById('product-modal-title');

  function sanitizeProductImageUrl(url) {
    if (!url || typeof url !== 'string') return '../assets/images/catalog-sofa.jpg';
    let clean = url.trim();
    if (/[<>"']/.test(clean)) return '../assets/images/catalog-sofa.jpg';
    if (clean.startsWith('assets/images/')) {
      return '../' + clean;
    }
    if (clean.startsWith('../assets/images/') || clean.startsWith('/assets/images/') || clean.startsWith('http://') || clean.startsWith('https://')) {
      return clean;
    }
    return clean.startsWith('../') ? clean : '../' + clean;
  }

  function renderProductsList() {
    if (!productsContainer || !siteData) return;
    const prods = siteData.products || [];

    if (prods.length === 0) {
      productsContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1;">
          <p style="color: #64748b; font-weight: 600;">Belum ada produk di katalog. Klik tombol di atas untuk menambah produk baru.</p>
        </div>
      `;
      return;
    }

    productsContainer.innerHTML = prods.map((p, idx) => {
      const safeImg = sanitizeProductImageUrl(p.image);
      const safeTitle = escapeHtml(p.title || '');
      const safeBadge = p.badge ? escapeHtml(p.badge) : '';
      const safeCategory = escapeHtml(p.category || 'Furnitur');
      const safePrice = escapeHtml(p.priceEstimate || 'Harga Hubungi WA');
      const safeDesc = escapeHtml(p.desc || '');

      return `
      <div class="prod-card-admin" data-index="${idx}">
        <div class="prod-img-wrap">
          <img src="${safeImg}" alt="${safeTitle}" onerror="this.src='../assets/images/catalog-sofa.jpg'">
          ${safeBadge ? `<span class="prod-badge-tag">${safeBadge}</span>` : ''}
          <span class="prod-cat-badge">${safeCategory}</span>
        </div>
        <div class="prod-body-admin">
          <h3 class="prod-title-admin">${safeTitle}</h3>
          <div class="prod-price-admin">${safePrice}</div>
          <p class="prod-desc-admin">${safeDesc}</p>
          <div class="prod-actions-admin">
            <button type="button" class="btn-adm btn-adm-outline btn-adm-sm btn-edit-prod" data-index="${idx}" style="flex: 1;">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
              <span>Edit Model</span>
            </button>
            <button type="button" class="btn-adm btn-adm-danger btn-adm-sm btn-del-prod" data-index="${idx}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    `;
    }).join('');

    // Bind Edit & Delete buttons
    document.querySelectorAll('.btn-edit-prod').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-index'), 10);
        openEditProductModal(idx);
      });
    });

    document.querySelectorAll('.btn-del-prod').forEach(b => {
      b.addEventListener('click', () => {
        const idx = parseInt(b.getAttribute('data-index'), 10);
        deleteProduct(idx);
      });
    });
  }

  function openEditProductModal(idx = -1) {
    if (!prodModal) return;

    if (idx >= 0 && siteData.products[idx]) {
      const p = siteData.products[idx];
      prodModalTitle.textContent = 'Edit Produk: ' + p.title;
      setVal('prod-id', idx.toString());
      setVal('prod-name', p.title);

      const catSelect = document.getElementById('prod-category');
      if (catSelect) {
        catSelect.value = `${p.category}|${p.categoryKey || 'living'}`;
      }

      setVal('prod-badge', p.badge || '');
      setVal('prod-price', p.priceEstimate || '');
      setVal('prod-image', p.image || '');
      setVal('prod-desc', p.desc || '');
      setVal('prod-watext', p.waText || '');
    } else {
      prodModalTitle.textContent = 'Tambah Produk Baru';
      setVal('prod-id', '-1');
      setVal('prod-name', '');
      setVal('prod-badge', 'Model Terbaru');
      setVal('prod-price', 'Mulai Rp 3.500.000');
      setVal('prod-image', '../assets/images/catalog-sofa.jpg');
      setVal('prod-desc', 'Sofa minimalis modern dengan kenyamanan busa empuk...');
      setVal('prod-watext', 'Halo ruvia Makassar, saya ingin info model produk ini.');
    }

    prodModal.classList.add('active');
  }

  function closeProductModal() {
    if (prodModal) prodModal.classList.remove('active');
  }

  if (btnCloseProdModal) btnCloseProdModal.addEventListener('click', closeProductModal);
  if (btnCancelProd) btnCancelProd.addEventListener('click', closeProductModal);
  if (btnAddProduct) btnAddProduct.addEventListener('click', () => openEditProductModal(-1));

  if (prodForm) {
    prodForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const idx = parseInt(getVal('prod-id'), 10);
      const catVal = document.getElementById('prod-category').value.split('|');
      const category = catVal[0];
      const categoryKey = catVal[1] || 'living';

      const productObj = {
        id: idx >= 0 && siteData.products[idx]?.id ? siteData.products[idx].id : 'prod_' + Date.now(),
        title: getVal('prod-name'),
        category: category,
        categoryKey: categoryKey,
        badge: getVal('prod-badge'),
        priceEstimate: getVal('prod-price'),
        image: getVal('prod-image'),
        desc: getVal('prod-desc'),
        waText: getVal('prod-watext') || `Halo ruvia Makassar, saya ingin tanya harga untuk ${getVal('prod-name')}.`,
        specs: idx >= 0 && siteData.products[idx]?.specs ? siteData.products[idx].specs : [
          { label: "Gaya Desain", value: "Minimalis Kekinian" },
          { label: "Bahan & Warna", value: "100+ Pilihan Bebas Request" },
          { label: "Garansi", value: "Garansi Rangka & Busa" }
        ]
      };

      if (idx >= 0) {
        siteData.products[idx] = productObj;
      } else {
        siteData.products.push(productObj);
      }

      closeProductModal();
      renderProductsList();
      showToast('Produk berhasil diperbarui! Jangan lupa klik "Simpan ke Server".');
    });
  }

  function deleteProduct(idx) {
    if (confirm(`Yakin ingin menghapus produk "${siteData.products[idx]?.title}"?`)) {
      siteData.products.splice(idx, 1);
      renderProductsList();
      showToast('Produk dihapus dari daftar.');
    }
  }

  // --- 8. Save All to Server ---
  async function saveAllData() {
    if (!siteData) return;

    const btnSave = document.getElementById('btn-save-all');
    if (btnSave) {
      btnSave.disabled = true;
      btnSave.style.opacity = '0.7';
    }

    // Harvest form data only for fields present on current page
    if (document.getElementById('hero-badge')) {
      siteData.hero = {
        badge: getVal('hero-badge'),
        headlinePrefix: getVal('hero-head-prefix'),
        headlineHighlight: getVal('hero-head-highlight'),
        headlineSuffix: getVal('hero-head-suffix'),
        subtext: getVal('hero-subtext'),
        pills: [
          { title: getVal('pill-1-title'), desc: getVal('pill-1-desc') },
          { title: getVal('pill-2-title'), desc: getVal('pill-2-desc') },
          { title: getVal('pill-3-title'), desc: getVal('pill-3-desc') }
        ]
      };
    }

    if (document.getElementById('promo-top-badge')) {
      const toggle = document.getElementById('promo-active-toggle');
      siteData.promo = {
        active: toggle ? toggle.checked : (siteData.promo?.active !== false),
        topBadge: getVal('promo-top-badge'),
        visualBadgeTag: getVal('promo-badge-tag'),
        visualDiscountNum: getVal('promo-discount-num'),
        urgency: getVal('promo-urgency'),
        titlePrefix: getVal('promo-title-prefix'),
        titleHighlight: getVal('promo-title-highlight'),
        desc: getVal('promo-desc'),
        perks: [
          getVal('promo-perk-1'),
          getVal('promo-perk-2'),
          getVal('promo-perk-3')
        ].filter(Boolean),
        waText: getVal('promo-watext')
      };
    }

    if (document.getElementById('store-wa-raw')) {
      siteData.storeInfo = {
        brandName: "Ruvia Furniture",
        city: "Makassar",
        whatsapp: getVal('store-wa-raw') || (siteData.storeInfo?.whatsapp || '628114500888'),
        whatsappDisplay: getVal('store-wa-disp') || (siteData.storeInfo?.whatsappDisplay || '+62 811-4500-888'),
        address: getVal('store-address') || (siteData.storeInfo?.address || 'Jl. Gunung Latimojong No.78, Lariang Bangi, Kec. Makassar, Kota Makassar, Sulawesi Selatan 90224'),
        hours: getVal('store-hours') || (siteData.storeInfo?.hours || 'Setiap Hari: 08.00 - 18.00 WITA'),
        googleMapsUrl: (siteData.storeInfo && siteData.storeInfo.googleMapsUrl) || 'https://share.google/Jd3qGqJP3vN8w0Hi9',
        email: getVal('store-email') || (siteData.storeInfo?.email || 'halo@ruviafurniture.com')
      };
    }

    // Mirror to localStorage
    try {
      localStorage.setItem('ruvia_site_data', JSON.stringify(siteData));
    } catch (e) {}

    // POST to backend API
    try {
      const res = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
        credentials: 'include',
        body: JSON.stringify(siteData)
      });

      if (res.status === 401) {
        redirectToLogin();
        return;
      }

      if (!res.ok) throw new Error('Gagal menyimpan ke server');
      const data = await res.json();
      showToast('Sukses! ' + (data.message || 'Data berhasil disimpan ke server.'));
    } catch (err) {
      console.warn('Gagal POST ke API:', err);
      showToast('Gagal terhubung ke server! Perubahan belum tersimpan dan belum tampil di website.');
    } finally {
      if (btnSave) {
        btnSave.disabled = false;
        btnSave.style.opacity = '1';
      }
    }
  }

  // Expose to window for inline onclick fallback
  window.saveAllData = saveAllData;

  // --- 9. Export, Import & Reset ---
  const btnExport = document.getElementById('btn-export-json');
  const inputImport = document.getElementById('input-import-json');
  const btnReset = document.getElementById('btn-reset-default');

  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(siteData, null, 2));
      const dlAnchor = document.createElement('a');
      dlAnchor.setAttribute("href", dataStr);
      dlAnchor.setAttribute("download", `ruvia-backup-${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(dlAnchor);
      dlAnchor.click();
      dlAnchor.remove();
      showToast('File backup JSON berhasil didownload.');
    });
  }

  if (inputImport) {
    inputImport.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target.result);
          siteData = imported;
          populateFormFields();
          renderProductsList();
          saveAllData();
          showToast('Data berhasil di-restore dari file backup!');
        } catch (err) {
          alert('Format file JSON tidak valid!');
        }
      };
      reader.readAsText(file);
    });
  }

  // Point 6: Tombol Reset benar-benar mengembalikan ke DEFAULT_SITE_DATA awal
  if (btnReset) {
    btnReset.addEventListener('click', async () => {
      if (confirm('Kembalikan semua teks dan produk ke setelan awal toko Ruvia?')) {
        try {
          localStorage.removeItem('ruvia_site_data');
          siteData = JSON.parse(JSON.stringify(DEFAULT_SITE_DATA));
          populateFormFields();
          renderProductsList();
          await saveAllData();
          showToast('Data berhasil di-reset ke setelan awal!');
        } catch (err) {
          console.error('Reset error:', err);
          showToast('Gagal me-reset data ke setelan awal.');
        }
      }
    });
  }

  // ==========================================================================
  // --- 11. Member Management Controller (CRM & Loyalitas) ---
  // ==========================================================================
  let membersList = [];
  const MEMBERS_API = getApiUrl('/api/members');

  const badgeMemberCount = document.getElementById('badge-member-count');
  const kpiTotalMembers = document.getElementById('kpi-total-members');
  const kpiFavoriteCategory = document.getElementById('kpi-favorite-category');
  const kpiTopCity = document.getElementById('kpi-top-city');
  const memberTableBody = document.getElementById('member-table-body');
  const memberEmptyState = document.getElementById('member-empty-state');
  const memberSearchInput = document.getElementById('member-search-input');
  const memberFilterCategory = document.getElementById('member-filter-category');
  const btnRefreshMembers = document.getElementById('btn-refresh-members');
  const btnExportMembers = document.getElementById('btn-export-members');
  const btnCopyWaBroadcast = document.getElementById('btn-copy-wa-broadcast');

  // Member Detail Modal Elements
  const memberDetailModal = document.getElementById('member-detail-modal-overlay');
  const btnCloseMemberDetail = document.getElementById('btn-close-member-detail');
  const btnCloseDetailModal = document.getElementById('btn-close-detail-modal');
  const btnChatMemberWa = document.getElementById('btn-chat-member-wa');

  const detailMbrTier = document.getElementById('detail-mbr-tier');
  const detailMbrName = document.getElementById('detail-mbr-name');
  const detailMbrId = document.getElementById('detail-mbr-id');
  const detailMbrWa = document.getElementById('detail-mbr-wa');
  const detailMbrEmail = document.getElementById('detail-mbr-email');
  const detailMbrDob = document.getElementById('detail-mbr-dob');
  const detailMbrCity = document.getElementById('detail-mbr-city');
  const detailMbrAddress = document.getElementById('detail-mbr-address');
  const detailMbrCategory = document.getElementById('detail-mbr-category');
  const detailMbrNotes = document.getElementById('detail-mbr-notes');
  const detailMbrDate = document.getElementById('detail-mbr-date');

  // Add Member Modal Elements
  const addMemberModal = document.getElementById('add-member-modal-overlay');
  const btnOpenAddMember = document.getElementById('btn-open-add-member');
  const btnCloseAddMember = document.getElementById('btn-close-add-member');
  const btnCancelAddMember = document.getElementById('btn-cancel-add-member');
  const formAdminAddMember = document.getElementById('form-admin-add-member');

  async function loadMembers() {
    // Point 3: Hapus cache lokal agar server menjadi satu-satunya sumber data
    try {
      localStorage.removeItem('ruvia_members');
      localStorage.removeItem('ruvia_members_cache');
    } catch (e) {}

    let serverMembers = [];

    try {
      const res = await fetch(MEMBERS_API, {
        credentials: 'include',
        headers: getAdminHeaders()
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          serverMembers = data;
        }
      } else {
        throw new Error('Gagal memuat data member dari server');
      }
    } catch (err) {
      console.warn('Gagal memuat member via server API:', err);
    }

    // Point 2 & 3: Server adalah satu-satunya sumber data (tanpa DEFAULT_MEMBERS / data contoh palsu)
    membersList = serverMembers;

    updateMemberKPIs();
    renderMembersTable();
  }

  function updateMemberKPIs() {
    const total = membersList.length;
    if (badgeMemberCount) badgeMemberCount.textContent = total;
    if (kpiTotalMembers) kpiTotalMembers.textContent = total;

    // Hitung kategori terfavorit & domisili terbanyak
    if (total > 0) {
      const catCount = {};
      const cityCount = {};

      membersList.forEach(m => {
        const cat = m.categoryInterest || 'Sofa & Ruang Tamu';
        catCount[cat] = (catCount[cat] || 0) + 1;

        const city = m.city || 'Makassar';
        cityCount[city] = (cityCount[city] || 0) + 1;
      });

      const topCat = Object.keys(catCount).reduce((a, b) => catCount[a] > catCount[b] ? a : b, '-');
      const topCity = Object.keys(cityCount).reduce((a, b) => cityCount[a] > cityCount[b] ? a : b, '-');

      if (kpiFavoriteCategory) kpiFavoriteCategory.textContent = topCat;
      if (kpiTopCity) kpiTopCity.textContent = topCity;
    } else {
      if (kpiFavoriteCategory) kpiFavoriteCategory.textContent = '-';
      if (kpiTopCity) kpiTopCity.textContent = '-';
    }
  }

  function renderMembersTable() {
    if (!memberTableBody) return;

    const searchTerm = (memberSearchInput ? memberSearchInput.value : '').toLowerCase().trim();
    const catFilter = memberFilterCategory ? memberFilterCategory.value : '';

    const filtered = membersList.filter(m => {
      const matchesSearch = !searchTerm || 
        (m.fullName && m.fullName.toLowerCase().includes(searchTerm)) ||
        (m.whatsapp && m.whatsapp.includes(searchTerm)) ||
        (m.id && m.id.toLowerCase().includes(searchTerm)) ||
        (m.city && m.city.toLowerCase().includes(searchTerm));

      const matchesCat = !catFilter || (m.categoryInterest === catFilter);

      return matchesSearch && matchesCat;
    });

    if (filtered.length === 0) {
      memberTableBody.innerHTML = '';
      if (memberEmptyState) memberEmptyState.style.display = 'block';
      return;
    }

    if (memberEmptyState) memberEmptyState.style.display = 'none';

    memberTableBody.innerHTML = filtered.map((m, idx) => {
      const cleanWa = (m.whatsapp || '').replace(/[^0-9]/g, '');
      const waApi = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : (cleanWa.startsWith('62') ? cleanWa : '62' + cleanWa);
      const regDate = m.registeredAt ? new Date(m.registeredAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

      return `
        <tr>
          <td style="padding: 0.75rem 1rem; color: var(--admin-gray-400); font-weight: 600; text-align: center;">${idx + 1}</td>
          <td style="padding: 0.75rem 1rem;">
            <span class="member-id-tag">${escapeHtml(m.id || 'RUV-M')}</span>
          </td>
          <td style="padding: 0.75rem 1rem;">
            <div class="member-name-row">
              <span class="member-name-text">${escapeHtml(m.fullName || '-')}</span>
              <span class="member-tier-pill">${escapeHtml(m.tier || 'Gold Member')}</span>
            </div>
          </td>
          <td style="padding: 0.75rem 1rem;">
            <a href="https://wa.me/${waApi}" target="_blank" rel="noopener noreferrer" class="member-wa-link" title="Chat WhatsApp Pelanggan">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm.01 1.67c2.2 0 4.26.86 5.82 2.41 1.56 1.56 2.41 3.63 2.41 5.83s-.85 4.27-2.41 5.83c-1.56 1.56-3.62 2.41-5.82 2.41-1.48 0-2.93-.39-4.2-1.14l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.39 0-2.2.86-4.27 2.41-5.83 1.56-1.55 3.63-2.41 5.84-2.41zm-3.32 3.61c-.18 0-.48.07-.73.34-.25.28-.96.94-.96 2.29s.98 2.66 1.12 2.84c.14.18 1.93 2.95 4.67 4.13.65.28 1.16.45 1.56.57.66.21 1.26.18 1.73.11.53-.08 1.63-.67 1.86-1.31.23-.65.23-1.2.16-1.31-.07-.12-.25-.18-.53-.32-.28-.14-1.63-.8-1.88-.89-.25-.09-.44-.14-.62.14-.18.28-.71.89-.87 1.07-.16.18-.32.21-.6.07-.28-.14-1.18-.44-2.25-1.39-.83-.74-1.39-1.66-1.55-1.94-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.18-.28.28-.46.09-.18.05-.35-.02-.49-.07-.14-.62-1.5-.85-2.06-.23-.54-.46-.47-.63-.48-.16-.01-.35-.01-.53-.01z"/>
              </svg>
              <span>${escapeHtml(m.whatsapp || '-')}</span>
            </a>
          </td>
          <td style="padding: 0.75rem 1rem;">
            <span class="member-city-tag">${escapeHtml(m.city || '-')}</span>
          </td>
          <td style="padding: 0.75rem 1rem;">
            <span class="member-cat-pill">${escapeHtml(m.categoryInterest || '-')}</span>
          </td>
          <td style="padding: 0.75rem 1rem; color: var(--admin-gray-600); font-size: 0.825rem; font-weight: 500;">${regDate}</td>
          <td style="padding: 0.75rem 1rem; text-align: center;">
            <div class="action-btn-group">
              <button type="button" class="btn-adm btn-adm-outline btn-adm-sm btn-detail-mbr" data-id="${escapeHtml(m.id)}" title="Lihat Biodata Lengkap">
                Detail
              </button>
              <button type="button" class="btn-adm btn-adm-danger btn-adm-sm btn-delete-mbr" data-id="${escapeHtml(m.id)}" title="Hapus Member">
                Hapus
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    // Attach listeners
    memberTableBody.querySelectorAll('.btn-detail-mbr').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        showMemberDetail(id);
      });
    });

    memberTableBody.querySelectorAll('.btn-delete-mbr').forEach(b => {
      b.addEventListener('click', () => {
        const id = b.getAttribute('data-id');
        deleteMember(id);
      });
    });
  }

  function showMemberDetail(id) {
    const member = membersList.find(m => m.id === id);
    if (!member || !memberDetailModal) return;

    if (detailMbrTier) detailMbrTier.textContent = member.tier || 'Ruvia Gold Member';
    if (detailMbrName) detailMbrName.textContent = member.fullName || '-';
    if (detailMbrId) detailMbrId.textContent = member.id || '-';
    if (detailMbrWa) detailMbrWa.textContent = member.whatsapp || '-';
    if (detailMbrEmail) detailMbrEmail.textContent = member.email || '(Tidak dicantumkan)';
    if (detailMbrDob) detailMbrDob.textContent = member.birthDate ? new Date(member.birthDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '(Tidak dicantumkan)';
    if (detailMbrCity) detailMbrCity.textContent = member.city || 'Makassar';
    if (detailMbrAddress) detailMbrAddress.textContent = member.address || '(Belum mengisi alamat detail)';
    if (detailMbrCategory) detailMbrCategory.textContent = member.categoryInterest || '-';
    if (detailMbrNotes) detailMbrNotes.textContent = member.notes || '(Tidak ada catatan khusus)';
    if (detailMbrDate) detailMbrDate.textContent = member.registeredAt ? new Date(member.registeredAt).toLocaleString('id-ID') : '-';

    if (btnChatMemberWa) {
      const cleanWa = (member.whatsapp || '').replace(/[^0-9]/g, '');
      const waApi = cleanWa.startsWith('0') ? '62' + cleanWa.slice(1) : (cleanWa.startsWith('62') ? cleanWa : '62' + cleanWa);
      const text = encodeURIComponent(`Halo Bapak/Ibu ${member.fullName}, kami dari ruvia Furniture Makassar (ID Member: ${member.id}). Terima kasih telah bergabung sebagai member ruvia Privilege! Ada yang bisa kami bantu untuk kebutuhan ${member.categoryInterest || 'furnitur Anda'}?`);
      btnChatMemberWa.href = `https://wa.me/${waApi}?text=${text}`;
    }

    memberDetailModal.classList.add('active');
  }

  async function deleteMember(id) {
    const member = membersList.find(m => m.id === id);
    const name = member ? member.fullName : id;

    if (!confirm(`Hapus data keanggotaan ${name} (${id})?`)) return;

    try {
      const res = await fetch(`${MEMBERS_API}?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: getAdminHeaders(),
        credentials: 'include'
      });
      if (res.status === 401) {
        redirectToLogin();
        return;
      }
    } catch (err) {
      console.warn('Gagal menghapus di server (offline), menghapus lokal:', err);
    }

    membersList = membersList.filter(m => m.id !== id);
    try {
      localStorage.removeItem('ruvia_members');
      localStorage.removeItem('ruvia_members_cache');
    } catch (e) {}

    updateMemberKPIs();
    renderMembersTable();
    showToast(`Member ${name} berhasil dihapus.`);
  }

  // Filter & Search Event Listeners
  if (memberSearchInput) {
    memberSearchInput.addEventListener('input', renderMembersTable);
  }

  if (memberFilterCategory) {
    memberFilterCategory.addEventListener('change', renderMembersTable);
  }

  if (btnRefreshMembers) {
    btnRefreshMembers.addEventListener('click', () => {
      loadMembers();
      showToast('Data member berhasil dimuat ulang!');
    });
  }

  // Export CSV
  if (btnExportMembers) {
    btnExportMembers.addEventListener('click', () => {
      if (membersList.length === 0) {
        alert('Tidak ada data member untuk diekspor.');
        return;
      }

      let csv = 'ID Member,Nama Lengkap,WhatsApp,Email,Tanggal Lahir,Domisili,Alamat,Minat Furnitur,Catatan,Tanggal Terdaftar\n';
      membersList.forEach(m => {
        const row = [
          `"${(m.id || '').replace(/"/g, '""')}"`,
          `"${(m.fullName || '').replace(/"/g, '""')}"`,
          `"${(m.whatsapp || '').replace(/"/g, '""')}"`,
          `"${(m.email || '').replace(/"/g, '""')}"`,
          `"${(m.birthDate || '').replace(/"/g, '""')}"`,
          `"${(m.city || '').replace(/"/g, '""')}"`,
          `"${(m.address || '').replace(/"/g, '""')}"`,
          `"${(m.categoryInterest || '').replace(/"/g, '""')}"`,
          `"${(m.notes || '').replace(/"/g, '""')}"`,
          `"${(m.registeredAt || '').replace(/"/g, '""')}"`
        ];
        csv += row.join(',') + '\n';
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `daftar_member_ruvia_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('File CSV member berhasil diunduh!');
    });
  }

  // Salin No. WA untuk Broadcast
  if (btnCopyWaBroadcast) {
    btnCopyWaBroadcast.addEventListener('click', () => {
      if (membersList.length === 0) {
        alert('Belum ada nomor WhatsApp member yang tersedia.');
        return;
      }

      const waNumbers = membersList
        .map(m => m.whatsapp)
        .filter(Boolean)
        .map(w => w.replace(/[^0-9]/g, ''))
        .filter(w => w.length >= 9);

      const uniqueNumbers = [...new Set(waNumbers)];

      navigator.clipboard.writeText(uniqueNumbers.join('\n')).then(() => {
        showToast(`Berhasil menyalin ${uniqueNumbers.length} nomor WhatsApp untuk broadcast!`);
      }).catch(err => {
        prompt('Salin nomor WhatsApp berikut:', uniqueNumbers.join(', '));
      });
    });
  }

  // Close Detail Modal
  if (btnCloseMemberDetail && memberDetailModal) {
    btnCloseMemberDetail.addEventListener('click', () => memberDetailModal.classList.remove('active'));
  }
  if (btnCloseDetailModal && memberDetailModal) {
    btnCloseDetailModal.addEventListener('click', () => memberDetailModal.classList.remove('active'));
  }
  if (memberDetailModal) {
    memberDetailModal.addEventListener('click', (e) => {
      if (e.target === memberDetailModal) memberDetailModal.classList.remove('active');
    });
  }

  // Manual Add Member
  if (btnOpenAddMember && addMemberModal) {
    btnOpenAddMember.addEventListener('click', () => {
      if (formAdminAddMember) formAdminAddMember.reset();
      addMemberModal.classList.add('active');
    });
  }

  if (btnCloseAddMember && addMemberModal) {
    btnCloseAddMember.addEventListener('click', () => addMemberModal.classList.remove('active'));
  }
  if (btnCancelAddMember && addMemberModal) {
    btnCancelAddMember.addEventListener('click', () => addMemberModal.classList.remove('active'));
  }
  if (addMemberModal) {
    addMemberModal.addEventListener('click', (e) => {
      if (e.target === addMemberModal) addMemberModal.classList.remove('active');
    });
  }

  if (formAdminAddMember) {
    formAdminAddMember.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = document.getElementById('adm-mbr-name');
      const waInput = document.getElementById('adm-mbr-wa');
      const emailInput = document.getElementById('adm-mbr-email');
      const dobInput = document.getElementById('adm-mbr-dob');
      const cityInput = document.getElementById('adm-mbr-city');
      const addressInput = document.getElementById('adm-mbr-address');
      const categorySelect = document.getElementById('adm-mbr-category');
      const notesInput = document.getElementById('adm-mbr-notes');

      const payload = {
        fullName: nameInput ? nameInput.value.trim() : '',
        whatsapp: waInput ? waInput.value.trim() : '',
        password: 'MemberRuvia2026!', // Password default memenuhi syarat validasi server (>= 8 char)
        email: emailInput ? emailInput.value.trim() : '',
        birthDate: dobInput ? dobInput.value : '',
        city: cityInput ? cityInput.value.trim() : 'Makassar',
        address: addressInput ? addressInput.value.trim() : '',
        categoryInterest: categorySelect ? categorySelect.value : 'Sofa & Ruang Tamu',
        notes: notesInput ? notesInput.value.trim() : ''
      };

      try {
        const res = await fetch(MEMBERS_API, {
          method: 'POST',
          headers: getAdminHeaders({ 'Content-Type': 'application/json' }),
          credentials: 'include',
          body: JSON.stringify(payload)
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Gagal menambahkan member');

        if (addMemberModal) addMemberModal.classList.remove('active');
        showToast(`Member ${payload.fullName} berhasil ditambahkan!`);
        formAdminAddMember.reset();
        await loadMembers();
      } catch (err) {
        console.error('API error when adding member:', err);
        showToast(err.message || 'Gagal menambahkan member ke server.');
      }
    });
  }

  // --- Initialize Dashboard ---
  async function initDashboard() {
    await loadAdminComponents();
    loadData();
    loadMembers();
  }

  // Cek otentikasi admin ke server; jika valid akan memanggil initDashboard(), jika tidak dialihkan ke login.html
  checkAuth();
});
