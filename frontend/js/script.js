// Sidebar Toggle
const menuToggle = document.getElementById('menuToggle');
const closeSidebar = document.getElementById('closeSidebar');
const sidebar = document.getElementById('sidebar');

menuToggle.addEventListener('click', () => {
    sidebar.classList.toggle('active');
});

closeSidebar.addEventListener('click', () => {
    sidebar.classList.remove('active');
});

// Tab Filter
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
    });
});

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Add to Cart Animation
const btnBeli = document.querySelectorAll('.btn-beli');
btnBeli.forEach(btn => {
    btn.addEventListener('click', () => {
        const cartBadge = document.querySelector('.cart-btn .badge');
        let count = parseInt(cartBadge.textContent);
        cartBadge.textContent = count + 1;
        
        // Animation
        btn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            btn.style.transform = 'scale(1)';
        }, 100);
    });
});

// Search Bar Focus
const searchInput = document.querySelector('.search-bar input');
searchInput.addEventListener('focus', () => {
    searchInput.parentElement.style.borderColor = 'var(--red-primary)';
});

searchInput.addEventListener('blur', () => {
    searchInput.parentElement.style.borderColor = 'var(--border-color)';
});

// Floating Button
const floatingBtn = document.querySelector('.floating-btn');
floatingBtn.addEventListener('click', () => {
    alert('Fitur AI Assistant akan segera hadir! 🤖');
});

console.log('YUKIDO Motorsport Website Loaded Successfully! 🏁');

// --- Fitur Khusus Halaman Produk ---

// 1. Filter Kategori (Tab)
const catTabs = document.querySelectorAll('.cat-tab');
const productCards = document.querySelectorAll('.produk-card');

catTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        // Hapus active dari semua tab
        catTabs.forEach(t => t.classList.remove('active'));
        // Tambah active ke tab yang diklik
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

// 2. Search Produk (Real-time)
const searchInput = document.getElementById('searchProduct');
if (searchInput) {
    searchInput.addEventListener('input', (e) => {
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

// 3. Fungsi Add to Cart (Update Badge)
let cartCount = 3; // Mulai dari 3 sesuai desain

function addToCart() {
    cartCount++;
    document.getElementById('cartBadge').textContent = cartCount;
    document.getElementById('sidebarCartBadge').textContent = cartCount + ' Part';
    
    // Efek visual sederhana
    const badge = document.getElementById('cartBadge');
    badge.style.transform = 'scale(1.5)';
    setTimeout(() => {
        badge.style.transform = 'scale(1)';
    }, 200);
    
    alert('Produk berhasil ditambahkan ke Keranjang Balap! 🏁');
}

// 4. Reset Filter
const btnReset = document.querySelector('.btn-reset');
if (btnReset) {
    btnReset.addEventListener('click', () => {
        // Reset search
        if(searchInput) searchInput.value = '';
        
        // Reset tab ke 'all'
        catTabs.forEach(t => t.classList.remove('active'));
        document.querySelector('.cat-tab[data-category="all"]').classList.add('active');
        
        // Tampilkan semua produk
        productCards.forEach(card => {
            card.style.display = 'block';
        });
    });
}

// --- Fitur Khusus Halaman Keranjang ---

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
        
        // Update Subtotal per item
        const itemSubtotal = price * qty;
        item.querySelector('.item-subtotal').innerHTML = `${formatRupiah(itemSubtotal)}<br><span class="per-unit">SUBTOTAL</span>`;
        
        totalItems += qty;
        subtotal += itemSubtotal;
        totalWeight += (weight * qty);

        // Update Telemetry Bars (Simulasi sederhana)
        if(index === 0) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            document.getElementById('weight1').textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            document.querySelector('.telem-item:nth-child(1) .progress-fill').style.width = `${pct}%`;
        } else if(index === 1) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            document.getElementById('weight2').textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            document.querySelector('.telem-item:nth-child(2) .progress-fill').style.width = `${pct}%`;
        } else if(index === 2) {
            const pct = Math.round(((weight * qty) / (totalWeight || 1)) * 100);
            document.getElementById('weight3').textContent = `${(weight * qty).toFixed(2)} kg (${pct}%)`;
            document.querySelector('.telem-item:nth-child(3) .progress-fill').style.width = `${pct}%`;
        }
    });

    document.getElementById('totalWeight').textContent = `${totalWeight.toFixed(2)} kg`;
    document.getElementById('summaryItems').textContent = `${totalItems} Barang (${totalJenis} Jenis Produk)`;
    document.getElementById('summarySubtotal').textContent = formatRupiah(subtotal);
    document.getElementById('slotCount').textContent = `${totalJenis} Produk Terpilih`;
    document.getElementById('cartBadge').textContent = totalJenis;
    document.getElementById('sidebarCartBadge').textContent = `${totalJenis} Part`;

    const grandTotal = subtotal + ongkir - diskon;
    document.getElementById('grandTotal').textContent = formatRupiah(grandTotal > 0 ? grandTotal : 0);
}

// Event Listeners untuk tombol +/- dan input
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

// Hapus Item
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

// Kosongkan Keranjang
const clearCartBtn = document.getElementById('clearCartBtn');
if(clearCartBtn) {
    clearCartBtn.addEventListener('click', () => {
        if(confirm('Yakin ingin mengosongkan keranjang balap Anda?')) {
            document.querySelectorAll('.cart-item').forEach(item => item.remove());
            updateCartCalculations();
        }
    });
}

// Jalankan kalkulasi awal jika di halaman keranjang
if(document.querySelector('.cart-layout')) {
    updateCartCalculations();
}

// --- Fitur Khusus Halaman Checkout ---

// 1. Payment Tabs Switching
const payTabs = document.querySelectorAll('.pay-tab');
payTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        payTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        // Di sini bisa ditambahkan logic untuk show/hide konten tab lain (QRIS, E-Wallet, dll)
        // Untuk sekarang kita fokus ke tab VA yang aktif.
    });
});

// 2. Shipping & Bank Selection (Visual Active State)
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

// 3. Accordion Toggle
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        const item = header.parentElement;
        const body = header.nextElementSibling;
        const icon = header.querySelector('i:last-child');
        
        // Tutup semua accordion lain
        document.querySelectorAll('.accordion-item').forEach(otherItem => {
            if (otherItem !== item) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.accordion-body').style.display = 'none';
                otherItem.querySelector('.accordion-header i:last-child').style.transform = 'rotate(0deg)';
            }
        });

        // Toggle yang diklik
        item.classList.toggle('active');
        if (item.classList.contains('active')) {
            body.style.display = 'block';
            icon.style.transform = 'rotate(180deg)';
        } else {
            body.style.display = 'none';
            icon.style.transform = 'rotate(0deg)';
        }
    });
});

// 4. Copy Virtual Account Number
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
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
        });
    });
}

// 5. Simulasi Tombol Bayar Sekarang
const btnPayNow = document.querySelector('.btn-pay-now');
if (btnPayNow) {
    btnPayNow.addEventListener('click', () => {
        btnPayNow.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MEMPROSES PEMBAYARAN...';
        setTimeout(() => {
            alert('Pembayaran berhasil disimulasikan! Pesanan Anda sedang diproses oleh tim Paddock YUKIDO. 🏁');
            btnPayNow.innerHTML = '<i class="fas fa-lock"></i> BAYAR SEKARANG & BUAT PESANAN';
        }, 1500);
    });
}

// --- Fitur Khusus Halaman Garansi ---

// 1. Simulasi Upload File
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

// 2. Simulasi Tracking Tiket
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

// 3. FAQ Accordion
document.querySelectorAll('.faq-question').forEach(button => {
    button.addEventListener('click', () => {
        const faqItem = button.parentElement;
        const isActive = faqItem.classList.contains('active');
        
        // Tutup semua FAQ
        document.querySelectorAll('.faq-item').forEach(item => {
            item.classList.remove('active');
        });

        // Buka yang diklik jika sebelumnya tertutup
        if (!isActive) {
            faqItem.classList.add('active');
        }
    });
});

// 4. Form Submission Simulation
const garansiForm = document.getElementById('garansiForm');
if (garansiForm) {
    garansiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const btn = garansiForm.querySelector('.btn-submit-klaim');
        const originalText = btn.innerHTML;
        
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> MENGIRIM DATA KE SERVER QC...';
        btn.disabled = true;
        
        setTimeout(() => {
            alert('Klaim garansi berhasil dikirim! Tiket Anda: YKD-CLM-88492. Tim QC akan menghubungi via WhatsApp dalam 1x24 jam.');
            btn.innerHTML = originalText;
            btn.disabled = false;
            garansiForm.reset();
            document.querySelectorAll('.file-name').forEach(el => el.textContent = '');
            document.querySelectorAll('.drop-zone').forEach(el => {
                el.style.borderColor = '';
                el.style.background = '';
            });
        }, 2000);
    });
}

// --- Fitur Khusus Halaman Tim Balap ---

// 1. Interaksi Kartu Tim (Simulasi View Profile)
document.querySelectorAll('.team-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
        const name = card.querySelector('h3').textContent;
        const role = card.querySelector('.team-role').textContent;
        // Efek visual klik
        card.style.transform = 'scale(0.98)';
        setTimeout(() => {
            card.style.transform = '';
            alert(`Membuka profil lengkap:\n\n${name}\n${role}\n\n(Data statistik balap dan riwayat podium akan dimuat di sini.)`);
        }, 150);
    });
});

// 2. Smooth Scroll untuk CTA Buttons
document.querySelectorAll('.cta-buttons a').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Biarkan link normal berjalan, tapi tambahkan efek
        btn.style.opacity = '0.7';
        setTimeout(() => btn.style.opacity = '1', 200);
    });
});

console.log('YUKIDO Racing Team Page Loaded Successfully! 🏁🏍️');

// --- Fitur Khusus Halaman Detail Produk ---

// 1. Ganti Gambar Utama saat Thumbnail diklik
function changeImage(element) {
    // Ubah src gambar utama
    document.getElementById('mainImage').src = element.src.replace('w=150&h=150', 'w=600&h=600');
    
    // Hapus class active dari semua thumbnail
    document.querySelectorAll('.thumb').forEach(thumb => thumb.classList.remove('active'));
    
    // Tambah class active ke thumbnail yang diklik
    element.classList.add('active');
}

// 2. Pilih Varian
function selectVariant(element) {
    document.querySelectorAll('.variant-btn').forEach(btn => btn.classList.remove('active'));
    element.classList.add('active');
}

// 3. Atur Jumlah (Qty)
function adjustDetailQty(change) {
    const qtyInput = document.getElementById('detailQty');
    let currentQty = parseInt(qtyInput.value);
    let newQty = currentQty + change;
    
    if (newQty >= 1) {
        qtyInput.value = newQty;
    }
}

// 4. Tambah ke Keranjang dari Detail
function addToCartFromDetail() {
    const qty = parseInt(document.getElementById('detailQty').value);
    let cartCount = parseInt(document.getElementById('cartBadge').textContent);
    
    cartCount += qty;
    document.getElementById('cartBadge').textContent = cartCount;
    document.getElementById('sidebarCartBadge').textContent = cartCount + ' Part';
    
    // Animasi badge
    const badge = document.getElementById('cartBadge');
    badge.style.transform = 'scale(1.5)';
    setTimeout(() => { badge.style.transform = 'scale(1)'; }, 200);
    
    alert(`Berhasil menambahkan ${qty} item ke Keranjang Balap! 🏁`);
}

// 5. Toggle Wishlist
function toggleWishlist(element) {
    element.classList.toggle('active');
    const icon = element.querySelector('i');
    if (element.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
    } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
    }
}

// 6. Tab Switching
function openTab(evt, tabName) {
    // Sembunyikan semua tab content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    
    // Hapus class active dari semua tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Tampilkan tab yang dipilih dan tambahkan class active ke button
    document.getElementById(tabName).classList.add('active');
    evt.currentTarget.classList.add('active');
}