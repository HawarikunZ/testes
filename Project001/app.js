// ═══════════════════════════════════════════════════════════
//  app.js — CihuySelek
//  Digunakan oleh: index.html & product-description.html
// ═══════════════════════════════════════════════════════════

// ── GANTI dengan URL Apps Script kamu setelah deploy ──────
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzP4skmtdFzNXXAQx531frh7Zq5K6uM75Fwtf8m0C2ct4SObdJVjoOcRGNanJv1GHWM/exec";

// ─── CURSOR (desktop only) ────────────────────────────────
if (window.matchMedia("(pointer: fine)").matches) {
  const cursor = document.getElementById("cursor");
  const ring = document.getElementById("cursor-ring");
  let mouseX = 0,
    mouseY = 0,
    ringX = 0,
    ringY = 0;

  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    cursor.style.left = mouseX + "px";
    cursor.style.top = mouseY + "px";
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    requestAnimationFrame(animateRing);
  }
  animateRing();

  document.querySelectorAll("a, button, [onclick]").forEach((el) => {
    el.addEventListener("mouseenter", () => {
      cursor.style.transform = "translate(-50%,-50%) scale(2.5)";
      cursor.style.background = "#ff4e8b";
      ring.style.opacity = "0";
    });
    el.addEventListener("mouseleave", () => {
      cursor.style.transform = "translate(-50%,-50%) scale(1)";
      cursor.style.background = "var(--accent)";
      ring.style.opacity = "0.5";
    });
  });
}

// ─── API HELPER ───────────────────────────────────────────
async function apiGet(action) {
  const res = await fetch(`${GAS_URL}?action=${action}`);
  const json = await res.json();
  if (json.status !== "ok") throw new Error(json.message);
  return json.data;
}

async function apiPost(body) {
  const res = await fetch(GAS_URL, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (json.status !== "ok") throw new Error(json.message);
  return json.data;
}

// ─── TOAST (shared) ───────────────────────────────────────
function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 2500);
}

// ─── PAGE DETECTION ───────────────────────────────────────
const isIndexPage = !!document.getElementById("product-grid");
const isProductPage = !!document.getElementById("slider-inner");

if (isIndexPage) initIndexPage();
if (isProductPage) initProductPage();

// ─── NORMALIZE produk dari Sheets ─────────────────────────
function normalizeProducts(raw) {
  return raw.map((p) => ({
    ...p,
    id: Number(p.id),
    stok: Number(p.stok),
    images:
      typeof p.images === "string"
        ? p.images.split(",").map((s) => s.trim())
        : [String(p.images)],
  }));
}

// ═══════════════════════════════════════════════════════════
//  INDEX PAGE
// ═══════════════════════════════════════════════════════════
async function initIndexPage() {
  const categories = ["ALL", "HandPhone", "Laptop", "Kamera", "Tablet"];
  showSkeletons();

  let products = [],
    banners = [];
  try {
    [products, banners] = await Promise.all([
      apiGet("getProducts").then(normalizeProducts),
      apiGet("getBanner"),
    ]);
  } catch (e) {
    showGridError("Gagal memuat produk. Periksa konfigurasi API.");
    return;
  }

  // ── Render Banner dari Sheets ──────────────────────────
  const bannerWrap = document.getElementById("banner-wrap");
  const dotsContainer = document.getElementById("bannerDots");
  const progressBar = document.getElementById("bannerProgress");
  let cur = 0;

  if (banners.length > 0) {
    bannerWrap.innerHTML = "";
    banners.forEach((b, i) => {
      const posClass =
        b.posisi === "kanan" ? "items-end text-right" : "items-start text-left";
      bannerWrap.innerHTML += `
        <div class="banner-slide ${i === 0 ? "active" : ""}">
          <img src="${b.gambar}" class="w-full h-full object-cover" style="opacity:0.45;"
            onerror="this.src='https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&h=600&fit=crop'"/>
          <div class="absolute inset-0 flex flex-col justify-end ${posClass} px-5 md:px-16 pb-6 md:pb-14 text-white">
            <div class="flex items-center gap-2 mb-1 md:mb-2 ${b.posisi === "kanan" ? "justify-end" : ""}">
              <span class="w-6 h-0.5" style="background:var(--accent2)"></span>
              <span class="text-[9px] md:text-xs font-black uppercase tracking-[0.25em]" style="color:rgba(255,255,255,0.75)">Featured</span>
            </div>
            <h2 class="font-display text-4xl md:text-8xl leading-none mb-1 md:mb-3">${b.judul}</h2>
            <p class="text-[9px] md:text-sm font-bold uppercase tracking-widest" style="color:rgba(255,255,255,0.6)">${b.subjudul}</p>
          </div>
        </div>`;
    });
    // Tambahkan progress bar & gradient overlay kembali
    bannerWrap.innerHTML += `
      <div class="banner-progress" id="bannerProgress"></div>
      <div class="absolute bottom-3 md:bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10" id="bannerDots"></div>
      <div class="absolute inset-0 pointer-events-none" style="background:linear-gradient(to top,rgba(13,13,20,0.85) 0%,transparent 60%)"></div>`;
  }

  // Re-query setelah render ulang
  const slides = document.querySelectorAll(".banner-slide");
  const dotsEl = document.getElementById("bannerDots");
  const progressEl = document.getElementById("bannerProgress");

  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = `w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? "bg-white w-6" : "bg-white/40"}`;
    dot.onclick = () => goToSlide(i);
    dotsEl.appendChild(dot);
  });

  function goToSlide(n) {
    slides[cur].classList.remove("active");
    dotsEl.children[cur].className =
      "w-2 h-2 rounded-full transition-all duration-300 bg-white/40";
    cur = n;
    slides[cur].classList.add("active");
    dotsEl.children[cur].className =
      "w-6 h-2 rounded-full transition-all duration-300 bg-white";
    progressEl.style.animation = "none";
    progressEl.offsetHeight;
    progressEl.style.animation = "";
  }

  setInterval(() => goToSlide((cur + 1) % slides.length), 5000);

  // ── Render ─────────────────────────────────────────────
  function renderProducts(data) {
    const grid = document.getElementById("product-grid");
    const empty = document.getElementById("empty-state");
    const count = document.getElementById("product-count");

    grid.innerHTML = "";
    count.textContent = data.length + " unit";

    if (data.length === 0) {
      empty.classList.remove("hidden");
      return;
    }
    empty.classList.add("hidden");

    data.forEach((p, i) => {
      const soldOut = p.stok === 0;
      const badgeHTML =
        p.badge === "sale"
          ? `<span class="badge-sale">SALE</span>`
          : `<span class="badge-new">NEW</span>`;

      const stokHTML = soldOut
        ? `<div class="absolute inset-0 flex items-center justify-center" style="background:rgba(0,0,0,0.25);backdrop-filter:blur(3px)">
             <span class="bg-white text-gray-900 px-3 py-1.5 rounded-full font-black text-[9px] uppercase tracking-wider shadow-lg">STOK HABIS</span>
           </div>`
        : `<div class="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full">
             <span class="stok-dot w-1.5 h-1.5 rounded-full bg-green-400 block"></span>
             <span class="text-white text-[9px] font-black uppercase">${p.stok} Unit</span>
           </div>`;

      grid.innerHTML += `
        <div onclick="location.href='product-description.html?id=${p.id}'"
          class="product-card ${soldOut ? "sold-out-card" : ""} flex flex-col h-full relative"
          style="animation-delay:${i * 80}ms">
          <div class="img-wrap aspect-[4/5]">
            <img src="${p.images[0]}" class="w-full h-full object-cover"
              onerror="this.src='https://placehold.co/400x500/f0eeff/5b4eff?text=${encodeURIComponent(p.nama)}'"/>
            <div class="absolute top-3 left-3 flex gap-1.5">${badgeHTML}</div>
            ${stokHTML}
          </div>
          <div class="p-3 md:p-4 flex flex-col flex-grow">
            <span class="text-[9px] font-black uppercase tracking-widest mb-1" style="color:var(--accent)">${p.cat}</span>
            <h3 class="font-bold text-[11px] md:text-sm uppercase leading-tight mb-auto line-clamp-2">${p.nama}</h3>
            <div class="mt-3">
              <p class="text-[9px] text-gray-400 line-through font-bold">${p.hargacoret}</p>
              <p class="font-black text-sm md:text-base" style="color:var(--accent)">${p.harga}</p>
            </div>
          </div>
        </div>`;
    });
  }

  function showSkeletons() {
    const grid = document.getElementById("product-grid");
    if (!grid) return;
    grid.innerHTML = Array(6)
      .fill(
        `
      <div class="bg-white rounded-[1.75rem] overflow-hidden border border-gray-100 animate-pulse">
        <div class="aspect-[4/5] bg-gray-100"></div>
        <div class="p-4 space-y-2">
          <div class="h-2 bg-gray-100 rounded w-1/3"></div>
          <div class="h-3 bg-gray-100 rounded w-3/4"></div>
          <div class="h-4 bg-gray-100 rounded w-1/2"></div>
        </div>
      </div>`,
      )
      .join("");
  }

  function showGridError(msg) {
    document.getElementById("product-grid").innerHTML =
      `<div class="col-span-full py-16 text-center">
        <div class="text-4xl mb-3">⚠️</div>
        <p class="font-black text-gray-400 uppercase text-sm tracking-widest">${msg}</p>
      </div>`;
  }

  // ── Kategori ───────────────────────────────────────────
  const catContainer = document.getElementById("category-list");
  categories.forEach((c, i) => {
    const btn = document.createElement("button");
    btn.textContent = c;
    btn.className = "cat-btn" + (i === 0 ? " active" : "");
    btn.onclick = () => {
      document
        .querySelectorAll(".cat-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProducts(
        c === "ALL" ? products : products.filter((p) => p.cat === c),
      );
    };
    catContainer.appendChild(btn);
  });

  // ── Search ─────────────────────────────────────────────
  document.getElementById("searchInput").addEventListener("input", function () {
    const key = this.value.toLowerCase().trim();
    document
      .querySelectorAll(".cat-btn")
      .forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".cat-btn")[0].classList.add("active");
    renderProducts(
      key
        ? products.filter(
            (p) =>
              p.nama.toLowerCase().includes(key) ||
              p.cat.toLowerCase().includes(key),
          )
        : products,
    );
  });

  renderProducts(products);
}

// ═══════════════════════════════════════════════════════════
//  PRODUCT PAGE
// ═══════════════════════════════════════════════════════════
async function initProductPage() {
  const pId = new URLSearchParams(window.location.search).get("id");
  let products = [],
    testimonials = [];

  try {
    const [rawP, rawT] = await Promise.all([
      apiGet("getProducts"),
      apiGet("getTestimoni"),
    ]);
    products = normalizeProducts(rawP);
    testimonials = rawT.map((t) => ({ ...t, rating: Number(t.rating) }));
  } catch (e) {
    console.error("Gagal fetch data:", e);
  }

  const p = products.find((item) => item.id == pId);
  let currentIdx = 0;

  if (!p) {
    document.body.innerHTML = `
      <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;">
        <div style="font-size:4rem;margin-bottom:1.5rem;">😵</div>
        <h2 style="font-family:'Bebas Neue',sans-serif;letter-spacing:0.06em;font-size:2.5rem;color:#1a1a2e;margin-bottom:0.75rem;">PRODUK TIDAK DITEMUKAN!</h2>
        <p style="color:#6b7280;margin-bottom:2rem;">ID produk yang kamu cari tidak tersedia.</p>
        <a href="index.html" style="background:#5b4eff;color:white;padding:1rem 2rem;border-radius:1rem;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;font-size:0.875rem;text-decoration:none;">← Kembali ke Katalog</a>
      </div>`;
    return;
  }

  document.title = p.nama + " – CIHUYSELEK";
  document.getElementById("breadcrumb-cat").textContent = p.cat;
  document.getElementById("breadcrumb-nama").textContent = p.nama;
  document.getElementById("p-nama").textContent = p.nama;
  document.getElementById("p-cat").textContent = p.cat;
  document.getElementById("p-harga").textContent = p.harga;
  document.getElementById("p-harga-coret").textContent = p.hargacoret;
  document.getElementById("p-deskripsi").textContent = p.deskripsi;

  // Kondisi, garansi, pengiriman — pakai nilai dari Sheets atau fallback default
  document.getElementById("p-kondisi").textContent =
    p.kondisi || "Second Mulus";
  document.getElementById("p-garansi").textContent =
    p.garansi || "Garansi Toko 7 Hari";
  document.getElementById("p-pengiriman").textContent =
    p.pengiriman || "Aman + Bubble Wrap";

  const hargaNum = parseInt(String(p.harga).replace(/\D/g, ""));
  const coretNum = parseInt(String(p.hargacoret).replace(/\D/g, ""));
  if (coretNum > hargaNum) {
    const pct = Math.round((1 - hargaNum / coretNum) * 100);
    document.getElementById("p-diskon").textContent =
      `Hemat ${pct}% dari harga normal!`;
  }

  document.getElementById("stok-val").textContent =
    p.stok === 0 ? "HABIS" : p.stok + " unit tersisa";
  document.getElementById("p-stok-badge").innerHTML =
    p.stok === 0
      ? `<span class="stok-badge-out"><i class="fas fa-times-circle"></i> Stok Habis</span>`
      : `<span class="stok-badge-available"><span class="pulse-dot w-2 h-2 rounded-full bg-green-500 block"></span> ${p.stok} Unit Tersedia</span>`;

  if (p.stok === 0) {
    document.getElementById("soldout-overlay").classList.remove("hidden");
    ["wa-btn", "sticky-wa-btn"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.innerHTML = `<i class="fas fa-exclamation-triangle"></i> STOK HABIS`;
      el.className = el.className.replace("btn-wa", "btn-disabled");
    });
  }

  const sliderInner = document.getElementById("slider-inner");
  const thumbStrip = document.getElementById("thumb-strip");
  const dots = document.getElementById("dots-container");

  p.images.forEach((img, i) => {
    sliderInner.innerHTML += `<img src="${img}" style="width:100%;height:100%;object-fit:cover;flex-shrink:0;"
      onerror="this.src='https://placehold.co/600x600/eae8ff/5b4eff?text=${encodeURIComponent(p.nama)}'"/>`;
    thumbStrip.innerHTML += `<div onclick="goToSlide(${i})" class="gallery-thumb w-16 h-16 flex-shrink-0 ${i === 0 ? "active" : ""}">
      <img src="${img}" class="w-full h-full object-cover" onerror="this.src='https://placehold.co/64x64/eae8ff/5b4eff?text=${i + 1}'"/>
    </div>`;
    if (p.images.length > 1) {
      dots.innerHTML += `<div class="w-2 h-2 rounded-full transition-all duration-300 ${i === 0 ? "bg-indigo-600 w-6" : "bg-gray-300"}"></div>`;
    }
  });

  updateSlide();

  function updateSlide() {
    document.getElementById("slider-inner").style.transform =
      `translateX(-${currentIdx * 100}%)`;
    document.querySelectorAll("#dots-container div").forEach((d, i) => {
      d.className = `rounded-full transition-all duration-300 h-2 ${i === currentIdx ? "bg-indigo-600 w-6" : "bg-gray-300 w-2"}`;
    });
    document
      .querySelectorAll(".gallery-thumb")
      .forEach((t, i) => t.classList.toggle("active", i === currentIdx));
  }

  window.goToSlide = (n) => {
    currentIdx = n;
    updateSlide();
  };
  window.nextSlide = () => {
    if (p.images.length > 1) {
      currentIdx = (currentIdx + 1) % p.images.length;
      updateSlide();
    }
  };
  window.prevSlide = () => {
    if (p.images.length > 1) {
      currentIdx = (currentIdx - 1 + p.images.length) % p.images.length;
      updateSlide();
    }
  };

  const sliderEl = document.getElementById("image-slider");
  let touchStart = 0;
  sliderEl.addEventListener(
    "touchstart",
    (e) => {
      touchStart = e.touches[0].clientX;
    },
    { passive: true },
  );
  sliderEl.addEventListener("touchend", (e) => {
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? window.nextSlide() : window.prevSlide();
  });

  window.checkStokAndChat = () => {
    if (p.stok === 0) {
      document.getElementById("soldOutModal").classList.remove("hidden");
      document.getElementById("soldOutModal").classList.add("flex");
      document.body.style.overflow = "hidden";
    } else {
      const msg = `Halo admin Sultan Store! 👋\n\nSaya tertarik dengan:\n*${p.nama}*\nHarga: ${p.harga}\n\nApakah stok masih tersedia? Terima kasih!`;
      window.open(
        `https://wa.me/6281333998839?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
    }
  };

  window.closeModal = () => {
    document.getElementById("soldOutModal").classList.replace("flex", "hidden");
    document.body.style.overflow = "auto";
    if (p.stok === 0) window.location.href = "index.html";
  };

  window.shareProduct = () => {
    if (navigator.share) {
      navigator.share({
        title: p.nama,
        text: `Cek ${p.nama} di Sultan Store!`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => showToast("🔗 Link disalin!"));
    }
  };

  const stickyCta = document.getElementById("sticky-cta");
  window.addEventListener("scroll", () =>
    stickyCta.classList.toggle("visible", window.scrollY > 400),
  );

  // Testimoni dari Sheets
  const c = document.getElementById("testi-container");
  const colors = ["#5b4eff", "#ff4e8b", "#00c6a2"];
  [...testimonials]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3)
    .forEach((t, i) => {
      const stars =
        '<i class="fas fa-star text-yellow-400 text-xs"></i>'.repeat(t.rating) +
        '<i class="fas fa-star text-gray-200 text-xs"></i>'.repeat(
          5 - t.rating,
        );
      c.innerHTML += `
      <div class="testi-card" style="animation-delay:${i * 120}ms">
        <div class="flex gap-1 mb-3">${stars}</div>
        <p class="text-gray-600 text-sm leading-relaxed mb-5 italic">"${t.pesan}"</p>
        <div class="flex items-center gap-3 mt-auto">
          <div class="w-10 h-10 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
               style="background:${colors[i % 3]}">${t.nama.charAt(0)}</div>
          <div>
            <div class="font-black text-xs uppercase text-gray-900">${t.nama}</div>
            <div class="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">${t.tgl}</div>
          </div>
        </div>
      </div>`;
    });
}
