
(() => {

    const API_URL = "../backend/cart/checkout-items.php";

    const STORAGE_KEY = "yukido_checkout_items";

    // Format rupiah
    const money = value => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    // Menghindari HTML injection
    const escapeHtml = value => {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    };

    // Mengambil alamat gambar
    function imageUrl(path) {

        if (!path) return "images/yukido.png";

        if (/^https?:\/\//i.test(path)) {
            return path;
        }

        path = path.replace(/\\/g, "/").replace(/^\.\//, "");

        return path.startsWith("/") ? path : `../${path}`;
    }

    // Menampilkan pesan
    function showMessage(message, isError = false) {

        const list = document.querySelector(".summary-items");

        if (!list) return;

        list.innerHTML = `
            <p style="
                padding:16px;
                color:${isError ? '#c62828' : 'inherit'}
            ">
                ${escapeHtml(message)}
            </p>
        `;
    }

    // Menampilkan produk checkout
    function updateSummary(items, subtotal) {

        const summary = document.querySelector(
            ".checkout-summary .summary-box"
        );

        if (!summary) return;

        const heading = summary.querySelector(
            ".summary-header .text-red"
        );

        if (heading) {
            heading.textContent = `${items.length} jenis produk`;
        }

        const list = summary.querySelector(".summary-items");

        if (list) {

            list.innerHTML = items.map(item => `
                <div class="sum-item">

                    <img
                        src="${escapeHtml(imageUrl(item.image_path))}"
                        alt="${escapeHtml(item.name)}"
                        onerror="this.onerror=null;this.src='images/yukido.png'"
                    >

                    <div>
                        <span>${escapeHtml(item.name)}</span>

                        <span class="sum-qty">
                            ${Number(item.quantity)}x Unit
                        </span>
                    </div>

                    <span class="sum-price">
                        ${money(item.subtotal)}
                    </span>

                </div>
            `).join("");

        }

        // Menghitung jumlah barang
        const totalQuantity = items.reduce(
            (sum, item) => sum + Number(item.quantity),
            0
        );

        // Memperbarui subtotal
        const rows = summary.querySelectorAll(".summary-row");

        if (rows[1]) {
            rows[1].innerHTML = `
                <span>Subtotal Produk (${totalQuantity} item)</span>
                <span>${money(subtotal)}</span>
            `;
        }

        // Memperbarui total sementara
        const total = summary.querySelector(
            ".summary-total .total-price"
        );

        if (total) {
            total.textContent = money(subtotal);
        }
    }

    // Mengambil produk dari keranjang
    async function loadCheckoutItems() {

        const rawIds = sessionStorage.getItem(STORAGE_KEY);

        let ids = [];

        try {
            ids = JSON.parse(rawIds || "[]");
        } catch {
            ids = [];
        }

        ids = Array.isArray(ids)
            ? [...new Set(
                ids.map(Number).filter(
                    id => Number.isInteger(id) && id > 0
                )
            )]
            : [];

        const payButton = document.querySelector(".btn-pay-now");

        if (!ids.length) {

            showMessage(
                "Belum ada produk yang dipilih. Silakan kembali ke keranjang.",
                true
            );

            if (payButton) payButton.disabled = true;

            return;
        }

        showMessage("Memuat produk pilihan...");

        try {

            const response = await fetch(API_URL, {

                method: "POST",

                credentials: "same-origin",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    cart_item_ids: ids
                })

            });

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message);
            }

            // Menampilkan produk
            updateSummary(
                result.data || [],
                result.subtotal || 0
            );

            if (payButton) {
                payButton.disabled = false;
            }

        } catch (error) {

            showMessage(error.message, true);

            if (payButton) {
                payButton.disabled = true;
            }

            console.error("Checkout Error:", error);
        }
    }

    document.addEventListener(
        "DOMContentLoaded",
        loadCheckoutItems
    );

})();
