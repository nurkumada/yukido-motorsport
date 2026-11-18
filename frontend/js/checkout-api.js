document.addEventListener("DOMContentLoaded", async () => {
    const CHECKOUT_API = "../backend/checkout";
    const rawIds = sessionStorage.getItem("yukido_checkout_items");
    const selectedIds = rawIds ? JSON.parse(rawIds) : [];

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        alert("Pilih produk terlebih dahulu di halaman keranjang.");
        window.location.href = "keranjang.html";
        return;
    }

    let checkoutItems = [];
    let subtotal = 0;
    let totalWeightGram = 0;
    let selectedCourier = "JNE Trucking";
    let baseShippingCost = 35000;
    let calculatedShippingCost = 35000;
    let discountAmount = 0;

    let activeMethod = "virtual_account";
    let activeChannel = "BCA";

    function formatRupiah(val) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(val) || 0);
    }

    function resolveImage(path) {
        if (!path) return "images/yukido.png";
        if (/^https?:\/\//i.test(path)) return path;
        return path.replace(/\\/g, "/").replace(/^\.?\//, "");
    }

    // 1. Ambil produk terpilih dari backend
    try {
        const res = await fetch(`${CHECKOUT_API}/items.php`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart_item_ids: selectedIds })
        });
        const data = await res.json();

        if (!res.ok || !data.success || !data.items.length) {
            throw new Error(data.message || "Produk checkout tidak ditemukan.");
        }

        checkoutItems = data.items;
        subtotal = Number(data.subtotal);
        totalWeightGram = Number(data.total_weight_gram);

        // Auto-fill form penerima dari data akun user
        if (data.user) {
            const nameInput = document.getElementById("recipientName");
            const phoneInput = document.getElementById("recipientPhone");
            const emailInput = document.getElementById("recipientEmail");
            const ewalletInput = document.getElementById("ewalletPhone");

            if (nameInput && data.user.full_name) nameInput.value = data.user.full_name;
            if (phoneInput && data.user.phone) phoneInput.value = data.user.phone;
            if (emailInput && data.user.email) emailInput.value = data.user.email;
            if (ewalletInput && data.user.phone) ewalletInput.value = data.user.phone;
        }

        renderSummaryItems(data.total_qty);
        updateShippingPrices();
        recalculateTotals();
        updateVaPreview();
    } catch (err) {
        alert(err.message);
        window.location.href = "keranjang.html";
        return;
    }

    // 2. Render produk yang dipilih di kolom kanan
    function renderSummaryItems(totalQty) {
        const listEl = document.getElementById("checkoutItemsList");
        const badgeEl = document.getElementById("summaryItemBadge");
        const qtyEl = document.getElementById("summaryTotalQty");

        if (badgeEl) badgeEl.textContent = `${checkoutItems.length} Jenis (${totalQty} Unit)`;
        if (qtyEl) qtyEl.textContent = totalQty;

        listEl.innerHTML = checkoutItems.map(item => `
            <div class="sum-item">
                <img src="${resolveImage(item.image_path)}" alt="${item.name}" onerror="this.src='images/yukido.png'">
                <div>
                    <span>${item.name}</span>
                    <span class="sum-qty">${item.quantity}x Unit • SKU: ${item.sku}</span>
                </div>
                <span class="sum-price">${formatRupiah(item.line_total)}</span>
            </div>
        `).join("");
    }

    // 3. Hitung ongkos kirim berdasarkan berat & ekspedisi
    function updateShippingPrices() {
        const weightKg = Math.max(1, Math.ceil(totalWeightGram / 1000));
        const weightBadge = document.getElementById("weightBadge");
        if (weightBadge) {
            weightBadge.innerHTML = `<i class="fas fa-weight-hanging"></i> BERAT TOTAL: ${(totalWeightGram / 1000).toFixed(1)} KG (${weightKg} Kg)`;
        }

        document.querySelectorAll("#shippingGrid .shipping-card").forEach(card => {
            const base = Number(card.dataset.baseCost) || 35000;
            const cost = base + ((weightKg - 1) * 5000);
            card.dataset.finalCost = cost;
            const priceSpan = card.querySelector(".shipping-price");
            if (priceSpan) priceSpan.textContent = formatRupiah(cost);

            if (card.classList.contains("active")) {
                selectedCourier = card.dataset.courier;
                calculatedShippingCost = cost;
            }
        });
    }

    document.querySelectorAll("#shippingGrid .shipping-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#shippingGrid .shipping-card").forEach(c => {
                c.classList.remove("active");
                const icon = c.querySelector(".shipping-top i");
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
            calculatedShippingCost = Number(card.dataset.finalCost) || 35000;
            recalculateTotals();
        });
    });

    // 4. Kalkulasi Subtotal & Total Pembayaran
    function recalculateTotals() {
        const grandTotal = Math.max(0, (subtotal + calculatedShippingCost) - discountAmount);

        document.getElementById("summarySubtotal").textContent = formatRupiah(subtotal);
        document.getElementById("summaryCourierName").textContent = selectedCourier;
        document.getElementById("summaryShippingCost").textContent = formatRupiah(calculatedShippingCost);
        document.getElementById("summaryDiscount").textContent = `-${formatRupiah(discountAmount)}`;
        document.getElementById("summaryGrandTotal").textContent = formatRupiah(grandTotal);
    }

    // 5. Navigasi Tab Metode Pembayaran (VA, QRIS, E-Wallet, Debit/Kredit)
    document.querySelectorAll("#paymentTabs .pay-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("#paymentTabs .pay-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            activeMethod = tab.dataset.method;
            const targetId = tab.dataset.target;

            document.querySelectorAll(".payment-content").forEach(panel => {
                panel.style.display = panel.id === targetId ? "block" : "none";
            });

            if (activeMethod === "virtual_account") {
                const activeBank = document.querySelector("#vaBankGrid .bank-card.active");
                activeChannel = activeBank ? activeBank.dataset.channel : "BCA";
            } else if (activeMethod === "qris") {
                activeChannel = "QRIS";
            } else if (activeMethod === "ewallet") {
                const activeWallet = document.querySelector("#ewalletGrid .bank-card.active");
                activeChannel = activeWallet ? activeWallet.dataset.channel : "GoPay";
            } else if (activeMethod === "debit_card") {
                activeChannel = "Debit/Credit Card";
            }
        });
    });

    // Pilihan Bank VA
    function updateVaPreview() {
        const activeBank = document.querySelector("#vaBankGrid .bank-card.active");
        const prefix = activeBank ? activeBank.dataset.prefix : "8271";
        const bankName = activeBank ? activeBank.dataset.channel : "BCA";
        const phone = (document.getElementById("recipientPhone")?.value || "081234567890").replace(/\D/g, "");
        const rawVa = (prefix + phone.padEnd(12, "0")).slice(0, 16);
        const formattedVa = rawVa.replace(/(.{4})/g, "$1 ").trim();

        const labelEl = document.getElementById("vaBankLabel");
        const numEl = document.getElementById("vaNumber");
        if (labelEl) labelEl.innerHTML = `<i class="fas fa-circle" style="color:#00cc66; font-size:8px;"></i> Nomor Akun Virtual ${bankName}`;
        if (numEl) numEl.textContent = formattedVa;
    }

    document.querySelectorAll("#vaBankGrid .bank-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#vaBankGrid .bank-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeChannel = card.dataset.channel;
            updateVaPreview();
        });
    });

    document.getElementById("recipientPhone")?.addEventListener("input", updateVaPreview);

    // Pilihan E-Wallet
    document.querySelectorAll("#ewalletGrid .bank-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#ewalletGrid .bank-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeChannel = card.dataset.channel;
        });
    });

    // Format spasi nomor kartu debit
    document.getElementById("cardNumber")?.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "").slice(0, 16);
        e.target.value = val.replace(/(.{4})/g, "$1 ").trim();
    });

    // 6. SUBMIT & BUAT PESANAN KE DATABASE
    const btnSubmit = document.getElementById("btnSubmitOrder");
    btnSubmit?.addEventListener("click", async () => {
        const recipientName = document.getElementById("recipientName").value.trim();
        const recipientPhone = document.getElementById("recipientPhone").value.trim();
        const recipientEmail = document.getElementById("recipientEmail").value.trim();
        const shippingAddress = document.getElementById("shippingAddress").value.trim();
        const province = document.getElementById("province").value.trim();
        const city = document.getElementById("city").value.trim();
        const district = document.getElementById("district").value.trim();
        const postalCode = document.getElementById("postalCode").value.trim();
        const notes = document.getElementById("orderNotes").value.trim();

        if (!recipientName || !recipientPhone || !shippingAddress) {
            alert("Mohon lengkapi Nama Penerima, Nomor Telepon/WhatsApp, dan Alamat Pengiriman Lengkap.");
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
            const ewPhone = document.getElementById("ewalletPhone").value.trim();
            if (!ewPhone) {
                alert("Masukkan nomor HP yang terdaftar pada E-Wallet.");
                return;
            }
            payload.ewallet_phone = ewPhone;
        }

        if (activeMethod === "debit_card") {
            const cardNum = document.getElementById("cardNumber").value.replace(/\s/g, "");
            const cardHolder = document.getElementById("cardHolder").value.trim();
            const cardExpiry = document.getElementById("cardExpiry").value.trim();
            const cardCvv = document.getElementById("cardCvv").value.trim();

            if (cardNum.length < 16 || !cardHolder || cardExpiry.length < 5 || cardCvv.length < 3) {
                alert("Lengkapi data Kartu Debit/Kredit (16 digit nomor kartu, nama, MM/YY, dan CVV).");
                return;
            }
            payload.card_number = cardNum;
            payload.card_holder = cardHolder;
        }

        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> MEMPROSES PESANAN...`;

        try {
            const res = await fetch(`${CHECKOUT_API}/create.php`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Gagal membuat pesanan.");
            }

            sessionStorage.removeItem("yukido_checkout_items");
            window.location.href = `konfirmasi.html?order=${encodeURIComponent(result.order_number)}`;
        } catch (err) {
            alert(err.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalHTML;
        }
    });
});document.addEventListener("DOMContentLoaded", async () => {
    const CHECKOUT_API = "../backend/checkout";
    const rawIds = sessionStorage.getItem("yukido_checkout_items");
    const selectedIds = rawIds ? JSON.parse(rawIds) : [];

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
        alert("Pilih produk terlebih dahulu di halaman keranjang.");
        window.location.href = "keranjang.html";
        return;
    }

    let checkoutItems = [];
    let subtotal = 0;
    let totalWeightGram = 0;
    let selectedCourier = "JNE Trucking";
    let baseShippingCost = 35000;
    let calculatedShippingCost = 35000;
    let discountAmount = 0;

    let activeMethod = "virtual_account";
    let activeChannel = "BCA";

    function formatRupiah(val) {
        return new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
            maximumFractionDigits: 0
        }).format(Number(val) || 0);
    }

    function resolveImage(path) {
        if (!path) return "images/yukido.png";
        if (/^https?:\/\//i.test(path)) return path;
        return path.replace(/\\/g, "/").replace(/^\.?\//, "");
    }

    // 1. Ambil produk terpilih dari backend
    try {
        const res = await fetch(`${CHECKOUT_API}/items.php`, {
            method: "POST",
            credentials: "same-origin",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart_item_ids: selectedIds })
        });
        const data = await res.json();

        if (!res.ok || !data.success || !data.items.length) {
            throw new Error(data.message || "Produk checkout tidak ditemukan.");
        }

        checkoutItems = data.items;
        subtotal = Number(data.subtotal);
        totalWeightGram = Number(data.total_weight_gram);

        // Auto-fill form penerima dari data akun user
        if (data.user) {
            const nameInput = document.getElementById("recipientName");
            const phoneInput = document.getElementById("recipientPhone");
            const emailInput = document.getElementById("recipientEmail");
            const ewalletInput = document.getElementById("ewalletPhone");

            if (nameInput && data.user.full_name) nameInput.value = data.user.full_name;
            if (phoneInput && data.user.phone) phoneInput.value = data.user.phone;
            if (emailInput && data.user.email) emailInput.value = data.user.email;
            if (ewalletInput && data.user.phone) ewalletInput.value = data.user.phone;
        }

        renderSummaryItems(data.total_qty);
        updateShippingPrices();
        recalculateTotals();
        updateVaPreview();
    } catch (err) {
        alert(err.message);
        window.location.href = "keranjang.html";
        return;
    }

    // 2. Render produk yang dipilih di kolom kanan
    function renderSummaryItems(totalQty) {
        const listEl = document.getElementById("checkoutItemsList");
        const badgeEl = document.getElementById("summaryItemBadge");
        const qtyEl = document.getElementById("summaryTotalQty");

        if (badgeEl) badgeEl.textContent = `${checkoutItems.length} Jenis (${totalQty} Unit)`;
        if (qtyEl) qtyEl.textContent = totalQty;

        listEl.innerHTML = checkoutItems.map(item => `
            <div class="sum-item">
                <img src="${resolveImage(item.image_path)}" alt="${item.name}" onerror="this.src='images/yukido.png'">
                <div>
                    <span>${item.name}</span>
                    <span class="sum-qty">${item.quantity}x Unit • SKU: ${item.sku}</span>
                </div>
                <span class="sum-price">${formatRupiah(item.line_total)}</span>
            </div>
        `).join("");
    }

    // 3. Hitung ongkos kirim berdasarkan berat & ekspedisi
    function updateShippingPrices() {
        const weightKg = Math.max(1, Math.ceil(totalWeightGram / 1000));
        const weightBadge = document.getElementById("weightBadge");
        if (weightBadge) {
            weightBadge.innerHTML = `<i class="fas fa-weight-hanging"></i> BERAT TOTAL: ${(totalWeightGram / 1000).toFixed(1)} KG (${weightKg} Kg)`;
        }

        document.querySelectorAll("#shippingGrid .shipping-card").forEach(card => {
            const base = Number(card.dataset.baseCost) || 35000;
            const cost = base + ((weightKg - 1) * 5000);
            card.dataset.finalCost = cost;
            const priceSpan = card.querySelector(".shipping-price");
            if (priceSpan) priceSpan.textContent = formatRupiah(cost);

            if (card.classList.contains("active")) {
                selectedCourier = card.dataset.courier;
                calculatedShippingCost = cost;
            }
        });
    }

    document.querySelectorAll("#shippingGrid .shipping-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#shippingGrid .shipping-card").forEach(c => {
                c.classList.remove("active");
                const icon = c.querySelector(".shipping-top i");
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
            calculatedShippingCost = Number(card.dataset.finalCost) || 35000;
            recalculateTotals();
        });
    });

    // 4. Kalkulasi Subtotal & Total Pembayaran
    function recalculateTotals() {
        const grandTotal = Math.max(0, (subtotal + calculatedShippingCost) - discountAmount);

        document.getElementById("summarySubtotal").textContent = formatRupiah(subtotal);
        document.getElementById("summaryCourierName").textContent = selectedCourier;
        document.getElementById("summaryShippingCost").textContent = formatRupiah(calculatedShippingCost);
        document.getElementById("summaryDiscount").textContent = `-${formatRupiah(discountAmount)}`;
        document.getElementById("summaryGrandTotal").textContent = formatRupiah(grandTotal);
    }

    // 5. Navigasi Tab Metode Pembayaran (VA, QRIS, E-Wallet, Debit/Kredit)
    document.querySelectorAll("#paymentTabs .pay-tab").forEach(tab => {
        tab.addEventListener("click", () => {
            document.querySelectorAll("#paymentTabs .pay-tab").forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            activeMethod = tab.dataset.method;
            const targetId = tab.dataset.target;

            document.querySelectorAll(".payment-content").forEach(panel => {
                panel.style.display = panel.id === targetId ? "block" : "none";
            });

            if (activeMethod === "virtual_account") {
                const activeBank = document.querySelector("#vaBankGrid .bank-card.active");
                activeChannel = activeBank ? activeBank.dataset.channel : "BCA";
            } else if (activeMethod === "qris") {
                activeChannel = "QRIS";
            } else if (activeMethod === "ewallet") {
                const activeWallet = document.querySelector("#ewalletGrid .bank-card.active");
                activeChannel = activeWallet ? activeWallet.dataset.channel : "GoPay";
            } else if (activeMethod === "debit_card") {
                activeChannel = "Debit/Credit Card";
            }
        });
    });

    // Pilihan Bank VA
    function updateVaPreview() {
        const activeBank = document.querySelector("#vaBankGrid .bank-card.active");
        const prefix = activeBank ? activeBank.dataset.prefix : "8271";
        const bankName = activeBank ? activeBank.dataset.channel : "BCA";
        const phone = (document.getElementById("recipientPhone")?.value || "081234567890").replace(/\D/g, "");
        const rawVa = (prefix + phone.padEnd(12, "0")).slice(0, 16);
        const formattedVa = rawVa.replace(/(.{4})/g, "$1 ").trim();

        const labelEl = document.getElementById("vaBankLabel");
        const numEl = document.getElementById("vaNumber");
        if (labelEl) labelEl.innerHTML = `<i class="fas fa-circle" style="color:#00cc66; font-size:8px;"></i> Nomor Akun Virtual ${bankName}`;
        if (numEl) numEl.textContent = formattedVa;
    }

    document.querySelectorAll("#vaBankGrid .bank-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#vaBankGrid .bank-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeChannel = card.dataset.channel;
            updateVaPreview();
        });
    });

    document.getElementById("recipientPhone")?.addEventListener("input", updateVaPreview);

    // Pilihan E-Wallet
    document.querySelectorAll("#ewalletGrid .bank-card").forEach(card => {
        card.addEventListener("click", () => {
            document.querySelectorAll("#ewalletGrid .bank-card").forEach(c => c.classList.remove("active"));
            card.classList.add("active");
            activeChannel = card.dataset.channel;
        });
    });

    // Format spasi nomor kartu debit
    document.getElementById("cardNumber")?.addEventListener("input", (e) => {
        let val = e.target.value.replace(/\D/g, "").slice(0, 16);
        e.target.value = val.replace(/(.{4})/g, "$1 ").trim();
    });

    // 6. SUBMIT & BUAT PESANAN KE DATABASE
    const btnSubmit = document.getElementById("btnSubmitOrder");
    btnSubmit?.addEventListener("click", async () => {
        const recipientName = document.getElementById("recipientName").value.trim();
        const recipientPhone = document.getElementById("recipientPhone").value.trim();
        const recipientEmail = document.getElementById("recipientEmail").value.trim();
        const shippingAddress = document.getElementById("shippingAddress").value.trim();
        const province = document.getElementById("province").value.trim();
        const city = document.getElementById("city").value.trim();
        const district = document.getElementById("district").value.trim();
        const postalCode = document.getElementById("postalCode").value.trim();
        const notes = document.getElementById("orderNotes").value.trim();

        if (!recipientName || !recipientPhone || !shippingAddress) {
            alert("Mohon lengkapi Nama Penerima, Nomor Telepon/WhatsApp, dan Alamat Pengiriman Lengkap.");
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
            const ewPhone = document.getElementById("ewalletPhone").value.trim();
            if (!ewPhone) {
                alert("Masukkan nomor HP yang terdaftar pada E-Wallet.");
                return;
            }
            payload.ewallet_phone = ewPhone;
        }

        if (activeMethod === "debit_card") {
            const cardNum = document.getElementById("cardNumber").value.replace(/\s/g, "");
            const cardHolder = document.getElementById("cardHolder").value.trim();
            const cardExpiry = document.getElementById("cardExpiry").value.trim();
            const cardCvv = document.getElementById("cardCvv").value.trim();

            if (cardNum.length < 16 || !cardHolder || cardExpiry.length < 5 || cardCvv.length < 3) {
                alert("Lengkapi data Kartu Debit/Kredit (16 digit nomor kartu, nama, MM/YY, dan CVV).");
                return;
            }
            payload.card_number = cardNum;
            payload.card_holder = cardHolder;
        }

        const originalHTML = btnSubmit.innerHTML;
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fas fa-spinner fa-spin"></i> MEMPROSES PESANAN...`;

        try {
            const res = await fetch(`${CHECKOUT_API}/create.php`, {
                method: "POST",
                credentials: "same-origin",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            const result = await res.json();

            if (!res.ok || !result.success) {
                throw new Error(result.message || "Gagal membuat pesanan.");
            }

            sessionStorage.removeItem("yukido_checkout_items");
            window.location.href = `konfirmasi.html?order=${encodeURIComponent(result.order_number)}`;
        } catch (err) {
            alert(err.message);
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = originalHTML;
        }
    });
});