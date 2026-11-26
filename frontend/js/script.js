// =========================================
// 1. SIDEBAR TOGGLE (BURGUNDY GLASSMORPHISM) & ACTIVE LINK
// =========================================
const menuToggle = document.getElementById('menuToggle');
const sidebar = document.getElementById('sidebar');

let yukidoCurrentUserId = localStorage.getItem('yukido_active_user_id') || null;
let yukidoCartCount = 3;

function applySidebarUserState(data) {
    const nameEl = document.getElementById('sidebarWelcomeName');
    const subEl = document.getElementById('sidebarWelcomeSub');
    const linkEl = document.getElementById('sidebarWelcomeCard');

    if (data && data.logged_in && data.user) {
        yukidoCurrentUserId = String(data.user.id);
        localStorage.setItem('yukido_active_user_id', yukidoCurrentUserId);

        if (nameEl) nameEl.textContent = data.user.name || data.user.full_name || 'Akun YUKIDO';
        if (subEl) subEl.textContent = data.user.email || 'Anggota Terverifikasi';
        if (linkEl) linkEl.setAttribute('href', 'akun.html');
    } else {
        yukidoCurrentUserId = null;
        localStorage.removeItem('yukido_active_user_id');

        if (nameEl) nameEl.textContent = 'Selamat Datang';
        if (subEl) subEl.textContent = 'Masuk atau kelola akun Anda';
        if (linkEl) linkEl.setAttribute('href', 'login.html');
    }
}

async function syncUserSessionAndSidebar() {
    try {
        const res = await fetch('../backend/auth/me.php', { credentials: 'same-origin' });
        if (!res.ok) return;
        const data = await res.json();
        applySidebarUserState(data);
    } catch {
        // Biarkan nilai fallback lokal tetap dipakai jika offline/belum terhubung
    }
    injectWishlistButtons();
}

function initBurgundyGlassSidebar() {
    if (!sidebar) return;

    let backdrop = document.querySelector('.sidebar-backdrop');
    if (!backdrop) {
        backdrop = document.createElement('div');
        backdrop.className = 'sidebar-backdrop';
        backdrop.hidden = true;
        document.body.appendChild(backdrop);
    }

    if (!sidebar.querySelector('.sidebar-header')) {
        const existingMenu = sidebar.querySelector('.sidebar-menu');
        const existingFooter = sidebar.querySelector('.sidebar-footer');

        const headerHTML = `
            <div class="sidebar-header">
                <a href="index.html" class="sidebar-brand">
                    <span>
                        <strong>YUKIDO</strong>
                        <small>POWER TEKNIK</small>
                    </span>
                </a>
                <button type="button" class="sidebar-close" id="sidebarClose" aria-label="Tutup Menu">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <a href="login.html" class="sidebar-welcome" id="sidebarWelcomeCard">
                <div class="sidebar-welcome-icon">
                    <i class="fas fa-user"></i>
                </div>
                <div>
                    <h4 id="sidebarWelcomeName">Selamat Datang</h4>
                    <p id="sidebarWelcomeSub">Masuk atau kelola akun Anda</p>
                </div>
                <i class="fas fa-chevron-right"></i>
            </a>
        `;

        sidebar.insertAdjacentHTML('afterbegin', headerHTML);

        if (!existingFooter) {
            sidebar.insertAdjacentHTML('beforeend', `
                <div class="sidebar-footer">
                    <a href="kategori-produk.html" class="telemetry-card" style="text-decoration:none;">
                        <i class="fas fa-check-circle telemetry-icon"></i>
                        <div class="telemetry-info">
                            <strong>TOOLS SELECTION</strong>
                            <span>Stok Tersedia &amp; Teruji</span>
                        </div>
                        <i class="fas fa-chevron-right" style="margin-left:auto;color:#fff;font-size:12px;"></i>
                    </a>
                </div>
            `);
        }

        const footerEl = sidebar.querySelector('.sidebar-footer');
        if (existingMenu && footerEl) {
            sidebar.insertBefore(existingMenu, footerEl);
        }
    }

    const closeBtn = sidebar.querySelector('.sidebar-close');

    function setSidebarState(isOpen) {
        sidebar.classList.toggle('expanded', isOpen);
        sidebar.classList.toggle('active', isOpen);
        sidebar.setAttribute('aria-hidden', String(!isOpen));

        backdrop.classList.toggle('active', isOpen);
        backdrop.hidden = !isOpen;

        document.body.classList.toggle('sidebar-open', isOpen);
        localStorage.setItem('yukido_sidebar_expanded', isOpen ? 'true' : 'false');
    }

    setSidebarState(false);

    if (menuToggle) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = !sidebar.classList.contains('expanded');
            setSidebarState(isOpen);
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            setSidebarState(false);
        });
    }

    backdrop.addEventListener('click', () => setSidebarState(false));

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') setSidebarState(false);
    });
}

initBurgundyGlassSidebar();

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

// =========================================
// 2. TAB FILTER, SMOOTH SCROLL & SEARCH TOP NAV
// =========================================
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const selector = this.getAttribute('href');
        if (!selector || selector === '#') return;
        const target = document.querySelector(selector);
        if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});

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
// 3. FITUR KERANJANG & HALAMAN PRODUK STATIS
// =========================================
function updateCartBadges() {
    const badge = document.getElementById('cartBadge');
    const sidebarBadge = document.getElementById('sidebarCartBadge');

    if (badge) {
        badge.textContent = yukidoCartCount;
        badge.style.transform = 'scale(1.35)';
        setTimeout(() => {
            badge.style.transform = 'scale(1)';
        }, 200);
    }

    if (sidebarBadge) {
        sidebarBadge.textContent = `${yukidoCartCount} Item`;
    }
}

function addToCart() {
    yukidoCartCount++;
    updateCartBadges();
    alert('Produk berhasil ditambahkan ke Keranjang Belanja!');
}

const btnBeliList = document.querySelectorAll('.btn-beli');
btnBeliList.forEach(btn => {
    btn.addEventListener('click', () => {
        const navCartBadge = document.querySelector('.cart-btn .badge');
        if (navCartBadge) {
            const current = parseInt(navCartBadge.textContent, 10) || 0;
            navCartBadge.textContent = current + 1;
        }
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 120);
    });
});

const staticCatTabs = document.querySelectorAll('.cat-tab[data-category]');
const staticProductCards = document.querySelectorAll('.produk-card[data-category]');

staticCatTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        staticCatTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const category = tab.getAttribute('data-category');
        staticProductCards.forEach(card => {
            if (category === 'all' || card.getAttribute('data-category') === category) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    });
});

const searchProductInput = document.getElementById('searchProduct');
if (searchProductInput && staticProductCards.length > 0) {
    searchProductInput.addEventListener('input', (e) => {
        const keyword = e.target.value.trim().toLowerCase();
        staticProductCards.forEach(card => {
            const titleEl = card.querySelector('h3');
            const title = titleEl ? titleEl.textContent.toLowerCase() : '';
            card.style.display = title.includes(keyword) ? '' : 'none';
        });
    });
}

const btnReset = document.querySelector('.btn-reset');
if (btnReset && staticProductCards.length > 0) {
    btnReset.addEventListener('click', () => {
        if (searchProductInput) searchProductInput.value = '';
        staticCatTabs.forEach(t => t.classList.remove('active'));
        const allTab = document.querySelector('.cat-tab[data-category="all"]');
        if (allTab) allTab.classList.add('active');
        staticProductCards.forEach(card => {
            card.style.display = '';
        });
    });
}

// =========================================
// 4. FITUR KHUSUS HALAMAN CHECKOUT
// =========================================
document.querySelectorAll('.pay-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.pay-tab').forEach(t => t.classList.remove('active'));
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
        if (!item || !body) return;

        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                const otherBody = otherItem.querySelector('.accordion-body');
                const otherIcon = otherItem.querySelector('.accordion-header i:last-child');
                if (otherBody) otherBody.style.display = 'none';
                if (otherIcon) otherIcon.style.transform = 'rotate(0deg)';
            }
        });

        item.classList.toggle('active');
        const isOpen = item.classList.contains('active');
        body.style.display = isOpen ? 'block' : 'none';
        if (icon) icon.style.transform = isOpen ? 'rotate(180deg)' : 'rotate(0deg)';
    });
});

const copyVaBtn = document.getElementById('copyVaBtn');
if (copyVaBtn) {
    copyVaBtn.addEventListener('click', () => {
        const vaEl = document.getElementById('vaNumber');
        if (!vaEl) return;
        const vaNumber = vaEl.textContent.replace(/\s/g, '');
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
        const originalText = btnPayNow.innerHTML;
        btnPayNow.disabled = true;
        btnPayNow.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES PEMBAYARAN...';
        setTimeout(() => {
            alert('Pembayaran berhasil dikonfirmasi! Pesanan Anda sedang diproses.');
            btnPayNow.disabled = false;
            btnPayNow.innerHTML = originalText;
        }, 1500);
    });
}

// =========================================
// 5. FITUR KHUSUS HALAMAN GARANSI
// =========================================
function setupFileUpload(inputId, dropZoneId, fileNameId) {
    const input = document.getElementById(inputId);
    const dropZone = document.getElementById(dropZoneId);
    const fileNameDisplay = document.getElementById(fileNameId);

    if (dropZone && input) {
        dropZone.addEventListener('click', () => input.click());
        input.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && fileNameDisplay) {
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
if (btnCekTiket && trackStatus) {
    btnCekTiket.addEventListener('click', () => {
        const ticketInput = document.getElementById('ticketInput');
        const ticketId = ticketInput ? ticketInput.value.trim() : '';
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
        if (!faqItem) return;
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
        const originalText = btn ? btn.innerHTML : '';
        if (btn) {
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM DATA...';
            btn.disabled = true;
        }
        setTimeout(() => {
            alert('Klaim garansi berhasil dikirim! Tim QC akan menghubungi via WhatsApp.');
            if (btn) {
                btn.innerHTML = originalText;
                btn.disabled = false;
            }
            garansiForm.reset();
        }, 2000);
    });
}

// =========================================
// 6. FITUR HALAMAN KONFIRMASI PEMBAYARAN
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

let remainingSeconds = 2 * 60 * 60;
const countdownEl = document.getElementById('countdown');
if (countdownEl) {
    const timer = setInterval(() => {
        const hours = Math.floor(remainingSeconds / 3600);
        const minutes = Math.floor((remainingSeconds % 3600) / 60);
        const seconds = remainingSeconds % 60;
        countdownEl.innerText = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        if (remainingSeconds <= 0) {
            clearInterval(timer);
            countdownEl.innerText = 'WAKTU HABIS';
        }
        remainingSeconds--;
    }, 1000);
}

// =========================================
// 7. AUTH PAGE LOGIC (LOGIN, REGISTER & LUPA KATA SANDI)
// =========================================
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
    const icon = btn ? btn.querySelector('i') : null;
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
// 8. LOGIKA AI CHATBOT YUKIDO
// =========================================
const chatbotToggle = document.getElementById('chatbotToggle');
const chatbotContainer = document.getElementById('chatbotContainer');
const chatbotClose = document.getElementById('chatbotClose');
const chatbotInput = document.getElementById('chatbotInput');
const chatbotSend = document.getElementById('chatbotSend');
const chatbotMessages = document.getElementById('chatbotMessages');

if (chatbotToggle && chatbotContainer) {
    chatbotToggle.addEventListener('click', () => {
        chatbotContainer.classList.toggle('active');
        if (chatbotContainer.classList.contains('active') && chatbotInput) {
            setTimeout(() => chatbotInput.focus(), 300);
        }
    });
}

if (chatbotClose && chatbotContainer) {
    chatbotClose.addEventListener('click', () => {
        chatbotContainer.classList.remove('active');
    });
}

function sendMessage() {
    if (!chatbotInput || !chatbotMessages) return;
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
    if (!chatbotMessages) return;
    const div = document.createElement('div');
    div.className = `message ${className}`;
    div.innerHTML = text;
    chatbotMessages.appendChild(div);
    chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
}

function showTypingIndicator() {
    if (!chatbotMessages) return null;
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
    if (!id) return;
    const el = document.getElementById(id);
    if (el) el.remove();
}

function getAIResponse(input) {
    if (input.includes('halo') || input.includes('hi') || input.includes('pagi') || input.includes('siang') || input.includes('malam')) {
        return 'Halo! 👋 Selamat datang di PT. Yukido Power Teknik. Ada yang bisa saya bantu terkait produk perkakas, garansi, atau lokasi showroom kami?';
    }
    if (input.includes('garansi') || input.includes('klaim') || input.includes('rusak')) {
        return "Garansi resmi YUKIDO berlaku <b>1 tahun</b> untuk mesin power tools dan <b>seumur hidup</b> untuk perkakas tangan (hand tools). Ajukan klaim di halaman <a href='garansi.html' style='color:var(--red-primary); font-weight:bold;'>Klaim Garansi</a> kami.";
    }
    if (input.includes('ongkir') || input.includes('kiriman') || input.includes('ekspedisi') || input.includes('biaya kirim')) {
        return 'Kami bekerja sama dengan JNE, J&T, dan SiCepat dengan gratis ongkir hingga Rp 50.000 serta perlindungan asuransi pengiriman 100%.';
    }
    if (input.includes('lokasi') || input.includes('alamat') || input.includes('toko') || input.includes('showroom')) {
        return "Kantor Pusat & Showroom kami berada di: <br><b>PT YUKIDO POWER TEKNIK</b><br>Caringin, Kec. Legok, Kabupaten Tangerang, Banten.<br>Buka Senin-Sabtu, 08.00 - 17.00 WIB. <a href='lokasi.html' style='color:var(--red-primary)'>Lihat di Peta</a>";
    }
    if (input.includes('bayar') || input.includes('metode pembayaran') || input.includes('transfer')) {
        return 'Kami menerima pembayaran via Virtual Account (BCA, Mandiri, BNI, BRI), QRIS Dinamis, GoPay, OVO, dan Debit Online.';
    }
    if (input.includes('terima kasih') || input.includes('makasih') || input.includes('thanks')) {
        return 'Sama-sama! Senang bisa membantu kebutuhan perkakas Anda.';
    }
    return "Maaf, saya belum mengerti pertanyaan tersebut. 🤖 <br><br>Coba ketik: <b>'garansi'</b>, <b>'ongkir'</b>, <b>'lokasi'</b>, atau <b>'cara bayar'</b>.";
}

// =========================================
// 9. FITUR WISHLIST OTOMATIS DI KARTU PRODUK (PER AKUN)
// =========================================
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
        if (!card || card === document.body) return;

        if (getComputedStyle(card).position === 'static') {
            card.style.position = 'relative';
        }

        const titleEl = card.querySelector('h3, h4, h5, .product-title, .nama-produk');
        const imgEl = card.querySelector('img');
        const name = titleEl ? titleEl.textContent.trim() : 'Produk YUKIDO';
        const image = imgEl ? imgEl.getAttribute('src') : 'images/yukido.png';
        const id = card.getAttribute('data-id') || name.toLowerCase().replace(/\s+/g, '-');
        const isSaved = wishlist.some(item => item.name === name);

        let btn = card.querySelector('.btn-wishlist-card');
        if (!btn) {
            btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'btn-wishlist-card';

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

                const currentList = getYukidoWishlist();
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
        }

        btn.classList.toggle('active', isSaved);
        btn.title = isSaved ? 'Hapus dari Wishlist' : 'Simpan ke Wishlist';
        btn.innerHTML = `<i class="${isSaved ? 'fas' : 'far'} fa-heart"></i>`;
        applyWishlistBtnStyle(btn, isSaved);
    });
}

// =========================================
// 10. WARNA HARGA PUTIH & RESET TOMBOL BELI
// =========================================
function forceWhiteProductPrices() {
    document.querySelectorAll('p, div, span').forEach(el => {
        if (el.children.length === 0 && /^Rp\s*[\d.,]+$/i.test(el.textContent.trim())) {
            el.style.setProperty('color', '#ffffff', 'important');
        }
    });
}

function resetStuckBuyButtons() {
    document.querySelectorAll('button, a').forEach(btn => {
        if (btn.textContent.trim().toUpperCase().includes('MEMPROSES')) {
            btn.disabled = false;
            btn.innerHTML = 'BELI';
        }
    });
}

function runCardEnhancements() {
    resetStuckBuyButtons();
    injectWishlistButtons();
    forceWhiteProductPrices();
}

window.addEventListener('pageshow', () => {
    runCardEnhancements();
});

document.addEventListener('DOMContentLoaded', () => {
    runCardEnhancements();
    syncUserSessionAndSidebar();

    let observerTimer = null;
    const observer = new MutationObserver((mutations) => {
        const hasRelevantNode = mutations.some(mutation =>
            Array.from(mutation.addedNodes).some(node =>
                node.nodeType === 1 &&
                !node.classList?.contains('btn-wishlist-card') &&
                !node.classList?.contains('typing-indicator') &&
                !node.classList?.contains('message')
            )
        );

        if (!hasRelevantNode) return;

        clearTimeout(observerTimer);
        observerTimer = setTimeout(() => {
            observer.disconnect();
            runCardEnhancements();
            observer.observe(document.body, { childList: true, subtree: true });
        }, 120);
    });

    observer.observe(document.body, { childList: true, subtree: true });
});

// =========================================
// 11. TOMBOL GESER (< & >) SLIDER KATEGORI
// =========================================
(function () {
    const slider = document.getElementById('kategoriSlider');
    const prevBtn = document.getElementById('kategoriScrollPrev');
    const nextBtn = document.getElementById('kategoriScrollNext');

    if (!slider) return;

    function getScrollStep() {
        const card = slider.querySelector('.kategori-card');
        return card ? card.getBoundingClientRect().width + 20 : 340;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const step = getScrollStep();
            if (slider.scrollLeft <= 5) {
                slider.scrollTo({ left: slider.scrollWidth, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: -step, behavior: 'smooth' });
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const step = getScrollStep();
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 5) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: step, behavior: 'smooth' });
            }
        });
    }
})();