document.addEventListener('DOMContentLoaded', loadOrders);

async function loadOrders() {
    const container = document.getElementById('order-list');

    try {
        const response = await fetch('../backend/orders/index.php', {
            credentials: 'same-origin'
        });

        const result = await response.json();

        if (!result.success) {
            container.textContent = result.message;
            return;
        }

        if (result.data.length === 0) {
            container.textContent = 'Belum ada pesanan.';
            return;
        }

        container.innerHTML = result.data.map(order => `
            <div class="order-card">
                <h3>${escapeHTML(order.order_number)}</h3>

                <p>Status:
                    <strong>${escapeHTML(order.order_status)}</strong>
                </p>

                <p>Total Produk: ${Number(order.total_items)}</p>

                <p>Total Pembayaran:
                    ${formatRupiah(order.grand_total)}
                </p>

                <a href="detail-pesanan.html?order_number=${encodeURIComponent(order.order_number)}">
                    Lihat Detail
                </a>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        container.textContent = 'Gagal memuat pesanan.';
    }
}

function formatRupiah(value) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(value) || 0);
}

function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    })[char]);
}