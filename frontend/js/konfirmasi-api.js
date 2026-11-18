document.addEventListener("DOMContentLoaded", async () => {
    const CHECKOUT_API = "../backend/checkout";
    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get("order");

    if (!orderNumber) {
        alert("Nomor pesanan tidak ditemukan.");
        window.location.href = "index.html";
        return;
    }

    const formatRupiah = (val) =>
        new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(val) || 0);

    try {
        const res = await fetch(`${CHECKOUT_API}/detail.php?order=${encodeURIComponent(orderNumber)}`, {
            credentials: "same-origin"
        });
        const data = await res.json();

        if (!res.ok || !data.success) {
            throw new Error(data.message || "Gagal memuat detail pesanan.");
        }

        const order = data.order;
        const provider = order.provider_response || {};

        // 1. Tampilkan Nomor Pesanan & Total
        document.getElementById("pgOrderId").textContent = order.order_number;
        document.getElementById("pgTotalAmount").textContent = formatRupiah(order.grand_total);

        // 2. Status Pembayaran
        const statusBadge = document.getElementById("pgStatusBadge");
        const btnSimulate = document.getElementById("btnSimulatePaid");
        const countdownEl = document.getElementById("countdown");

        if (order.order_status === "paid" || order.payment_status === "settlement") {
            statusBadge.className = "pg-status-badge paid";
            statusBadge.style.background = "rgba(0, 204, 102, 0.15)";
            statusBadge.style.color = "#00cc66";
            statusBadge.style.borderColor = "#00cc66";
            statusBadge.innerHTML = `<i class="fas fa-check-circle"></i> PEMBAYARAN LUNAS`;

            if (btnSimulate) btnSimulate.style.display = "none";
            if (countdownEl) {
                countdownEl.style.color = "#00cc66";
                countdownEl.textContent = "TERVERIFIKASI";
            }
        } else if (order.expires_at && countdownEl) {
            const expireTime = new Date(order.expires_at.replace(" ", "T")).getTime();
            const timer = setInterval(() => {
                const diff = Math.max(0, Math.floor((expireTime - Date.now()) / 1000));
                const h = String(Math.floor(diff / 3600)).padStart(2, "0");
                const m = String(Math.floor((diff % 3600) / 60)).padStart(2, "0");
                const s = String(diff % 60).padStart(2, "0");
                countdownEl.textContent = `${h}:${m}:${s}`;

                if (diff <= 0) {
                    clearInterval(timer);
                    countdownEl.textContent = "WAKTU HABIS";
                }
            }, 1000);
        }

        // 3. Tampilan Sesuai Metode Pembayaran (VA, QRIS, E-Wallet, Debit/Kredit)
        const methodNameEl = document.getElementById("pgMethodName");
        const vaArea = document.getElementById("pgVaArea");
        const qrisArea = document.getElementById("pgQrisArea");
        const codeLabel = document.getElementById("pgCodeLabel");
        const vaNumberEl = document.getElementById("vaNumber");
        const btnCopy = document.getElementById("btnCopyPgCode");
        const guideList = document.getElementById("pgInstructionList");

        if (order.method === "virtual_account") {
            methodNameEl.textContent = `${order.payment_channel} Virtual Account`;
            vaArea.style.display = "block";
            qrisArea.style.display = "none";
            codeLabel.textContent = `Nomor Virtual Account ${order.payment_channel}:`;

            const formattedVa = (provider.va_number || "-").replace(/(.{4})/g, "$1 ").trim();
            vaNumberEl.textContent = formattedVa;

            guideList.innerHTML = `
                <li>Buka aplikasi Mobile Banking / ATM <strong>${order.payment_channel}</strong>.</li>
                <li>Pilih menu <strong>Transfer &gt; Virtual Account</strong>.</li>
                <li>Masukkan nomor Virtual Account <strong>${formattedVa}</strong> dan pastikan nominal sesuai.</li>
                <li>Status pesanan otomatis berubah menjadi <strong>Lunas</strong> setelah pembayaran berhasil.</li>
            `;
        } else if (order.method === "qris") {
            methodNameEl.textContent = "QRIS Instant (Semua E-Wallet & m-Banking)";
            vaArea.style.display = "none";
            qrisArea.style.display = "block";

            const qrPayload = provider.qris_payload || order.order_number;
            document.getElementById("pgQrisImg").src =
                `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrPayload)}`;
            document.getElementById("pgQrisNmid").textContent = `Ref: ${order.payment_reference}`;

            guideList.innerHTML = `
                <li>Buka aplikasi GoPay, OVO, DANA, ShopeePay, atau Mobile Banking Anda.</li>
                <li>Pilih menu <strong>Scan / Bayar QRIS</strong>.</li>
                <li>Arahkan kamera ke kode QR di atas dan periksa nama merchant <strong>PT YUKIDO POWER TEKNIK</strong>.</li>
                <li>Masukkan PIN Anda untuk menyelesaikan pembayaran.</li>
            `;
        } else if (order.method === "ewallet") {
            methodNameEl.textContent = `E-Wallet ${order.payment_channel}`;
            vaArea.style.display = "block";
            qrisArea.style.display = "none";
            codeLabel.textContent = `Kode Pembayaran ${order.payment_channel} (${provider.ewallet_phone || order.recipient_phone}):`;
            vaNumberEl.textContent = provider.payment_code || order.payment_reference;

            guideList.innerHTML = `
                <li>Buka aplikasi <strong>${order.payment_channel}</strong> pada nomor <strong>${provider.ewallet_phone || order.recipient_phone}</strong>.</li>
                <li>Cek notifikasi tagihan masuk atau masukkan kode pembayaran di atas.</li>
                <li>Konfirmasi nominal <strong>${formatRupiah(order.grand_total)}</strong> dan masukkan PIN E-Wallet.</li>
            `;
        } else {
            methodNameEl.textContent = "Kartu Debit Online / Kredit";
            vaArea.style.display = "block";
            qrisArea.style.display = "none";
            codeLabel.textContent = `Kartu Terdaftar (${provider.card_holder || order.recipient_name}):`;
            vaNumberEl.textContent = provider.card_masked || "**** **** **** 4242";
            if (btnCopy) btnCopy.style.display = "none";

            guideList.innerHTML = `
                <li>Transaksi kartu debit/kredit Anda telah diotorisasi dengan enkripsi 3D-Secure.</li>
                <li>Klik tombol konfirmasi di bawah untuk menyelesaikan verifikasi pembayaran sandbox.</li>
            `;
        }

        // 4. Rincian Barang & Alamat Pengiriman
        const itemsContainer = document.getElementById("pgOrderItems");
        itemsContainer.innerHTML = order.items.map(item => `
            <div style="display:flex; justify-content:space-between; padding:5px 0; border-bottom:1px solid #242424;">
                <span>${item.product_name_snapshot} (${item.quantity}x)</span>
                <strong>${formatRupiah(item.line_total)}</strong>
            </div>
        `).join("") + `
            <div style="display:flex; justify-content:space-between; padding:6px 0; color:#aaa;">
                <span>Ongkos Kirim (${order.courier})</span>
                <span>${formatRupiah(order.shipping_cost)}</span>
            </div>
        `;

        document.getElementById("pgShippingInfo").innerHTML = `
            <strong>Penerima:</strong> ${order.recipient_name} (${order.recipient_phone})<br>
            <strong>Alamat:</strong> ${order.shipping_address}, ${order.district || ""} ${order.city || ""} ${order.province || ""} ${order.postal_code || ""}
        `;

        // 5. Tombol Salin Nomor VA / Kode Bayar
        btnCopy?.addEventListener("click", () => {
            const rawCode = vaNumberEl.textContent.replace(/\s+/g, "");
            navigator.clipboard.writeText(rawCode).then(() => {
                const orig = btnCopy.innerHTML;
                btnCopy.innerHTML = `<i class="fas fa-check"></i> Disalin`;
                setTimeout(() => { btnCopy.innerHTML = orig; }, 2000);
            });
        });

        // 6. Tombol Simulasi Sudah Bayar -> Update Database ke 'paid' / 'settlement'
        btnSimulate?.addEventListener("click", async () => {
            const origText = btnSimulate.innerHTML;
            btnSimulate.disabled = true;
            btnSimulate.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Memverifikasi Pembayaran...`;

            try {
                const payRes = await fetch(`${CHECKOUT_API}/confirm_payment.php`, {
                    method: "POST",
                    credentials: "same-origin",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ order_number: order.order_number })
                });
                const payData = await payRes.json();

                if (!payRes.ok || !payData.success) {
                    throw new Error(payData.message || "Gagal mengonfirmasi pembayaran.");
                }

                alert("Pembayaran berhasil dikonfirmasi! Status pesanan kini LUNAS.");
                window.location.reload();
            } catch (err) {
                alert(err.message);
                btnSimulate.disabled = false;
                btnSimulate.innerHTML = origText;
            }
        });

    } catch (err) {
        alert(err.message);
    }
});