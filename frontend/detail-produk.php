<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Detail Produk - YUKIDO Motorsport</title>
    <link rel="stylesheet" href="css/style.css?v=10">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">

    <style>
        .detail-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 110px 20px 50px;
            color: white;
            box-sizing: border-box;
            width: 100%;
        }

        .back-link {
            display: inline-block;
            color: #aaa;
            text-decoration: none;
            margin-bottom: 25px;
        }

        .detail-content {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 35px;
        }

        .detail-image {
            width: 100%;
            min-height: 350px;
            max-height: 500px;
            object-fit: contain;
            background: #1b1b1b;
            border: 1px solid #333;
            border-radius: 12px;
        }

        .detail-info h1 {
            margin: 12px 0;
            font-size: 30px;
        }

        .detail-category {
            color: #aaa;
        }

        .detail-price {
            color: red;
            font-size: 27px;
            font-weight: bold;
            margin: 20px 0;
        }

        .detail-description {
            color: #ccc;
            line-height: 1.7;
            margin: 20px 0;
        }

        .detail-stock, .detail-warranty {
            margin: 12px 0;
        }

        .detail-actions {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-top: 22px;
            flex-wrap: wrap;
        }

        .qty-control-detail {
            display: inline-flex;
            align-items: center;
            background: #1b1b1b;
            border: 1px solid #333;
            border-radius: 8px;
            overflow: hidden;
        }

        .qty-control-detail button {
            width: 38px;
            height: 44px;
            background: transparent;
            border: 0;
            color: white;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
        }

        .qty-control-detail input {
            width: 48px;
            height: 44px;
            background: transparent;
            border: 0;
            border-left: 1px solid #333;
            border-right: 1px solid #333;
            color: white;
            text-align: center;
            font-weight: bold;
            font-size: 15px;
        }

        .btn-buy {
            background: #ed0000;
            color: white;
            border: 0;
            padding: 14px 28px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: opacity 0.2s ease;
        }

        .btn-buy:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        .video-section {
            margin-top: 45px;
        }

        .video-section iframe {
            width: 100%;
            max-width: 400px;
            height: 600px;
            border: 0;
            border-radius: 12px;
        }

        @media(max-width: 768px) {
            .detail-content {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>

<body>

<nav class="top-nav">
    <div class="nav-left">
        <a href="produk.html" class="logo">
            <span class="logo-text">YUKIDO</span>
        </a>
    </div>

    <div class="nav-right" style="display: flex; align-items: center; gap: 20px;">
        <a href="keranjang.html" style="color:white;text-decoration:none;">
            <i class="fas fa-shopping-cart"></i> Keranjang
        </a>
        <a href="produk.html" style="color:white;text-decoration:none;">
            <i class="fas fa-store"></i> Katalog Produk
        </a>
    </div>
</nav>

<main class="detail-container">

    <a href="produk.html" class="back-link">
        <i class="fas fa-arrow-left"></i> Kembali ke katalog
    </a>

    <div id="detailContent">
        Memuat detail produk...
    </div>

    <section class="video-section" id="videoSection" style="display:none;">
        <h2>Video Produk</h2>
        <div id="productVideos"></div>
    </section>

</main>

<script>
const API_URL = "../backend/products/detail.php";
const CART_ADD_API = "../backend/cart/add.php";
const params = new URLSearchParams(window.location.search);
const productId = params.get("id");

const detailContent = document.getElementById("detailContent");

function formatRupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value || 0));
}

function safeText(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function getImagePath(path) {
    if (!path) {
        return "images/yukido.png";
    }
    if (/^https?:\/\//i.test(path)) {
        return path;
    }
    const clean = String(path).replace(/\\/g, "/").replace(/^(\.\/|frontend\/)/, "");
    if (clean.startsWith("../") || clean.startsWith("/")) {
        return clean;
    }
    if (clean.startsWith("uploads/")) {
        return "../" + clean;
    }
    return clean;
}

function getTikTokEmbed(url) {
    try {
        const parsed = new URL(url);
        if (!parsed.hostname.endsWith("tiktok.com")) return null;
        const match = parsed.pathname.match(/\/video\/(\d+)/);
        return match
            ? "https://www.tiktok.com/player/v1/" + match[1]
            : null;
    } catch {
        return null;
    }
}

async function handleAddToCart(id, maxStock) {
    const qtyInput = document.getElementById("detailQtyInput");
    const btnAdd = document.getElementById("btnAddToCartDetail");
    const quantity = qtyInput ? (parseInt(qtyInput.value, 10) || 1) : 1;

    if (maxStock <= 0) {
        alert("Stok produk sedang habis.");
        return;
    }

    if (quantity < 1 || quantity > maxStock) {
        alert(`Jumlah harus antara 1 sampai ${maxStock}.`);
        return;
    }

    const originalHTML = btnAdd.innerHTML;
    btnAdd.disabled = true;
    btnAdd.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENAMBAHKAN...';

    try {
        const response = await fetch(CART_ADD_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
                product_id: Number(id),
                quantity: quantity
            })
        });

        if (response.status === 401) {
            alert("Silakan login terlebih dahulu untuk menambahkan produk ke keranjang.");
            window.location.href = "login.html";
            return;
        }

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal menambahkan produk ke keranjang.");
        }

        if (confirm("Produk berhasil ditambahkan ke keranjang! Lihat keranjang sekarang?")) {
            window.location.href = "keranjang.html";
        }
    } catch (error) {
        alert(error.message || "Gagal terhubung ke server.");
    } finally {
        btnAdd.disabled = false;
        btnAdd.innerHTML = originalHTML;
    }
}

async function loadProduct() {
    if (!productId) {
        detailContent.innerHTML = "ID produk tidak ditemukan.";
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}?id=${encodeURIComponent(productId)}`,
            { credentials: "same-origin" }
        );

        const result = await response.json();

        if (!result.success || !result.data) {
            throw new Error(result.message || "Produk tidak ditemukan.");
        }

        const product = result.data;
        const stock = Number(product.stock || 0);

        const image = product.images?.length
            ? getImagePath(product.images[0].image_path)
            : "images/yukido.png";

        const warranty = product.warranty_type === "lifetime"
            ? "Garansi Seumur Hidup"
            : product.warranty_type === "limited"
                ? `Garansi Terbatas (${product.warranty_period_months || 0} bulan)`
                : "Tidak Ada Garansi";

        detailContent.innerHTML = `
            <div class="detail-content">
                <div>
                    <img
                        src="${safeText(image)}"
                        alt="${safeText(product.name)}"
                        class="detail-image"
                        onerror="this.onerror=null; this.src='images/yukido.png';"
                    >
                </div>

                <div class="detail-info">
                    <p class="detail-category">
                        ${safeText(product.category_name || "Produk Yukido")}
                    </p>

                    <h1>${safeText(product.name)}</h1>

                    <p style="color:#999;">
                        SKU: ${safeText(product.sku)}
                    </p>

                    <div class="detail-price">
                        ${formatRupiah(product.price)}
                    </div>

                    <p class="detail-description">
                        ${safeText(product.description || "Belum ada deskripsi produk.")}
                    </p>

                    <p class="detail-stock">
                        <i class="fas fa-box"></i>
                        Stok tersedia: ${stock}
                    </p>

                    <p class="detail-warranty">
                        <i class="fas fa-shield-alt"></i>
                        ${warranty}
                    </p>

                    <div class="detail-actions">
                        <div class="qty-control-detail">
                            <button type="button" id="btnDetailMinus">-</button>
                            <input type="number" id="detailQtyInput" value="1" min="1" max="${Math.max(1, stock)}">
                            <button type="button" id="btnDetailPlus">+</button>
                        </div>

                        <button type="button" class="btn-buy" id="btnAddToCartDetail" ${stock <= 0 ? "disabled" : ""}>
                            <i class="fas fa-shopping-cart"></i>
                            ${stock <= 0 ? "STOK HABIS" : "TAMBAH KE KERANJANG"}
                        </button>
                    </div>
                </div>
            </div>
        `;

        const qtyInput = document.getElementById("detailQtyInput");
        document.getElementById("btnDetailMinus")?.addEventListener("click", () => {
            const val = parseInt(qtyInput.value, 10) || 1;
            if (val > 1) qtyInput.value = val - 1;
        });

        document.getElementById("btnDetailPlus")?.addEventListener("click", () => {
            const val = parseInt(qtyInput.value, 10) || 1;
            if (val < stock) qtyInput.value = val + 1;
        });

        document.getElementById("btnAddToCartDetail")?.addEventListener("click", () => {
            handleAddToCart(product.id, stock);
        });

        const videos = product.videos || [];
        const videoContainer = document.getElementById("productVideos");
        const videoSection = document.getElementById("videoSection");

        const validVideos = videos
            .map(video => ({
                ...video,
                embedUrl: getTikTokEmbed(video.video_url)
            }))
            .filter(video => video.embedUrl);

        if (validVideos.length) {
            videoSection.style.display = "block";

            videoContainer.innerHTML = validVideos.map(video => `
                <div style="margin:20px 0;">
                    <h3>${safeText(video.video_title || "Video Produk")}</h3>
                    <iframe
                        src="${safeText(video.embedUrl)}"
                        allow="fullscreen"
                        loading="lazy">
                    </iframe>
                </div>
            `).join("");
        }

    } catch (error) {
        detailContent.innerHTML = `
            <p style="color:#ff4444;">
                Gagal memuat produk: ${safeText(error.message)}
            </p>
        `;
    }
}

loadProduct();
</script>

</body>
</html>