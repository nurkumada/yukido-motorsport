/* Shared header/sidebar loader and behavior for all content pages. */
document.addEventListener('DOMContentLoaded', async () => {
    const mount = document.getElementById('site-layout');
    if (!mount) return;

    try {
        const response = await fetch('components/layout.html');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        mount.innerHTML = await response.text();

        const currentPage = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        mount.querySelectorAll('.sidebar-menu .menu-item').forEach(link => {
            link.classList.toggle('active', (link.getAttribute('href') || '').toLowerCase() === currentPage);
        });

        const toggle = mount.querySelector('#menuToggle');
        const sidebar = mount.querySelector('#sidebar');
        const backdrop = mount.querySelector('#sidebarBackdrop');
        const setSidebar = (open) => {
            sidebar?.classList.toggle('active', open);
            document.body.classList.toggle('sidebar-open', open);
            if (toggle) {
                toggle.setAttribute('aria-expanded', String(open));
                toggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
                const icon = toggle.querySelector('i');
                if (icon) icon.className = open ? 'fas fa-xmark' : 'fas fa-bars';
            }
            if (backdrop) backdrop.hidden = !open;
        };

        toggle?.addEventListener('click', () => setSidebar(!sidebar.classList.contains('active')));
        backdrop?.addEventListener('click', () => setSidebar(false));

        // Search button expands a compact search field without adding duplicate navigation.
        const searchToggle = mount.querySelector('#searchToggle');
        const searchWrap = mount.querySelector('.header-search-wrap');
        const searchInput = mount.querySelector('#headerSearchInput');
        const searchForm = mount.querySelector('#headerSearchForm');
        searchToggle?.addEventListener('click', () => {
            const open = searchWrap?.classList.toggle('search-open') || false;
            searchToggle.setAttribute('aria-expanded', String(open));
            if (open) searchInput?.focus();
        });
        searchForm?.addEventListener('submit', event => {
            event.preventDefault();
            const query = searchInput?.value.trim();
            if (query) window.location.href = `produk.html?search=${encodeURIComponent(query)}`;
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape') setSidebar(false);
        });
        sidebar?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => setSidebar(false)));

        // Keep shared cart count aligned with a page-level cart badge when one exists.
        const sharedBadge = mount.querySelector('.sidebar-menu .badge');
        const pageBadge = document.getElementById('cartBadge');
        if (sharedBadge && pageBadge) sharedBadge.textContent = `${pageBadge.textContent.trim()} Part`;
    } catch (error) {
        console.error('Gagal memuat header/sidebar YUKIDO:', error);
        mount.innerHTML = '<p style="padding:12px;color:#ff4d4d">Header tidak dapat dimuat. Jalankan proyek melalui VS Code Live Server.</p>';
    }
});
