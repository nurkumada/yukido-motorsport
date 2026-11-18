
<?php
session_start();

if (
    !isset($_SESSION['user']) ||
    ($_SESSION['user']['role'] ?? '') !== 'admin'
) {
    header("Location: ../../frontend/login.html");
    exit;
}

$adminName = $_SESSION['user']['full_name'] ?? 'Administrator';
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <title>Manajemen Pesanan | Yukido Motorsport</title>

  <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background: #f4f5f7;
            color: #222;
        }

        .sidebar {
            width: 250px;
            height: 100vh;
            background: #151515;
            color: white;
            position: fixed;
            left: 0;
            top: 0;
            padding: 30px 20px;
        }

        .brand {
            font-size: 23px;
            font-weight: bold;
            color: #e63939;
            margin-bottom: 8px;
        }

        .sidebar small {
            color: #aaa;
        }

        .menu {
            margin-top: 45px;
        }

        .menu a {
            display: block;
            text-decoration: none;
            color: #ccc;
            padding: 14px 15px;
            margin-bottom: 8px;
            border-radius: 7px;
        }

        .menu a.active,
        .menu a:hover {
            background: #e63939;
            color: white;
        }

        .main {
            margin-left: 250px;
            padding: 30px;
        }


        .topbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            margin-bottom: 30px;
        }

        .topbar h1 {
            font-size: 27px;
            margin-bottom: 4px;
        }

        .admin-info {
            color: #777;
            font-size: 14px;
        }

        button {
            font-family: inherit;
        }

        .logout-btn {
            border: none;
            background: #e63939;
            color: white;
            padding: 11px 18px;
            border-radius: 7px;
            cursor: pointer;
            font-weight: bold;
        }

        .logout-btn:hover {
            background: #c92e2e;
        }

        .back-btn {
            display: inline-block;
            margin-bottom: 20px;
            color: #555;
            text-decoration: none;
            font-size: 14px;
        }

        .back-btn:hover {
            color: #e63939;
        }

        /* STATISTIK */

        .cards {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
            margin-bottom: 30px;
        }

        .card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
        }

        .card p {
            color: #777;
            font-size: 14px;
            margin-bottom: 15px;
        }

        .card h2 {
            font-size: 30px;
        }

        /* KONTEN */

        .content-box {
            background: white;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 3px 12px rgba(0,0,0,.05);
        }

        .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 15px;
            margin-bottom: 20px;
            flex-wrap: wrap;
        }

        .content-header h2 {
            font-size: 20px;
        }

        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin-bottom: 20px;
        }

        .filters input,
        .filters select {
            padding: 11px 13px;
            border: 1px solid #ddd;
            border-radius: 7px;
            background: white;
            color: #333;
            outline: none;
            font-size: 13px;
        }

        .filters input {
            flex: 1;
            min-width: 200px;
        }

        .filters input:focus,
        .filters select:focus {
            border-color: #e63939;
        }

        .refresh-btn {
            border: none;
            background: #e63939;
            color: white;
            padding: 11px 16px;
            border-radius: 7px;
            cursor: pointer;
        }

        .refresh-btn:hover {
            background: #c92e2e;
        }

        /* TABEL */

        .table-wrapper {
            width: 100%;
            overflow-x: auto;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 850px;
        }

        th, td {
            padding: 14px;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 14px;
            vertical-align: middle;
        }

        th {
            background: #f8f8f8;
            color: #555;
            font-weight: normal;
        }

        td small {
            display: block;
            color: #888;
            margin-top: 5px;
        }

        .status {
            display: inline-block;
            padding: 6px 10px;
            border-radius: 20px;
            font-size: 12px;
            white-space: nowrap;
        }

        .pending_payment {
            background: #fff3d6;
            color: #a66a00;
        }

        .processing {
            background: #e2efff;
            color: #2463a5;
        }

        .shipped {
            background: #f0e5ff;
            color: #7541a5;
        }

        .completed {
            background: #e5f7eb;
            color: #218344;
        }

        .cancelled {
            background: #ffe5e5;
            color: #bd3030;
        }

        .payment-paid {
            color: #218344;
            font-weight: bold;
        }

        .payment-pending {
            color: #a66a00;
        }

        .action-buttons {
            display: flex;
            gap: 6px;
        }

        .action-btn {
            border: none;
            padding: 8px 10px;
            border-radius: 6px;
            cursor: pointer;
            background: #f0f0f0;
            color: #333;
        }

        .action-btn:hover {
            background: #e63939;
            color: white;
        }

        .empty-row {
            text-align: center;
            color: #888;
            padding: 30px;
        }

        /* MODAL */

        .modal {
            display: none;
            position: fixed;
            inset: 0;
            z-index: 1000;
            background: rgba(0,0,0,.45);
            padding: 20px;
            overflow-y: auto;
        }

        .modal-content {
            background: white;
            max-width: 650px;
            margin: 40px auto;
            padding: 25px;
            border-radius: 12px;
            box-shadow: 0 5px 25px rgba(0,0,0,.15);
        }

        .modal-content h2 {
            margin-bottom: 20px;
            font-size: 21px;
        }

        .detail-section {
            border-bottom: 1px solid #eee;
            padding: 14px 0;
        }

        .detail-section strong {
            display: block;
            margin-bottom: 7px;
        }

        .detail-section p {
            font-size: 14px;
            color: #666;
            line-height: 1.7;
        }

        .modal-content label {
            display: block;
            font-size: 14px;
            margin: 15px 0 7px;
        }

        .modal-content select,
        .modal-content textarea {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 7px;
            font-family: inherit;
            font-size: 14px;
        }

        .modal-actions {
            display: flex;
            gap: 10px;
            margin-top: 20px;
        }

        .save-btn,
        .close-btn {
            padding: 11px 17px;
            border: none;
            border-radius: 7px;
            cursor: pointer;
        }

        .save-btn {
            background: #e63939;
            color: white;
        }

        .close-btn {
            background: #eee;
            color: #333;
        }

        @media (max-width: 1000px) {
            .cards {
                grid-template-columns: repeat(2, 1fr);
            }
        }

        @media (max-width: 650px) {
            .main {
                padding: 20px;
            }

            .cards {
                grid-template-columns: 1fr;
            }

            .topbar {
                align-items: flex-start;
            }

            .content-box {
                padding: 18px;
            }
        }
    </style>
</head>

<body>

<aside class="sidebar">
    <div class="brand">YUKIDO</div>
    <small>Motorsport Admin Panel</small>

    <nav class="menu">
        <a href="dashboard.php">Dashboard</a>
        <a href="products.php">Manajemen Produk</a>
        <a href="categories.php">Manajemen Kategori</a>
        <a href="orders.php">Manajemen Pesanan</a>
    </nav>
</aside>

<main class="main">

    <a href="dashboard.php" class="back-btn">
        ← Kembali ke Dashboard
    </a>

    <header class="topbar">
        <div>
            <h1>Manajemen Pesanan</h1>
            <p class="admin-info">
                Selamat datang, <?= htmlspecialchars($adminName) ?>!
            </p>
        </div>

        <button class="logout-btn" onclick="logout()">
            Logout
        </button>
    </header>

    <!-- RINGKASAN PESANAN -->

    <section class="cards">

        <div class="card">
            <p>Total Pesanan</p>
            <h2 id="statTotal">0</h2>
        </div>

        <div class="card">
            <p>Menunggu Pembayaran</p>
            <h2 id="statPending">0</h2>
        </div>

        <div class="card">
            <p>Sedang Diproses</p>
            <h2 id="statProcessing">0</h2>
        </div>

        <div class="card">
            <p>Pesanan Selesai</p>
            <h2 id="statCompleted">0</h2>
        </div>

    </section>

    <!-- DAFTAR PESANAN -->

    <section class="content-box">

        <div class="content-header">
            <h2>Daftar Pesanan</h2>
        </div>

        <div class="filters">

            <input
                type="search"
                id="searchOrder"
                placeholder="Cari nomor pesanan atau nama penerima..."
            >

            <select id="filterStatus">
                <option value="">Semua Status</option>
                <option value="pending_payment">Menunggu Pembayaran</option>
                <option value="processing">Sedang Diproses</option>
                <option value="shipped">Dikirim</option>
                <option value="completed">Selesai</option>
                <option value="cancelled">Dibatalkan</option>
            </select>

            <button class="refresh-btn" onclick="loadOrders()">
                ↻ Refresh
            </button>

        </div>

        <div class="table-wrapper">
            <table>

                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Nomor Pesanan</th>
                        <th>Penerima</th>
                        <th>Total</th>
                        <th>Pembayaran</th>
                        <th>Status</th>
                        <th>Tanggal</th>
                        <th>Aksi</th>
                    </tr>
                </thead>

                <tbody id="ordersTableBody">
                    <tr>
                        <td colspan="8" class="empty-row">
                            Memuat pesanan...
                        </td>
                    </tr>
                </tbody>

            </table>
        </div>

    </section>

</main>


<!-- MODAL DETAIL -->

<div class="modal" id="detailModal">
    <div class="modal-content">

        <h2>Detail Pesanan</h2>

        <div id="detailContent">
            Memuat detail pesanan...
        </div>

        <div class="modal-actions">
            <button class="close-btn" onclick="closeModals()">
                Tutup
            </button>
        </div>

    </div>
</div>


<!-- MODAL UBAH STATUS -->

<div class="modal" id="statusModal">
    <div class="modal-content">

        <h2>Ubah Status Pesanan</h2>

        <input type="hidden" id="editOrderId">

        <label>Status Pesanan</label>

        <select id="editOrderStatus">
            <option value="pending_payment">Menunggu Pembayaran</option>
            <option value="processing">Sedang Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
        </select>

        <label>Catatan Admin</label>

        <textarea
            id="editOrderNote"
            rows="3"
            placeholder="Masukkan catatan perubahan status..."
        ></textarea>

        <div class="modal-actions">
            <button class="save-btn" onclick="saveOrderStatus()">
                Simpan Perubahan
            </button>

            <button class="close-btn" onclick="closeModals()">
                Batal
            </button>
        </div>

    </div>
</div>


<script>
const API = "../orders";
let allOrders = [];

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}

function rupiah(value) {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function dateFormat(value) {
    if (!value) return "-";

    const date = new Date(String(value).replace(" ", "T"));

    return isNaN(date.getTime())
        ? escapeHTML(value)
        : date.toLocaleString("id-ID");
}

function statusLabel(status) {
    const labels = {
        pending_payment: "Menunggu Pembayaran",
        processing: "Sedang Diproses",
        shipped: "Dikirim",
        completed: "Selesai",
        cancelled: "Dibatalkan"
    };

    return labels[status] || status;
}

async function loadOrders() {
    const tbody = document.getElementById("ordersTableBody");

    tbody.innerHTML = `
        <tr>
            <td colspan="8" class="empty-row">Memuat pesanan...</td>
        </tr>
    `;

    try {
        const response = await fetch(`${API}/index.php`, {
            credentials: "same-origin"
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengambil pesanan.");
        }

        allOrders = result.data || [];

        updateStats();
        renderOrders();

    } catch (error) {
        console.error(error);

        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

function updateStats() {
    document.getElementById("statTotal").textContent =
        allOrders.length;

    document.getElementById("statPending").textContent =
        allOrders.filter(o => o.order_status === "pending_payment").length;

    document.getElementById("statProcessing").textContent =
        allOrders.filter(o => o.order_status === "processing").length;

    document.getElementById("statCompleted").textContent =
        allOrders.filter(o => o.order_status === "completed").length;
}

function renderOrders() {
    const tbody = document.getElementById("ordersTableBody");

    const keyword = document
        .getElementById("searchOrder")
        .value.toLowerCase();

    const statusFilter = document.getElementById("filterStatus").value;

    const filtered = allOrders.filter(order => {
        const matchesKeyword =
            String(order.order_number || "").toLowerCase().includes(keyword) ||
            String(order.recipient_name || "").toLowerCase().includes(keyword);

        const matchesStatus =
            !statusFilter || order.order_status === statusFilter;

        return matchesKeyword && matchesStatus;
    });

    if (!filtered.length) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-row">
                    Belum ada pesanan yang cocok.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map((order, index) => `
        <tr>
            <td>${index + 1}</td>

            <td>
                <strong>${escapeHTML(order.order_number)}</strong>
                <small>${Number(order.total_qty || 0)} produk</small>
            </td>

            <td>
                ${escapeHTML(order.recipient_name)}
                <small>${escapeHTML(order.recipient_phone)}</small>
            </td>

            <td>${rupiah(order.grand_total)}</td>

            <td>
                <span class="${
                    order.payment_status === "settlement"
                        ? "payment-paid"
                        : "payment-pending"
                }">
                    ${escapeHTML(order.payment_status || "Belum ada")}
                </span>
            </td>

            <td>
                <span class="status ${escapeHTML(order.order_status)}">
                    ${escapeHTML(statusLabel(order.order_status))}
                </span>
            </td>

            <td>${dateFormat(order.created_at)}</td>

            <td>
                <div class="action-buttons">
                    <button class="action-btn"
                        title="Detail"
                        onclick="showDetail('${escapeHTML(order.order_number)}')">
                        Lihat
                    </button>

                    <button class="action-btn"
                        title="Ubah status"
                        onclick="openStatusModal(${Number(order.id)})">
                        Edit
                    </button>
                </div>
            </td>
        </tr>
    `).join("");
}

function openStatusModal(orderId) {
    const order = allOrders.find(
        item => Number(item.id) === Number(orderId)
    );

    if (!order) return;

    document.getElementById("editOrderId").value = order.id;
    document.getElementById("editOrderStatus").value = order.order_status;
    document.getElementById("editOrderNote").value = "";

    document.getElementById("statusModal").style.display = "block";
}

async function saveOrderStatus() {
    const orderId = Number(
        document.getElementById("editOrderId").value
    );

    const status = document.getElementById("editOrderStatus").value;
    const note = document.getElementById("editOrderNote").value.trim();

    try {
        const response = await fetch(`${API}/update-status.php`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                order_id: orderId,
                status,
                note
            })
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengubah status.");
        }

        alert(result.message);
        closeModals();
        await loadOrders();

    } catch (error) {
        alert(error.message);
    }
}

async function showDetail(orderNumber) {
    const modal = document.getElementById("detailModal");
    const content = document.getElementById("detailContent");

    modal.style.display = "block";
    content.textContent = "Memuat detail pesanan...";

    try {
        const response = await fetch(
            `../orders/detail.php?order_number=${encodeURIComponent(orderNumber)}`,
            { credentials: "same-origin" }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengambil detail.");
        }

        const order = result.order;

        content.innerHTML = `
            <div class="detail-section">
                <strong>Nomor Pesanan</strong>
                <p>${escapeHTML(order.order_number)}</p>

                <strong>Penerima</strong>
                <p>${escapeHTML(order.recipient_name)}</p>

                <strong>Telepon</strong>
                <p>${escapeHTML(order.recipient_phone)}</p>

                <strong>Alamat Pengiriman</strong>
                <p>
                    ${escapeHTML(order.shipping_address)},
                    ${escapeHTML(order.district)},
                    ${escapeHTML(order.city)},
                    ${escapeHTML(order.province)},
                    ${escapeHTML(order.postal_code)}
                </p>
            </div>

            <div class="detail-section">
                <strong>Produk</strong>
                ${(result.items || []).map(item => `
                    <p>
                        ${escapeHTML(item.product_name_snapshot)}
                        (${Number(item.quantity)}x)
                        — ${rupiah(item.line_total)}
                    </p>
                `).join("")}
            </div>

            <div class="detail-section">
                <strong>Rincian Pembayaran</strong>
                <p>Subtotal: ${rupiah(order.subtotal)}</p>
                <p>Diskon: ${rupiah(order.discount)}</p>
                <p>Ongkir: ${rupiah(order.shipping_cost)}</p>
                <p><strong>Total: ${rupiah(order.grand_total)}</strong></p>
            </div>

            <div class="detail-section">
                <strong>Riwayat Status</strong>
                ${(result.history || []).map(item => `
                    <p>
                        ${escapeHTML(item.old_status || "Pesanan dibuat")}
                        → ${escapeHTML(item.new_status)}
                        <br>${escapeHTML(item.note || "")}
                        <br>${dateFormat(item.created_at)}
                    </p>
                `).join("") || "<p>Belum ada riwayat.</p>"}
            </div>

            <div class="detail-section">
                <strong>Riwayat Pembayaran</strong>
                ${(result.payments || []).map(payment => `
                    <p>
                        Referensi: ${escapeHTML(payment.payment_reference)}
                        <br>Metode: ${escapeHTML(payment.method)}
                        <br>Channel: ${escapeHTML(payment.payment_channel)}
                        <br>Jumlah: ${rupiah(payment.amount)}
                        <br>Status: ${escapeHTML(payment.payment_status)}
                    </p>
                `).join("") || "<p>Belum ada pembayaran.</p>"}
            </div>
        `;

    } catch (error) {
        content.textContent = error.message;
    }
}

function closeModals() {
    document.getElementById("detailModal").style.display = "none";
    document.getElementById("statusModal").style.display = "none";
}

async function logout() {
    if (!confirm("Apakah kamu yakin ingin logout?")) return;

    try {
        const response = await fetch("../auth/logout.php", {
            method: "POST",
            credentials: "same-origin"
        });

        if (response.ok) {
            window.location.href = "../../frontend/login.html";
        } else {
            alert("Logout gagal. Silakan coba lagi.");
        }
    } catch (error) {
        alert("Terjadi kesalahan saat logout.");
    }
}

document.getElementById("searchOrder")
    .addEventListener("input", renderOrders);

document.getElementById("filterStatus")
    .addEventListener("change", renderOrders);

loadOrders();
</script>

</body>
</html>
