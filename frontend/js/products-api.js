const YUKIDO_API = "../backend";

let yukidoProducts = [];
let yukidoCategory = "";

const productGrid = document.getElementById("productGrid");
const categoryTabs = document.getElementById("categoryTabs");
const searchProduct = document.getElementById("searchProduct");
const sortProducts = document.getElementById("sortProducts");

// Format harga Rupiah
function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value));
}

// Mencegah HTML dari database dieksekusi
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

// Menentukan lokasi gambar produk
function productImage(path) {
    if (!path) {
        return "images/yukido.png";
    }

    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    path = path.replace(/\\/g, "/");

    if (path.startsWith("/")) {
        return path;
    }

    return path.replace(/^\.?\//, "");
}

// Mengambil kategori dari database
async function loadCategories() {
    try {
        const response = await fetch(`${YUKIDO_API}/categories/index.php`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        categoryTabs.innerHTML = `
            <button class="cat-tab active" data-category-id="">
                Semua Kategori
            </button>
        `;

        result.data.forEach(category => {
            categoryTabs.insertAdjacentHTML("beforeend", `
                <button
                    class="cat-tab"
                    data-category-id="${Number(category.id)}">
                    ${escapeHTML(category.name)}
                </button>
            `);
        });
    } catch (error) {
        console.error("Gagal mengambil kategori:", error);
    }
}

// Mengambil produk dari database
async function loadProducts() {
    try {
        productGrid.innerHTML = "<p>Memuat produk Yukido...</p>";

        const response = await fetch(`${YUKIDO_API}/products/index.php`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        yukidoProducts = result.data;
        renderProducts();
    } catch (error) {
        console.error("Gagal mengambil produk:", error);
        productGrid.innerHTML = `
            <p>Produk gagal dimuat. Periksa koneksi backend.</p>
        `;
    }
}

// Menampilkan kartu produk

// Menampilkan kartu produk
function renderProducts() {
    const keyword = searchProduct.value.toLowerCase().trim();
    const sort = sortProducts.value;

    let filtered = yukidoProducts.filter(product => {
        const matchesKeyword =
            product.name.toLowerCase().includes(keyword) ||
            (product.sku || "").toLowerCase().includes(keyword) ||
            (product.description || "").toLowerCase().includes(keyword);

        const matchesCategory =
            !yukidoCategory ||
            Number(product.category_id) === Number(yukidoCategory);

        return matchesKeyword && matchesCategory;
    });

    // Pengurutan produk
    if (sort === "price_low") {
        filtered.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sort === "price_high") {
        filtered.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sort === "name") {
        filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else {
        filtered.sort((a, b) =>
            new Date(b.created_at) - new Date(a.created_at)
        );
    }

    // Jika produk tidak ditemukan
    if (filtered.length === 0) {
        productGrid.innerHTML = `<p>Produk tidak ditemukan.</p>`;
        return;
    }

    // Menampilkan kartu produk
    productGrid.innerHTML = filtered.map(product => `
        <div
            class="produk-card"
            data-product-detail="${Number(product.id)}"
            role="link"
            tabindex="0"
        >

            <div class="produk-image">
                <img
                    src="${escapeHTML(productImage(product.image_path))}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.onerror=null;this.src='images/yukido.png';"
                >
            </div>

            <div class="produk-info">

                <p class="kategori-label">
                    ${escapeHTML(product.category_name || "Produk Yukido")}
                </p>

                <h3>${escapeHTML(product.name)}</h3>

                <p class="harga">
                    ${rupiah(product.price)}
                </p>

                <p>
                    ${product.warranty_type === "lifetime"
                        ? "Garansi Seumur Hidup"
                        : product.warranty_type === "limited"
                            ? `Garansi ${product.warranty_period_months} Bulan`
                            : "Tanpa Garansi"}
                </p>

                <p>
                    Stok: ${Number(product.stock)}
                </p>

                <div class="produk-actions">

    <!-- TOMBOL KERANJANG -->
    <button
        class="btn-cart-add"
        type="button"
        title="Tambah ke keranjang"
        data-cart-add="${Number(product.id)}"
        ${Number(product.stock) < 1 ? "disabled" : ""}
    >
        <i class="fas fa-shopping-cart"></i>
    </button>

    <!-- TOMBOL BELI -->
    <button
        class="btn-beli"
        type="button"
        data-add-product="${Number(product.id)}"
        ${Number(product.stock) < 1 ? "disabled" : ""}
    >
        BELI
    </button>

</div>
            </div>
        </div>
    `).join("");
}



// Klik kategori
categoryTabs.addEventListener("click", event => {
    const button = event.target.closest(".cat-tab");
    if (!button) return;

    categoryTabs.querySelectorAll(".cat-tab").forEach(tab => {
        tab.classList.remove("active");
    });

    button.classList.add("active");
    yukidoCategory = button.dataset.categoryId;
    renderProducts();
});

// Pencarian & pengurutan
searchProduct.addEventListener("input", renderProducts);
sortProducts.addEventListener("change", renderProducts);

// Tombol reset
const resetButton = document.querySelector(".btn-reset");
if (resetButton) {
    resetButton.addEventListener("click", () => {
        searchProduct.value = "";
        yukidoCategory = "";

        categoryTabs.querySelectorAll(".cat-tab").forEach(tab => {
            tab.classList.toggle("active", tab.dataset.categoryId === "");
        });

        sortProducts.value = "newest";
        renderProducts();
    });
}

// =========================================
// KLIK KARTU PRODUK UNTUK MELIHAT DETAIL
// =========================================
productGrid.addEventListener("click", function(event) {

    // Abaikan klik tombol keranjang dan beli
    if (event.target.closest("button")) {
        return;
    }

    const card = event.target.closest("[data-product-detail]");

    if (!card) return;

    const productId = card.dataset.productDetail;

    window.location.href =
        `detail-produk.php?id=${productId}`;
});

// Mendukung navigasi menggunakan keyboard
productGrid.addEventListener("keydown", function(event) {

    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    if (event.target.closest("button")) {
        return;
    }

    const card = event.target.closest("[data-product-detail]");

    if (!card) return;

    event.preventDefault();

    window.location.href =
        `detail-produk.php?id=${card.dataset.productDetail}`;
});


// =========================================
// KLIK KARTU PRODUK UNTUK DETAIL
// =========================================

productGrid.addEventListener("click", function(event) {

    // Jangan buka detail ketika tombol diklik
    if (event.target.closest("button")) {
        return;
    }

    const card = event.target.closest("[data-product-detail]");

    if (!card) return;

    const productId = card.dataset.productDetail;

    window.location.href =
        `detail-produk.php?id=${productId}`;
});

// Mendukung tombol Enter pada keyboard
productGrid.addEventListener("keydown", function(event) {

    if (event.key !== "Enter" && event.key !== " ") {
        return;
    }

    if (event.target.closest("button")) {
        return;
    }

    const card = event.target.closest("[data-product-detail]");

    if (!card) return;

    event.preventDefault();

    window.location.href =
        `detail-produk.php?id=${card.dataset.productDetail}`;
});


// =========================================
// TAMBAH KERANJANG DAN BELI
// =========================================

productGrid.addEventListener("click", async function(event) {

    // Mendeteksi tombol keranjang
    const cartButton = event.target.closest("[data-cart-add]");

    // Mendeteksi tombol beli
    const buyButton = event.target.closest("[data-add-product]");

    const button = cartButton || buyButton;

    if (!button) return;

    const productId = Number(
        cartButton
            ? cartButton.dataset.cartAdd
            : buyButton.dataset.addProduct
    );

    if (!productId) return;

    const isBuy = Boolean(buyButton);

    const originalText = button.innerHTML;

    try {
        button.disabled = true;

        button.innerHTML = isBuy
            ? '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...'
            : '<i class="fas fa-spinner fa-spin"></i>';

        const response = await fetch(`${YUKIDO_API}/cart/add.php`, {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            credentials: "same-origin",

            body: JSON.stringify({
                product_id: productId,
                quantity: 1
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {

            if (response.status === 401) {
                alert("Silakan login terlebih dahulu.");

                window.location.href = "login.html";
                return;
            }

            throw new Error(
                result.message || "Produk gagal ditambahkan."
            );
        }

        // Jika hanya menambahkan ke keranjang
        if (cartButton) {

            alert("Produk berhasil ditambahkan ke keranjang!");

            button.innerHTML =
                '<i class="fas fa-check"></i>';

            button.classList.add("is-added");

            setTimeout(() => {
                button.innerHTML = originalText;
                button.classList.remove("is-added");
                button.disabled = false;
            }, 1200);

            return;
        }

        // Jika tombol BELI ditekan
        if (buyButton) {

            if (result.cart_item_id) {

                sessionStorage.setItem(
                    "yukido_checkout_items",
                    JSON.stringify([
                        Number(result.cart_item_id)
                    ])
                );

                window.location.href = "checkout.html";

            } else {
                window.location.href = "keranjang.html";
            }
        }

    } catch (error) {

        console.error("Gagal memproses produk:", error);

        alert(error.message);

        button.disabled = false;
        button.innerHTML = originalText;
    }
});


// Jalankan inisialisasi katalog
async function initializeYukidoCatalog() {
    await Promise.all([
        loadCategories(),
        loadProducts()
    ]);
}

initializeYukidoCatalog();