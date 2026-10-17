// =========================================
// YUKIDO MOTORSPORT - MAIN SCRIPT
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

console.log('YUKIDO Motorsport Website Loaded Successfully! 🏁');

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

// Search Produk (Real-time) - VARIABLE NAME FIXED!
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
    if (sidebarBadge) sidebarBadge.textContent = cartCount + ' Part';
    
    if (badge) {
        badge.style.transform = 'scale(1.5)';
        setTimeout(() => badge.style.transform = 'scale(1)', 200);
    }
    alert('Produk berhasil ditambahkan ke Keranjang Balap! 🏁');
}

// Reset Filter
const btnReset = document.querySelector('.btn-reset');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        if(searchProductInput) searchProductInput.value = '';
        catTabs.forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.cat-tab[data-category="all"]');
        if(allTab) allTab.classList.add('active');
        productCards.forEach(card => card.style.display = 'block');
    });
}

// =========================================
// FITUR KHUSUS HALAMAN KERANJANG
// =========================================
function formatRupiah(angka) {
    return 'Rp ' + angka.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function updateCartCalculations() {
    let totalItems = 0;
    let totalJenis = 0;
    let subtotal = 0;
    let totalWeight = 0;
    const diskon = 100000;
    const ongkir = 35000;

    const items = document.querySelectorAll('.cart-item');
    totalJenis = items.length;

    items.forEach((item, index) => {
        const price = parseInt(item.getAttribute('data-price'));
        const weight = parseFloat(item.getAttribute('data-weight'));
        const qtyInput = item.querySelector('.qty-input');
        const qty = parseInt(qtyInput.value) || 1;
        
        const itemSubtotal = price * qty;
        item.querySelector('.item-subtotal').innerHTML = `${formatRupiah(itemSubtotal)}<br><span class="per-unit">SUBTOTAL</span>`;
        
        totalItems += qty;
        subtotal += itemSubtotal;
        totalWeight += (weight * qty);

        if(index === 0) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            const w1 = document.getElementById('weight1');
            if(w1) w1.textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            const p1 = document.querySelector('.telem-item:nth-child(1) .progress-fill');
            if(p1) p1.style.width = `${pct}%`;
        } else if(index === 1) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            const w2 = document.getElementById('weight2');
            if(w2) w2.textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            const p2 = document.querySelector('.telem-item:nth-child(2) .progress-fill');
            if(p2) p2.style.width = `${pct}%`;
        } else if(index === 2) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            const w3 = document.getElementById('weight3');
            if(w3) w3.textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            const p3 = document.querySelector('.telem-item:nth-child(3) .progress-fill');
            if(p3) p3.style.width = `${pct}%`;
        }
    });

    const tw = document.getElementById('totalWeight'); if(tw) tw.textContent = `${totalWeight.toFixed(2)} kg`;
    const si = document.getElementById('summaryItems'); if(si) si.textContent = `${totalItems} Barang (${totalJenis} Jenis Produk)`;
    const ss = document.getElementById('summarySubtotal'); if(ss) ss.textContent = formatRupiah(subtotal);
    const sc = document.getElementById('slotCount'); if(sc) sc.textContent = `${totalJenis} Produk Terpilih`;
    const cb = document.getElementById('cartBadge'); if(cb) cb.textContent = totalJenis;
    const sb = document.getElementById('sidebarCartBadge'); if(sb) sb.textContent = `${totalJenis} Part`;

    const grandTotal = subtotal + ongkir - diskon;
    const gt = document.getElementById('grandTotal'); 
    if(gt) gt.textContent = formatRupiah(grandTotal > 0 ? grandTotal : 0);
}

document.querySelectorAll('.qty-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const input = e.target.parentElement.querySelector('.qty-input');
        let val = parseInt(input.value);
        if (e.target.classList.contains('plus')) val++;
        if (e.target.classList.contains('minus') && val > 1) val--;
        input.value = val;
        updateCartCalculations();
    });
});

document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        e.target.value = val;
        updateCartCalculations();
    });
});

document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const item = e.target.closest('.cart-item');
        item.style.opacity = '0';
        item.style.transform = 'translateX(-20px)';
        setTimeout(() => {
            item.remove();
            updateCartCalculations();
        }, 300);
    });
});

const clearCartBtn = document.getElementById('clearCartBtn');
if(clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if(confirm('Yakin ingin mengosongkan keranjang balap Anda?')) {
            document.querySelectorAll('.cart-item').forEach(item => item.remove());
            updateCartCalculations();
        }
    });
}

if(document.querySelector('.cart-layout')) {
    updateCartCalculations();
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
                if(otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
        });

        item.classList.toggle('active');
        if (item.classList.contains('active')) {
            body.style.display = 'block';
            if(icon) icon.style.transform = 'rotate(180deg)';
        } else {
            body.style.display = 'none';
            if(icon) icon.style.transform = 'rotate(0deg)';
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
            alert('Pembayaran berhasil disimulasikan! Pesanan Anda sedang diproses. 🏁');
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
// FITUR KHUSUS HALAMAN TIM BALAP
// =========================================
document.querySelectorAll('.team-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        const name = card.querySelector('h3').textContent;
        card.style.transform = 'scale(0.98)';
        setTimeout(() => card.style.transform = '', 150);
    });
});

// =========================================
// FITUR HALAMAN KONFIRMASI PEMBAYARAN
// =========================================
function copyOrderId() {
    const orderId = document.getElementById('orderId');
    if(orderId) {
        navigator.clipboard.writeText(orderId.innerText);
        alert('Nomor Order berhasil disalin!');
    }
}

function copyVa() {
    const vaNumber = document.getElementById('vaNumber');
    if(vaNumber) {
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

// =========================================
// FITUR HALAMAN LOGIN
// =========================================
function switchAuth(type) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabs = document.querySelectorAll('.auth-tab');
    if (!loginForm || !registerForm) return;

    if (type === 'login') {
        loginForm.classList.add('active');
        registerForm.classList.remove('active');
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
    } else {
        loginForm.classList.remove('active');
        registerForm.classList.add('active');
        tabs[0].classList.remove('active');
        tabs[1].classList.add('active');
    }
}

const loginFormEl = document.getElementById('loginForm');
if (loginFormEl) {
    loginFormEl.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Login berhasil! Mengalihkan ke Dashboard...');
        window.location.href = 'index.html';
    });
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
        return "Halo! 👋 Selamat datang di YUKIDO Motorsport. Ada yang bisa saya bantu terkait part balap, garansi, atau lokasi showroom kami?";
    }
    if (input.includes('garansi') || input.includes('klaim') || input.includes('rusak')) {
        return "Garansi resmi YUKIDO berlaku <b>6 bulan</b> untuk part keras (cakram, shockbreaker) dan <b>1 bulan</b> untuk part consumable. Ajukan klaim di halaman <a href='garansi.html' style='color:var(--red-primary); font-weight:bold;'>Klaim Garansi</a> kami.";
    }
    if (input.includes('ongkir') || input.includes('kiriman') || input.includes('ekspedisi') || input.includes('biaya kirim')) {
        return "Kami bekerja sama dengan JNE Trucking, SiCepat, dan Instant Paddock. Estimasi biaya mulai dari <b>Rp 35.000</b> dengan asuransi kerusakan 100% included! ";
    }
    if (input.includes('lokasi') || input.includes('alamat') || input.includes('toko') || input.includes('showroom')) {
        return "Showroom & Workshop kami berada di: <br><b>PT YUKIDO POWER TEKNIK</b><br>Kawasan Industri, Serang, Banten.<br>Buka Senin-Sabtu, 08.00 - 19.00 WIB.  <a href='lokasi.html' style='color:var(--red-primary)'>Lihat di Peta</a>";
    }
    if (input.includes('bayar') || input.includes('metode pembayaran') || input.includes('transfer')) {
        return "Kami menerima pembayaran via Virtual Account (BCA, Mandiri, BNI, BRI), QRIS Dinamis, GoPay, OVO, dan Debit Online. Transaksi dienkripsi SSL 256-bit. ";
    }
    if (input.includes('cnc') || input.includes('material') || input.includes('bahan') || input.includes('spesifikasi')) {
        return "Part CNC YUKIDO terbuat dari <b>Billet Aluminium 6061-T6</b> dan <b>Stainless Steel 410</b> dengan toleransi mesin 0.02 mikron, diuji tahan panas hingga 680°C! 🔥";
    }
    if (input.includes('terima kasih') || input.includes('makasih') || input.includes('thanks')) {
        return "Sama-sama! 🏁 Selalu siap mendukung performa balap Anda. Jangan ragu untuk bertanya lagi!";
    }
    return "Maaf, saya belum mengerti pertanyaan tersebut. 🤖 <br><br>Coba ketik: <b>'garansi'</b>, <b>'ongkir'</b>, <b>'lokasi'</b>, atau <b>'cara bayar'</b>.";
}

document.addEventListener("DOMContentLoaded", function () {
    const toggleButton = document.querySelector(
        ".menu-toggle, .hamburger, #menu-toggle"
    );

    if (!toggleButton) return;

    toggleButton.addEventListener("click", function () {
        document.body.classList.toggle("sidebar-closed");
    });
});