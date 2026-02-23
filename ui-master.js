/**
 * UI-MASTER.JS - Modul Manajemen Master Butir Kegiatan
 * Mengelola data referensi kegiatan (Kamus)
 */

// Global State untuk modul Master
let currentKamusData = [];
let editingKamusId = null;

/**
 * FUNGSI UTAMA: Dipanggil oleh ui.js untuk menampilkan halaman Master
 */
function renderMasterPage(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:30px;">
                <div>
                    <h2 style="font-weight:800; font-size:1.5rem;">📚 Master Butir Kegiatan</h2>
                    <p style="color:var(--text-body); font-size:13px;">Kelola referensi kegiatan standar untuk logbook harian Anda</p>
                </div>
                <button onclick="openModalMaster()" class="auth-btn" style="width:auto; padding:12px 25px; margin:0; background:var(--accent-gradient);">
                    <i class="fa-solid fa-plus" style="margin-right:8px;"></i> TAMBAH BUTIR
                </button>
            </div>

            <div id="list-kegiatan-master" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                <div style="padding:40px; text-align:center; grid-column: 1 / -1; opacity:0.5;">
                    <i class="fas fa-circle-notch fa-spin"></i> Menghubungkan ke database...
                </div>
            </div>
        </div>

        <div id="modal-kamus" class="modal-overlay">
            <div class="modal-content" style="max-width:500px;">
                <div class="modal-header">
                    <h3 id="modal-title-master" style="font-weight:800;">📚 Tambah Butir Master</h3>
                    <span class="close-btn" onclick="closeModal('modal-kamus')">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="margin-bottom:15px;">
                        <label class="modal-label">Nama Butir Kegiatan</label>
                        <textarea id="nama_kegiatan" class="auth-input" style="height:100px; padding-top:12px; resize:none;" placeholder="Contoh: Memberikan asuhan keperawatan pada pasien kritis..."></textarea>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label class="modal-label">Target Tahunan</label>
                            <input type="number" id="target_tahunan" class="auth-input" value="0">
                        </div>
                        <div>
                            <label class="modal-label">Satuan Hasil</label>
                            <select id="hasil_kerja" class="auth-input">
                                <option value="Kegiatan">Kegiatan</option>
                                <option value="Laporan">Laporan</option>
                                <option value="Dokumen">Dokumen</option>
                                <option value="Pasien">Pasien</option>
                                <option value="Logbook">Logbook</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label class="modal-label">Link Bukti Dukung (Google Drive/Dropbox)</label>
                        <div style="display:flex; gap:10px;">
                            <input type="url" id="link_bukti" class="auth-input" style="margin-bottom:0;" placeholder="https://drive.google.com/...">
                            <button onclick="cekLinkKoreksi()" type="button" class="auth-btn" style="width:auto; margin:0; padding:0 15px; font-size:11px; background:#475569;">TEST</button>
                        </div>
                        <small style="color:rgba(255,255,255,0.4); font-size:10px; margin-top:5px; display:block;">
                            *Link ini akan otomatis muncul saat cetak laporan.
                        </small>
                    </div>
                </div>
                <div class="modal-footer" style="padding-top:10px;">
                    <button id="btn-save-kamus" onclick="simpanButirKegiatan()" class="auth-btn" style="margin:0; width:100%;">
                        <i class="fa-solid fa-floppy-disk" style="margin-right:8px;"></i> SIMPAN DATA MASTER
                    </button>
                </div>
            </div>
        </div>
    `;
    renderListKamus();
}

/**
 * Mengambil dan merender daftar kamus dari Supabase
 */
async function renderListKamus() {
    const container = document.getElementById('list-kegiatan-master');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('kamus_kegiatan')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        currentKamusData = data;

        if (!data || data.length === 0) {
            container.innerHTML = `
                <div style="padding:60px; text-align:center; grid-column: 1 / -1; background:rgba(255,255,255,0.02); border-radius:20px; border:1px dashed var(--border);">
                    <div style="font-size:40px; margin-bottom:15px; opacity:0.3;">📂</div>
                    <p style="opacity:0.5;">Belum ada butir kegiatan. Klik "+ Tambah Butir" untuk memulai.</p>
                </div>`;
            return;
        }

        container.innerHTML = data.map(item => `
            <div class="master-card" style="background:var(--input-bg); padding:25px; border-radius:20px; border:1px solid var(--border); display:flex; flex-direction:column; position:relative; transition:0.3s hover;">
                <div style="margin-bottom:15px;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span style="font-size:10px; background:var(--accent); color:#000; padding:2px 8px; border-radius:4px; font-weight:800; text-transform:uppercase; margin-bottom:10px;">${item.hasil_kerja}</span>
                        ${item.link_bukti_dukung ? `<a href="${item.link_bukti_dukung}" target="_blank" title="Buka Link Bukti" style="color:var(--accent); font-size:14px;"><i class="fa-solid fa-link"></i></a>` : ''}
                    </div>
                    <h4 style="font-size:14px; font-weight:700; color:#fff; line-height:1.5; margin-top:5px;">${item.nama_kegiatan}</h4>
                </div>
                
                <div style="margin-top:auto;">
                    <div style="background:rgba(255,255,255,0.03); padding:10px; border-radius:12px; margin-bottom:15px;">
                        <div style="font-size:11px; color:rgba(255,255,255,0.5);">Target Tahunan:</div>
                        <div style="font-size:16px; font-weight:800; color:var(--accent);">${item.target_tahunan} <span style="font-size:11px; opacity:0.7;">${item.hasil_kerja}</span></div>
                    </div>
                    
                    <div style="display:flex; gap:10px; border-top:1px solid rgba(255,255,255,0.05); padding-top:15px;">
                        <button onclick="editKamus('${item.id}')" style="flex:1; background:rgba(255,255,255,0.05); color:#fff; border:none; padding:8px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700; transition:0.2s;">
                            <i class="fa-solid fa-pen-to-square"></i> EDIT
                        </button>
                        <button onclick="hapusKamus('${item.id}')" style="flex:1; background:rgba(239, 68, 68, 0.1); color:#ef4444; border:none; padding:8px; border-radius:8px; cursor:pointer; font-size:11px; font-weight:700; transition:0.2s;">
                            <i class="fa-solid fa-trash"></i> HAPUS
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (err) {
        container.innerHTML = `<div style="color:#ef4444; padding:20px;">Gagal memuat data: ${err.message}</div>`;
    }
}

/**
 * Logika Simpan (Create/Update)
 */
async function simpanButirKegiatan() {
    const btn = document.getElementById('btn-save-kamus');
    const nama = document.getElementById('nama_kegiatan').value;
    const target = document.getElementById('target_tahunan').value;
    const hasil = document.getElementById('hasil_kerja').value;
    const link = document.getElementById('link_bukti').value;

    if (!nama) return alert("Mohon isi nama kegiatan!");

    try {
        btn.innerText = "⏳ Menyimpan...";
        btn.disabled = true;

        const { data: { user } } = await supabaseClient.auth.getUser();
        
        const payload = {
            user_id: user.id,
            nama_kegiatan: nama,
            target_tahunan: parseInt(target) || 0,
            hasil_kerja: hasil,
            link_bukti_dukung: link,
            updated_at: new Date()
        };

        let result;
        if (editingKamusId) {
            result = await supabaseClient.from('kamus_kegiatan').update(payload).eq('id', editingKamusId);
        } else {
            result = await supabaseClient.from('kamus_kegiatan').insert([payload]);
        }

        if (result.error) throw result.error;

        alert("✅ Data Master Berhasil Disimpan!");
        closeModal('modal-kamus');
        renderListKamus();
        
        // Refresh dropdown di halaman logbook jika sedang terbuka
        if (typeof loadDropdownKegiatan === 'function') loadDropdownKegiatan();

    } catch (err) {
        alert("Error: " + err.message);
    } finally {
        btn.innerText = "SIMPAN DATA MASTER";
        btn.disabled = false;
    }
}

/**
 * UI Helpers
 */
function openModalMaster() {
    editingKamusId = null;
    document.getElementById('modal-title-master').innerText = "📚 Tambah Butir Master";
    document.getElementById('nama_kegiatan').value = "";
    document.getElementById('target_tahunan').value = "0";
    document.getElementById('hasil_kerja').value = "Kegiatan";
    document.getElementById('link_bukti').value = "";
    openModal('modal-kamus');
}

function editKamus(id) {
    const item = currentKamusData.find(x => x.id === id);
    if (!item) return;

    editingKamusId = id;
    document.getElementById('modal-title-master').innerText = "✏️ Edit Butir Master";
    document.getElementById('nama_kegiatan').value = item.nama_kegiatan;
    document.getElementById('target_tahunan').value = item.target_tahunan;
    document.getElementById('hasil_kerja').value = item.hasil_kerja;
    document.getElementById('link_bukti').value = item.link_bukti_dukung || "";
    openModal('modal-kamus');
}

async function hapusKamus(id) {
    if (confirm("Hapus butir kegiatan ini? Data logbook harian yang menggunakan butir ini mungkin akan kehilangan referensi nama.")) {
        try {
            const { error } = await supabaseClient.from('kamus_kegiatan').delete().eq('id', id);
            if (error) throw error;
            renderListKamus();
        } catch (err) {
            alert(err.message);
        }
    }
}

function cekLinkKoreksi() {
    const link = document.getElementById('link_bukti').value;
    if (!link) return alert("Masukkan link terlebih dahulu!");
    if (!link.startsWith('http')) return alert("Gunakan format link lengkap (https://...)");
    window.open(link, '_blank');
}