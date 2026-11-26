(function () {
    const API_BASE = "../backend";
    const sliderEl = document.getElementById("kategoriSlider");
    const gridEl = document.getElementById("homeProdukGrid");
    const topSearchInput = document.querySelector(".search-bar input");

    let allHomeProducts = [];

    const fallbackCategoryImages = {
        "air-tools": "images/air_tools.png",
        "pneumatic": "images/pneumatic.png",
        "automotive": "images/automotive.png",
        "hand-tools": "images/hand_tools.png",
        "pliers-tools": "images/pilers_tools.png",
        "screwdriver": "images/screwdriver.png",
        "accessories": "images/accessories.png",
        "insulation": "images/insulation.png",
        "general": "images/general.png",
        "tools-storage": "images/tools_storage.png",
        "inverter": "images/inverter.png"
    };

    function formatRupiah(value) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value || 0));
    }

    function escapeHtml(value) {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    function resolveMediaUrl(path, fallback = "images/yukido.png") {
        if (!path) return fallback;
        if (/^https?:\/\//i.test(path)) return path;

        const clean = String(path).replace(/\\/g, "/");
        if (clean.startsWith("/")) return clean;
        if (clean.startsWith("frontend/")) return clean.replace(/^frontend\//, "");
        return clean.replace(/^\.?\//, "");
    }

    function renderHomeCategories(categories) {
        if (!sliderEl || !Array.isArray(categories) || categories.length === 0) return;

        sliderEl.innerHTML = categories.map(cat => {
            const slug = String(cat.slug || cat.name || "").toLowerCase().replace(/\s+/g, "-");
            const fallbackImg = fallbackCategoryImages[slug] || "images/general.png";
            const imgSrc = resolveMediaUrl(cat.image_path, fallbackImg);
            const totalPart = Number(cat.total_products || 0);
            const badgeText = totalPart >= 100 ? "100+ Part" : `${totalPart} Part`;

            return `
                <div class="kategori-card">
                    <div class="kategori-image">
                        <img
                            src="${escapeHtml(imgSrc)}"
                            alt="${escapeHtml(cat.name)}"
                            onerror="this.onerror=null;this.src='${escapeHtml(fallbackImg)}';"
                        >
                        <span class="kategori-badge">${escapeHtml(badgeText)}</span>
                    </div>
                    <div class="kategori-info">
                        <h3>${escapeHtml(String(cat.name || "").toUpperCase())}</h3>
                        <p>Koleksi ${escapeHtml(cat.name)} resmi PT Yukido Power Teknik dengan standar kualitas bengkel dan industri.</p>
                        <a href="kategori-produk.html?category=${encodeURIComponent(cat.slug || cat.id)}" class="btn-katalog">
                            BUKA KATALOG <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                </div>
            `;
        }).join("");
    }

    function renderHomeProducts(products) {
        if (!gridEl || !Array.isArray(products) || products.length === 0) return;

        gridEl.innerHTML = products.map(prod => {
            const id = Number(prod.id);
            const sku = prod.sku || `YKD-${id}`;
            const categoryLabel = prod.category_name || prod.type || "PRODUK YUKIDO";
            const desc = prod.description || "Produk perkakas dan peralatan teknik resmi PT Yukido Power Teknik.";
            const imgSrc = resolveMediaUrl(prod.image_path, "images/yukido.png");
            const stock = Number(prod.stock ?? 1);
            const badgeText = prod.badge || (stock > 0 ? "TERSEDIA" : "HABIS");

            return `
                <div class="produk-card" data-id="${id}" data-price="${Number(prod.price || 0)}">
                    <div class="produk-image">
                        <img
                            src="${escapeHtml(imgSrc)}"
                            alt="${escapeHtml(prod.name)}"
                            onerror="this.onerror=null;this.src='images/yukido.png';"
                        >
                        <span class="badge-terlaris">${escapeHtml(String(badgeText).toUpperCase())}</span>
                        <span class="sku">${escapeHtml(sku)}</span>
                    </div>
                    <div class="produk-info">
                        <div class="produk-header">
                            <span class="produk-type">${escapeHtml(String(categoryLabel).toUpperCase())}</span>
                            <span class="rating">
                                <i class="fas fa-star"></i> ${escapeHtml(prod.rating ?? "0 (0)")}
                            </span>
                        </div>
                        <h3>${escapeHtml(prod.name)}</h3>
                        <p class="produk-desc">${escapeHtml(desc)}</p>
                        <div class="produk-footer">
                            <div>
                                <span class="label">HARGA RESMI</span>
                                <span class="harga">${formatRupiah(prod.price)}</span>
                            </div>
                            <div class="produk-actions">
                                <a href="detail-produk.php?id=${id}" class="btn-detail" style="text-decoration:none; display:inline-flex; align-items:center; gap:4px;">
                                    <i class="fas fa-info-circle"></i> DETAIL
                                </a>
                                <button
                                    class="btn-beli"
                                    type="button"
                                    data-home-buy="${id}"
                                    ${stock < 1 ? "disabled" : ""}
                                >
                                    <i class="fas fa-shopping-cart"></i> ${stock < 1 ? "HABIS" : "BELI"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join("");

        if (typeof window.runCardEnhancements === "function") {
            window.runCardEnhancements();
        }
    }

    async function fetchHomeCategories() {
        try {
            const res = await fetch(`${API_BASE}/categories/index.php`, { credentials: "same-origin" });
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                renderHomeCategories(json.data);
            }
        } catch (err) {
            console.warn("Kategori beranda memakai tampilan bawaan:", err);
        }
    }

    async function fetchHomeProducts() {
        try {
            const res = await fetch(`${API_BASE}/products/index.php`, { credentials: "same-origin" });
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && Array.isArray(json.data) && json.data.length > 0) {
                allHomeProducts = json.data;
                renderHomeProducts(allHomeProducts.slice(0, 4));
            }
        } catch (err) {
            console.warn("Produk populer beranda memakai tampilan bawaan:", err);
        }
    }

    async function syncHomeCartBadge() {
        try {
            const res = await fetch(`${API_BASE}/cart/index.php`, { credentials: "same-origin" });
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success || !Array.isArray(json.data)) return;

            const count = json.data.length;
            const sidebarBadge = document.getElementById("sidebarCartBadge");
            if (sidebarBadge) {
                sidebarBadge.textContent = `${count} Item`;
            }

            const cartBtn = document.querySelector(".cart-btn");
            if (cartBtn) {
                let navBadge = cartBtn.querySelector(".badge");
                if (!navBadge) {
                    navBadge = document.createElement("span");
                    navBadge.className = "badge";
                    cartBtn.appendChild(navBadge);
                }
                navBadge.textContent = count;
            }
        } catch {
            // Biarkan nilai bawaan jika belum login atau endpoint belum merespons
        }
    }

    if (gridEl) {
        gridEl.addEventListener("click", async event => {
            const buyBtn = event.target.closest("[data-home-buy]");
            if (!buyBtn) return;

            const productId = Number(buyBtn.dataset.homeBuy);
            if (!productId) return;

            const originalHtml = buyBtn.innerHTML;
            buyBtn.disabled = true;
            buyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES...';

            try {
                const res = await fetch(`${API_BASE}/cart/add.php`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "same-origin",
                    body: JSON.stringify({ product_id: productId, quantity: 1 })
                });

                const result = await res.json();

                if (!res.ok || !result.success) {
                    if (res.status === 401) {
                        alert("Silakan login terlebih dahulu sebelum membeli produk.");
                        window.location.href = "login.html";
                        return;
                    }
                    throw new Error(result.message || "Gagal menambahkan produk ke keranjang.");
                }

                await syncHomeCartBadge();

                if (result.cart_item_id) {
                    sessionStorage.setItem("yukido_checkout_items", JSON.stringify([Number(result.cart_item_id)]));
                    window.location.href = "checkout.html";
                } else {
                    window.location.href = "keranjang.html";
                }
            } catch (err) {
                alert(err.message || "Terjadi kesalahan saat memproses pembelian.");
                buyBtn.disabled = false;
                buyBtn.innerHTML = originalHtml;
            }
        });
    }

    if (topSearchInput) {
        topSearchInput.addEventListener("keydown", event => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            const q = topSearchInput.value.trim().toLowerCase();

            if (!q) {
                if (allHomeProducts.length > 0) renderHomeProducts(allHomeProducts.slice(0, 4));
                return;
            }

            if (allHomeProducts.length > 0) {
                const matches = allHomeProducts.filter(p =>
                    String(p.name || "").toLowerCase().includes(q) ||
                    String(p.sku || "").toLowerCase().includes(q) ||
                    String(p.description || "").toLowerCase().includes(q)
                );
                if (matches.length > 0) {
                    renderHomeProducts(matches.slice(0, 8));
                    gridEl?.scrollIntoView({ behavior: "smooth", block: "start" });
                    return;
                }
            }

            window.location.href = `produk.html?q=${encodeURIComponent(topSearchInput.value.trim())}`;
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        fetchHomeCategories();
        fetchHomeProducts();
        syncHomeCartBadge();
    });
})();