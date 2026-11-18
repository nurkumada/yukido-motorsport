
document.addEventListener('DOMContentLoaded', loadOrderDetail);

// =====================================
// 1. LOAD DETAIL PESANAN
// =====================================

async function loadOrderDetail() {
    const container = document.getElementById('order-detail');

    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('order_number');

    if (!container) return;

    if (!orderNumber) {
        container.textContent = 'Nomor pesanan tidak ditemukan.';
        return;
    }

    try {
        const response = await fetch(
            `../backend/orders/detail.php?order_number=${encodeURIComponent(orderNumber)}`,
            {
                method: 'GET',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            container.textContent =
                result.message || 'Gagal mengambil detail pesanan.';
            return;
        }

        renderOrderDetail(result);

    } catch (error) {
        console.error('Error:', error);
        container.textContent = 'Terjadi kesalahan saat memuat pesanan.';
    }
}


// =====================================
// 2. TAMPILKAN DETAIL PESANAN
// =====================================

function renderOrderDetail(result) {
    const container = document.getElementById('order-detail');

    const order = result.order;
    const items = result.items || [];
    const history = result.history || [];
    const payments = result.payments || [];

    container.innerHTML = `
        <div class="order-detail-container">

            <!-- INFORMASI PESANAN -->
            <section class="order-section">
                <h2>Pesanan ${escapeHTML(order.order_number)}</h2>

                <p>
                    Status Pesanan:
                    <strong class="order-status">
                        ${escapeHTML(order.order_status)}
                    </strong>
                </p>

                <p>
                    Tanggal Pesanan:
                    ${formatDate(order.created_at)}
                </p>
            </section>


            <!-- ALAMAT PENGIRIMAN -->
            <section class="order-section">
                <h3>Alamat Pengiriman</h3>

                <p>
                    <strong>
                        ${escapeHTML(order.recipient_name)}
                    </strong>
                </p>

                <p>
                    ${escapeHTML(order.recipient_phone)}
                </p>

                <p>
                    ${escapeHTML(order.recipient_email)}
                </p>

                <p>
                    ${escapeHTML(order.shipping_address)}
                </p>

                <p>
                    ${escapeHTML(order.district)},
                    ${escapeHTML(order.city)},
                    ${escapeHTML(order.province)}
                    ${escapeHTML(order.postal_code)}
                </p>

                <p>
                    Kurir:
                    ${escapeHTML(order.courier)}
                </p>
            </section>


            <!-- DAFTAR PRODUK -->
            <section class="order-section">
                <h3>Produk Pesanan</h3>

                ${
                    items.length
                    ? items.map(item => `
                        <div class="order-item">
                            <h4>
                                ${escapeHTML(item.product_name_snapshot)}
                            </h4>

                            <p>
                                SKU:
                                ${escapeHTML(item.sku_snapshot)}
                            </p>

                            <p>
                                Harga:
                                ${formatRupiah(item.unit_price)}
                            </p>

                            <p>
                                Jumlah:
                                ${Number(item.quantity)}
                            </p>

                            <p>
                                Subtotal:
                                ${formatRupiah(item.line_total)}
                            </p>

                            <p>
                                Garansi:
                                ${escapeHTML(item.warranty_type || '-')}
                            </p>

                            <p>
                                Masa Garansi:
                                ${Number(item.warranty_period_months || 0)}
                                bulan
                            </p>
                        </div>
                    `).join('')
                    : '<p>Tidak ada produk dalam pesanan.</p>'
                }
            </section>


            <!-- RINCIAN PEMBAYARAN PESANAN -->
            <section class="order-section">
                <h3>Rincian Total Pesanan</h3>

                <p>
                    Subtotal:
                    ${formatRupiah(order.subtotal)}
                </p>

                <p>
                    Diskon:
                    ${formatRupiah(order.discount)}
                </p>

                <p>
                    Ongkos Kirim:
                    ${formatRupiah(order.shipping_cost)}
                </p>

                <h3>
                    Total:
                    ${formatRupiah(order.grand_total)}
                </h3>
            </section>


            <!-- RIWAYAT STATUS PESANAN -->
            <section class="order-section">
                <h3>Riwayat Status Pesanan</h3>

                ${
                    history.length
                    ? history.map(item => `
                        <div class="status-history">
                            <strong>
                                ${escapeHTML(item.new_status)}
                            </strong>

                            <p>
                                ${
                                    item.old_status
                                    ? 'Status sebelumnya: ' +
                                      escapeHTML(item.old_status)
                                    : 'Status awal pesanan'
                                }
                            </p>

                            <p>
                                ${escapeHTML(item.note || '-')}
                            </p>

                            <small>
                                ${formatDate(item.created_at)}
                            </small>
                        </div>
                    `).join('')
                    : '<p>Belum ada riwayat perubahan status.</p>'
                }
            </section>


            <!-- RIWAYAT PEMBAYARAN -->
            <section class="order-section">
                <h3>Riwayat Pembayaran</h3>

                ${
                    payments.length
                    ? payments.map(payment => `
                        <div class="payment-card">

                            <p>
                                Referensi:
                                ${escapeHTML(payment.payment_reference)}
                            </p>

                            <p>
                                Provider:
                                ${escapeHTML(payment.provider)}
                            </p>

                            <p>
                                Metode:
                                ${escapeHTML(payment.method)}
                            </p>

                            <p>
                                Channel:
                                ${escapeHTML(payment.payment_channel)}
                            </p>

                            <p>
                                Jumlah:
                                ${formatRupiah(payment.amount)}
                            </p>

                            <p>
                                Status:
                                <strong>
                                    ${escapeHTML(payment.payment_status)}
                                </strong>
                            </p>

                            <p>
                                Waktu Pembayaran:
                                ${formatDate(payment.paid_at)}
                            </p>

                            <p>
                                Batas Pembayaran:
                                ${formatDate(payment.expires_at)}
                            </p>

                            <p>
                                Dibuat:
                                ${formatDate(payment.created_at)}
                            </p>

                        </div>
                    `).join('')
                    : '<p>Belum ada data pembayaran.</p>'
                }
            </section>


            <!-- CATATAN PESANAN -->
            ${
                order.notes
                ? `
                    <section class="order-section">
                        <h3>Catatan Pesanan</h3>
                        <p>${escapeHTML(order.notes)}</p>
                    </section>
                `
                : ''
            }

        </div>
    `;
}


// =====================================
// 3. FORMAT RUPIAH
// =====================================

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}


// =====================================
// 4. FORMAT TANGGAL
// =====================================

function formatDate(value) {
    if (!value) return '-';

    const date = new Date(value.replace(' ', 'T'));

    if (isNaN(date.getTime())) {
        return escapeHTML(value);
    }

    return date.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}


// =====================================
// 5. ESCAPE HTML
// =====================================

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}
