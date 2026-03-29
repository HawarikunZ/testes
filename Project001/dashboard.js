// ═══════════════════════════════════════════════════════════
//  dashboard.js — CihuySelek Admin Panel
// ═══════════════════════════════════════════════════════════

// ── CONFIG — GANTI sesuai kebutuhan ───────────────────────
const ADMIN_USER = "admin";
const ADMIN_PASS = "gibrut112233";
const GAS_URL =
  "https://script.google.com/macros/s/AKfycbzP4skmtdFzNXXAQx531frh7Zq5K6uM75Fwtf8m0C2ct4SObdJVjoOcRGNanJv1GHWM/exec"; // sama dengan app.js

// ── STATE ─────────────────────────────────────────────────
let products = [];
let testimonials = [];
let banners = [];
let confirmCallback = null;
let editingProductId = null;
let editingTestiId = null;
let editingBannerId = null;

// ═══════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════
function doLogin() {
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value;
  const err = document.getElementById("loginError");
  const btn = document.getElementById("loginBtn");

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("cs_admin", "1");
    err.classList.add("hidden");
    btn.innerHTML = '<span class="spinner"></span>';
    setTimeout(() => showDashboard(), 600);
  } else {
    err.classList.remove("hidden");
    document.getElementById("loginPass").value = "";
  }
}

function doLogout() {
  sessionStorage.removeItem("cs_admin");
  location.reload();
}

function togglePass() {
  const inp = document.getElementById("loginPass");
  const icon = document.getElementById("eyeIcon");
  if (inp.type === "password") {
    inp.type = "text";
    icon.className = "fas fa-eye-slash";
  } else {
    inp.type = "password";
    icon.className = "fas fa-eye";
  }
}

// Enter key login
document.getElementById("loginPass").addEventListener("keydown", (e) => {
  if (e.key === "Enter") doLogin();
});

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════
async function showDashboard() {
  document.getElementById("loginOverlay").classList.add("hidden");
  document.getElementById("dashboardWrap").classList.remove("hidden");
  await loadAll();
}

async function loadAll() {
  try {
    const [rawP, rawT, rawB] = await Promise.all([
      apiGet("getProducts"),
      apiGet("getTestimoni"),
      apiGet("getBanner"),
    ]);
    products = rawP.map((p) => ({
      ...p,
      id: Number(p.id),
      stok: Number(p.stok),
    }));
    testimonials = rawT.map((t) => ({
      ...t,
      id: Number(t.id),
      rating: Number(t.rating),
    }));
    banners = rawB.map((b) => ({ ...b, id: Number(b.id) }));
    renderOverview();
    renderProductTable();
    renderTestiTable();
    renderBannerTable();
  } catch (e) {
    toast("Gagal memuat data: " + e.message, "error");
  }
}

// Auto-login jika session masih ada
if (sessionStorage.getItem("cs_admin") === "1") showDashboard();

// ═══════════════════════════════════════════════════════════
//  API
// ═══════════════════════════════════════════════════════════
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

// ═══════════════════════════════════════════════════════════
//  NAVIGATION
// ═══════════════════════════════════════════════════════════
const tabTitles = {
  overview: "OVERVIEW",
  products: "PRODUK",
  banner: "BANNER",
  testimoni: "TESTIMONI",
};

function switchTab(name) {
  document
    .querySelectorAll(".tab-panel")
    .forEach((el) => el.classList.remove("active"));
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));
  document.getElementById("tab-" + name).classList.add("active");
  document.getElementById("nav-" + name).classList.add("active");
  document.getElementById("topbar-title").textContent = tabTitles[name];
  closeSidebar();
}

function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("sidebarOverlay").classList.remove("hidden");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("sidebarOverlay").classList.add("hidden");
}

// ═══════════════════════════════════════════════════════════
//  OVERVIEW
// ═══════════════════════════════════════════════════════════
function renderOverview() {
  document.getElementById("stat-total").textContent = products.length;
  document.getElementById("stat-habis").textContent = products.filter(
    (p) => p.stok === 0,
  ).length;
  document.getElementById("stat-testi").textContent = testimonials.length;

  const avgRating = testimonials.length
    ? (
        testimonials.reduce((s, t) => s + t.rating, 0) / testimonials.length
      ).toFixed(1)
    : "–";
  document.getElementById("stat-rating").textContent =
    avgRating + (testimonials.length ? "★" : "");

  const lowStock = products
    .filter((p) => p.stok >= 0 && p.stok <= 3)
    .sort((a, b) => a.stok - b.stok);
  const el = document.getElementById("low-stock-list");
  if (lowStock.length === 0) {
    el.innerHTML = `<p class="text-sm text-gray-400 font-bold text-center py-4">Semua stok aman ✅</p>`;
    return;
  }
  el.innerHTML = lowStock
    .map(
      (p) => `
    <div class="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
      <div class="flex items-center gap-3">
        <img src="${Array.isArray(p.images) ? p.images[0] : p.images}" class="w-10 h-10 rounded-lg object-cover bg-indigo-50"
          onerror="this.src='https://placehold.co/40x40/f0eeff/5b4eff?text=?'"/>
        <div>
          <p class="font-black text-xs uppercase">${p.nama}</p>
          <p class="text-[10px] text-gray-400 font-bold">${p.cat}</p>
        </div>
      </div>
      <span class="badge ${p.stok === 0 ? "badge-out" : "badge-ok"}">${p.stok === 0 ? "HABIS" : p.stok + " unit"}</span>
    </div>`,
    )
    .join("");
}

// ═══════════════════════════════════════════════════════════
//  PRODUK TABLE
// ═══════════════════════════════════════════════════════════
function renderProductTable() {
  const tbody = document.getElementById("product-tbody");
  if (products.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center py-10 text-gray-400 font-bold text-sm">Belum ada produk</td></tr>`;
    return;
  }
  tbody.innerHTML = products
    .map((p) => {
      const imgSrc = Array.isArray(p.images)
        ? p.images[0]
        : typeof p.images === "string"
          ? p.images.split(",")[0].trim()
          : "";
      const stokBadge =
        p.stok === 0
          ? `<span class="badge badge-out">HABIS</span>`
          : `<span class="badge badge-ok">${p.stok}</span>`;
      const badge =
        p.badge === "sale"
          ? `<span class="badge badge-sale-sm">SALE</span>`
          : `<span class="badge badge-new-sm">NEW</span>`;

      return `
      <tr>
        <td><img src="${imgSrc}" class="w-10 h-10 rounded-xl object-cover bg-indigo-50"
          onerror="this.src='https://placehold.co/40x40/f0eeff/5b4eff?text=?'"/></td>
        <td>
          <p class="font-black text-xs uppercase">${p.nama}</p>
          <p class="text-[10px] text-gray-400 font-bold md:hidden">${p.cat} · ${p.harga}</p>
        </td>
        <td class="hidden md:table-cell text-xs font-bold text-gray-500">${p.cat}</td>
        <td class="hidden sm:table-cell text-xs font-bold">
          <span style="color:var(--accent)">${p.harga}</span>
          <span class="text-gray-400 line-through ml-1 text-[10px]">${p.hargacoret}</span>
        </td>
        <td class="hidden sm:table-cell">${stokBadge}</td>
        <td class="hidden md:table-cell">${badge}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-edit" onclick="openProductModal(${p.id})"><i class="fas fa-pencil"></i></button>
            <button class="btn-danger" onclick="askDeleteProduct(${p.id}, '${p.nama.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

// ═══════════════════════════════════════════════════════════
//  BANNER TABLE & CRUD
// ═══════════════════════════════════════════════════════════
function renderBannerTable() {
  const tbody = document.getElementById("banner-tbody");
  if (banners.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 font-bold text-sm">Belum ada banner</td></tr>`;
    return;
  }
  tbody.innerHTML = banners
    .map(
      (b) => `
    <tr>
      <td><img src="${b.gambar}" class="w-20 h-10 rounded-lg object-cover bg-indigo-50"
        onerror="this.src='https://placehold.co/80x40/f0eeff/5b4eff?text=?'"/></td>
      <td><p class="font-black text-xs uppercase">${b.judul}</p></td>
      <td class="hidden md:table-cell text-xs text-gray-500">${b.subjudul || "-"}</td>
      <td class="hidden md:table-cell"><span class="badge badge-ok">${b.posisi || "kiri"}</span></td>
      <td class="text-right">
        <div class="flex items-center justify-end gap-1.5">
          <button class="btn-edit" onclick="openBannerModal(${b.id})"><i class="fas fa-pencil"></i></button>
          <button class="btn-danger" onclick="askDeleteBanner(${b.id}, '${b.judul.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`,
    )
    .join("");
}

function openBannerModal(id = null) {
  editingBannerId = id;
  document.getElementById("bannerModalTitle").textContent = id
    ? "EDIT BANNER"
    : "TAMBAH BANNER";
  document.getElementById("bannerModal").classList.add("open");
  ["b-id", "b-judul", "b-subjudul", "b-gambar"].forEach(
    (el) => (document.getElementById(el).value = ""),
  );
  document.getElementById("b-posisi").value = "kiri";
  document.getElementById("b-preview").classList.add("hidden");

  if (id !== null) {
    const b = banners.find((x) => x.id === id);
    if (!b) return;
    document.getElementById("b-id").value = b.id;
    document.getElementById("b-judul").value = b.judul;
    document.getElementById("b-subjudul").value = b.subjudul || "";
    document.getElementById("b-gambar").value = b.gambar;
    document.getElementById("b-posisi").value = b.posisi || "kiri";
    updateBannerPreview();
  }
}

function closeBannerModal() {
  document.getElementById("bannerModal").classList.remove("open");
  editingBannerId = null;
}

function updateBannerPreview() {
  const gambar = document.getElementById("b-gambar").value.trim();
  const judul = document.getElementById("b-judul").value.trim();
  const subjudul = document.getElementById("b-subjudul").value.trim();
  const preview = document.getElementById("b-preview");
  if (gambar) {
    document.getElementById("b-preview-img").src = gambar;
    document.getElementById("b-preview-judul").textContent = judul;
    document.getElementById("b-preview-sub").textContent = subjudul;
    preview.classList.remove("hidden");
  }
}

// Live preview saat ketik
["b-gambar", "b-judul", "b-subjudul"].forEach((id) => {
  document.getElementById(id)?.addEventListener("input", updateBannerPreview);
});

async function saveBanner() {
  const judul = document.getElementById("b-judul").value.trim();
  const gambar = document.getElementById("b-gambar").value.trim();
  if (!judul || !gambar) {
    toast("Judul dan gambar wajib diisi!", "error");
    return;
  }

  const data = {
    id: document.getElementById("b-id").value || null,
    judul,
    subjudul: document.getElementById("b-subjudul").value.trim(),
    gambar,
    posisi: document.getElementById("b-posisi").value,
  };

  const btn = document.getElementById("saveBannerBtn");
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    if (editingBannerId) {
      await apiPost({ action: "updateBanner", data });
      toast("Banner diperbarui! ✅", "success");
    } else {
      await apiPost({ action: "addBanner", data });
      toast("Banner ditambahkan! ✅", "success");
    }
    closeBannerModal();
    await loadAll();
  } catch (e) {
    toast("Gagal menyimpan: " + e.message, "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan';
    btn.disabled = false;
  }
}

function askDeleteBanner(id, judul) {
  document.getElementById("confirmMsg").textContent =
    `Banner "${judul}" akan dihapus permanen.`;
  document.getElementById("confirmModal").classList.add("open");
  confirmCallback = async () => {
    try {
      await apiPost({ action: "deleteBanner", id });
      toast("Banner dihapus! 🗑️", "success");
      await loadAll();
    } catch (e) {
      toast("Gagal menghapus: " + e.message, "error");
    }
  };
}

document.getElementById("bannerModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("bannerModal")) closeBannerModal();
});

// ═══════════════════════════════════════════════════════════
//  TESTIMONI TABLE
// ═══════════════════════════════════════════════════════════
function renderTestiTable() {
  const tbody = document.getElementById("testi-tbody");
  if (testimonials.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="text-center py-10 text-gray-400 font-bold text-sm">Belum ada testimoni</td></tr>`;
    return;
  }
  tbody.innerHTML = testimonials
    .map((t) => {
      const stars = "★".repeat(t.rating) + "☆".repeat(5 - t.rating);
      return `
      <tr>
        <td>
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0" style="background:var(--accent)">${t.nama.charAt(0)}</div>
            <p class="font-black text-xs uppercase">${t.nama}</p>
          </div>
        </td>
        <td class="hidden sm:table-cell text-xs text-gray-500 max-w-xs">
          <p class="line-clamp-2">"${t.pesan}"</p>
        </td>
        <td class="hidden md:table-cell text-yellow-500 text-sm font-bold">${stars}</td>
        <td class="hidden md:table-cell text-xs text-gray-400 font-bold">${t.tgl}</td>
        <td class="text-right">
          <div class="flex items-center justify-end gap-1.5">
            <button class="btn-edit" onclick="openTestiModal(${t.id})"><i class="fas fa-pencil"></i></button>
            <button class="btn-danger" onclick="askDeleteTesti(${t.id}, '${t.nama.replace(/'/g, "\\'")}')"><i class="fas fa-trash"></i></button>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

// ═══════════════════════════════════════════════════════════
//  PRODUK MODAL
// ═══════════════════════════════════════════════════════════
function openProductModal(id = null) {
  editingProductId = id;
  const isEdit = id !== null;
  document.getElementById("productModalTitle").textContent = isEdit
    ? "EDIT PRODUK"
    : "TAMBAH PRODUK";
  document.getElementById("productModal").classList.add("open");

  // Reset form
  [
    "p-id",
    "p-nama",
    "p-harga",
    "p-hargacoret",
    "p-stok",
    "p-deskripsi",
    "p-images",
    "p-kondisi",
    "p-garansi",
    "p-pengiriman",
  ].forEach((el) => {
    document.getElementById(el).value = "";
  });
  document.getElementById("p-cat").value = "";
  document.getElementById("p-badge").value = "sale";
  document.getElementById("img-preview").classList.remove("show");
  document.getElementById("p-image-file").value = "";

  if (isEdit) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    document.getElementById("p-id").value = p.id;
    document.getElementById("p-nama").value = p.nama;
    document.getElementById("p-cat").value = p.cat;
    document.getElementById("p-harga").value = p.harga;
    document.getElementById("p-hargacoret").value = p.hargacoret;
    document.getElementById("p-stok").value = p.stok;
    document.getElementById("p-badge").value = p.badge;
    document.getElementById("p-deskripsi").value = p.deskripsi;
    document.getElementById("p-kondisi").value = p.kondisi || "";
    document.getElementById("p-garansi").value = p.garansi || "";
    document.getElementById("p-pengiriman").value = p.pengiriman || "";
    const imgVal = Array.isArray(p.images) ? p.images.join(", ") : p.images;
    document.getElementById("p-images").value = imgVal;
    // Preview existing image
    const firstImg = Array.isArray(p.images) ? p.images[0] : p.images;
    if (firstImg) {
      document.getElementById("img-preview-img").src = firstImg;
      document.getElementById("img-preview").classList.add("show");
    }
  }
}

function closeProductModal() {
  document.getElementById("productModal").classList.remove("open");
  editingProductId = null;
}

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    document.getElementById("img-preview-img").src = e.target.result;
    document.getElementById("img-preview").classList.add("show");
    // Isi URL field dengan nama file sebagai hint
    document.getElementById("p-images").value = file.name;
  };
  reader.readAsDataURL(file);
}

async function saveProduct() {
  const nama = document.getElementById("p-nama").value.trim();
  const cat = document.getElementById("p-cat").value;
  const harga = document.getElementById("p-harga").value.trim();
  const stok = document.getElementById("p-stok").value;
  const images =
    document.getElementById("p-images").value.trim() || "gambar1.jpg";

  if (!nama || !cat || !harga || stok === "") {
    toast("Lengkapi field yang wajib diisi!", "error");
    return;
  }

  const data = {
    id: document.getElementById("p-id").value || null,
    nama,
    cat,
    harga,
    hargacoret: document.getElementById("p-hargacoret").value.trim(),
    stok: Number(stok),
    badge: document.getElementById("p-badge").value,
    deskripsi: document.getElementById("p-deskripsi").value.trim(),
    kondisi: document.getElementById("p-kondisi").value.trim(),
    garansi: document.getElementById("p-garansi").value.trim(),
    pengiriman: document.getElementById("p-pengiriman").value.trim(),
    images,
  };

  const btn = document.getElementById("saveProductBtn");
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    if (editingProductId) {
      await apiPost({ action: "updateProduct", data });
      toast("Produk berhasil diperbarui! ✅", "success");
    } else {
      await apiPost({ action: "addProduct", data });
      toast("Produk berhasil ditambahkan! ✅", "success");
    }
    closeProductModal();
    await loadAll();
  } catch (e) {
    toast("Gagal menyimpan: " + e.message, "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan';
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════
//  TESTIMONI MODAL
// ═══════════════════════════════════════════════════════════
function openTestiModal(id = null) {
  editingTestiId = id;
  document.getElementById("testiModalTitle").textContent = id
    ? "EDIT TESTIMONI"
    : "TAMBAH TESTIMONI";
  document.getElementById("testiModal").classList.add("open");

  ["t-id", "t-nama", "t-pesan", "t-tgl"].forEach(
    (el) => (document.getElementById(el).value = ""),
  );
  document.getElementById("t-rating").value = "5";

  if (id !== null) {
    const t = testimonials.find((x) => x.id === id);
    if (!t) return;
    document.getElementById("t-id").value = t.id;
    document.getElementById("t-nama").value = t.nama;
    document.getElementById("t-rating").value = t.rating;
    document.getElementById("t-pesan").value = t.pesan;
    document.getElementById("t-tgl").value = t.tgl;
  }
}

function closeTestiModal() {
  document.getElementById("testiModal").classList.remove("open");
  editingTestiId = null;
}

async function saveTestimoni() {
  const nama = document.getElementById("t-nama").value.trim();
  const pesan = document.getElementById("t-pesan").value.trim();

  if (!nama || !pesan) {
    toast("Nama dan pesan wajib diisi!", "error");
    return;
  }

  const data = {
    id: document.getElementById("t-id").value || null,
    nama,
    rating: Number(document.getElementById("t-rating").value),
    pesan,
    tgl: document.getElementById("t-tgl").value.trim() || "Baru saja",
  };

  const btn = document.getElementById("saveTestiBtn");
  btn.innerHTML = '<span class="spinner"></span>';
  btn.disabled = true;

  try {
    if (editingTestiId) {
      await apiPost({ action: "updateTestimoni", data });
      toast("Testimoni berhasil diperbarui! ✅", "success");
    } else {
      await apiPost({ action: "addTestimoni", data });
      toast("Testimoni berhasil ditambahkan! ✅", "success");
    }
    closeTestiModal();
    await loadAll();
  } catch (e) {
    toast("Gagal menyimpan: " + e.message, "error");
  } finally {
    btn.innerHTML = '<i class="fas fa-save"></i> Simpan';
    btn.disabled = false;
  }
}

// ═══════════════════════════════════════════════════════════
//  DELETE CONFIRM
// ═══════════════════════════════════════════════════════════
function askDeleteProduct(id, nama) {
  document.getElementById("confirmMsg").textContent =
    `Produk "${nama}" akan dihapus permanen.`;
  document.getElementById("confirmModal").classList.add("open");
  confirmCallback = async () => {
    try {
      await apiPost({ action: "deleteProduct", id });
      toast("Produk dihapus! 🗑️", "success");
      await loadAll();
    } catch (e) {
      toast("Gagal menghapus: " + e.message, "error");
    }
  };
}

function askDeleteTesti(id, nama) {
  document.getElementById("confirmMsg").textContent =
    `Testimoni dari "${nama}" akan dihapus permanen.`;
  document.getElementById("confirmModal").classList.add("open");
  confirmCallback = async () => {
    try {
      await apiPost({ action: "deleteTestimoni", id });
      toast("Testimoni dihapus! 🗑️", "success");
      await loadAll();
    } catch (e) {
      toast("Gagal menghapus: " + e.message, "error");
    }
  };
}

async function confirmAction() {
  const btn = document.getElementById("confirmBtn");
  btn.innerHTML =
    '<span class="spinner" style="border-color:rgba(255,255,255,0.3);border-top-color:white;"></span>';
  btn.disabled = true;
  if (confirmCallback) await confirmCallback();
  closeConfirm();
  btn.innerHTML = '<i class="fas fa-trash mr-1"></i> Hapus';
  btn.disabled = false;
}

function closeConfirm() {
  document.getElementById("confirmModal").classList.remove("open");
  confirmCallback = null;
}

// Close modal on overlay click
document.getElementById("productModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("productModal")) closeProductModal();
});
document.getElementById("testiModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("testiModal")) closeTestiModal();
});
document.getElementById("confirmModal").addEventListener("click", (e) => {
  if (e.target === document.getElementById("confirmModal")) closeConfirm();
});

// ═══════════════════════════════════════════════════════════
//  TOAST
// ═══════════════════════════════════════════════════════════
function toast(msg, type = "default") {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.className = `show ${type}`;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.className = "";
  }, 3000);
}
