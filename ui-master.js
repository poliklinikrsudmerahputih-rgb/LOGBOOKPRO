/**
 * UI-MASTER.JS - Professional & Fixed Edition
 * Update: Enhanced Link Evidence Box & Satuan Hasil
 */

let currentKamusData = [];
let editingKamusId = null;

/**
 * RENDER HALAMAN UTAMA
 */
function renderMasterPage(container) {
    if (!container) return;

    container.innerHTML = `
        <div class="card fade-in" style="background: var(--card-bg); border-radius: 24px; border: 1px solid var(--border); overflow: hidden;">
            <div style="padding: 30px; background: linear-gradient(135deg, rgba(var(--accent-rgb), 0.1), transparent); border-bottom: 1px solid var(--border);">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:20px; flex-wrap:wrap;">
                    <div>
                        <h2 style="font-weight:900; font-size:1.8rem; margin:0; letter-spacing:-0.5px; color: #fff;">📚 Master Butir Kegiatan</h2>
                        <p style="color:var(--text-body); font-size:14px; margin-top:5px; opacity: 0.8;">Kelola katalog standar kegiatan untuk otomasi logbook harian</p>
                    </div>
                    <button onclick="openModalMaster()" class="auth-btn" style="width:auto; padding:14px 28px; margin:0; background:var(--accent-gradient); box-shadow: 0 10px 20px rgba(0,0,0,0.2); transition: all 0.3s ease;">
                        <i class="fa-solid fa-plus-circle" style="margin-right:10px;"></i> TAMBAH BUTIR BARU
                    </button>
                </div>
            </div>

            <div style="padding: 30px;">
                <div id="list-kegiatan-master" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap:25px;">
                    <div style="padding:60px; text-align:center; grid-column: 1 / -1; opacity:0.5;">
                        <i class="fas fa-circle-notch fa-spin fa-2x"></i>
                        <p style="margin-top:15px;">Sinkronisasi data database...</p>
                    </div>
                </div>
            </div>
        </div>

        <div id="modal-kamus" class="modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.85); backdrop-filter:blur(15px); z-index:9999; align-items:center; justify-content:center; padding:20px; animation: fadeIn 0.3s ease;">
            <div class="modal-content" style="background:var(--card-bg); border:1px solid var(--border); border-radius:30px; width:100%; max-width:550px; overflow:hidden; box-shadow: 0 25px 50px rgba(0,0,0,0.5);">
                <div class="modal-header" style="padding:25px 30px; border-bottom:1px solid var(--border); display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.02);">
                    <h3 id="modal-title-master" style="font-weight:800; margin:0; font-size:20px; color: var(--accent);">📚 Tambah Butir Master</h3>
                    <span class="close-btn" onclick="closeModalMaster()" style="cursor:pointer; font-size:28px; opacity:0.6; transition:0.3s;">&times;</span>
                </div>
                
                <div class="modal-body" style="padding:30px;">
                    <div style="margin-bottom:20px;">
                        <label class="modal-label" style="display:block; font-size:12px; font-weight:800; color:var(--accent); margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">Deskripsi Butir Kegiatan</label>
                        <textarea id="nama_kegiatan" class="auth-input" style="height:120px; padding:18px; resize:none; font-size:15px; border-radius:15px;" placeholder="Contoh: Melakukan pengkajian keperawatan dasar pada individu..."></textarea>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-bottom:20px;">
                        <div>
                            <label class="modal-label" style="display:block; font-size:12px; font-weight:800; color:var(--accent); margin-bottom:10px; text-transform:uppercase;">Target Per Tahun</label>
                            <input type="number" id="target_tahunan" class="auth-input" value="0" style="border-radius:15px; padding:15px;">
                        </div>
                        <div>
                            <label class="modal-label" style="display:block; font-size:12px; font-weight:800; color:var(--accent); margin-bottom:10px; text-transform:uppercase;">Satuan Hasil</label>
                            <select id="hasil_kerja" class="auth-input" style="border-radius:15px; padding:15px; cursor:pointer;">
                                <option value="Kegiatan">Kegiatan</option>
                                <option value="Laporan">Laporan</option>
                                <option value="Pasien">Pasien</option>
                                <option value="Dokumen">Dokumen</option>
                                <option value="Logbook">Logbook</option>
                            </select>
                        </div>
                    </div>
                    
                    <div style="margin-bottom:10px;">
                        <label class="modal-label" style="display:block; font-size:12px; font-weight:800; color:var(--accent); margin-bottom:10px; text-transform:uppercase; letter-spacing:1px;">Link Folder Bukti (GDrive/OneDrive)</label>
                        <div style="display:flex; gap:10px;">
                            <input type="url" id="link_bukti" class="auth-input" style="border-radius:15px; padding:15px; margin:0;" placeholder="https://drive.google.com/...">
                            <button onclick="if(document.getElementById('link_bukti').value) window.open(document.getElementById('link_bukti').value, '_blank'); else alert('Link kosong!');" type="button" class="auth-btn" style="width:auto; margin:0; padding:0 20px; background:#334155; border-radius:15px;"><i class="fa-solid fa-external-link"></i></button>
                        </div>
                    </div>
                </div>

                <div class="modal-footer" style="padding:25px 30px; background: rgba(255,255,255,0.02); border-top:1px solid var(--border);">
                    <button id="btn-save-kamus" onclick="simpanButirKegiatan()" class="auth-btn" style="margin:0; width:100%; height:55px; font-size:16px; font-weight:800; border-radius:15px; letter-spacing:1px;">
                        <i class="fa-solid fa-cloud-arrow-up" style="margin-right:10px;"></i> SIMPAN KE DATABASE
                    </button>
                </div>
            </div>
        </div>
    `;
    renderListKamus();
}

/**
 * LOAD DATA DARI SUPABASE
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
                <div style="padding:80px; text-align:center; grid-column: 1 / -1; background:rgba(255,255,255,0.02); border-radius:24px; border:2px dashed var(--border);">
                    <i class="fa-solid fa-folder-open fa-3x" style="opacity:0.2; margin-bottom:20px;"></i>
                    <p style="opacity:0.6; font-size:16px;">Kamus Master masih kosong.</p>
                    <button onclick="openModalMaster()" style="background:none; border:none; color:var(--accent); cursor:pointer; font-weight:bold; text-decoration:underline;">Tambah butir pertama Anda</button>
                </div>`;
            return;
        }

        container.innerHTML = data.map(item => {
            // Logika untuk menampilkan box link bukti jika ada
            const evidenceBox = item.link_bukti_dukung ? `
                <div style="background: rgba(99, 102, 241, 0.1); border: 1px dashed rgba(99, 102, 241, 0.3); border-radius: 12px; padding: 10px 15px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 11px; color: var(--accent); font-weight: 700;"><i class="fa-solid fa-folder-tree" style="margin-right:8px;"></i> E-EVIDENCE READY</span>
                    <a href="${item.link_bukti_dukung}" target="_blank" style="color: #fff; background: var(--accent); padding: 4px 10px; border-radius: 8px; font-size: 10px; text-decoration: none; font-weight: 800;">BUKA LINK</a>
                </div>
            ` : `
                <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 10px 15px; margin-bottom: 15px; text-align: center;">
                    <span style="font-size: 10px; opacity: 0.4;">Belum ada link bukti</span>
                </div>
            `;

            return `
            <div class="master-card" style="background:var(--input-bg); padding:25px; border-radius:24px; border:1px solid var(--border); display:flex; flex-direction:column; position:relative; overflow:hidden; transition: all 0.3s ease;">
                <div style="position:absolute; top:0; right:0; width:80px; height:80px; background: linear-gradient(225deg, rgba(var(--accent-rgb), 0.1), transparent); border-radius: 0 0 0 100%;"></div>
                
                <div style="margin-bottom:15px; position:relative;">
                    <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                        <span style="font-size:10px; background:var(--accent); color:#000; padding:4px 12px; border-radius:50px; font-weight:900; text-transform:uppercase; letter-spacing:1px;">${item.hasil_kerja}</span>
                    </div>
                    <h4 style="font-size:15px; font-weight:700; color:#fff; margin-top:15px; line-height:1.6; min-height:45px;">${item.nama_kegiatan}</h4>
                </div>

                ${evidenceBox}
                
                <div style="margin-top:auto;">
                    <div style="background:rgba(255,255,255,0.03); padding:12px; border-radius:15px; margin-bottom:20px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <small style="opacity:0.5; font-size:10px; font-weight:600; text-transform:uppercase;">Target Tahunan</small>
                            <span style="font-weight:800; color:var(--accent); font-size:13px;">${item.target_tahunan} <small style="font-weight:400; opacity:0.7;">${item.hasil_kerja}</small></span>
                        </div>
                    </div>
                    
                    <div style="display:flex; gap:10px;">
                        <button onclick="editKamus('${item.id}')" style="flex:1; background:rgba(255,255,255,0.05); color:#fff; border:1px solid var(--border); padding:10px; border-radius:12px; cursor:pointer; font-weight:700; font-size:11px; transition:0.3s;">
                            <i class="fa-solid fa-pen-to-square" style="margin-right:5px;"></i> EDIT
                        </button>
                        <button onclick="hapusKamus('${item.id}')" style="flex:1; background:rgba(239, 68, 68, 0.1); color:#ef4444; border:1px solid rgba(239, 68, 68, 0.2); padding:10px; border-radius:12px; cursor:pointer; font-weight:700; font-size:11px; transition:0.3s;">
                            <i class="fa-solid fa-trash" style="margin-right:5px;"></i> HAPUS
                        </button>
                    </div>
                </div>
            </div>
        `}).join('');
    } catch (err) {
        container.innerHTML = `<div style="color:#ef4444; background:rgba(239, 68, 68, 0.1); padding:20px; border-radius:15px; border:1px solid rgba(239, 68, 68, 0.2);"><strong>ERROR:</strong> ${err.message}</div>`;
    }
}

/**
 * FUNGSI SIMPAN & HELPERS (TETAP SAMA)
 */
async function simpanButirKegiatan() {
    const btn = document.getElementById('btn-save-kamus');
    const nama = document.getElementById('nama_kegiatan').value;
    const target = document.getElementById('target_tahunan').value;
    const hasil = document.getElementById('hasil_kerja').value;
    const link = document.getElementById('link_bukti').value;

    if (!nama) return alert("Mohon deskripsikan nama kegiatan!");

    try {
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> MEMPROSES...`;
        btn.disabled = true;

        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) throw new Error("Sesi login berakhir. Silakan refresh.");
        
        const payload = {
            user_id: user.id,
            nama_kegiatan: nama,
            target_tahunan: parseInt(target) || 0,
            hasil_kerja: hasil,
            link_bukti_dukung: link
        };

        let res;
        if (editingKamusId) {
            res = await supabaseClient.from('kamus_kegiatan').update(payload).eq('id', editingKamusId);
        } else {
            res = await supabaseClient.from('kamus_kegiatan').insert([payload]);
        }

        if (res.error) throw res.error;

        alert("✨ Sukses! Data Master telah diperbarui.");
        closeModalMaster();
        renderListKamus();
    } catch (err) {
        alert("🚨 Gagal menyimpan: " + err.message);
    } finally {
        btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up" style="margin-right:10px;"></i> SIMPAN KE DATABASE`;
        btn.disabled = false;
    }
}

function openModalMaster() {
    editingKamusId = null;
    document.getElementById('modal-kamus').style.display = 'flex';
    document.getElementById('modal-title-master').innerText = "📚 Tambah Butir Master";
    document.getElementById('nama_kegiatan').value = "";
    document.getElementById('target_tahunan').value = "0";
    document.getElementById('hasil_kerja').value = "Kegiatan";
    document.getElementById('link_bukti').value = "";
}

function closeModalMaster() {
    document.getElementById('modal-kamus').style.display = 'none';
}

function editKamus(id) {
    const item = currentKamusData.find(x => x.id === id);
    if (!item) return;

    editingKamusId = id;
    document.getElementById('modal-kamus').style.display = 'flex';
    document.getElementById('modal-title-master').innerText = "✏️ Edit Butir Master";
    
    document.getElementById('nama_kegiatan').value = item.nama_kegiatan;
    document.getElementById('target_tahunan').value = item.target_tahunan;
    document.getElementById('hasil_kerja').value = item.hasil_kerja;
    document.getElementById('link_bukti').value = item.link_bukti_dukung || "";
}

async function hapusKamus(id) {
    if (confirm("Data yang dihapus tidak dapat dikembalikan. Lanjutkan?")) {
        const { error } = await supabaseClient.from('kamus_kegiatan').delete().eq('id', id);
        if (error) alert("Gagal menghapus: " + error.message);
        else renderListKamus();
    }
}