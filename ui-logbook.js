/**
 * UI-LOGBOOK.JS - Modul Riwayat & Input Logbook Harian
 * Fitur: Mobile Optimized, Auto-Calculate Target, Realisasi, & Sisa
 */

// Global state
let currentLogbookData = [];
let editingLogId = null;

/**
 * FUNGSI UTAMA: Menampilkan halaman Logbook
 */
function renderLogbookPage(container) {
    container.innerHTML = `
        <div class="card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; flex-wrap:wrap; gap:20px;">
                <div>
                    <h2 style="font-weight:800; font-size:1.6rem; color:var(--accent);">📊 Riwayat Logbook</h2>
                    <p style="color:var(--text-body); font-size:13px;">Data aktifitas harian terintegrasi sistem cloud</p>
                </div>
                <div style="width: 100%; max-width: 200px;">
                    <button onclick="openModalLogbook()" class="auth-btn" style="width:100%; padding:12px 25px; margin:0; background:var(--accent-gradient); border-radius:15px; font-weight:800; font-size:12px;">
                        <i class="fas fa-plus"></i> TAMBAH DATA
                    </button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap:15px; background:rgba(0,0,0,0.2); padding:20px; border-radius:20px; border:1px solid var(--border); margin-bottom:25px;">
                <div>
                    <label class="modal-label">🔍 Cari No. RM</label>
                    <input type="text" id="search-rm" oninput="applyFilters()" class="auth-input" style="margin:0; font-size:13px;" placeholder="Ketik nomor RM...">
                </div>
                <div>
                    <label class="modal-label">📅 Filter Tanggal</label>
                    <input type="date" id="filter-date" onchange="applyFilters()" class="auth-input" style="margin:0; font-size:13px;">
                </div>
                <div style="display:flex; align-items:flex-end;">
                    <button onclick="resetFilters()" style="background:var(--border); border:none; color:var(--text-body); padding:12px; border-radius:12px; width:100%; cursor:pointer; font-size:11px; font-weight:700;">
                        <i class="fas fa-sync"></i> RESET
                    </button>
                </div>
            </div>

            <div style="overflow-x:auto; border-radius:15px; border:1px solid var(--border); background: rgba(0,0,0,0.1);">
                <table style="width:100%; border-collapse: collapse; min-width:800px;">
                    <thead>
                        <tr style="text-align:left; background: var(--bg-side);">
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 15%;">Waktu & Tanggal</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 40%;">Butir Kegiatan & Analisa Capaian</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 10%; text-align:center;">No. RM</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 10%; text-align:center;">Vol</th>
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; text-align:center; width: 25%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-logbook-body">
                        <tr><td colspan="5" style="text-align:center; padding:50px; opacity:0.5;">
                            <i class="fas fa-circle-notch fa-spin"></i> Sinkronisasi data cloud...
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <div id="modal-harian" class="modal-overlay">
            <div class="modal-content" style="max-width:550px;">
                <div class="modal-header">
                    <h3 id="modal-title-log" style="font-weight:800; color:var(--accent);">📝 Input Logbook Harian</h3>
                    <span class="close-btn" onclick="closeModalLogbook()">&times;</span>
                </div>
                <div class="modal-body">
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                        <div>
                            <label class="modal-label">Tanggal Kerja</label>
                            <input type="date" id="tgl_input" class="auth-input">
                        </div>
                        <div>
                            <label class="modal-label">No. Rekam Medis (RM)</label>
                            <input type="text" id="no_rm" class="auth-input" placeholder="RM Pasien">
                        </div>
                    </div>
                    
                    <div style="margin-top:15px;">
                        <label class="modal-label">Pilih Butir Kegiatan</label>
                        <select id="kegiatan_id" class="auth-input" style="font-size:14px;"></select>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-top:15px;">
                        <div>
                            <label class="modal-label">Mulai</label>
                            <input type="time" id="jam_mulai" class="auth-input">
                        </div>
                        <div>
                            <label class="modal-label">Selesai</label>
                            <input type="time" id="jam_selesai" class="auth-input">
                        </div>
                        <div>
                            <label class="modal-label">Jumlah</label>
                            <input type="number" id="jumlah_kegiatan" class="auth-input" value="1" min="1">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button id="btn-save-log" onclick="prosesSimpanLogbook()" class="auth-btn" style="margin:0; width:100%; background:var(--accent-gradient);">SIMPAN DATA</button>
                </div>
            </div>
        </div>
    `;
    loadDropdownKegiatan();
    fetchLogbookData();
}

/**
 * LOGIKA DATABASE & PERHITUNGAN
 */
async function loadDropdownKegiatan() {
    const select = document.getElementById('kegiatan_id');
    if (!select) return;
    try {
        const { data, error } = await supabaseClient
            .from('kamus_kegiatan')
            .select('id, nama_kegiatan')
            .order('nama_kegiatan', { ascending: true });
        
        if (error) throw error;
        select.innerHTML = '<option value="">-- Pilih Butir Kegiatan --</option>' + 
            data.map(item => `<option value="${item.id}">${item.nama_kegiatan}</option>`).join('');
    } catch (err) { 
        select.innerHTML = '<option>Gagal memuat kegiatan</option>';
    }
}

async function fetchLogbookData() {
    try {
        const { data, error } = await supabaseClient
            .from('logbook_harian')
            .select('*, kamus_kegiatan(nama_kegiatan, target_tahunan)')
            .order('tanggal', { ascending: false })
            .order('jam_mulai', { ascending: false });

        if (error) throw error;
        currentLogbookData = data;
        renderTableRows(data);
    } catch (err) {
        document.getElementById('table-logbook-body').innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">⚠️ Terjadi gangguan koneksi cloud.</td></tr>`;
    }
}

function renderTableRows(data) {
    const tbody = document.getElementById('table-logbook-body');
    if (!tbody) return;
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:60px; opacity:0.3; font-style:italic;">Data tidak ditemukan.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => {
        // Logika Perhitungan Real-time
        const target = item.kamus_kegiatan?.target_tahunan || 0;
        const realisasi = currentLogbookData
            .filter(log => log.kegiatan_id === item.kegiatan_id)
            .reduce((sum, log) => sum + (parseInt(log.jumlah) || 0), 0);
            
        const sisa = target - realisasi;
        const sisaVal = sisa < 0 ? 0 : sisa;
        const colorSisa = sisa <= 0 ? '#22c55e' : '#ef4444';

        return `
            <tr class="fade-in" style="border-bottom: 1px solid var(--border); transition: 0.3s;">
                <td style="padding:15px 25px;">
                    <div style="font-weight:800; font-size:13px; color:var(--text-title);">${item.tanggal}</div>
                    <div style="font-size:11px; font-family:'JetBrains Mono'; color:var(--accent);">${item.jam_mulai?.slice(0, 5) || '--:--'} - ${item.jam_selesai?.slice(0, 5) || '--:--'}</div>
                </td>
                <td style="padding:15px;">
                    <div style="line-height:1.4; color:var(--text-title); font-size:13px; font-weight:600; margin-bottom:8px;">
                        ${item.kamus_kegiatan?.nama_kegiatan || '<span style="color:#ef4444;">Kegiatan Terhapus</span>'}
                    </div>
                    <div style="display:flex; gap:10px; flex-wrap:wrap;">
                        <span style="background:rgba(255,255,255,0.05); padding:3px 8px; border-radius:6px; font-size:9px; font-weight:700; color:#94a3b8;">TARGET: ${target}</span>
                        <span style="background:rgba(56,189,248,0.1); padding:3px 8px; border-radius:6px; font-size:9px; font-weight:700; color:var(--accent);">REALISASI: ${realisasi}</span>
                        <span style="background:${colorSisa}22; padding:3px 8px; border-radius:6px; font-size:9px; font-weight:700; color:${colorSisa};">SISA: ${sisaVal}</span>
                    </div>
                </td>
                <td style="padding:15px; font-family:'JetBrains Mono'; text-align:center; font-size:12px; color:var(--text-body);">${item.no_rm || '-'}</td>
                <td style="padding:15px; text-align:center; font-weight:800; color:var(--text-title);">${item.jumlah || '1'}</td>
                <td style="padding:15px 25px; text-align:center;">
                    <div style="display:flex; gap:10px; justify-content:center;">
                        <button onclick="editLog('${item.id}')" style="background:var(--accent); color:#000; border:none; padding:6px 12px; border-radius:8px; cursor:pointer; font-size:10px; font-weight:800;">EDIT</button>
                        <button onclick="hapusLog('${item.id}')" style="background:rgba(239,68,68,0.1); color:#ef4444; border:1px solid rgba(239,68,68,0.2); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:10px; font-weight:800;">HAPUS</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * MODAL & CRUD LOGIC
 */
function openModalLogbook() {
    editingLogId = null;
    document.getElementById('modal-title-log').innerText = "📝 Input Logbook Harian";
    document.getElementById('tgl_input').value = new Date().toISOString().split('T')[0];
    document.getElementById('no_rm').value = "";
    document.getElementById('jam_mulai').value = "";
    document.getElementById('jam_selesai').value = "";
    document.getElementById('jumlah_kegiatan').value = "1";
    document.getElementById('kegiatan_id').value = "";
    openModal('modal-harian');
}

function closeModalLogbook() { closeModal('modal-harian'); }

async function prosesSimpanLogbook() {
    const btn = document.getElementById('btn-save-log');
    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if(!user) throw new Error("Sesi berakhir, silahkan login ulang.");

        const payload = {
            user_id: user.id,
            tanggal: document.getElementById('tgl_input').value,
            kegiatan_id: document.getElementById('kegiatan_id').value,
            no_rm: document.getElementById('no_rm').value,
            jam_mulai: document.getElementById('jam_mulai').value,
            jam_selesai: document.getElementById('jam_selesai').value,
            jumlah: parseInt(document.getElementById('jumlah_kegiatan').value) || 1
        };

        if (!payload.kegiatan_id || !payload.tanggal) {
            return Swal.fire('Data Belum Lengkap', 'Pilih kegiatan dan tanggal kerja!', 'warning');
        }
        
        btn.innerHTML = `<i class="fas fa-circle-notch fa-spin"></i> Memproses...`;
        btn.disabled = true;

        let res;
        if (editingLogId) {
            res = await supabaseClient.from('logbook_harian').update(payload).eq('id', editingLogId);
        } else {
            res = await supabaseClient.from('logbook_harian').insert([payload]);
        }

        if (res.error) throw res.error;

        Swal.fire('Berhasil!', 'Data logbook telah disinkronkan ke cloud.', 'success');
        closeModalLogbook();
        fetchLogbookData();
    } catch (err) { 
        Swal.fire('Gagal Menyimpan', err.message, 'error'); 
    } finally { 
        btn.innerText = "SIMPAN DATA"; 
        btn.disabled = false; 
    }
}

function applyFilters() {
    const search = document.getElementById('search-rm').value.toLowerCase();
    const date = document.getElementById('filter-date').value;
    const filtered = currentLogbookData.filter(item => {
        const matchRM = item.no_rm?.toLowerCase().includes(search);
        const matchDate = date ? item.tanggal === date : true;
        return matchRM && matchDate;
    });
    renderTableRows(filtered);
}

function resetFilters() {
    document.getElementById('search-rm').value = "";
    document.getElementById('filter-date').value = "";
    renderTableRows(currentLogbookData);
}

function editLog(id) {
    const item = currentLogbookData.find(x => x.id === id);
    if (!item) return;
    editingLogId = id;
    openModal('modal-harian');
    document.getElementById('modal-title-log').innerText = "✏️ Edit Logbook Harian";
    document.getElementById('tgl_input').value = item.tanggal;
    document.getElementById('no_rm').value = item.no_rm;
    document.getElementById('kegiatan_id').value = item.kegiatan_id;
    document.getElementById('jam_mulai').value = item.jam_mulai;
    document.getElementById('jam_selesai').value = item.jam_selesai;
    document.getElementById('jumlah_kegiatan').value = item.jumlah || 1;
}

async function hapusLog(id) {
    const confirm = await Swal.fire({
        title: 'Hapus Data?',
        text: "Data yang dihapus tidak dapat dipulihkan.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        confirmButtonText: 'Ya, Hapus!'
    });

    if (confirm.isConfirmed) {
        const { error } = await supabaseClient.from('logbook_harian').delete().eq('id', id);
        if(!error) {
            Swal.fire('Terhapus', 'Data berhasil dibuang.', 'success');
            fetchLogbookData();
        } else {
            Swal.fire('Error', 'Gagal menghapus data.', 'error');
        }
    }
}