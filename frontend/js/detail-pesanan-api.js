document.addEventListener('DOMContentLoaded', loadOrderDetail);

const STATUS_LABELS = {
    pending_payment: 'Menunggu Pembayaran',
    pending: 'Menunggu Pembayaran',
    unpaid: 'Belum Dibayar',
    paid: 'Sudah Dibayar',
    settlement: 'Lunas',
    processing: 'Sedang Diproses',
    shipped: 'Sedang Dikirim',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    expired: 'Kedaluwarsa',
    failed: 'Gagal'
};

function formatStatusLabel(status) {
    if (!status) return '-';
    const key = String(status).toLowerCase();
    return STATUS_LABELS[key] || String(status).toUpperCase();
}

function sanitizeOrderText(text) {
    if (!text) return '-';
    return String(text)
        .replace(/pembayaran\s+simulasi\s+berhasil\s+dikonfirmasi\.?/gi, 'Pembayaran berhasil dikonfirmasi.')
        .replace(/\bsimulasi\b/gi, '')
        .replace(/\bsandbox\b/gi, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
}

function getDetailContainer() {
    return (
        document.getElementById('order-detail') ||
        document.getElementById('orderDetailContainer')
    );
}

// =====================================
// 1. LOAD DETAIL PESANAN
// =====================================
async function loadOrderDetail() {
    const container = getDetailContainer();
    if (!container) return;

    const params = new URLSearchParams(window.location.search);
    let orderNumber =
        params.get('order_number') ||
        params.get('order') ||
        params.get('no') ||
        sessionStorage.getItem('yukido_selected_order') ||
        '';
    const orderId = params.get('id') || params.get('order_id') || '';

    try {
        const listRes = await fetch('../backend/orders/index.php', {
            method: 'GET',
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' }
        });

        if (listRes.status === 401) {
            container.innerHTML = `
                <div class="od-card od-state-box">
                    <h3 class="od-state-title">Silakan Login Terlebih Dahulu</h3>
                    <p class="od-state-desc">Masuk ke akun YUKIDO Anda untuk melihat detail pesanan.</p>
                    <a href="login.html" class="od-btn-primary">Login Sekarang</a>
                </div>
            `;
            return;
        }

        const listJson = await listRes.json();
        const list = Array.isArray(listJson)
            ? listJson
            : (listJson.orders || listJson.data || []);

        if (!orderNumber && orderId) {
            const matched = list.find(o => String(o.id) === String(orderId));
            if (matched && matched.order_number) {
                orderNumber = matched.order_number;
            }
        }

        if (!orderNumber && !orderId && list.length > 0) {
            orderNumber = list[0].order_number || '';
        }

        if (!orderNumber && !orderId) {
            container.innerHTML = `
                <div class="od-card od-state-box">
                    <i class="fas fa-box-open od-state-icon"></i>
                    <h3 class="od-state-title">Belum Ada Pesanan</h3>
                    <p class="od-state-desc">Anda belum memiliki riwayat pesanan. Silakan checkout produk terlebih dahulu.</p>
                    <a href="produk.html" class="od-btn-primary">Belanja Sekarang</a>
                </div>
            `;
            return;
        }

        const queryParam = orderNumber
            ? `order_number=${encodeURIComponent(orderNumber)}`
            : `id=${encodeURIComponent(orderId)}`;

        const response = await fetch(
            `../backend/orders/detail.php?${queryParam}`,
            {
                method: 'GET',
                credentials: 'same-origin',
                headers: { 'Accept': 'application/json' }
            }
        );

        const result = await response.json();

        if (!response.ok || !result.success) {
            container.innerHTML = `
                <div class="od-card od-state-box">
                    <i class="fas fa-exclamation-triangle od-state-icon"></i>
                    <h3 class="od-state-title">Gagal Mengambil Detail Pesanan</h3>
                    <p class="od-state-desc">${escapeHTML(result.message || 'Data pesanan tidak ditemukan.')}</p>
                    <a href="login.html" class="od-btn-primary">Kembali ke Pesanan</a>
                </div>
            `;
            return;
        }

        sessionStorage.removeItem('yukido_selected_order');

        renderOrderDetail(result);

    } catch (error) {
        console.error('Error:', error);
        container.innerHTML = `
            <div class="od-card od-state-box">
                <i class="fas fa-exclamation-triangle od-state-icon"></i>
                <h3 class="od-state-title">Terjadi Kesalahan</h3>
                <p class="od-state-desc">Terjadi kesalahan saat memuat pesanan: ${escapeHTML(error.message)}</p>
            </div>
        `;
    }
}

// =====================================
// 2. TAMPILKAN DETAIL PESANAN
// =====================================
function renderOrderDetail(result) {
    const container = getDetailContainer();
    if (!container) return;

    const order = result.order || result.data || {};
    const items = result.items || order.items || [];
    const history = result.history || [];
    const payments = result.payments || [];

    const fullAddress = [
        order.shipping_address,
        order.district,
        order.city,
        order.province,
        order.postal_code
    ].filter(Boolean).join(', ');

    container.innerHTML = `
        <div class="order-detail-container">

            <!-- INFORMASI PESANAN -->
            <section class="od-card">
                <div class="od-header">
                    <div>
                        <div class="od-label">NOMOR PESANAN</div>
                        <h2 class="od-order-number">${escapeHTML(order.order_number)}</h2>
                        <div class="od-order-date">Tanggal Pesanan: ${formatDate(order.created_at)}</div>
                    </div>
                    <div>
                        <span class="od-status-badge">${escapeHTML(formatStatusLabel(order.order_status))}</span>
                    </div>
                </div>

                <!-- ALAMAT PENGIRIMAN -->
                <div class="od-grid">
                    <div>
                        <div class="od-label">Penerima</div>
                        <div class="od-value">${escapeHTML(order.recipient_name)}</div>
                        <div class="od-sub-value">${escapeHTML(order.recipient_phone || '-')}</div>
                        <div class="od-sub-value">${escapeHTML(order.recipient_email || '-')}</div>
                    </div>
                    <div>
                        <div class="od-label">Kurir Pengiriman</div>
                        <div class="od-value">${escapeHTML((order.courier || '-').toUpperCase())}</div>
                    </div>
                </div>

                <div class="od-address-box">
                    <div class="od-label">Alamat Pengiriman</div>
                    <div class="od-value od-address-text">${escapeHTML(fullAddress || '-')}</div>
                </div>
            </section>

            <!-- DAFTAR PRODUK -->
            <section class="od-card">
                <h3 class="od-section-title">Produk Pesanan (${items.length})</h3>

                ${
                    items.length
                    ? items.map(item => {
                        const warrantyLabel = item.warranty_type === 'lifetime'
                            ? 'Garansi Seumur Hidup'
                            : item.warranty_type === 'limited'
                                ? `Garansi ${Number(item.warranty_period_months || 0)} Bulan`
                                : (item.warranty_type || 'Tanpa Garansi');

                        return `
                            <div class="od-item-row">
                                <div>
                                    <div class="od-item-name">${escapeHTML(item.product_name_snapshot || item.name)}</div>
                                    <div class="od-item-qty">
                                        SKU: ${escapeHTML(item.sku_snapshot || item.sku || '-')} &bull;
                                        ${Number(item.quantity)} x ${formatRupiah(item.unit_price || item.price)}
                                    </div>
                                    <div class="od-payment-status">
                                        <i class="fas fa-shield-alt"></i> ${escapeHTML(warrantyLabel)}
                                    </div>
                                </div>
                                <div class="od-item-total">
                                    ${formatRupiah(item.line_total || (Number(item.unit_price || 0) * Number(item.quantity || 1)))}
                                </div>
                            </div>
                        `;
                    }).join('')
                    : '<p class="od-state-desc">Tidak ada produk dalam pesanan.</p>'
                }
            </section>

            <!-- RINCIAN PEMBAYARAN PESANAN -->
            <section class="od-card">
                <h3 class="od-section-title">Rincian Total Pesanan</h3>

                <div class="od-summary-row">
                    <span>Subtotal</span>
                    <span>${formatRupiah(order.subtotal)}</span>
                </div>

                <div class="od-summary-row od-summary-discount">
                    <span>Diskon</span>
                    <span>-${formatRupiah(order.discount)}</span>
                </div>

                <div class="od-summary-row">
                    <span>Ongkos Kirim</span>
                    <span>${formatRupiah(order.shipping_cost)}</span>
                </div>

                <div class="od-summary-total">
                    <span>Total Pembayaran</span>
                    <span>${formatRupiah(order.grand_total)}</span>
                </div>
            </section>

            <!-- RIWAYAT PEMBAYARAN -->
            <section class="od-card">
                <h3 class="od-section-title">Riwayat Pembayaran</h3>

                ${
                    payments.length
                    ? payments.map(payment => `
                        <div class="od-subcard">
                            <div class="od-subcard-top">
                                <strong>${escapeHTML(payment.payment_reference || '-')}</strong>
                                <span class="od-status-badge">${escapeHTML(formatStatusLabel(payment.payment_status))}</span>
                            </div>
                            <div class="od-grid">
                                <div>
                                    <div class="od-label">Provider / Metode</div>
                                    <div class="od-value">${escapeHTML(sanitizeOrderText(payment.provider || '-').toUpperCase())} (${escapeHTML(payment.method || '-')})</div>
                                </div>
                                <div>
                                    <div class="od-label">Channel</div>
                                    <div class="od-value">${escapeHTML((payment.payment_channel || '-').toUpperCase())}</div>
                                </div>
                                <div>
                                    <div class="od-label">Jumlah</div>
                                    <div class="od-value">${formatRupiah(payment.amount)}</div>
                                </div>
                            </div>
                            <div class="od-sub-value" style="margin-top:10px;">
                                Dibuat: ${formatDate(payment.created_at)} &bull;
                                Dibayar: ${formatDate(payment.paid_at)} &bull;
                                Batas Bayar: ${formatDate(payment.expires_at)}
                            </div>
                        </div>
                    `).join('')
                    : '<p class="od-state-desc">Belum ada data pembayaran.</p>'
                }
            </section>

            <!-- RIWAYAT STATUS PESANAN -->
            <section class="od-card">
                <h3 class="od-section-title">Riwayat Status Pesanan</h3>

                ${
                    history.length
                    ? history.map(item => `
                        <div class="od-history-item">
                            <div class="od-subcard-top">
                                <strong>${escapeHTML(formatStatusLabel(item.new_status))}</strong>
                                <small class="od-order-date">${formatDate(item.created_at)}</small>
                            </div>
                            <div class="od-sub-value">
                                ${
                                    item.old_status
                                    ? 'Status sebelumnya: ' + escapeHTML(formatStatusLabel(item.old_status))
                                    : 'Status awal pesanan'
                                }
                            </div>
                            <div class="od-sub-value">${escapeHTML(sanitizeOrderText(item.note || '-'))}</div>
                        </div>
                    `).join('')
                    : '<p class="od-state-desc">Belum ada riwayat perubahan status.</p>'
                }
            </section>

            <!-- CATATAN PESANAN -->
            ${
                order.notes
                ? `
                    <section class="od-card">
                        <h3 class="od-section-title">Catatan Pesanan</h3>
                        <p class="od-value od-address-text">${escapeHTML(sanitizeOrderText(order.notes))}</p>
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

    const date = new Date(String(value).replace(' ', 'T'));

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