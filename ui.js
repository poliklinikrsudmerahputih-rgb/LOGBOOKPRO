/**
 * UI.JS - Core UI Controller (Final V3.7 - Mobile Optimized)
 * Sistem Navigasi & Sinkronisasi Data Global Terintegrasi
 */

// 1. INISIALISASI HALAMAN
document.addEventListener('DOMContentLoaded', () => {
    // Sinkronisasi data profile di header secara otomatis
    syncSidebarProfile();
    
    // Default: Tampilkan halaman profil saat pertama kali buka
    showPage('profil');

    // Listener Tambahan: Tutup sidebar otomatis saat menu diklik (Khusus Mobile)
    const navItems = document.querySelectorAll('#sidebar li');
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleSidebar(); // Fungsi ini ada di index.html
            }
        });
    });
});

/**
 * FUNGSI NAVIGASI UTAMA (ROUTER)
 * Menghubungkan sidebar dengan modul-modul JS yang berbeda
 */
function showPage(page) {
    const container = document.getElementById('page-content');
    const titleEl = document.getElementById('page-title');
    if (!container) return;

    // Mapping Judul Halaman agar Header Dinamis
    const pageTitles = {
        'harian': 'Input Logbook Harian',
        'kegiatan': 'Master Butir Kegiatan',
        'profil': 'Profil Pegawai',
        'rekap-harian': 'Laporan Harian',
        'rekap-bulanan': 'Laporan Bulanan',
        'rekap-triwulan': 'Laporan Triwulan',
        'rekap-tahunan': 'Laporan Tahunan'
    };

    if (titleEl) titleEl.innerText = pageTitles[page] || 'Dashboard';

    // Highlight menu aktif di sidebar
    document.querySelectorAll('#sidebar li').forEach(li => li.classList.remove('active'));
    const activeMenu = document.getElementById('nav-' + page);
    if (activeMenu) activeMenu.classList.add('active');

    // Reset scroll & Berikan feedback visual loading
    window.scrollTo(0, 0);
    container.innerHTML = `
        <div style="display:flex; justify-content:center; align-items:center; height:300px; flex-direction:column; gap:20px;">
            <i class="fas fa-circle-notch fa-spin" style="font-size:40px; color:var(--accent);"></i>
            <p style="letter-spacing:2px; font-size:12px; opacity:0.7;">MEMUAT MODUL ${page.toUpperCase()}...</p>
        </div>
    `;

    try {
        switch (page) {
            case 'harian':
                if (typeof renderLogbookPage === 'function') {
                    renderLogbookPage(container);
                }
                break;

            case 'kegiatan':
                if (typeof renderMasterPage === 'function') {
                    renderMasterPage(container);
                }
                break;

            case 'profil':
                if (typeof renderProfilPage === 'function') {
                    renderProfilPage(container);
                }
                break;

            case 'rekap-harian':
                if (window.uiRekap?.renderRekapHarian) {
                    window.uiRekap.renderRekapHarian();
                }
                break;

            case 'rekap-bulanan':
                if (window.uiRekap?.renderRekapBulanan) {
                    window.uiRekap.renderRekapBulanan();
                }
                break;

            case 'rekap-triwulan':
                if (window.uiRekap?.renderRekapTriwulan) {
                    window.uiRekap.renderRekapTriwulan();
                }
                break;

            case 'rekap-tahunan':
                if (window.uiRekap?.renderRekapTahunan) {
                    window.uiRekap.renderRekapTahunan();
                }
                break;

            default:
                container.innerHTML = `
                    <div class="card" style="text-align:center; padding:50px;">
                        <i class="fas fa-tools" style="font-size:40px; margin-bottom:20px; opacity:0.3;"></i>
                        <p>Halaman <b>${page}</b> sedang dalam tahap sinkronisasi.</p>
                    </div>`;
        }
    } catch (err) {
        console.error("Critical Nav Error:", err);
        container.innerHTML = `
            <div class="card" style="border-left: 5px solid #ef4444;">
                <h3 style="color:#ef4444;">⚠️ Modul Gagal Dimuat</h3>
                <p style="font-size:13px; opacity:0.8;">Gagal memanggil file JS modul ini. Pastikan file sudah ter-import di index.html.</p>
                <code style="display:block; background:rgba(0,0,0,0.1); padding:10px; margin-top:10px; font-size:11px;">${err.message}</code>
            </div>`;
    }
}

/**
 * SINKRONISASI DATA PROFIL (HEADER & SIDEBAR)
 */
async function syncSidebarProfile() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) return;

        const { data, error } = await supabaseClient
            .from('profil_user')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (data) {
            const nameEl = document.getElementById('user-display-name');
            const nipEl = document.getElementById('user-display-nip');
            const imgEl = document.getElementById('header-avatar-img');

            if (nameEl) nameEl.innerText = data.p_nama || 'User Logbook';
            if (nipEl) nipEl.innerText = data.p_nip ? "NIP. " + data.p_nip : "NIP. -";
            if (imgEl) {
                imgEl.src = data.p_foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.p_nama || 'U')}&background=6366f1&color=fff`;
            }
        }
    } catch (err) {
        console.warn("Sinkronisasi header tertunda.");
    }
}

/**
 * MODAL ENGINE (UTILITY)
 */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'flex';
        modal.style.opacity = '0';
        setTimeout(() => { 
            modal.style.opacity = '1'; 
            modal.style.transition = 'opacity 0.3s ease'; 
        }, 10);
        // Mencegah body scroll saat modal buka di HP
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => { 
            modal.style.display = 'none'; 
            document.body.style.overflow = 'auto';
        }, 300);
    }
}

/**
 * GLOBAL EVENT LISTENER
 */
window.onclick = function(event) {
    // Tutup Modal jika area luar diklik
    if (event.target.classList.contains('modal-overlay')) {
        const modalId = event.target.id;
        closeModal(modalId);
    }
    
    // Tutup Menu Akun
    if (!event.target.closest('.profile-trigger')) {
        const menu = document.getElementById('account-menu');
        if (menu && menu.classList.contains('show')) {
            menu.classList.remove('show');
        }
    }
}