const CART_API = "../backend/cart";

let cartItems = [];
let selectedItems = new Set();
let voucherApplied = false;
const VOUCHER_DISCOUNT = 50000;

function cartRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function cartEscape(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function cartImage(path) {
    if (!path) return "images/yukido.png";
    if (/^https?:\/\//i.test(path)) return path;

    path = String(path).replace(/\\/g, "/").trim();

    // Hapus awalan "./", "/", atau "frontend/" karena halaman sudah berada di dalam folder frontend/
    path = path.replace(/^\.?\//, "").replace(/^frontend\//i, "");

    if (path.startsWith("uploads/") || path.startsWith("images/")) {
        return path;
    }

    return "uploads/products/" + path;
}

async function cartRequest(endpoint, data = null) {
    const options = {
        method: data ? "POST" : "GET",
        credentials: "same-origin",
        headers: {}
    };

    if (data) {
        options.headers["Content-Type"] = "application/json";
        options.body = JSON.stringify(data);
    }

    const response = await fetch(`${CART_API}/${endpoint}.php`, options);
    const result = await response.json();

    if (!response.ok || !result.success) {
        const err = new Error(result.message || "Permintaan keranjang gagal.");
        err.status = response.status;
        throw err;
    }

    return result;
}

async function loadCart() {
    const container = document.querySelector(".shopee-store-group");
    if (!container) return;

    container.innerHTML = `
        <div style="padding: 40px; text-align: center; color: #9ca3af;">
            <i class="fas fa-spinner fa-spin" style="font-size: 24px; color: #e50914; margin-bottom: 10px;"></i>
            <p>Memuat keranjang...</p>
        </div>
    `;

    try {
        const result = await cartRequest("index");
        cartItems = result.data || [];

        selectedItems = new Set(
            cartItems.map(item => Number(item.cart_item_id))
        );

        renderCart();
    } catch (error) {
        console.error("Gagal memuat keranjang:", error);
        if (error.status === 401) {
            container.innerHTML = `
                <div style="padding: 45px 20px; text-align: center;">
                    <i class="fas fa-lock" style="font-size: 34px; color: #e50914; margin-bottom: 12px;"></i>
                    <h3 style="color: #fff; margin-bottom: 6px;">Silakan Login Terlebih Dahulu</h3>
                    <p style="color: #9ca3af; margin-bottom: 18px;">Masuk ke akun YUKIDO Anda untuk melihat isi keranjang belanja.</p>
                    <a href="login.html" class="btn-shopee-checkout" style="display: inline-block; text-decoration: none;">Login Sekarang</a>
                </div>
            `;
        } else {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: #ef4444;">
                    <p>${cartEscape(error.message)}</p>
                </div>
            `;
        }
        updateCartSummary();
    }
}

function renderCart() {
    const container = document.querySelector(".shopee-store-group");
    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div style="padding: 45px 20px; text-align: center;">
                <i class="fas fa-shopping-cart" style="font-size: 42px; color: #4b5563; margin-bottom: 12px;"></i>
                <h3 style="color: #fff; margin-bottom: 6px;">Keranjang masih kosong</h3>
                <p style="color: #9ca3af; margin-bottom: 18px;">Silakan pilih produk yang ingin dibeli.</p>
                <a href="produk.html" class="btn-shopee-checkout" style="display: inline-block; text-decoration: none;">Belanja Sekarang</a>
            </div>
        `;
        updateCartSummary();
        return;
    }

    container.innerHTML = `
        <div class="store-group-header">
            <input type="checkbox" id="selectStore"
                ${selectedItems.size === cartItems.length ? "checked" : ""}>
            <span class="mall-tag">OFFICIAL</span>
            <strong>PT. Yukido Power Teknik</strong>
            <span class="free-ship-note">
                <i class="fas fa-truck"></i> Gratis Ongkir s/d Rp 50.000
            </span>
        </div>

        ${cartItems.map(item => {
            const id = Number(item.cart_item_id);
            const price = Number(item.price);
            const qty = Number(item.quantity);
            const checked = selectedItems.has(id);
            const imgSrc = cartImage(item.image_path || item.image || item.product_image);

            return `
                <div class="shopee-cart-item"
                     data-id="${id}"
                     data-price="${price}">
                    <div class="col-check">
                        <input type="checkbox" class="item-check"
                            ${checked ? "checked" : ""}>
                    </div>

                    <div class="col-product">
                        <img src="${cartEscape(imgSrc)}"
                             alt="${cartEscape(item.name)}"
                             onerror="this.onerror=null;this.src='images/yukido.png';">
                        <div class="prod-meta">
                            <h3>${cartEscape(item.name)}</h3>
                            <span class="prod-variant">
                                SKU: ${cartEscape(item.sku || "-")}
                            </span>
                            <span class="prod-warranty">
                                <i class="fas fa-shield-alt"></i>
                                ${item.warranty_type === "lifetime"
                                    ? "Garansi Seumur Hidup"
                                    : item.warranty_type === "limited"
                                        ? `Garansi ${Number(item.warranty_period_months)} Bulan`
                                        : "Tanpa Garansi"}
                            </span>
                            <small style="color: #9ca3af;">Stok: ${Number(item.stock)}</small>
                        </div>
                    </div>

                    <div class="col-price">${cartRupiah(price)}</div>

                    <div class="col-qty">
                        <div class="shopee-qty-box">
                            <button type="button"
                                class="shopee-qty-btn minus">-</button>
                            <input type="number" min="1"
                                max="${Number(item.stock)}"
                                value="${qty}"
                                class="shopee-qty-input">
                            <button type="button"
                                class="shopee-qty-btn plus">+</button>
                        </div>
                    </div>

                    <div class="col-total item-row-total">
                        ${cartRupiah(price * qty)}
                    </div>

                    <div class="col-action">
                        <button type="button" class="btn-del-item">
                            Hapus
                        </button>
                    </div>
                </div>
            `;
        }).join("")}
    `;

    updateCartSummary();
}

function updateCartSummary() {
    const selected = cartItems.filter(item =>
        selectedItems.has(Number(item.cart_item_id))
    );

    const subtotal = selected.reduce((sum, item) =>
        sum + Number(item.price) * Number(item.quantity), 0
    );

    const discount = (voucherApplied && subtotal > VOUCHER_DISCOUNT) ? VOUCHER_DISCOUNT : 0;
    const total = Math.max(0, subtotal - discount);

    const count = selected.reduce((sum, item) =>
        sum + Number(item.quantity), 0
    );

    const allChecked = cartItems.length > 0 &&
        selectedItems.size === cartItems.length;

    const totalJenis = document.getElementById("totalJenisProduk");
    const selectedCount = document.getElementById("selectedProductCount");
    const grandTotal = document.getElementById("shopeeGrandTotal");
    const selectTop = document.getElementById("selectAllTop");
    const selectBottom = document.getElementById("selectAllBottom");
    const selectStore = document.getElementById("selectStore");
    const badge = document.getElementById("cartBadge");
    const sidebarBadge = document.getElementById("sidebarCartBadge");

    if (totalJenis) totalJenis.textContent = cartItems.length;
    if (selectedCount) selectedCount.textContent = count;
    if (grandTotal) grandTotal.textContent = cartRupiah(total);

    if (selectTop) selectTop.checked = allChecked;
    if (selectBottom) selectBottom.checked = allChecked;
    if (selectStore) selectStore.checked = allChecked;

    if (badge) badge.textContent = cartItems.length;
    if (sidebarBadge) sidebarBadge.textContent = `${cartItems.length} Item`;

    const voucher = document.getElementById("voucherBadge");
    const hemat = document.getElementById("hematText");

    if (voucher) {
        voucher.textContent = voucherApplied
            ? "Diskon Bengkel -Rp 50.000 Terpakai"
            : "Voucher belum diterapkan";
    }
    if (hemat) {
        hemat.textContent = discount > 0 ? `Hemat ${cartRupiah(discount)}` : "";
    }
}

async function updateCartItem(id, quantity) {
    const item = cartItems.find(
        product => Number(product.cart_item_id) === id
    );

    if (!item) return;

    if (quantity < 1 || quantity > Number(item.stock)) {
        alert(`Jumlah produk harus antara 1 sampai ${item.stock}.`);
        return;
    }

    try {
        await cartRequest("update", {
            cart_item_id: id,
            quantity
        });

        item.quantity = quantity;

        const row = document.querySelector(
            `.shopee-cart-item[data-id="${id}"]`
        );

        if (row) {
            const input = row.querySelector(".shopee-qty-input");
            const total = row.querySelector(".item-row-total");

            if (input) input.value = quantity;

            if (total) {
                total.textContent = cartRupiah(
                    Number(item.price) * quantity
                );
            }
        }

        updateCartSummary();

    } catch (error) {
        alert(error.message);
        await loadCart();
    }
}

async function deleteCartItem(id) {
    if (!confirm("Hapus produk ini dari keranjang?")) return;

    try {
        await cartRequest("delete", {
            cart_item_id: id
        });

        await loadCart();
    } catch (error) {
        alert(error.message);
    }
}

document.addEventListener("click", async event => {
    const row = event.target.closest(".shopee-cart-item");
    if (!row) return;

    const id = Number(row.dataset.id);

    if (event.target.closest(".btn-del-item")) {
        await deleteCartItem(id);
        return;
    }

    const qtyButton = event.target.closest(".shopee-qty-btn");

    if (qtyButton) {
        const input = row.querySelector(".shopee-qty-input");
        let quantity = Number(input.value) || 1;

        quantity += qtyButton.classList.contains("plus") ? 1 : -1;

        if (quantity >= 1) {
            await updateCartItem(id, quantity);
        }
    }
});

document.addEventListener("change", async event => {
    if (event.target.matches(".item-check")) {
        const row = event.target.closest(".shopee-cart-item");
        const id = Number(row.dataset.id);

        if (event.target.checked) selectedItems.add(id);
        else selectedItems.delete(id);

        updateCartSummary();
    }

    if (event.target.matches(".shopee-qty-input")) {
        const row = event.target.closest(".shopee-cart-item");
        await updateCartItem(
            Number(row.dataset.id),
            Number(event.target.value)
        );
    }

    if (["selectAllTop", "selectAllBottom", "selectStore"].includes(event.target.id)) {
        selectedItems = event.target.checked
            ? new Set(cartItems.map(item => Number(item.cart_item_id)))
            : new Set();

        renderCart();
    }
});

document.getElementById("btnToggleVoucher")?.addEventListener("click", () => {
    voucherApplied = !voucherApplied;
    updateCartSummary();
});

document.getElementById("btnDeleteSelected")?.addEventListener("click", async () => {
    if (selectedItems.size === 0) {
        alert("Pilih produk yang ingin dihapus.");
        return;
    }

    if (!confirm("Hapus semua produk yang dipilih?")) return;

    try {
        for (const id of [...selectedItems]) {
            await cartRequest("delete", { cart_item_id: id });
        }

        await loadCart();
    } catch (error) {
        alert(error.message);
    }
});

document.querySelector(".btn-shopee-checkout")
    ?.addEventListener("click", event => {

    event.preventDefault();

    const ids = Array.from(selectedItems)
        .map(id => Number(id))
        .filter(id => Number.isInteger(id) && id > 0);

    if (ids.length === 0) {
        alert("Pilih minimal satu produk untuk checkout.");
        return;
    }

    sessionStorage.setItem(
        "yukido_checkout_items",
        JSON.stringify(ids)
    );

    window.location.href = "checkout.html";
});

document.addEventListener("DOMContentLoaded", () => {
    loadCart();
});