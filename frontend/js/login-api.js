const API_AUTH = "../backend/auth/";
let allOrders = [];
let currentUserId = null;

const authModal = document.getElementById("authModalOverlay");
const authWrapper = document.getElementById("authWrapper");

/* HELPER KEY WISHLIST PER AKUN */
function getWishlistStorageKey() {
    return currentUserId ? `yukido_wishlist_${currentUserId}` : null;
}

/* BUKA & TUTUP MODAL LOGIN / DAFTAR */
function openAuthModal(mode = "login") {
    hideMsgs();
    if (mode === "register") {
        authWrapper.classList.add("active");
    } else {
        authWrapper.classList.remove("active");
    }
    authModal.classList.add("show");
}

function closeAuthModal() {
    authModal.classList.remove("show");
}

if (authModal) {
    authModal.addEventListener("click", (e) => {
        if (e.target === authModal) closeAuthModal();
    });
}

const signUpLink = document.querySelector(".SignUpLink");
if (signUpLink) {
    signUpLink.addEventListener("click", () => {
        authWrapper.classList.add("active");
        hideMsgs();
    });
}

const signInLink = document.querySelector(".SignInLink");
if (signInLink) {
    signInLink.addEventListener("click", () => {
        authWrapper.classList.remove("active");
        hideMsgs();
    });
}

/* TOGGLE PASSWORD & NOTIFIKASI */
function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector("i");
    if (input.type === "password") {
        input.type = "text";
        icon.classList.replace("fa-eye", "fa-eye-slash");
    } else {
        input.type = "password";
        icon.classList.replace("fa-eye-slash", "fa-eye");
    }
}

function showMsg(boxId, text, type = "success") {
    const box = document.getElementById(boxId);
    box.style.display = "block";
    box.className = "auth-msg-box " + (type === "success" ? "msg-ok" : "msg-err");
    box.textContent = text;
}

function hideMsgs() {
    ["loginMessage", "registerMessage"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.style.display = "none";
            el.textContent = "";
        }
    });
}

/* PROSES LOGIN */
const loginForm = document.getElementById("loginForm");
if (loginForm) {
    loginForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        hideMsgs();

        const btn = document.getElementById("loginButton");
        const identifier = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...';

        try {
            const res = await fetch(API_AUTH + "login.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({ email: identifier, password: password })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || "Login gagal.");

            if (result.user && result.user.role === "admin") {
                window.location.href = "../backend/admin/dashboard.php";
                return;
            }

            showMsg("loginMessage", "Login berhasil!", "success");
            setTimeout(() => {
                closeAuthModal();
                loadUserSession();
            }, 500);

        } catch (err) {
            showMsg("loginMessage", err.message || "Gagal terhubung ke server.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "MASUK SEKARANG";
        }
    });
}

/* PROSES REGISTER */
const registerForm = document.getElementById("registerForm");
if (registerForm) {
    registerForm.addEventListener("submit", async function(e) {
        e.preventDefault();
        hideMsgs();

        const btn = document.getElementById("registerButton");
        const fullName = document.getElementById("regName").value.trim();
        const email = document.getElementById("regEmail").value.trim();
        const phone = document.getElementById("regPhone").value.trim();
        const password = document.getElementById("regPassword").value;

        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENDAFTARKAN...';

        try {
            const res = await fetch(API_AUTH + "register.php", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "same-origin",
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    phone: phone,
                    password: password
                })
            });

            const result = await res.json();
            if (!res.ok || !result.success) throw new Error(result.message || "Registrasi gagal.");

            this.reset();
            authWrapper.classList.remove("active");
            document.getElementById("loginEmail").value = email;
            showMsg("loginMessage", "Registrasi berhasil! Silakan masuk dengan akun baru Anda.", "success");

        } catch (err) {
            showMsg("registerMessage", err.message || "Gagal terhubung ke server.", "error");
        } finally {
            btn.disabled = false;
            btn.textContent = "DAFTAR SEKARANG";
        }
    });
}

/* TAB PESANAN & WISHLIST */
document.querySelectorAll(".akun-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelectorAll(".akun-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".akun-tab-body").forEach(body => body.classList.remove("active"));

        btn.classList.add("active");
        document.getElementById(btn.getAttribute("data-target")).classList.add("active");
    });
});

/* CEK SESI LOGIN USER */
async function loadUserSession() {
    try {
        const res = await fetch(API_AUTH + "me.php", { credentials: "same-origin" });
        const data = await res.json();

        if (data.logged_in && data.user) {
            currentUserId = data.user.id;
            localStorage.setItem("yukido_active_user_id", String(currentUserId));

            // Bersihkan key lama yang tidak terikat akun
            localStorage.removeItem("yukido_wishlist");

            document.getElementById("bannerTitle").innerHTML =
                `Halo, ${data.user.full_name} <span style="color:#e50914; font-size:13px;">(Member Resmi YUKIDO)</span>`;
            document.getElementById("bannerDesc").textContent =
                `Email terdaftar: ${data.user.email} • Pantau status pengiriman pesanan dan klaim garansi resmi Anda di bawah ini.`;
            document.getElementById("bannerActions").innerHTML = `
                <button type="button" class="btn-akun-outline" onclick="logoutAkun()">
                    <i class="fas fa-sign-out-alt"></i> Keluar
                </button>
            `;
            loadUserOrders();
            loadWishlist();
        } else {
            currentUserId = null;
            localStorage.removeItem("yukido_active_user_id");
            localStorage.removeItem("yukido_wishlist");
            loadWishlist();
        }
    } catch (e) {
        console.warn("Gagal memeriksa sesi user:", e);
        currentUserId = null;
        loadWishlist();
    }
}

/* AMBIL PESANAN DARI DATABASE */
async function loadUserOrders() {
    try {
        const res = await fetch("../backend/orders/index.php", { credentials: "same-origin" });
        const result = await res.json();

        const list = Array.isArray(result)
            ? result
            : (result.orders || result.data || []);

        if (Array.isArray(list)) {
            allOrders = list;
            renderOrders(allOrders);
        }
    } catch (e) {
        console.warn("Gagal memuat pesanan:", e);
    }
}

function renderOrders(orders) {
    const container = document.getElementById("ordersContainer");
    document.getElementById("orderTotalCount").textContent = orders.length;

    if (!orders.length) {
        container.innerHTML = `
            <div class="akun-empty-state">
                <i class="fas fa-box-open"></i>
                <h5>Tidak ada pesanan</h5>
                <p>Silakan buat pesanan untuk melihat riwayat transaksi Anda di sini.</p>
                <a href="produk.html" class="btn-akun-solid" style="display:inline-block;">Jelajahi Katalog Produk</a>
            </div>
        `;
        return;
    }

    const statusLabels = {
        pending_payment: "Menunggu Pembayaran",
        pending: "Menunggu Pembayaran",
        paid: "Sudah Dibayar",
        processing: "Sedang Diproses",
        shipped: "Dikirim",
        completed: "Selesai",
        cancelled: "Dibatalkan"
    };

    container.innerHTML = `<div class="order-list-grid">` + orders.map(order => {
        const rawStatus = (order.order_status || order.status || "pending_payment").toLowerCase();
        let badgeClass = "badge-pending";
        if (["paid", "completed", "selesai", "shipped", "processing", "dikirim", "diproses"].includes(rawStatus)) {
            badgeClass = "badge-paid";
        }
        if (["cancelled", "batal", "dibatalkan"].includes(rawStatus)) {
            badgeClass = "badge-cancelled";
        }

        const statusText = statusLabels[rawStatus] || rawStatus;
        const total = Number(
            order.grand_total || order.total_amount || order.total_price || order.total || 0
        ).toLocaleString("id-ID");
        const code = order.order_number || order.order_code || ("#YKD-" + order.id);

        return `
            <div class="order-item-card">
                <div class="order-item-meta">
                    <span class="order-code">${code}</span>
                    <span class="order-date">${order.created_at || order.order_date || ""}</span>
                    <span class="order-badge ${badgeClass}">${statusText}</span>
                </div>
                <div class="order-item-right">
                    <span class="order-total-price">Rp ${total}</span>
                    <a href="detail-pesanan.html?id=${order.id}" class="btn-akun-outline" style="padding:8px 16px; font-size:12.5px;">
                        Detail
                    </a>
                </div>
            </div>
        `;
    }).join("") + `</div>`;
}

const filterOrderStatus = document.getElementById("filterOrderStatus");
if (filterOrderStatus) {
    filterOrderStatus.addEventListener("change", (e) => {
        const val = e.target.value;
        if (val === "all") {
            renderOrders(allOrders);
        } else {
            const filtered = allOrders.filter(o => (o.order_status || o.status || "").toLowerCase() === val);
            renderOrders(filtered);
        }
    });
}

/* WISHLIST PER AKUN */
function loadWishlist() {
    const key = getWishlistStorageKey();
    let wishlist = [];

    if (key) {
        try {
            wishlist = JSON.parse(localStorage.getItem(key) || "[]");
        } catch {
            wishlist = [];
        }
    }

    const tabCount = document.getElementById("wishlistCountTab");
    const headerCount = document.getElementById("wishlistCountHeader");
    if (tabCount) tabCount.textContent = wishlist.length;
    if (headerCount) headerCount.textContent = wishlist.length;

    const container = document.getElementById("wishlistContainer");
    if (!container) return;

    if (!key) {
        container.innerHTML = `
            <div class="akun-empty-state">
                <i class="far fa-heart"></i>
                <h5>Silakan login untuk melihat Wishlist</h5>
                <p>Masuk ke akun YUKIDO Anda untuk menyimpan dan melihat perkakas favorit.</p>
                <button type="button" class="btn-akun-solid" onclick="openAuthModal('login')">Login Sekarang</button>
            </div>
        `;
        return;
    }

    if (!wishlist.length) {
        container.innerHTML = `
            <div class="akun-empty-state">
                <i class="far fa-heart"></i>
                <h5>Wishlist masih kosong</h5>
                <p>Simpan perkakas favorit Anda dari katalog untuk dibeli nanti.</p>
                <a href="produk.html" class="btn-akun-solid" style="display:inline-block;">Lihat Semua Produk</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `<div class="wishlist-grid">` + wishlist.map((item, idx) => `
        <div class="wish-card">
            <img src="${item.image || "images/yukido.png"}" alt="${item.name}">
            <div>
                <h6>${item.name}</h6>
                <div class="wish-price">Rp ${Number(item.price || 0).toLocaleString("id-ID")}</div>
            </div>
            <div class="wish-actions">
                <a href="produk.html" class="btn-akun-solid">Lihat</a>
                <button type="button" class="btn-akun-outline btn-remove-wish" data-index="${idx}">Hapus</button>
            </div>
        </div>
    `).join("") + `</div>`;

    container.querySelectorAll(".btn-remove-wish").forEach(btn => {
        btn.addEventListener("click", function () {
            const idx = parseInt(this.getAttribute("data-index"), 10);
            window.removeWishlist(idx);
        });
    });
}

window.removeWishlist = function (index) {
    const key = getWishlistStorageKey();
    if (!key) return;

    let wishlist = [];
    try {
        wishlist = JSON.parse(localStorage.getItem(key) || "[]");
    } catch {
        wishlist = [];
    }
    if (!isNaN(index) && index >= 0 && index < wishlist.length) {
        wishlist.splice(index, 1);
        localStorage.setItem(key, JSON.stringify(wishlist));
    }
    loadWishlist();
};

async function logoutAkun() {
    await fetch(API_AUTH + "logout.php", { credentials: "same-origin" });
    currentUserId = null;
    localStorage.removeItem("yukido_active_user_id");
    localStorage.removeItem("yukido_wishlist");
    window.location.reload();
}

document.addEventListener("DOMContentLoaded", () => {
    loadUserSession();
});