// =========================================
// 1. SIDEBAR TOGGLE (GARIS 3) & ACTIVE LINK
// =========================================
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

function updateSidebarLayout() {
    const isExpanded = sidebar && sidebar.classList.contains('expanded');
    document.body.classList.toggle('sidebar-open', isExpanded);
    localStorage.setItem('yukido_sidebar_expanded', isExpanded ? 'true' : 'false');
}

// Terapkan status sidebar terakhir (bawaan terbuka / 'true')
if (sidebar) {
    const savedState = localStorage.getItem('yukido_sidebar_expanded');
    if (savedState === 'false') {
        sidebar.classList.remove('expanded');
    } else {
        sidebar.classList.add('expanded');
    }
    updateSidebarLayout();
}

if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        sidebar.classList.toggle('expanded');
        updateSidebarLayout();
    });
}

// Otomatis tandai menu sidebar yang aktif sesuai halaman
document.addEventListener('DOMContentLoaded', () => {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.sidebar-menu .menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('href') === currentPage) {
            item.classList.add('active');
        }
    });
});

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

// =========================================
// FITUR WISHLIST OTOMATIS DI KARTU PRODUK (IKON LOVE SAJA + PER AKUN)
// =========================================
let yukidoCurrentUserId = localStorage.getItem('yukido_active_user_id') || null;

function getYukidoWishlistKey() {
    return yukidoCurrentUserId ? `yukido_wishlist_${yukidoCurrentUserId}` : null;
}

function getYukidoWishlist() {
    const key = getYukidoWishlistKey();
    if (!key) return [];
    try {
        return JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
        return [];
    }
}

function saveYukidoWishlist(list) {
    const key = getYukidoWishlistKey();
    if (!key) return;
    localStorage.setItem(key, JSON.stringify(list));
}

function extractProductPrice(card) {
    const dataPrice = card.getAttribute('data-price');
    if (dataPrice) return parseInt(dataPrice.replace(/[^\d]/g, ''), 10) || 0;

    const textMatch = card.innerText.match(/Rp\s*([\d.,]+)/i);
    if (textMatch && textMatch[1]) {
        const numeric = textMatch[1].replace(/[^\d]/g, '');
        return parseInt(numeric, 10) || 0;
    }
    return 0;
}

function applyWishlistBtnStyle(btn, isSaved) {
    btn.style.setProperty('position', 'absolute', 'important');
    btn.style.setProperty('top', '12px', 'important');
    btn.style.setProperty('right', '12px', 'important');
    btn.style.setProperty('width', 'auto', 'important');
    btn.style.setProperty('min-width', '0', 'important');
    btn.style.setProperty('height', 'auto', 'important');
    btn.style.setProperty('padding', '4px', 'important');
    btn.style.setProperty('background', 'transparent', 'important');
    btn.style.setProperty('border', 'none', 'important');
    btn.style.setProperty('border-radius', '0', 'important');
    btn.style.setProperty('box-shadow', 'none', 'important');
    btn.style.setProperty('color', isSaved ? '#e50914' : '#ffffff', 'important');
    btn.style.setProperty('font-size', '21px', 'important');
    btn.style.setProperty('line-height', '1', 'important');
    btn.style.setProperty('cursor', 'pointer', 'important');
    btn.style.setProperty('z-index', '15', 'important');
    btn.style.setProperty('filter', 'drop-shadow(0 2px 5px rgba(0, 0, 0, 0.75))', 'important');
    btn.style.setProperty('transition', 'transform 0.2s ease, color 0.2s ease', 'important');
}

function injectWishlistButtons() {
    const buyButtons = Array.from(document.querySelectorAll('button, a')).filter(
        el => el.textContent.trim().toUpperCase() === 'BELI'
    );

    const wishlist = getYukidoWishlist();

    buyButtons.forEach(buyBtn => {
        let card = buyBtn.parentElement;
        while (card && card !== document.body && !card.querySelector('img')) {
            card = card.parentElement;
        }
        if (!card || card === document.body || card.querySelector('.btn-wishlist-card')) return;

        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }

        const titleEl = card.querySelector('h3, h4, h5, .product-title, .nama-produk');
        const imgEl = card.querySelector('img');

        const name = titleEl ? titleEl.textContent.trim() : 'Produk YUKIDO';
        const image = imgEl ? imgEl.getAttribute('src') : 'images/yukido.png';
        const id = card.getAttribute('data-id') || name.toLowerCase().replace(/\s+/g, '-');

        const isSaved = wishlist.some(item => item.name === name);

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn-wishlist-card' + (isSaved ? ' active' : '');
        btn.title = isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist';
        btn.innerHTML = `<i class="${isSaved ? 'fas' : 'far'} fa-heart"></i>`;
        applyWishlistBtnStyle(btn, isSaved);

        btn.addEventListener('mouseenter', () => {
            btn.style.setProperty('transform', 'scale(1.18)', 'important');
            btn.style.setProperty('color', '#e50914', 'important');
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.setProperty('transform', 'scale(1)', 'important');
            applyWishlistBtnStyle(btn, btn.classList.contains('active'));
        });

        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (!yukidoCurrentUserId) {
                alert('Silakan login terlebih dahulu untuk menyimpan produk ke Wishlist.');
                window.location.href = 'login.html';
                return;
            }

            let currentList = getYukidoWishlist();
            const existingIndex = currentList.findIndex(item => item.name === name);
            const latestPrice = extractProductPrice(card);

            if (existingIndex > -1) {
                currentList.splice(existingIndex, 1);
                btn.classList.remove('active');
                btn.title = 'Simpan ke Wishlist';
                btn.innerHTML = '<i class="far fa-heart"></i>';
                applyWishlistBtnStyle(btn, false);
            } else {
                currentList.push({ id, name, price: latestPrice, image });
                btn.classList.add('active');
                btn.title = 'Hapus dari Wishlist';
                btn.innerHTML = '<i class="fas fa-heart"></i>';
                applyWishlistBtnStyle(btn, true);
            }

            saveYukidoWishlist(currentList);
        });

        card.appendChild(btn);
    });
}

async function syncWishlistUserSession() {
    try {
        const res = await fetch('../backend/auth/me.php', { credentials: 'same-origin' });
        const data = await res.json();
        if (data.logged_in && data.user) {
            yukidoCurrentUserId = String(data.user.id);
            localStorage.setItem('yukido_active_user_id', yukidoCurrentUserId);
        } else {
            yukidoCurrentUserId = null;
            localStorage.removeItem('yukido_active_user_id');
        }
    } catch {
        // biarkan fallback
    }
    injectWishlistButtons();
}

// =========================================
// RESET TOMBOL "MEMPROSES..." SAAT KEMBALI (BACK) DARI HALAMAN LAIN
// =========================================
function resetStuckBuyButtons() {
    document.querySelectorAll('button, a').forEach(btn => {
        if (btn.textContent.trim().toUpperCase().includes('MEMPROSES')) {
            btn.disabled = false;
            btn.innerHTML = 'BELI';
        }
    });
}

window.addEventListener('pageshow', () => {
    resetStuckBuyButtons();
    injectWishlistButtons();
});

document.addEventListener('DOMContentLoaded', () => {
    resetStuckBuyButtons();
    syncWishlistUserSession();
    setTimeout(injectWishlistButtons, 500);
    setTimeout(injectWishlistButtons, 1500);

    const observer = new MutationObserver(() => {
        resetStuckBuyButtons();
        injectWishlistButtons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
});