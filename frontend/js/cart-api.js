
const CART_API = "../backend/cart";

let cartItems = [];
let selectedItems = new Set();

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
    path = path.replace(/\\/g, "/");
    if (path.startsWith("/")) return path;
    return path.replace(/^\.?\//, "");
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
        throw new Error(result.message || "Permintaan keranjang gagal.");
    }

    return result;
}

async function loadCart() {
    const container = document.querySelector(".shopee-store-group");
    if (!container) return;

    container.innerHTML = "<p>Memuat keranjang...</p>";

    try {
        const result = await cartRequest("index");
        cartItems = result.data || [];

        selectedItems = new Set(
            cartItems.map(item => Number(item.cart_item_id))
        );

        renderCart();
    } catch (error) {
        console.error("Gagal memuat keranjang:", error);
        container.innerHTML = `
            <p>${cartEscape(error.message)}</p>
        `;
    }
}

function renderCart() {
    const container = document.querySelector(".shopee-store-group");

    if (!container) return;

    if (cartItems.length === 0) {
        container.innerHTML = `
            <div style="padding:40px;text-align:center;">
                <i class="fas fa-shopping-cart" style="font-size:45px;"></i>
                <h3>Keranjang masih kosong</h3>
                <p>Silakan pilih produk yang ingin dibeli.</p>
                <a href="produk.html">Belanja Sekarang</a>
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

            return `
                <div class="shopee-cart-item"
                     data-id="${id}"
                     data-price="${price}">
                    <div class="col-check">
                        <input type="checkbox" class="item-check"
                            ${checked ? "checked" : ""}>
                    </div>

                    <div class="col-product">
                        <img src="${cartEscape(cartImage(item.image_path))}"
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
                            <small>Stok: ${Number(item.stock)}</small>
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

    const total = selected.reduce((sum, item) =>
        sum + Number(item.price) * Number(item.quantity), 0
    );

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

    if (voucher) voucher.textContent = "Voucher belum diterapkan";
    if (hemat) hemat.textContent = "";
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
        const result = await cartRequest("update", {
            cart_item_id: id,
            quantity
        });

        // Perbarui data lokal tanpa membuat ulang seluruh halaman
        item.quantity = quantity;

        // Perbarui angka kuantitas
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

        // Perbarui total belanja
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

document.querySelector(".btn-shopee-checkout")?.addEventListener("click", event => {
    const ids = [...selectedItems];

    if (ids.length === 0) {
        event.preventDefault();
        alert("Pilih minimal satu produk untuk checkout.");
        return;
    }

    sessionStorage.setItem("yukido_checkout_items", JSON.stringify(ids));
});

document.addEventListener("DOMContentLoaded", loadCart);
