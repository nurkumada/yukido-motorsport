
document.addEventListener("DOMContentLoaded", async () => {
    const CHECKOUT_API = "../backend/checkout";
    const STORAGE_KEY = "yukido_checkout_items";

    // =====================================
    // 1. AMBIL PRODUK YANG DIPILIH
    // =====================================

    let selectedIds = [];

    try {
        selectedIds = JSON.parse(
            sessionStorage.getItem(STORAGE_KEY) || "[]"
        );
    } catch (error) {
        console.error("Data checkout tidak valid:", error);
    }

    selectedIds = Array.isArray(selectedIds)
        ? [...new Set(selectedIds.map(Number).filter(id =>
            Number.isInteger(id) && id > 0
        ))]
        : [];

    if (selectedIds.length === 0) {
        alert("Pilih produk terlebih dahulu di halaman keranjang.");
        window.location.href = "keranjang.html";
        return;
    }

    let checkoutItems = [];
    let subtotal = 0;
    let totalWeightGram = 0;

    let selectedCourier = "JNE Trucking";
    let calculatedShippingCost = 35000;
    let discountAmount = 0;

    let activeMethod = "virtual_account";
    let activeChannel = "BCA";

    const getValue = id =>
        document.getElementById(id)?.value?.trim() || "";

    const formatRupiah = value => {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(value) || 0);
    };

    const escapeHTML = value => {
        return String(value ?? "").replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    };

    function resolveImage(path) {
        if (!path) return "images/yukido.png";

        if (/^https?:\/\//i.test(path)) {
            return path;
        }

        path = path.replace(/\\/g, "/").replace(/^\.?\//, "");

        return path.startsWith("/") ? path : `../${path}`;
    }

    // =====================================
    // 2. AMBIL DATA CHECKOUT DARI BACKEND
    // =====================================

    try {
        const response = await fetch(`${CHECKOUT_API}/items.php`, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cart_item_ids: selectedIds
            })
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || "Gagal memuat produk checkout.");
        }

        if (!Array.isArray(data.items) || data.items.length === 0) {
            throw new Error("Produk checkout tidak ditemukan.");
        }

        checkoutItems = data.items;
        subtotal = Number(data.subtotal) || 0;
        totalWeightGram = Number(data.total_weight_gram) || 0;

        // Auto-fill profil penerima
        if (data.user) {
            const nameInput = document.getElementById("recipientName");
            const phoneInput = document.getElementById("recipientPhone");
            const emailInput = document.getElementById("recipientEmail");
            const ewalletInput = document.getElementById("ewalletPhone");

            if (nameInput && data.user.full_name) {
                nameInput.value = data.user.full_name;
            }

            if (phoneInput && data.user.phone) {
                phoneInput.value = data.user.phone;
            }

            if (emailInput && data.user.email) {
                emailInput.value = data.user.email;
            }

            if (ewalletInput && data.user.phone) {
                ewalletInput.value = data.user.phone;
            }
        }

        renderSummaryItems(data.total_qty);
        updateShippingPrices();
        recalculateTotals();
        updateVaPreview();

    } catch (error) {
        console.error("Checkout Error:", error);
        alert(error.message);
        window.location.href = "keranjang.html";
        return;
    }

    // =====================================
    // 3. TAMPILKAN PRODUK CHECKOUT
    // =====================================

    function renderSummaryItems(totalQty) {
        const listEl = document.getElementById("checkoutItemsList");
        const badgeEl = document.getElementById("summaryItemBadge");
        const qtyEl = document.getElementById("summaryTotalQty");

        if (!listEl) {
            console.error("Elemen checkoutItemsList tidak ditemukan.");
            return;
        }

        if (badgeEl) {
            badgeEl.textContent =
                `${checkoutItems.length} Jenis (${totalQty} Unit)`;
        }

        if (qtyEl) {
            qtyEl.textContent = totalQty;
        }

        listEl.innerHTML = checkoutItems.map(item => `
            <div class="sum-item">
                <img
                    src="${escapeHTML(resolveImage(item.image_path))}"
                    alt="${escapeHTML(item.name)}"
                    onerror="this.onerror=null;this.src='images/yukido.png'"
                >

                <div>
                    <span>${escapeHTML(item.name)}</span>

                    <span class="sum-qty">
                        ${Number(item.quantity)}x Unit
                        • SKU: ${escapeHTML(item.sku)}
                    </span>
                </div>

                <span class="sum-price">
                    ${formatRupiah(item.line_total)}
                </span>
            </div>
        `).join("");
    }

    // =====================================
    // 4. HITUNG ONGKIR
    // =====================================

    function updateShippingPrices() {
        const weightKg = Math.max(
            1,
            Math.ceil(totalWeightGram / 1000)
        );

        const weightBadge = document.getElementById("weightBadge");

        if (weightBadge) {
            weightBadge.innerHTML = `
                <i class="fas fa-weight-hanging"></i>
                BERAT TOTAL: ${(totalWeightGram / 1000).toFixed(1)} KG
                (${weightKg} Kg)
            `;
        }

        document.querySelectorAll(
            "#shippingGrid .shipping-card"
        ).forEach(card => {
            const base = Number(card.dataset.baseCost) || 35000;
            const cost = base + ((weightKg - 1) * 5000);

            card.dataset.finalCost = cost;

            const priceSpan = card.querySelector(".shipping-price");

            if (priceSpan) {
                priceSpan.textContent = formatRupiah(cost);
            }

            if (card.classList.contains("active")) {
                selectedCourier = card.dataset.courier;
                calculatedShippingCost = cost;
            }
        });
    }

    document.querySelectorAll(
        "#shippingGrid .shipping-card"
    ).forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(
                "#shippingGrid .shipping-card"
            ).forEach(item => {
                item.classList.remove("active");

                const icon = item.querySelector(".shipping-top i");

                if (icon) {
                    icon.className = "fas fa-circle-notch";
                    icon.style.color = "var(--text-muted)";
                }
            });

            card.classList.add("active");

            const activeIcon = card.querySelector(".shipping-top i");

            if (activeIcon) {
                activeIcon.className = "fas fa-check-circle";
                activeIcon.style.color = "var(--red-primary)";
            }

            selectedCourier = card.dataset.courier;
            calculatedShippingCost =
                Number(card.dataset.finalCost) || 35000;

            recalculateTotals();
        });
    });

    // =====================================
    // 5. HITUNG TOTAL TAGIHAN
    // =====================================

    function recalculateTotals() {
        const grandTotal = Math.max(
            0,
            subtotal + calculatedShippingCost - discountAmount
        );

        const subtotalEl = document.getElementById("summarySubtotal");
        const courierEl = document.getElementById("summaryCourierName");
        const shippingEl = document.getElementById("summaryShippingCost");
        const discountEl = document.getElementById("summaryDiscount");
        const totalEl = document.getElementById("summaryGrandTotal");

        if (subtotalEl) {
            subtotalEl.textContent = formatRupiah(subtotal);
        }

        if (courierEl) {
            courierEl.textContent = selectedCourier;
        }

        if (shippingEl) {
            shippingEl.textContent = formatRupiah(calculatedShippingCost);
        }

        if (discountEl) {
            discountEl.textContent = `-${formatRupiah(discountAmount)}`;
        }

        if (totalEl) {
            totalEl.textContent = formatRupiah(grandTotal);
        }
    }

    // =====================================
    // 6. PILIH METODE PEMBAYARAN
    // =====================================

    document.querySelectorAll(
        "#paymentTabs .pay-tab"
    ).forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll(
                "#paymentTabs .pay-tab"
            ).forEach(item => item.classList.remove("active"));

            tab.classList.add("active");

            activeMethod = tab.dataset.method;
            const targetId = tab.dataset.target;

            document.querySelectorAll(
                ".payment-content"
            ).forEach(panel => {
                panel.style.display =
                    panel.id === targetId ? "block" : "none";
            });

            if (activeMethod === "virtual_account") {
                const bank = document.querySelector(
                    "#vaBankGrid .bank-card.active"
                );

                activeChannel = bank
                    ? bank.dataset.channel
                    : "BCA";

            } else if (activeMethod === "qris") {
                activeChannel = "QRIS";

            } else if (activeMethod === "ewallet") {
                const wallet = document.querySelector(
                    "#ewalletGrid .bank-card.active"
                );

                activeChannel = wallet
                    ? wallet.dataset.channel
                    : "GoPay";

            } else if (
                activeMethod === "debit_card" ||
                activeMethod === "credit_card"
            ) {
                activeChannel = "Debit/Credit Card";
            }
        });
    });

    // =====================================
    // 7. PILIH BANK VIRTUAL ACCOUNT
    // =====================================

    function updateVaPreview() {
        const activeBank = document.querySelector(
            "#vaBankGrid .bank-card.active"
        );

        const prefix = activeBank
            ? activeBank.dataset.prefix
            : "8271";

        const bankName = activeBank
            ? activeBank.dataset.channel
            : "BCA";

        const phone = (
            getValue("recipientPhone") || "081234567890"
        ).replace(/\D/g, "");

        const rawVa = (
            prefix + phone.padEnd(12, "0")
        ).slice(0, 16);

        const formattedVa = rawVa
            .replace(/(.{4})/g, "$1 ")
            .trim();

        const labelEl = document.getElementById("vaBankLabel");
        const numberEl = document.getElementById("vaNumber");

        if (labelEl) {
            labelEl.innerHTML = `
                <i class="fas fa-circle"
                   style="color:#00cc66;font-size:8px;"></i>
                Nomor Akun Virtual ${escapeHTML(bankName)}
            `;
        }

        if (numberEl) {
            numberEl.textContent = formattedVa;
        }
    }

    document.querySelectorAll(
        "#vaBankGrid .bank-card"
    ).forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(
                "#vaBankGrid .bank-card"
            ).forEach(item => item.classList.remove("active"));

            card.classList.add("active");

            activeChannel = card.dataset.channel;
            updateVaPreview();
        });
    });

    document.getElementById("recipientPhone")
        ?.addEventListener("input", updateVaPreview);

    // =====================================
    // 8. PILIH E-WALLET
    // =====================================

    document.querySelectorAll(
        "#ewalletGrid .bank-card"
    ).forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll(
                "#ewalletGrid .bank-card"
            ).forEach(item => item.classList.remove("active"));

            card.classList.add("active");

            activeChannel = card.dataset.channel;
        });
    });

    // =====================================
    // 9. FORMAT NOMOR KARTU
    // =====================================

    document.getElementById("cardNumber")
        ?.addEventListener("input", event => {
            const value = event.target.value
                .replace(/\D/g, "")
                .slice(0, 16);

            event.target.value = value
                .replace(/(.{4})/g, "$1 ")
                .trim();
        });

    // =====================================
    // 10. BUAT PESANAN
    // =====================================

    const btnSubmit = document.getElementById("btnSubmitOrder");

    btnSubmit?.addEventListener("click", async event => {
        event.preventDefault();

        const recipientName = getValue("recipientName");
        const recipientPhone = getValue("recipientPhone");
        const recipientEmail = getValue("recipientEmail");
        const shippingAddress = getValue("shippingAddress");

        const province = getValue("province");
        const city = getValue("city");
        const district = getValue("district");
        const postalCode = getValue("postalCode");
        const notes = getValue("orderNotes");

        if (
            !recipientName ||
            !recipientPhone ||
            !shippingAddress
        ) {
            alert(
                "Mohon lengkapi nama penerima, nomor telepon, dan alamat pengiriman."
            );
            return;
        }

        const payload = {
            cart_item_ids: selectedIds,
            recipient_name: recipientName,
            recipient_phone: recipientPhone,
            recipient_email: recipientEmail,
            shipping_address: shippingAddress,
            province,
            city,
            district,
            postal_code: postalCode,
            courier: selectedCourier,
            shipping_cost: calculatedShippingCost,
            discount: discountAmount,
            notes,
            method: activeMethod,
            payment_channel: activeChannel
        };

        if (activeMethod === "ewallet") {
            const ewPhone = getValue("ewalletPhone");

            if (!ewPhone) {
                alert("Masukkan nomor HP yang terdaftar pada E-Wallet.");
                return;
            }

            payload.ewallet_phone = ewPhone;
        }

        if (
            activeMethod === "debit_card" ||
            activeMethod === "credit_card"
        ) {
            const cardNum = getValue("cardNumber").replace(/\s/g, "");
            const cardHolder = getValue("cardHolder");
            const cardExpiry = getValue("cardExpiry");
            const cardCvv = getValue("cardCvv");

            if (
                cardNum.length < 16 ||
                !cardHolder ||
                cardExpiry.length < 5 ||
                cardCvv.length < 3
            ) {
                alert(
                    "Lengkapi data kartu: nomor 16 digit, nama pemegang, masa berlaku, dan CVV."
                );
                return;
            }

            payload.card_number = cardNum;
            payload.card_holder = cardHolder;
        }

        const originalHTML = btnSubmit.innerHTML;

        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `
            <i class="fas fa-spinner fa-spin"></i>
            MEMPROSES PESANAN...
        `;

        try {
            const response = await fetch(
                `${CHECKOUT_API}/create.php`,
                {
                    method: "POST",
                    credentials: "same-origin",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload)
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Gagal membuat pesanan."
                );
            }

            // Hapus pilihan checkout setelah pesanan berhasil
            sessionStorage.removeItem(STORAGE_KEY);

            // Pindah ke halaman konfirmasi
            window.location.href =
                `konfirmasi.html?order=${encodeURIComponent(result.order_number)}`;

        } catch (error) {
            console.error("Create Order Error:", error);

            alert(error.message);

            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalHTML;
        }
    });
});
