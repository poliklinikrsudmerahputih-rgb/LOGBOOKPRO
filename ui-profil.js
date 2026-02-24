/**
 * UI-PROFIL.JS - Modul Profil Pegawai
 * Fitur: Update Profil, Sinkronisasi Foto Navbar, Share Link, & WhatsApp Integration
 * Perbaikan: Penanganan Link lokal (file://) agar view.html dapat ditemukan
 */

function renderProfilPage(container) {
    container.innerHTML = `
        <div class="card" style="max-width: 950px; margin: 0 auto;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:40px; flex-wrap:wrap; gap:20px;">
                <div>
                    <h2 style="font-weight:800; font-size:1.5rem;">👤 Profil Pegawai</h2>
                    <p style="color:var(--text-body); font-size:13px;">Informasi data diri dan atasan penilai.</p>
                </div>
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="shareKeWhatsApp()" class="auth-btn" style="width:auto; padding:12px 20px; margin:0; background:#25D366; border:none; display:flex; align-items:center; gap:8px;">
                        <i class="fa-brands fa-whatsapp"></i> KIRIM KE ATASAN
                    </button>
                    <button onclick="copyLinkMonitoring()" class="auth-btn" style="width:auto; padding:12px 20px; margin:0; background:rgba(255,255,255,0.1); border:1px solid var(--border);">
                        <i class="fa-solid fa-link"></i> SALIN LINK
                    </button>
                    <button onclick="openModal('modal-profil')" class="auth-btn" style="width:auto; padding:12px 25px; margin:0; background:var(--accent-gradient);">
                        <i class="fa-solid fa-pen-to-square"></i> EDIT PROFIL
                    </button>
                </div>
            </div>

            <div id="profil-display-biografi" style="background: var(--input-bg); border-radius: 30px; padding: 40px; border: 1px solid var(--border);">
                 <div style="text-align:center; padding:50px;">
                    <div class="spinner"></div>
                    <p>Memuat data profil...</p>
                 </div>
            </div>
        </div>

        <div id="modal-profil" class="modal-overlay">
            <div class="modal-content" style="max-width:850px;">
                <div class="modal-header">
                    <h3 style="font-weight:800;">✏️ Update Data Profil</h3>
                    <span class="close-btn" onclick="closeModal('modal-profil')">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:30px;">
                        <div>
                            <h4 class="modal-label" style="color:var(--accent); border-bottom:1px solid rgba(99,102,241,0.2); padding-bottom:10px;">IDENTITAS PEGAWAI</h4>
                            <label class="modal-label">Link Foto Pegawai (URL)</label>
                            <input type="text" id="p_foto" class="auth-input" placeholder="https://link-foto.jpg">
                            <label class="modal-label">Nama Lengkap & Gelar</label>
                            <input type="text" id="p_nama" class="auth-input">
                            <label class="modal-label">NIP</label>
                            <input type="text" id="p_nip" class="auth-input">
                            <label class="modal-label">Jabatan</label>
                            <input type="text" id="p_jabatan" class="auth-input">
                            <label class="modal-label">Pangkat / Golongan</label>
                            <input type="text" id="p_golongan" class="auth-input">
                            <label class="modal-label">Unit Kerja</label>
                            <input type="text" id="p_unit" class="auth-input">
                        </div>
                        <div>
                            <h4 class="modal-label" style="color:#f59e0b; border-bottom:1px solid rgba(245,158,11,0.2); padding-bottom:10px;">IDENTITAS ATASAN</h4>
                            <label class="modal-label">Nama Atasan</label>
                            <input type="text" id="a_nama" class="auth-input">
                            <label class="modal-label">NIP Atasan</label>
                            <input type="text" id="a_nip" class="auth-input">
                            <label class="modal-label">Jabatan Atasan</label>
                            <input type="text" id="a_jabatan" class="auth-input">
                            <label class="modal-label">Pangkat Atasan</label>
                            <input type="text" id="a_golongan" class="auth-input">
                            <label class="modal-label">Instansi / Organisasi</label>
                            <input type="text" id="p_instansi" class="auth-input">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="btn-save-profil" onclick="updateProfil()" class="auth-btn" style="margin:0; width:100%;">SIMPAN PERUBAHAN DATA</button>
                </div>
            </div>
        </div>
    `;
    loadDataProfil();
}

async function loadDataProfil() {
    const display = document.getElementById('profil-display-biografi');
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const { data, error } = await supabaseClient.from('profil_user').select('*').eq('user_id', user.id).maybeSingle();
        
        if (data) {
            const fotoUrl = data.p_foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(data.p_nama || 'User') + '&background=random&size=200';
            
            // Sinkronisasi Foto Navbar
            const navImg = document.getElementById('nav-user-img');
            if(navImg) navImg.src = fotoUrl;

            display.innerHTML = `
                <div style="display:flex; gap:40px; align-items:start; flex-wrap:wrap;">
                    <div style="flex: 0 0 180px;">
                        <img src="${fotoUrl}" style="width:180px; height:220px; object-fit:cover; border-radius:20px; border:4px solid var(--border); box-shadow: 0 20px 40px rgba(0,0,0,0.3);">
                    </div>
                    <div style="flex: 1; min-width:300px;">
                        <h3 style="font-size:24px; font-weight:800; margin-bottom:5px; color:#fff;">${data.p_nama || '-'}</h3>
                        <p style="color:var(--accent); font-weight:600; margin-bottom:20px;">NIP. ${data.p_nip || '-'}</p>
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px;">
                            <div><small style="opacity:0.5; font-size:10px; text-transform:uppercase;">Jabatan</small><br>${data.p_jabatan || '-'}</div>
                            <div><small style="opacity:0.5; font-size:10px; text-transform:uppercase;">Golongan</small><br>${data.p_golongan || '-'}</div>
                            <div><small style="opacity:0.5; font-size:10px; text-transform:uppercase;">Unit</small><br>${data.p_unit || '-'}</div>
                            <div><small style="opacity:0.5; font-size:10px; text-transform:uppercase;">Instansi</small><br>${data.p_instansi || '-'}</div>
                        </div>
                        <hr style="border:0; border-top:1px solid var(--border); margin:20px 0;">
                        <div style="background: rgba(245,158,11,0.05); padding:15px; border-radius:12px; border-left:4px solid #f59e0b;">
                            <h4 style="font-size:10px; color:#f59e0b; margin-bottom:5px;">ATASAN PENILAI</h4>
                            <p style="font-weight:700; margin-bottom:2px;">${data.a_nama || '-'}</p>
                            <p style="font-size:11px; opacity:0.7;">${data.a_jabatan || '-'} (${data.a_golongan || '-'})</p>
                        </div>
                    </div>
                </div>
            `;
            
            // Isi Form Modal
            const fields = ['p_nama', 'p_nip', 'p_jabatan', 'p_golongan', 'p_unit', 'p_foto', 'a_nama', 'a_nip', 'a_jabatan', 'a_golongan', 'p_instansi'];
            fields.forEach(field => { 
                const el = document.getElementById(field);
                if(el) el.value = data[field] || ''; 
            });
            
            window.userDataCache = data;
        } else {
            display.innerHTML = `<div style="text-align:center; padding:50px; opacity:0.5;">Belum ada data profil. Silakan klik Edit Profil.</div>`;
        }
    } catch (err) { console.error("Load Profil Error:", err); }
}

async function updateProfil() {
    const btn = document.getElementById('btn-save-profil');
    try {
        btn.innerText = "Menyimpan...";
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const payload = {
            user_id: user.id,
            p_nama: document.getElementById('p_nama').value,
            p_nip: document.getElementById('p_nip').value,
            p_jabatan: document.getElementById('p_jabatan').value,
            p_golongan: document.getElementById('p_golongan').value,
            p_unit: document.getElementById('p_unit').value,
            p_foto: document.getElementById('p_foto').value,
            a_nama: document.getElementById('a_nama').value,
            a_nip: document.getElementById('a_nip').value,
            a_jabatan: document.getElementById('a_jabatan').value,
            a_golongan: document.getElementById('a_golongan').value,
            p_instansi: document.getElementById('p_instansi').value
        };

        const { error } = await supabaseClient.from('profil_user').upsert([payload]);
        if (error) throw error;

        alert("Profil Berhasil Diperbarui!");
        closeModal('modal-profil');
        loadDataProfil();
    } catch (err) { 
        alert("Gagal update: " + err.message); 
    } finally { 
        btn.innerText = "SIMPAN PERUBAHAN DATA"; 
    }
}

/** * FUNGSI GENERATE LINK (SOLUSI FIX UNTUK FILE LOKAL)
 */
function generateShareLink(userId) {
    const currentPath = window.location.href;
    // Jika dibuka via file://, ganti index.html menjadi view.html secara manual
    if (currentPath.includes('index.html')) {
        return currentPath.replace('index.html', 'view.html') + (currentPath.includes('?') ? '&id=' : '?id=') + userId;
    } 
    // Jika dalam folder tapi tidak ada index.html di URL
    const baseUrl = currentPath.substring(0, currentPath.lastIndexOf('/') + 1);
    return baseUrl + 'view.html?id=' + userId;
}

async function copyLinkMonitoring() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const shareUrl = generateShareLink(user.id);
        
        await navigator.clipboard.writeText(shareUrl);
        alert("Link Monitoring disalin!\n" + shareUrl);
    } catch (err) {
        console.error(err);
    }
}

async function shareKeWhatsApp() {
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        const p = window.userDataCache;
        
        if(!p) { 
            alert("Harap simpan profil terlebih dahulu."); 
            return; 
        }

        const shareUrl = generateShareLink(user.id);
        
        const teks = `Yth. Bapak/Ibu ${p.a_nama || 'Atasan'},\n\nIzin melaporkan rincian logbook kinerja saya:\n\n👤 *Nama:* ${p.p_nama}\n🆔 *NIP:* ${p.p_nip}\n\nBapak/Ibu dapat memantau progres harian saya melalui tautan berikut:\n${shareUrl}\n\nTerima kasih.`;
        
        const waUrl = `https://wa.me/?text=${encodeURIComponent(teks)}`;
        window.open(waUrl, '_blank');
    } catch (err) {
        alert("Gagal membagikan ke WhatsApp.");
    }
}