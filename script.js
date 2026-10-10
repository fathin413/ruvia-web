/**
 * RUVIA FURNITURE MAKASSAR
 * JavaScript Controller: Interaktivitas Bersih, Lookbook, Modal, & WhatsApp Routing
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Helper for safe text escaping
  function esc(str) {
    if (str === null || str === undefined) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // --- 1. Data Lookbook Koleksi ruvia (Digital Catalog - Toko Furnitur Modern) ---
  const lookbookData = {
    aurelia: {
      title: 'Aurelia Curved Sofa',
      category: 'Sofa & Ruang Tamu',
      image: 'assets/images/catalog-sofa.jpg',
      alt: 'Aurelia Curved Sofa - ruvia Makassar',
      desc: 'Sofa lengkung modern yang nyaman dan estetik. Model ini bisa Anda custom warna dan bahan pelapisnya sesuai konsep interior ruangan serta ukuran panjangnya (tersedia 2-seater, 3-seater, hingga letter L) dengan jaminan harga pasti murah.',
      waText: 'Halo ruvia Makassar, saya ingin tanya harga dan opsi custom warna/ukuran untuk Aurelia Curved Sofa.',
      specs: [
        { label: 'Pilihan Warna & Bahan', value: '100+ Pilihan Warna & Material (Bouclé, Beludru Velvet, Kanvas Linen, Kulit Sintetis)' },
        { label: 'Pilihan Custom Ukuran', value: 'Bisa Custom Panjang (2-Seater, 3-Seater, Letter L, atau request panjang khusus)' },
        { label: 'Kualitas Busa', value: 'Busa High Resilience Empuk & Tahan Kempes' },
        { label: 'Rangka Penopang', value: 'Rangka Kuat, Kokoh & Anti Rayap' },
        { label: 'Garansi', value: 'Garansi Rangka & Busa' },
        { label: 'Jaminan Harga', value: 'Pasti Murah & Transparan Langsung di Makassar' }
      ]
    },
    verona: {
      title: 'Verona Marble Dining Suite',
      category: 'Set Meja Makan',
      image: 'assets/images/catalog-dining.jpg',
      alt: 'Verona Marble Dining Suite - ruvia Makassar',
      desc: 'Set meja makan modern bernuansa elegan untuk ruang makan keluarga. Pilihan top meja motif marmer mewah atau kayu dengan kursi empuk yang warna dan material pelapisnya bisa di-custom sesuai selera.',
      waText: 'Halo ruvia Makassar, saya ingin tanya harga dan opsi custom untuk Verona Dining Suite.',
      specs: [
        { label: 'Pilihan Top Meja', value: 'Motif Marmer Calacatta White / Black Marquina / Kayu' },
        { label: 'Formasi Kursi', value: 'Tersedia 4 Kursi, 6 Kursi, atau 8 Kursi' },
        { label: 'Custom Dudukan Kursi', value: 'Bebas Pilih Warna & Bahan Kursi (Kain/Kulit Sintetis)' },
        { label: 'Kapasitas & Daya Beban', value: 'Kuat & Teruji hingga 300+ kg' },
        { label: 'Perawatan', value: 'Permukaan Meja Mudah Dibersihkan & Tahan Noda' },
        { label: 'Jaminan Harga', value: 'Pasti Murah Dibanding Toko Mall' }
      ]
    },
    celeste: {
      title: 'Celeste Modern Bed Suite',
      category: 'Tempat Tidur',
      image: 'assets/images/catalog-bedroom.jpg',
      alt: 'Celeste Modern Bed Suite - ruvia Makassar',
      desc: 'Dipan tempat tidur modern dengan sandaran headboard empuk berlapis material berkualitas. Ukuran serta pilihan warna dan bahan headboard bisa disesuaikan dengan luas kamar tidur Anda.',
      waText: 'Halo ruvia Makassar, saya ingin tanya harga dan custom ukuran untuk Celeste Bed Suite.',
      specs: [
        { label: 'Pilihan Ukuran Matras', value: 'Queen (160×200), King (180×200), Super King (200×200), atau Custom' },
        { label: 'Custom Headboard', value: 'Bebas Pilih Warna & Material (Bouclé, Linen, Velvet, Kulit Sintetis)' },
        { label: 'Rangka Dipan', value: 'Struktur Penopang Solid, Anti Goyang & Anti Bunyi' },
        { label: 'Opsi Nakas', value: 'Bisa dipesan satu set dengan nakas samping senada' },
        { label: 'Garansi', value: 'Garansi Struktur Rangka' },
        { label: 'Jaminan Harga', value: 'Pasti Murah & Hemat Budget Hunian' }
      ]
    },
    elysian: {
      title: 'Elysian Fluted Credenza',
      category: 'Credenza & Lemari',
      image: 'assets/images/catalog-credenza.jpg',
      alt: 'Elysian Fluted Credenza - ruvia Makassar',
      desc: 'Credenza TV dan kabinet penyimpanan dengan aksen kisi estetik. Panjang meja dapat di-custom agar pas dengan dimensi dinding ruangan tamu atau kamar Anda.',
      waText: 'Halo ruvia Makassar, saya ingin tanya harga dan custom panjang untuk Elysian Credenza.',
      specs: [
        { label: 'Pilihan Custom Panjang', value: 'Bisa Request Panjang (160 cm, 180 cm, 200 cm, hingga 240 cm)' },
        { label: 'Pilihan Warna Finishing', value: 'Natural Oak, Dark Walnut, Warm Beige, atau Matte Black' },
        { label: 'Mekanisme Pintu', value: 'Sistem Pintu Soft-Close (Menutup Perlahan Tanpa Suara)' },
        { label: 'Fungsi Unit', value: 'Meja TV, Ruang Audio/Game Console, & Penyimpanan Serbaguna' },
        { label: 'Garansi', value: 'Garansi Rel & Engsel' },
        { label: 'Jaminan Harga', value: 'Pasti Murah & Finishing Rapi Maksimal' }
      ]
    }
  };

  // --- 2. Modular Component Loader (Navbar & Footer) ---
  let headerNavInitialized = false;
  let footerInitialized = false;

  function updateActiveNavLink() {
    const rawPath = window.location.pathname.toLowerCase();
    const currentFile = rawPath.substring(rawPath.lastIndexOf('/') + 1) || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    let matched = false;
    navLinks.forEach(link => {
      const href = link.getAttribute('href').toLowerCase();
      const linkFile = href.substring(href.lastIndexOf('/') + 1);

      const isHome = currentFile === '' || currentFile === 'index.html' || currentFile === 'index';
      const isLinkHome = linkFile === 'index.html' || linkFile === '' || linkFile === './';

      if (isHome && isLinkHome) {
        link.classList.add('active');
        matched = true;
      } else if (!isHome && linkFile && currentFile.includes(linkFile.replace('.html', ''))) {
        link.classList.add('active');
        matched = true;
      } else {
        link.classList.remove('active');
      }
    });

    if (!matched) {
      const defaultHome = document.querySelector('.nav-link[href="index.html"]');
      if (defaultHome && (currentFile === '' || currentFile === 'index.html')) {
        defaultHome.classList.add('active');
      }
    }
  }

  function initHeaderNav() {
    const header = document.getElementById('site-header');
    if (!header) return;

    if (!headerNavInitialized) {
      headerNavInitialized = true;
      window.addEventListener('scroll', () => {
        if (window.scrollY > 30) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      }, { passive: true });

      const menuToggle = document.getElementById('menu-toggle');
      const navMenu = document.getElementById('nav-menu');
      const navLinks = document.querySelectorAll('.nav-link');

      if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
          const isOpen = navMenu.classList.toggle('is-open');
          menuToggle.classList.toggle('is-active', isOpen);
          menuToggle.setAttribute('aria-expanded', isOpen);
        });

        navLinks.forEach(link => {
          link.addEventListener('click', () => {
            navMenu.classList.remove('is-open');
            menuToggle.classList.remove('is-active');
            menuToggle.setAttribute('aria-expanded', 'false');
          });
        });

        document.addEventListener('click', (e) => {
          if (!navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains('is-open')) {
            navMenu.classList.remove('is-open');
            menuToggle.classList.remove('is-active');
            menuToggle.setAttribute('aria-expanded', 'false');
          }
        });
      }
    }

    updateActiveNavLink();
    updateHeaderMemberBtn();
  }

  function updateHeaderMemberBtn() {
    const btn = document.getElementById('btn-header-member');
    if (!btn) return;
    try {
      const raw = sessionStorage.getItem('ruvia_member_session') || localStorage.getItem('ruvia_active_member');
      let mem = null;
      if (raw) mem = JSON.parse(raw);
      if (!mem) {
        const listRaw = localStorage.getItem('ruvia_members') || localStorage.getItem('ruvia_members_cache');
        if (listRaw) {
          const list = JSON.parse(listRaw);
          if (Array.isArray(list) && list.length > 0) mem = list[0];
        }
      }
      if (mem && mem.fullName) {
        const firstName = esc(mem.fullName.split(' ')[0]);
        btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg><span>Akun: ${firstName}</span>`;
        btn.href = 'login.html';
        btn.title = `Member Resmi: ${esc(mem.fullName)} (${esc(mem.id || 'Gold')})`;
      }
    } catch (e) {}
  }

  function initFooter() {
    const backToTopBtn = document.getElementById('btn-back-to-top');
    if (!backToTopBtn || footerInitialized) return;
    footerInitialized = true;

    backToTopBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Fallback templates jika dibuka secara statis/file:// tanpa web server
  const COMPONENT_NAVBAR_FALLBACK = `<header class="site-header" id="site-header">
  <div class="container nav-container">
    <a href="index.html" class="brand-logo" aria-label="ruvia Makassar">
      <img src="assets/images/ruvia-logo.png" alt="ruvia logo" class="brand-logo-img">
      <div class="brand-text-block">
        <span class="brand-name-text">ruvia</span>
        <span class="brand-sub-badge">Furniture Makassar</span>
      </div>
    </a>
    <nav class="nav-menu" id="nav-menu" aria-label="Navigasi Utama">
      <a href="index.html" class="nav-link">Beranda</a>
      <a href="promo.html" class="nav-link">Promo</a>
      <a href="keunggulan.html" class="nav-link">Keunggulan</a>
      <a href="katalog.html" class="nav-link">Katalog</a>
      <a href="layanan.html" class="nav-link">Layanan</a>
      <a href="lokasi.html" class="nav-link">Lokasi Toko</a>
      <a href="member.html" class="nav-link">Membership</a>
    </nav>
    <div class="nav-actions">
      <a href="login.html?tab=register" class="btn btn-primary" id="btn-header-member">
        Daftar Membership
      </a>
      <button type="button" class="menu-toggle" id="menu-toggle" aria-label="Buka Menu" aria-expanded="false" aria-controls="nav-menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
    </div>
  </div>
</header>`;

  const COMPONENT_FOOTER_FALLBACK = `<footer class="site-footer" id="kontak" aria-labelledby="footer-brand">
  <div class="container">
    <div class="footer-grid">
      <div>
        <a href="index.html" class="brand-logo" id="footer-brand">
          <img src="assets/images/ruvia-logo.png" alt="ruvia logo" class="brand-logo-img">
          <div class="brand-text-block">
            <span class="brand-name-text">ruvia</span>
            <span class="brand-sub-badge">Furniture Makassar</span>
          </div>
        </a>
        <p class="footer-brand-p">
          Pusat penjualan furnitur modern di Makassar. Menghadirkan kemudahan custom warna, ukuran pas ruangan, dan jaminan harga pasti murah.
        </p>
        <div class="social-links" aria-label="Media Sosial ruvia">
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" class="social-btn" aria-label="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
          </a>
          <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" class="social-btn" aria-label="Pinterest">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.1-2.1.1-3l1.5-6.3s-.4-.7-.4-1.8c0-1.7 1-3 2.2-3 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.4 0-2.8-2-4.8-4.9-4.8-3.4 0-5.3 2.5-5.3 5.1 0 1 .4 2.1.9 2.7.1.1.1.2.1.4l-.3 1.4c0 .2-.2.3-.4.2-1.4-.6-2.3-2.6-2.3-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.8 2.7 6.8 6.4 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.7c-.3 1-1 2.3-1.5 3.1A10 10 0 1 0 12 2z"></path></svg>
          </a>
          <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" class="social-btn" aria-label="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
          </a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Navigasi</div>
        <div class="footer-list">
          <a href="index.html">Beranda</a>
          <a href="promo.html">Katalog Promo</a>
          <a href="keunggulan.html">Keunggulan Custom</a>
          <a href="katalog.html">Katalog Produk</a>
          <a href="layanan.html">Layanan Pengiriman</a>
          <a href="lokasi.html">Lokasi Toko</a>
          <a href="member.html">Daftar Member</a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Kategori Furnitur</div>
        <div class="footer-list">
          <a href="katalog.html">Sofa & Ruang Tamu</a>
          <a href="katalog.html">Set Meja Makan</a>
          <a href="katalog.html">Tempat Tidur</a>
          <a href="katalog.html">Credenza & Lemari</a>
        </div>
      </div>

      <div>
        <div class="footer-col-title">Kontak & Lokasi</div>
        <div class="footer-contact-block">
          <div class="contact-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span>Jl. Gunung Latimojong No.78, Makassar</span>
          </div>
          <div class="contact-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>+62 811-4500-888</span>
          </div>
          <div class="contact-row">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            <span>halo@ruviafurniture.id</span>
          </div>
        </div>
      </div>
    </div>

    <div class="footer-bottom">
      <p>&copy; 2026 ruvia Furniture Makassar. Hak Cipta Dilindungi. &bull; <a href="admin/index.html" style="color: rgba(255,255,255,0.45); text-decoration: none; font-size: 0.8rem; transition: color 0.2s;" onmouseover="this.style.color='#f8c320'" onmouseout="this.style.color='rgba(255,255,255,0.45)'" title="Panel Pengelola Website">Portal Admin</a></p>
      <button type="button" class="btn-top" id="btn-back-to-top" aria-label="Kembali ke atas">
        <span>Kembali ke Atas</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg>
      </button>
    </div>
  </div>
</footer>`;

  // --- Fitur 1: Controller Animasi Scroll Halus (Smooth Scroll Reveal) ---
  function initScrollReveal() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale').forEach(el => {
        el.classList.add('reveal-active');
      });
      return;
    }

    const autoSelectors = [
      '.bento-item',
      '.service-card',
      '.catalog-card',
      '.catalog-item',
      '.promo-card',
      '.step-card',
      '.feature-box',
      '.member-perk-card',
      '.testimonial-card',
      '.about-narrative',
      '.location-overlap-card',
      '.services-header',
      '.catalog-header',
      '.about-header'
    ];

    autoSelectors.forEach(sel => {
      document.querySelectorAll(sel).forEach((el, i) => {
        if (!el.classList.contains('reveal') && !el.classList.contains('reveal-left') && !el.classList.contains('reveal-right')) {
          el.classList.add('reveal');
          if (i % 3 === 1) el.classList.add('reveal-delay-1');
          if (i % 3 === 2) el.classList.add('reveal-delay-2');
        }
      });
    });

    const items = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale');
    if (!items.length) return;

    if ('IntersectionObserver' in window) {
      const revealObserver = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            obs.unobserve(entry.target);
          }
        });
      }, {
        threshold: 0.08,
        rootMargin: '0px 0px -30px 0px'
      });

      items.forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top < window.innerHeight && r.bottom > 0) {
          el.classList.add('reveal-active');
        } else {
          revealObserver.observe(el);
        }
      });
    } else {
      items.forEach(el => el.classList.add('reveal-active'));
    }
  }

  async function loadComponents() {
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
      let loaded = false;
      if (window.location.protocol !== 'file:') {
        try {
          const res = await fetch('components/navbar.html');
          if (res.ok) {
            const html = await res.text();
            navbarPlaceholder.outerHTML = html;
            loaded = true;
          }
        } catch (err) {
          // ignore, will fallback
        }
      }
      if (!loaded) {
        navbarPlaceholder.outerHTML = COMPONENT_NAVBAR_FALLBACK;
      }
    }

    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (footerPlaceholder) {
      let loaded = false;
      if (window.location.protocol !== 'file:') {
        try {
          const res = await fetch('components/footer.html');
          if (res.ok) {
            const html = await res.text();
            footerPlaceholder.outerHTML = html;
            loaded = true;
          }
        } catch (err) {
          // ignore, will fallback
        }
      }
      if (!loaded) {
        footerPlaceholder.outerHTML = COMPONENT_FOOTER_FALLBACK;
      }
    }

    initHeaderNav();
    initFooter();
    initScrollReveal();
  }

  // Load components & initialize header/footer/reveal
  loadComponents();
  setTimeout(initScrollReveal, 300);

  // --- 4. Lookbook Filtering ---
  const tabButtons = document.querySelectorAll('.tab-btn, .filter-tab');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      const filter = btn.getAttribute('data-filter');
      const catalogCards = document.querySelectorAll('.catalog-card, .catalog-item');

      catalogCards.forEach(card => {
        const category = card.getAttribute('data-category');
        const isMatch = filter === 'all' || 
                        category === filter || 
                        ((filter === 'accent' || filter === 'storage') && (category === 'accent' || category === 'storage'));
        if (isMatch) {
          card.style.display = 'flex';
          card.style.animation = 'fadeInUp 0.4s ease forwards';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Support Query Param Filter (misal: katalog.html?filter=living)
  try {
    const urlParams = new URLSearchParams(window.location.search);
    const filterParam = urlParams.get('filter');
    if (filterParam) {
      const targetTab = document.querySelector(`.tab-btn[data-filter="${filterParam}"]`);
      if (targetTab) {
        targetTab.click();
      }
    }
  } catch (err) {
    // Ignore query param error
  }

  // --- 5. Modal Dialog Controller ---
  const reservationModal = document.getElementById('modal-reservation');
  const productModal = document.getElementById('modal-product');

  const btnOpenRsvpHeader = document.getElementById('btn-open-rsvp-header');
  const btnHeroRsvp = document.getElementById('btn-hero-rsvp');
  const btnOpenHowRsvp = document.getElementById('btn-open-how-rsvp');
  const btnCloseReservation = document.getElementById('btn-close-reservation');
  const btnCloseProduct = document.getElementById('btn-close-product');
  const btnModalReserveSwitch = document.getElementById('btn-modal-reserve-switch');

  const promoModal = document.getElementById('modal-promo');
  const btnClosePromo = document.getElementById('btn-close-promo');
  const btnReopenPromo = document.getElementById('btn-reopen-promo');
  const btnClaimPromo = document.getElementById('btn-claim-promo');

  function openModal(modal) {
    if (modal && typeof modal.showModal === 'function') {
      modal.showModal();
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal(modal) {
    if (modal && typeof modal.close === 'function') {
      modal.close();
      document.body.style.overflow = '';
    }
  }

  if (btnOpenRsvpHeader) {
    btnOpenRsvpHeader.addEventListener('click', () => openModal(reservationModal));
  }
  if (btnHeroRsvp) {
    btnHeroRsvp.addEventListener('click', () => openModal(reservationModal));
  }
  if (btnOpenHowRsvp) {
    btnOpenHowRsvp.addEventListener('click', () => openModal(reservationModal));
  }
  if (btnCloseReservation) {
    btnCloseReservation.addEventListener('click', () => closeModal(reservationModal));
  }
  if (btnCloseProduct) {
    btnCloseProduct.addEventListener('click', () => closeModal(productModal));
  }

  if (btnModalReserveSwitch) {
    btnModalReserveSwitch.addEventListener('click', () => {
      closeModal(productModal);
      setTimeout(() => openModal(reservationModal), 120);
    });
  }

  // Promo / Event Modal Controller
  if (promoModal) {
    // Tampilkan promo pop-up secara otomatis setelah 2.5 detik jika belum pernah ditutup di sesi ini
    try {
      const hasDismissedPromo = sessionStorage.getItem('ruvia_promo_dismissed');
      if (!hasDismissedPromo) {
        setTimeout(() => {
          if (!reservationModal?.open && !productModal?.open && window._ruviaPromoActive !== false) {
            openModal(promoModal);
          }
        }, 2200);
      }
    } catch (e) {
      // Fallback
      setTimeout(() => {
        if (window._ruviaPromoActive !== false) openModal(promoModal);
      }, 2200);
    }

    if (btnClosePromo) {
      btnClosePromo.addEventListener('click', () => {
        closeModal(promoModal);
        try { sessionStorage.setItem('ruvia_promo_dismissed', 'true'); } catch (e) {}
      });
    }

    if (btnClaimPromo) {
      btnClaimPromo.addEventListener('click', () => {
        try { sessionStorage.setItem('ruvia_promo_dismissed', 'true'); } catch (e) {}
        closeModal(promoModal);
      });
    }

    if (btnReopenPromo) {
      btnReopenPromo.addEventListener('click', () => {
        openModal(promoModal);
      });
    }
  }

  // --- Promo Slider Controls (Homepage Carousel) ---
  const sliderViewport = document.getElementById('promo-slider-viewport');
  const btnPromoPrev = document.getElementById('btn-promo-prev');
  const btnPromoNext = document.getElementById('btn-promo-next');

  if (sliderViewport && btnPromoPrev && btnPromoNext) {
    btnPromoPrev.addEventListener('click', () => {
      const card = sliderViewport.querySelector('.promo-slider-item');
      const step = card ? card.offsetWidth + 24 : 320;
      sliderViewport.scrollBy({ left: -step, behavior: 'smooth' });
    });

    btnPromoNext.addEventListener('click', () => {
      const card = sliderViewport.querySelector('.promo-slider-item');
      const step = card ? card.offsetWidth + 24 : 320;
      sliderViewport.scrollBy({ left: step, behavior: 'smooth' });
    });
  }

  // --- Interactive Hero Color Swatch Selector ---
  const swatchButtons = document.querySelectorAll('.swatch-dot');
  const swatchSelectedName = document.getElementById('swatch-selected-name');

  if (swatchButtons.length > 0 && swatchSelectedName) {
    swatchButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        swatchButtons.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        const colorName = btn.getAttribute('data-color-name');
        if (colorName) {
          swatchSelectedName.textContent = colorName;
        }
      });
    });
  }

  // Backdrop light dismiss
  [reservationModal, productModal, promoModal].forEach(modal => {
    if (modal) {
      modal.addEventListener('click', (e) => {
        const rect = modal.getBoundingClientRect();
        const isInDialog = (
          rect.top <= e.clientY &&
          e.clientY <= rect.top + rect.height &&
          rect.left <= e.clientX &&
          e.clientX <= rect.left + rect.width
        );
        if (!isInDialog) {
          closeModal(modal);
        }
      });

      modal.addEventListener('cancel', () => {
        document.body.style.overflow = '';
      });
    }
  });

  // --- 6. Lookbook Quick View Inspector ---
  const modalProdImg = document.getElementById('modal-prod-img');
  const modalProdCategory = document.getElementById('modal-prod-category');
  const modalProdTitle = document.getElementById('modal-prod-title');
  const modalProdDesc = document.getElementById('modal-prod-desc');
  const modalProdSpecs = document.getElementById('modal-prod-specs');
  const modalProdWaLink = document.getElementById('modal-prod-wa-link');

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-detail, .btn-curation-view');
    if (!btn) return;

    const productKey = btn.getAttribute('data-product');
    const item = lookbookData[productKey];

    if (item && productModal) {
      if (modalProdImg) {
        modalProdImg.src = normalizePublicImgUrl(item.image);
        modalProdImg.alt = item.alt || item.title;
        modalProdImg.onerror = () => { modalProdImg.src = 'assets/images/catalog-sofa.jpg'; };
      }
      if (modalProdCategory) modalProdCategory.textContent = item.category;
      if (modalProdTitle) modalProdTitle.textContent = item.title;
      if (modalProdDesc) modalProdDesc.textContent = item.desc;

      if (modalProdSpecs) {
        modalProdSpecs.innerHTML = (item.specs || []).map(spec => `
          <div class="spec-item">
            <strong>${esc(spec.label)}</strong>
            <span>${esc(spec.value)}</span>
          </div>
        `).join('');
      }

      if (modalProdWaLink) {
        const currentWaNumber = window.__ruviaStoreInfo?.whatsapp || '628114500888';
        const encodedWa = encodeURIComponent(item.waText || `Halo ruvia Makassar, saya ingin info produk ${item.title}.`);
        modalProdWaLink.href = `https://wa.me/${currentWaNumber}?text=${encodedWa}`;
      }

      openModal(productModal);
    }
  });

  // --- 7. WhatsApp Reservation Form ---
  const reservationForm = document.getElementById('reservation-form');
  if (reservationForm) {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    function formatLocalDate(d) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }

    const dateInput = document.getElementById('visit-date');
    if (dateInput) {
      dateInput.min = formatLocalDate(today);
      dateInput.value = formatLocalDate(tomorrow);
    }

    reservationForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const date = document.getElementById('visit-date').value;
      const type = document.getElementById('visit-type').value;
      const notes = document.getElementById('client-notes').value.trim();

      const message = 
`*KONSULTASI CUSTOM FURNITUR - RUVIA MAKASSAR*
━━━━━━━━━━━━━━━━━━━━━━━━━━
*Nama:* ${name}
*Nomor WhatsApp:* ${phone}
*Kategori Furnitur:* ${type}
*Rencana Kunjungan / Pembelian:* ${date}
${notes ? `*Request Custom (Warna/Ukuran):* ${notes}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━
Halo tim ruvia Makassar, saya ingin konsultasi pilihan warna, ukuran, dan mendapatkan penawaran harga terbaik. Terima kasih.`;

      const waUrl = `https://wa.me/628114500888?text=${encodeURIComponent(message)}`;
      window.open(waUrl, '_blank', 'noopener,noreferrer');

      closeModal(reservationModal);
      reservationForm.reset();
    });
  }

  // --- 8. Back to Top ---
  initFooter();

  // --- 9. Clean Subtle Scroll Reveal ---
  const revealElements = document.querySelectorAll(
    '.section-title, .section-desc, .about-frame-card, .feature-box, .how-card, .catalog-card, .service-card, .review-card, .boutique-container-card, .trust-item, .hero-showcase-card'
  );

  const observerOptions = {
    threshold: 0.12,
    rootMargin: '0px 0px -40px 0px'
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(16px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    revealObserver.observe(el);
  });

  // --- 10. Dynamic Backend Sync (Admin CMS Integration) ---
  function normalizePublicImgUrl(url) {
    if (!url || typeof url !== 'string') return 'assets/images/catalog-sofa.jpg';
    let clean = url.trim();
    if (/[<>"']/.test(clean)) return 'assets/images/catalog-sofa.jpg';
    if (clean.startsWith('../')) {
      clean = clean.replace(/^(\.\.\/)+/, '');
    }
    return clean || 'assets/images/catalog-sofa.jpg';
  }

  function renderSwatchesPreview(p) {
    const catKey = (p.categoryKey || '').toLowerCase();
    if (catKey === 'dining') {
      return `
        <div class="card-swatches-preview">
          <span class="swatch-label">Pilihan Meja:</span>
          <span class="mini-swatch" style="background-color: #f7f7f7; border: 1px solid #ccc;" title="Calacatta White"></span>
          <span class="mini-swatch" style="background-color: #222222;" title="Black Marquina"></span>
          <span class="mini-swatch" style="background-color: #8b5a2b;" title="Natural Wood"></span>
          <span class="mini-swatch-more">+Bahan Kursi Custom</span>
        </div>
      `;
    } else if (catKey === 'bedroom') {
      return `
        <div class="card-swatches-preview">
          <span class="swatch-label">Warna Headboard:</span>
          <span class="mini-swatch" style="background-color: #eae6df;" title="Warm Beige"></span>
          <span class="mini-swatch" style="background-color: #4a5568;" title="Slate Grey"></span>
          <span class="mini-swatch" style="background-color: #2b3a4a;" title="Dark Navy"></span>
          <span class="mini-swatch" style="background-color: #8c7853;" title="Taupe Brown"></span>
          <span class="mini-swatch-more">+Custom Ukuran</span>
        </div>
      `;
    } else if (catKey === 'storage' || catKey === 'accent') {
      return `
        <div class="card-swatches-preview">
          <span class="swatch-label">Pilihan Finishing:</span>
          <span class="mini-swatch" style="background-color: #d2b48c;" title="Natural Oak"></span>
          <span class="mini-swatch" style="background-color: #5c4033;" title="Dark Walnut"></span>
          <span class="mini-swatch" style="background-color: #fdfbf7;" title="Off-White"></span>
          <span class="mini-swatch" style="background-color: #1a1a1a;" title="Matte Black"></span>
          <span class="mini-swatch-more">+Custom Panjang</span>
        </div>
      `;
    } else {
      return `
        <div class="card-swatches-preview">
          <span class="swatch-label">Pilihan Warna:</span>
          <span class="mini-swatch" style="background-color: #f3ede2;" title="Cream Bouclé"></span>
          <span class="mini-swatch" style="background-color: #1e1fab;" title="Cobalt Navy"></span>
          <span class="mini-swatch" style="background-color: #f8c320;" title="Mustard Gold"></span>
          <span class="mini-swatch" style="background-color: #c85a32;" title="Terracotta"></span>
          <span class="mini-swatch" style="background-color: #2b593f;" title="Emerald Green"></span>
          <span class="mini-swatch-more">+100 warna</span>
        </div>
      `;
    }
  }

  function renderProductChips(p) {
    if (Array.isArray(p.specs) && p.specs.length > 0) {
      return p.specs.slice(0, 3).map(s => `<span class="material-chip">${esc(s.value || s.label)}</span>`).join('');
    }
    return `
      <span class="material-chip">Bisa Custom Warna & Bahan</span>
      <span class="material-chip">Bisa Custom Ukuran</span>
      <span class="material-chip">Busa Empuk Bergaransi</span>
    `;
  }

  function renderCatalogCard(p, waNumber) {
    const catKey = (p.categoryKey || 'living').toLowerCase();
    const filterCat = (catKey === 'storage') ? 'accent' : catKey;
    const safeImg = normalizePublicImgUrl(p.image);
    const safeTitle = esc(p.title || 'Produk ruvia');
    const safeCat = esc(p.category || 'Furnitur Modern');
    const safeBadge = esc(p.badge || 'Pasti Murah');
    const safeDesc = esc(p.desc || '');
    const prodId = esc(p.id || ('prod_' + Math.random().toString(36).substr(2, 6)));
    const waText = p.waText || `Halo ruvia Makassar, saya tertarik tanya harga dan custom ${p.title || 'produk ini'}.`;
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`;

    return `
      <article class="catalog-card" data-category="${filterCat}" id="item-${prodId}">
        <div class="card-img-wrap">
          <span class="card-category-tag">${safeCat}</span>
          <span class="card-price-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
            <span>${safeBadge}</span>
          </span>
          <img src="${safeImg}" alt="${safeTitle} ruvia Makassar" loading="lazy" decoding="async" onerror="this.src='assets/images/catalog-sofa.jpg'">
        </div>
        <div class="card-body">
          ${renderSwatchesPreview(p)}
          <h3 class="card-title">${safeTitle}</h3>
          <div class="card-material-list">
            ${renderProductChips(p)}
          </div>
          <p class="card-desc">
            ${safeDesc}
          </p>
          <div class="card-footer">
            <button type="button" class="btn-detail" data-product="${prodId}">
              <span>Lihat Opsi Custom</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
            <a href="${waUrl}" target="_blank" rel="noopener noreferrer" class="btn-wa-inquire">
              <span>Tanya Harga WA</span>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
            </a>
          </div>
        </div>
      </article>
    `;
  }

  function applyDynamicData(data) {
    if (!data) return;

    // 1. Hero Content
    if (data.hero) {
      const h = data.hero;
      const badgeEl = document.getElementById('hero-badge-text');
      if (badgeEl && h.badge) badgeEl.textContent = h.badge;

      const pfxEl = document.getElementById('hero-title-prefix');
      if (pfxEl && h.headlinePrefix) pfxEl.textContent = h.headlinePrefix;

      const hlEl = document.getElementById('hero-title-highlight');
      if (hlEl && h.headlineHighlight) hlEl.textContent = h.headlineHighlight;

      const sfxEl = document.getElementById('hero-title-suffix');
      if (sfxEl && h.headlineSuffix) sfxEl.textContent = h.headlineSuffix;

      const subEl = document.getElementById('hero-subtext-el');
      if (subEl && h.subtext) {
        subEl.textContent = '';
        const strong = document.createElement('strong');
        strong.textContent = 'ruvia';
        subEl.appendChild(strong);
        const remainder = ' ' + h.subtext.replace(/^ruvia\s*/i, '');
        subEl.appendChild(document.createTextNode(remainder));
      }

      if (Array.isArray(h.pills)) {
        h.pills.forEach((p, idx) => {
          const titleEl = document.getElementById(`pill-title-${idx}`);
          const descEl = document.getElementById(`pill-desc-${idx}`);
          if (titleEl && p.title) titleEl.textContent = p.title;
          if (descEl && p.desc) descEl.textContent = p.desc;
        });
      }
    }

    // 2. Promo Pop-up Content
    if (data.promo) {
      const p = data.promo;
      if (p.active === false) {
        window._ruviaPromoActive = false;
        if (btnReopenPromo) btnReopenPromo.style.display = 'none';
      }

      const pTitle = document.getElementById('modal-promo-title');
      if (pTitle && (p.titlePrefix || p.titleHighlight)) {
        pTitle.textContent = '';
        if (p.titlePrefix) {
          pTitle.appendChild(document.createTextNode(p.titlePrefix));
        }
        if (p.titleHighlight) {
          const span = document.createElement('span');
          span.className = 'brand-yellow-highlight';
          span.textContent = p.titleHighlight;
          pTitle.appendChild(span);
        }
      }

      const pDesc = document.querySelector('.promo-desc');
      if (pDesc && p.desc) pDesc.textContent = p.desc;

      const pUrgency = document.querySelector('.promo-urgency-box span');
      if (pUrgency && p.urgency) pUrgency.textContent = p.urgency;

      const pBadgeNum = document.querySelector('.promo-discount-num');
      if (pBadgeNum && p.visualDiscountNum) pBadgeNum.textContent = p.visualDiscountNum;

      const pBadgeTag = document.querySelector('.promo-badge-tag');
      if (pBadgeTag && p.visualBadgeTag) pBadgeTag.textContent = p.visualBadgeTag;

      const pClaimBtn = document.getElementById('btn-claim-promo');
      const waNumber = data.storeInfo?.whatsapp || '628114500888';
      if (pClaimBtn && p.waText) {
        pClaimBtn.href = `https://wa.me/${waNumber}?text=${encodeURIComponent(p.waText)}`;
      }
    }

    // 3. Lookbook Products sync (Data + DOM di katalog.html)
    if (Array.isArray(data.products) && data.products.length > 0) {
      data.products.forEach(p => {
        if (p.id) {
          lookbookData[p.id] = {
            title: p.title,
            category: p.category,
            image: normalizePublicImgUrl(p.image),
            alt: (p.title || 'Produk') + ' - ruvia Makassar',
            desc: p.desc,
            waText: p.waText || `Halo ruvia Makassar, saya ingin tanya harga untuk ${p.title}.`,
            specs: p.specs || [
              { label: "Gaya Desain", value: "Minimalis Kekinian" },
              { label: "Bahan & Warna", value: "100+ Varian Pilihan" },
              { label: "Garansi", value: "Garansi Rangka & Busa" }
            ]
          };
        }
      });

      const catalogGrid = document.getElementById('catalog-grid');
      if (catalogGrid) {
        const waNumber = data.storeInfo?.whatsapp || '628114500888';
        catalogGrid.innerHTML = data.products.map(p => renderCatalogCard(p, waNumber)).join('');

        // Terapkan filter tab yang sedang aktif jika ada
        const activeTab = document.querySelector('.catalog-tabs .tab-btn.active');
        if (activeTab) {
          const filter = activeTab.getAttribute('data-filter');
          if (filter && filter !== 'all') {
            catalogGrid.querySelectorAll('.catalog-card').forEach(card => {
              const cat = card.getAttribute('data-category');
              const match = filter === 'all' || cat === filter || ((filter === 'accent' || filter === 'storage') && (cat === 'accent' || cat === 'storage'));
              card.style.display = match ? 'flex' : 'none';
            });
          }
        }
      }
    }

    // 4. Update WhatsApp links if number changed in admin
    if (data.storeInfo?.whatsapp) {
      window.__ruviaStoreInfo = data.storeInfo;
      if (data.storeInfo.whatsapp !== '628114500888') {
        const waNum = data.storeInfo.whatsapp;
        document.querySelectorAll('a[href*="wa.me/"]').forEach(a => {
          a.href = a.href.replace(/wa\.me\/\d+/, `wa.me/${waNum}`);
        });
      }
    }
  }

  async function syncBackendData() {
    let remoteData = null;
    try {
      const res = await fetch('/api/data');
      if (res.ok) {
        remoteData = await res.json();
      }
    } catch (e) {
      // offline / file protocol fallback
    }

    if (!remoteData) {
      try {
        const cached = localStorage.getItem('ruvia_site_data');
        if (cached) remoteData = JSON.parse(cached);
      } catch (e) {}
    }

    if (remoteData) {
      applyDynamicData(remoteData);
      setTimeout(initScrollReveal, 150);
    }
  }

  syncBackendData();
});

