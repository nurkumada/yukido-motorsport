// =========================================
// YUKIDO POWER TEKNIK - MAIN SCRIPT
// =========================================

// 1. Sidebar Toggle
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

function updateSidebarLayout() {
    document.body.classList.toggle(
        'sidebar-open',
        sidebar && sidebar.classList.contains('active')
    );
}

if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('active');
        updateSidebarLayout();
    });
}

if (closeSidebar && sidebar) {
    closeSidebar.addEventListener('click', () => {
        sidebar.classList.remove('active');
        updateSidebarLayout();
    });
}

// 2. Tab Filter (General)
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// 3. Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

// 4. Add to Cart Animation (General)
const btnBeli = document.querySelectorAll('.btn-beli');
btnBeli.forEach(btn => {
    btn.addEventListener('click', () => {
        const cartBadge = document.querySelector('.cart-btn .badge');
        if (cartBadge) {
            let count = parseInt(cartBadge.textContent) || 0;
            cartBadge.textContent = count + 1;
        }
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => btn.style.transform = 'scale(1)', 100);
    });
});

// 5. Search Bar Focus (Top Navigation)
const searchInput = document.querySelector('.search-bar input');
if (searchInput) {
    searchInput.addEventListener('focus', () => {
        searchInput.parentElement.style.borderColor = 'var(--red-primary)';
    });
    searchInput.addEventListener('blur', () => {
        searchInput.parentElement.style.borderColor = 'var(--border-color)';
    });
}

// =========================================
// FITUR KHUSUS HALAMAN PRODUK
// =========================================
const catTabs = document.querySelectorAll('.cat-tab');
const productCards = document.querySelectorAll('.produk-card');

catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        catTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const category = tab.getAttribute('data-category');
        productCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// Search Produk (Real-time)
const searchProductInput = document.getElementById('searchProduct');
if (searchProductInput) {
    searchProductInput.addEventListener('input', (e) => {
        const keyword = e.target.value.toLowerCase();
        productCards.forEach(card => {
            const title = card.querySelector('h3').textContent.toLowerCase();
            if (title.includes(keyword)) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    });
}

// Add to Cart Logic
let cartCount = 3; 
function addToCart() {
    cartCount++;
    const badge = document.getElementById('cartBadge');
    const sidebarBadge = document.getElementById('sidebarCartBadge');
    
    if (badge) badge.textContent = cartCount;
    if (sidebarBadge) sidebarBadge.textContent = cartCount + ' Item';
    
    if (badge) {
        badge.style.transform = 'scale(1.5)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
    alert('Produk berhasil ditambahkan ke Keranjang Belanja!');
}

// Reset Filter
const btnReset = document.querySelector('.btn-reset');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        if (searchProductInput) searchProductInput.value = '';
        catTabs.forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.cat-tab[data-category="all"]');
        if (allTab) allTab.classList.add('active');
        productCards.forEach(card => card.style.display = 'block');
    });
}

// =========================================
// FITUR KHUSUS HALAMAN KERANJANG (ALA SHOPEE)
// =========================================
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

let voucherActive = true;
const voucherDiscount = 50000;

function recalculateShopeeCart() {
    const rows = document.querySelectorAll('.shopee-cart-item');
    if (!rows.length && !document.querySelector('.shopee-checkout-bar')) return;

    let subtotal = 0;
    let checkedProducts = 0;
    let allChecked = rows.length > 0;

    rows.forEach(row => {
        const price = parseInt(row.getAttribute('data-price')) || 0;
        const qtyInput = row.querySelector('.shopee-qty-input');
        const qty = parseInt(qtyInput.value) || 1;
        const rowTotal = price * qty;

        const rowTotalEl = row.querySelector('.item-row-total');
        if (rowTotalEl) rowTotalEl.textContent = formatRupiah(rowTotal);

        const checkEl = row.querySelector('.item-check');
        if (checkEl && checkEl.checked) {
            subtotal += rowTotal;
            checkedProducts++;
        } else {
            allChecked = false;
        }
    });

    const totalJenisEl = document.getElementById('totalJenisProduk');
    const selectedCountEl = document.getElementById('selectedProductCount');
    const selectTop = document.getElementById('selectAllTop');
    const selectStore = document.getElementById('selectStore');
    const selectBottom = document.getElementById('selectAllBottom');
    const badge = document.getElementById('cartBadge');
    const sidebarBadge = document.getElementById('sidebarCartBadge');

    if (totalJenisEl) totalJenisEl.textContent = rows.length;
    if (selectedCountEl) selectedCountEl.textContent = checkedProducts;
    if (selectTop) selectTop.checked = allChecked;
    if (selectStore) selectStore.checked = allChecked;
    if (selectBottom) selectBottom.checked = allChecked;
    if (badge) badge.textContent = rows.length;
    if (sidebarBadge) sidebarBadge.textContent = rows.length + ' Item';

    const discount = (voucherActive && subtotal > 0) ? Math.min(voucherDiscount, subtotal) : 0;
    const finalTotal = subtotal - discount;

    const grandTotalEl = document.getElementById('shopeeGrandTotal');
    const hematEl = document.getElementById('hematText');

    if (grandTotalEl) grandTotalEl.textContent = formatRupiah(finalTotal);
    if (hematEl) {
        hematEl.textContent = discount > 0 ? `Hemat ${formatRupiah(discount)}` : 'Pilih voucher untuk hemat';
    }
}

// Event Listener Checkbox Pilih Semua (Atas, Toko, Bawah)
['selectAllTop', 'selectStore', 'selectAllBottom'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('change', (e) => {
            const checked = e.target.checked;
            document.querySelectorAll('.item-check').forEach(cb => {
                cb.checked = checked;
            });
            recalculateShopeeCart();
        });
    }
});

// Event Listener Checkbox Per Item
document.querySelectorAll('.item-check').forEach(cb => {
    cb.addEventListener('change', recalculateShopeeCart);
});

// Event Listener Tombol +/- Kuantitas
document.querySelectorAll('.shopee-qty-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('.shopee-qty-input');
        let val = parseInt(input.value) || 1;
        if (btn.classList.contains('plus')) val++;
        if (btn.classList.contains('minus') && val > 1) val--;
        input.value = val;
        recalculateShopeeCart();
    });
});

// Event Listener Input Manual Kuantitas
document.querySelectorAll('.shopee-qty-input').forEach(input => {
    input.addEventListener('change', () => {
        let val = parseInt(input.value);
        if (isNaN(val) || val < 1) val = 1;
        input.value = val;
        recalculateShopeeCart();
    });
});

// Event Listener Hapus Item Satuan
document.querySelectorAll('.btn-del-item').forEach(btn => {
    btn.addEventListener('click', () => {
        const row = btn.closest('.shopee-cart-item');
        if (row) {
            row.remove();
            recalculateShopeeCart();
        }
    });
});

// Event Listener Hapus yang Dipilih
const btnDeleteSelected = document.getElementById('btnDeleteSelected');
if (btnDeleteSelected) {
    btnDeleteSelected.addEventListener('click', () => {
        const checkedItems = document.querySelectorAll('.shopee-cart-item .item-check:checked');
        if (checkedItems.length === 0) {
            alert('Pilih minimal 1 produk untuk dihapus.');
            return;
        }
        if (confirm(`Hapus ${checkedItems.length} produk yang dipilih dari keranjang?`)) {
            checkedItems.forEach(cb => {
                const row = cb.closest('.shopee-cart-item');
                if (row) row.remove();
            });
            recalculateShopeeCart();
        }
    });
}

// Event Listener Toggle Voucher YUKIDO
const btnToggleVoucher = document.getElementById('btnToggleVoucher');
if (btnToggleVoucher) {
    btnToggleVoucher.addEventListener('click', () => {
        voucherActive = !voucherActive;
        const badge = document.getElementById('voucherBadge');
        if (badge) {
            if (voucherActive) {
                badge.textContent = 'Diskon Bengkel -Rp 50.000 Terpakai';
                badge.style.color = '#22c55e';
            } else {
                badge.textContent = 'Tidak ada voucher digunakan';
                badge.style.color = '#a3a3a3';
            }
        }
        recalculateShopeeCart();
    });
}

if (document.querySelector('.shopee-checkout-bar')) {
    recalculateShopeeCart();
}

// =========================================
// FITUR KHUSUS HALAMAN CHECKOUT
// =========================================
const payTabs = document.querySelectorAll('.pay-tab');
payTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        payTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

document.querySelectorAll('.shipping-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.shipping-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
});

document.querySelectorAll('.bank-card').forEach(card => {
    card.addEventListener('click', () => {
        document.querySelectorAll('.bank-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
    });
});

document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = header.nextElementSibling;
        const icon = header.querySelector('i:last-child');
        
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-body').style.display = 'none';
                const otherIcon = otherItem.querySelector('.accordion-header i:last-child');
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
        });

        item.classList.toggle('active');
        if (item.classList.contains('active')) {
            body.style.display = 'block';
            if (icon) icon.style.transform = 'rotate(180deg)';
        } else {
            body.style.display = 'none';
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    });
});

const copyVaBtn = document.getElementById('copyVaBtn');
if (copyVaBtn) {
    copyVaBtn.addEventListener('click', () => {
        const vaNumber = document.getElementById('vaNumber').textContent.replace(/\s/g, '');
        navigator.clipboard.writeText(vaNumber).then(() => {
            const originalText = copyVaBtn.innerHTML;
            copyVaBtn.innerHTML = '<i class="fas fa-check"></i> DISALIN!';
            copyVaBtn.style.background = '#00cc66';
            copyVaBtn.style.color = 'white';
            copyVaBtn.style.borderColor = '#00cc66';
            setTimeout(() => {
                copyVaBtn.innerHTML = originalText;
                copyVaBtn.style.background = '';
                copyVaBtn.style.color = '';
                copyVaBtn.style.borderColor = '';
            }, 2000);
        });
    });
}

const btnPayNow = document.querySelector('.btn-pay-now');
if (btnPayNow) {
    btnPayNow.addEventListener('click', () => {
        btnPayNow.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES PEMBAYARAN...';
        setTimeout(() => {
            alert('Pembayaran berhasil disimulasikan! Pesanan Anda sedang diproses.');
            btnPayNow.innerHTML = '<i class="fas fa-lock"></i> BAYAR SEKARANG & BUAT PESANAN';
        }, 1500);
    });
}

// =========================================
// FITUR KHUSUS HALAMAN GARANSI
// =========================================
function setupFileUpload(inputId, dropZoneId, fileNameId) {
    const input = document.getElementById(inputId);
    const dropZone = document.getElementById(dropZoneId);
    const fileNameDisplay = document.getElementById(fileNameId);

    if (dropZone && input) {
        dropZone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                fileNameDisplay.textContent = `Terpilih: ${e.target.files[0].name}`;
                dropZone.style.borderColor = 'var(--red-primary)';
                dropZone.style.background = 'rgba(225,6,0,0.05)';
            }
        });
    }
}
setupFileUpload('file1', 'dropZone1', 'fileName1');
setupFileUpload('file2', 'dropZone2', 'fileName2');

const btnCekTiket = document.getElementById('btnCekTiket');
const trackStatus = document.getElementById('trackStatus');
if (btnCekTiket) {
    btnCekTiket.addEventListener('click', () => {
        const ticketId = document.getElementById('ticketInput').value.trim();
        if (ticketId === 'YKD-CLM-77921') {
            trackStatus.style.display = 'block';
            trackStatus.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        } else {
            alert('Tiket tidak ditemukan. Gunakan Demo ID: YKD-CLM-77921');
            trackStatus.style.display = 'none';
        }
    });
}

document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        document.querySelectorAll('.faq-item').forEach(item => item.classList.remove('active'));
        if (!isActive) faqItem.classList.add('active');
    });
});

const garansiForm = document.getElementById('garansiForm');
if (garansiForm) {
    garansiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = garansiForm.querySelector('.btn-submit-klaim');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM DATA...';
        btn.disabled = true;
        setTimeout(() => {
            alert('Klaim garansi berhasil dikirim! Tim QC akan menghubungi via WhatsApp.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            garansiForm.reset();
        }, 2000);
    });
}

// =========================================
// FITUR HALAMAN KONFIRMASI PEMBAYARAN
// =========================================
function copyOrderId() {
    const orderId = document.getElementById('orderId');
    if (orderId) {
        navigator.clipboard.writeText(orderId.innerText);
        alert('Nomor Order berhasil disalin!');
    }
}

function copyVa() {
    const vaNumber = document.getElementById('vaNumber');
    if (vaNumber) {
        navigator.clipboard.writeText(vaNumber.innerText.replace(/\s/g, ''));
        alert('Nomor Virtual Account berhasil disalin!');
    }
}

let time = 2 * 60 * 60; 
const countdownEl = document.getElementById('countdown');
if (countdownEl) {
    const timer = setInterval(() => {
        const hours = Math.floor(time / 3600);
        const minutes = Math.floor((time % 3600) / 60);
        const seconds = time % 60;
        countdownEl.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (time <= 0) {
            clearInterval(timer);
            countdownEl.innerText = "WAKTU HABIS";
        }
        time--;
    }, 1000);
}

// === AUTH PAGE LOGIC (LOGIN, REGISTER & LUPA KATA SANDI) ===
function switchAuth(mode) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const forgotForm = document.getElementById('forgotForm');
    const authTabs = document.getElementById('authTabs');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (!loginForm || !registerForm) return;

    loginForm.classList.remove('active');
    registerForm.classList.remove('active');
    if (forgotForm) forgotForm.classList.remove('active');

    if (mode === 'login') {
        if (authTabs) authTabs.style.display = 'grid';
        loginForm.classList.add('active');
        if (tabLogin) tabLogin.classList.add('active');
        if (tabRegister) tabRegister.classList.remove('active');
    } else if (mode === 'register') {
        if (authTabs) authTabs.style.display = 'grid';
        registerForm.classList.add('active');
        if (tabRegister) tabRegister.classList.add('active');
        if (tabLogin) tabLogin.classList.remove('active');
    } else if (mode === 'forgot' && forgotForm) {
        if (authTabs) authTabs.style.display = 'none';
        forgotForm.classList.add('active');
        const successBox = document.getElementById('resetSuccessBox');
        if (successBox) successBox.style.display = 'none';
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    const icon = btn.querySelector('i');
    if (!input || !icon) return;

    if (input.type === 'password') {
        input.type = 'text';
        icon.classList.replace('fa-eye', 'fa-eye-slash');
    } else {
        input.type = 'password';
        icon.classList.replace('fa-eye-slash', 'fa-eye');
    }
}

function handleResetPassword(e) {
    e.preventDefault();
    const targetInput = document.getElementById('resetTarget');
    const box = document.getElementById('resetSuccessBox');
    const text = document.getElementById('resetSuccessText');

    if (targetInput && box && text) {
        text.textContent = `Kode verifikasi dan tautan atur ulang kata sandi telah dikirim ke ${targetInput.value.trim()}.`;
        box.style.display = 'flex';
    }
}

// =========================================
// LOGIKA AI CHATBOT YUKIDO
// =========================================
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');

if (chatbotToggle) {
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.toggle('active');
        if (chatbotContainer.classList.contains('active')) {
            setTimeout(() => chatbotInput.focus(), 300);
        }
    });
}

if (chatbotClose) {
    chatbotClose.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
    });
}

function sendMessage() {
    const text = chatbotInput.value.trim();
    if (!text) return;
    addMessage(text, 'user-message');
    chatbotInput.value = '';
    const typingId = showTypingIndicator();
    setTimeout(() => {
        removeTypingIndicator(typingId);
        const response = getAIResponse(text.toLowerCase());
        addMessage(response, 'bot-message');
    }, 1200);
}

if (chatbotSend) chatbotSend.addEventListener('click', sendMessage);
if (chatbotInput) {
    chatbotInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
}

function addMessage(text, className) {
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerHTML = text; 
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight; 
}

function showTypingIndicator() {
    const id = 'typing-' + Date.now();
    const div = document.createElement('div');
    div.className = 'typing-indicator';
    div.id = id;
    div.innerHTML = '<span></span><span></span><span></span>';
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    return id;
}

function removeTypingIndicator(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
}

function getAIResponse(input) {
    if (input.includes('halo') || input.includes('hi') || input.includes('pagi') || input.includes('siang') || input.includes('malam')) {
        return "Halo! 👋 Selamat datang di PT. Yukido Power Teknik. Ada yang bisa saya bantu terkait produk perkakas, garansi, atau lokasi showroom kami?";
    }
    if (input.includes('garansi') || input.includes('klaim') || input.includes('rusak')) {
        return "Garansi resmi YUKIDO berlaku <b>1 tahun</b> untuk mesin power tools dan <b>seumur hidup</b> untuk perkakas tangan (hand tools). Ajukan klaim di halaman <a href='garansi.html' style='color:var(--red-primary); font-weight:bold;'>Klaim Garansi</a> kami.";
    }
    if (input.includes('ongkir') || input.includes('kiriman') || input.includes('ekspedisi') || input.includes('biaya kirim')) {
        return "Kami bekerja sama dengan JNE, J&T, dan SiCepat dengan gratis ongkir hingga Rp 50.000 serta perlindungan asuransi pengiriman 100%.";
    }
    if (input.includes('lokasi') || input.includes('alamat') || input.includes('toko') || input.includes('showroom')) {
        return "Kantor Pusat & Showroom kami berada di: <br><b>PT YUKIDO POWER TEKNIK</b><br>Caringin, Kec. Legok, Kabupaten Tangerang, Banten.<br>Buka Senin-Sabtu, 08.00 - 17.00 WIB. <a href='lokasi.html' style='color:var(--red-primary)'>Lihat di Peta</a>";
    }
    if (input.includes('bayar') || input.includes('metode pembayaran') || input.includes('transfer')) {
        return "Kami menerima pembayaran via Virtual Account (BCA, Mandiri, BNI, BRI), QRIS Dinamis, GoPay, OVO, dan Debit Online.";
    }
    if (input.includes('terima kasih') || input.includes('makasih') || input.includes('thanks')) {
        return "Sama-sama! Senang bisa membantu kebutuhan perkakas Anda.";
    }
    return "Maaf, saya belum mengerti pertanyaan tersebut. 🤖 <br><br>Coba ketik: <b>'garansi'</b>, <b>'ongkir'</b>, <b>'lokasi'</b>, atau <b>'cara bayar'</b>.";
}

document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.querySelector(".menu-toggle, .hamburger, #menu-toggle");
    if (!toggleButton) return;
    toggleButton.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-closed");
    });
});