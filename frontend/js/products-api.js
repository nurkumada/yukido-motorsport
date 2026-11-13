
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

// Menentukan lokasi gambar

// Menentukan lokasi gambar produk

function productImage(path) {
    if (!path) {
        return "images/yukido.png";
    }

    // URL gambar dari website eksternal
    if (/^https?:\/\//i.test(path)) {
        return path;
    }

    // Ubah backslash menjadi forward slash
    path = path.replace(/\\/g, "/");

    // Jika menggunakan path absolut
    if (path.startsWith("/")) {
        return path;
    }

    // Lokasi gambar relatif dari folder frontend
    return path.replace(/^\.?\//, "");
}



// Mengambil kategori dari database
async function loadCategories() {
    try {
        const response = await fetch(
            `${YUKIDO_API}/categories/index.php`
        );

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

        const response = await fetch(
            `${YUKIDO_API}/products/index.php`
        );

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

    if (filtered.length === 0) {
        productGrid.innerHTML = `
            <p>Produk tidak ditemukan.</p>
        `;
        return;
    }

    productGrid.innerHTML = filtered.map(product => `
        <div class="produk-card">
            <div class="produk-image">
                <img
                    src="${escapeHTML(productImage(product.image_path))}"
                    alt="${escapeHTML(product.name)}"
                    onerror="this.onerror=null;this.src='images/yukido.png';">
            </div>

            <div class="produk-info">
                <p class="kategori-label">
                    ${escapeHTML(product.category_name || "Produk Yukido")}
                </p>

                <h3>${escapeHTML(product.name)}</h3>

                <p class="harga">${rupiah(product.price)}</p>

                <p>
                    ${product.warranty_type === "lifetime"
                        ? "Garansi Seumur Hidup"
                        : product.warranty_type === "limited"
                            ? `Garansi ${product.warranty_period_months} Bulan`
                            : "Tanpa Garansi"}
                </p>

                <p>Stok: ${Number(product.stock)}</p>

                <div class="produk-actions">
                    <a
                        href="detail-produk.php?id=${Number(product.id)}"
                        class="btn-detail"
                        style="text-decoration:none;">
                        <i class="fas fa-info-circle"></i> DETAIL
                    </a>

                    <button
                        class="btn-beli"
                        type="button"
                        data-add-product="${Number(product.id)}">
                        <i class="fas fa-shopping-cart"></i> BELI
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

// Pencarian
searchProduct.addEventListener("input", renderProducts);

// Pengurutan
sortProducts.addEventListener("change", renderProducts);

// Tombol reset
const resetButton = document.querySelector(".btn-reset");

if (resetButton) {
    resetButton.addEventListener("click", () => {
        searchProduct.value = "";
        yukidoCategory = "";

        categoryTabs.querySelectorAll(".cat-tab").forEach(tab => {
            tab.classList.toggle(
                "active",
                tab.dataset.categoryId === ""
            );
        });

        sortProducts.value = "newest";

        renderProducts();
    });
}

// Menjalankan kedua API
async function initializeYukidoCatalog() {
    await Promise.all([
        loadCategories(),
        loadProducts()
    ]);
}

initializeYukidoCatalog();


// =========================================
// TAMBAH PRODUK KE KERANJANG DATABASE
// =========================================

productGrid.addEventListener("click", async function (event) {
    const button = event.target.closest("[data-add-product]");

    if (!button) return;

    const productId = Number(button.dataset.addProduct);

    if (!productId) return;

    const originalText = button.innerHTML;

    try {
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...';

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
                alert("Silakan login terlebih dahulu untuk membeli produk.");
                window.location.href = "login.html";
                return;
            }

            throw new Error(result.message || "Produk gagal ditambahkan.");
        }

        alert("Produk berhasil ditambahkan ke keranjang!");

    } catch (error) {
        console.error("Gagal menambahkan produk:", error);
        alert(error.message);

    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
});


initializeYukidoCatalog();

// TEST EVENT TOMBOL BELI
productGrid.addEventListener("click", async function(event) {
    const button = event.target.closest(".btn-beli");

    if (!button) return;

    console.log("TOMBOL BELI DIKLIK");

    const productId = Number(button.dataset.addProduct);

    console.log("PRODUCT ID:", productId);

    alert("Tombol BELI berhasil diklik. ID Produk: " + productId);
});


