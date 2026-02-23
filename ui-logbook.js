/**
 * UI-LOGBOOK.JS - Modul Riwayat & Input Logbook Harian
 */

// Global state untuk menyimpan data agar filter bekerja cepat
let currentLogbookData = [];
let editingLogId = null;

/**
 * FUNGSI UTAMA: Menampilkan halaman Logbook
 */
function renderLogbookPage(container) {
    container.innerHTML = `
        <div class="card">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; flex-wrap:wrap; gap:20px;">
                <div>
                    <h2 style="font-weight:800; font-size:1.6rem;">📊 Riwayat Logbook</h2>
                    <p style="color:var(--text-body); font-size:13px;">Data aktifitas harian terintegrasi sistem</p>
                </div>
                <div style="display:flex; gap:12px;">
                    <button onclick="openModalLogbook()" class="auth-btn" style="width:auto; padding:12px 25px; margin:0; background:var(--accent-gradient);">+ TAMBAH DATA</button>
                    <button onclick="exportPDF()" class="auth-btn" style="width:auto; padding:12px 20px; background:#ef4444; margin:0; font-size:12px;">PDF</button>
                    <button onclick="exportExcel()" class="auth-btn" style="width:auto; padding:12px 20px; background:#22c55e; margin:0; font-size:12px;">EXCEL</button>
                </div>
            </div>

            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; background:rgba(255,255,255,0.02); padding:20px; border-radius:15px; border:1px solid var(--border); margin-bottom:25px;">
                <div>
                    <label class="modal-label" style="color:var(--accent)">🔍 Cari Nomor RM</label>
                    <input type="text" id="search-rm" oninput="applyFilters()" class="auth-input" style="margin:0;" placeholder="Contoh: 56335...">
                </div>
                <div>
                    <label class="modal-label" style="color:var(--accent)">📅 Filter Tanggal</label>
                    <input type="date" id="filter-date" onchange="applyFilters()" class="auth-input" style="margin:0;">
                </div>
                <div style="display:flex; align-items:flex-end;">
                    <button onclick="resetFilters()" style="background:rgba(255,255,255,0.05); border:1px solid var(--border); color:#fff; padding:12px; border-radius:12px; width:100%; cursor:pointer; font-size:12px;">RESET FILTER</button>
                </div>
            </div>

            <div style="overflow-x:auto; border-radius:12px; border:1px solid var(--border);">
                <table style="width:100%; border-collapse: collapse; min-width:900px;">
                    <thead>
                        <tr style="text-align:left; background: var(--input-bg);">
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 15%;">Waktu & Tanggal</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 40%;">Butir Kegiatan</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 15%; text-align:center;">No. RM</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 10%; text-align:center;">Vol</th>
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; text-align:center; width: 20%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-logbook-body">
                        <tr><td colspan="5" style="text-align:center; padding:50px; opacity:0.5;">Memuat data logbook...</td></tr>
                    </tbody>
                </table>
            </div>

            <div id="modal-harian" class="modal-overlay">
                <div class="modal-content" style="max-width:550px;">
                    <div class="modal-header">
                        <h3 id="modal-title-log" style="font-weight:800;">📝 Input Logbook Harian</h3>
                        <span class="close-btn" onclick="closeModalLogbook()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                            <div>
                                <label class="modal-label">Tanggal Kerja</label>
                                <input type="date" id="tgl_input" class="auth-input">
                            </div>
                            <div>
                                <label class="modal-label">Nomor Rekam Medis (RM)</label>
                                <input type="text" id="no_rm" class="auth-input" placeholder="Contoh: 56335">
                            </div>
                        </div>
                        
                        <label class="modal-label" style="margin-top:15px;">Pilih Butir Kegiatan</label>
                        <select id="kegiatan_id" class="auth-input">
                            <option value="">-- Memuat Kegiatan --</option>
                        </select>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:15px; margin-top:15px;">
                            <div>
                                <label class="modal-label">Jam Mulai</label>
                                <input type="time" id="jam_mulai" class="auth-input">
                            </div>
                            <div>
                                <label class="modal-label">Jam Selesai</label>
                                <input type="time" id="jam_selesai" class="auth-input">
                            </div>
                            <div>
                                <label class="modal-label">Jumlah (Volume)</label>
                                <input type="number" id="jumlah_kegiatan" class="auth-input" value="1" min="1">
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button id="btn-save-log" onclick="prosesSimpanLogbook()" class="auth-btn" style="margin:0; width:100%;">SIMPAN KE CLOUD</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Inisialisasi Data
    loadDropdownKegiatan();
    fetchLogbookData();
}

/**
 * LOGIKA DATABASE & DATA FETCHING
 */

async function loadDropdownKegiatan() {
    try {
        const { data, error } = await supabaseClient
            .from('kamus_kegiatan')
            .select('id, nama_kegiatan')
            .order('nama_kegiatan', { ascending: true });

        const select = document.getElementById('kegiatan_id');
        if (!select) return;

        if (error) throw error;

        select.innerHTML = '<option value="">-- Pilih Butir Kegiatan --</option>' + 
            data.map(item => `<option value="${item.id}">${item.nama_kegiatan}</option>`).join('');
    } catch (err) {
        console.error("Gagal memuat dropdown:", err);
    }
}

async function fetchLogbookData() {
    try {
        const { data, error } = await supabaseClient
            .from('logbook_harian')
            .select('*, kamus_kegiatan(nama_kegiatan)')
            .order('tanggal', { ascending: false })
            .order('jam_mulai', { ascending: false });

        if (error) throw error;
        currentLogbookData = data;
        renderTableRows(data);
    } catch (err) {
        console.error("Gagal mengambil logbook:", err);
        document.getElementById('table-logbook-body').innerHTML = `<tr><td colspan="5" style="text-align:center; color:red;">Gagal memuat data.</td></tr>`;
    }
}

function renderTableRows(data) {
    const tbody = document.getElementById('table-logbook-body');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:50px; opacity:0.5;">Belum ada data.</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(item => `
        <tr style="border-bottom: 1px solid rgba(255,255,255,0.03);">
            <td style="padding:15px 25px;">
                <div style="font-weight:700; font-size:13px; color:white;">${item.tanggal}</div>
                <div style="font-size:11px; color:var(--accent);">${item.jam_mulai?.slice(0, 5) || '--:--'} - ${item.jam_selesai?.slice(0, 5) || '--:--'}</div>
            </td>
            <td style="padding:15px;">
                <div style="line-height:1.4; color:white; font-size:13px;">${item.kamus_kegiatan?.nama_kegiatan || 'Kegiatan dihapus'}</div>
            </td>
            <td style="padding:15px; font-family:monospace; text-align:center; color:rgba(255,255,255,0.7);">${item.no_rm || '-'}</td>
            <td style="padding:15px; text-align:center; font-weight:700; color:white;">${item.jumlah || '1'}</td>
            <td style="padding:15px 25px; text-align:center;">
                <div style="display:flex; gap:12px; justify-content:center;">
                    <button onclick="editLog('${item.id}')" style="color:var(--accent); background:none; border:none; cursor:pointer; font-size:10px; font-weight:800;">EDIT</button>
                    <button onclick="hapusLog('${item.id}')" style="color:#ef4444; background:none; border:none; cursor:pointer; font-size:10px; font-weight:800;">HAPUS</button>
                </div>
            </td>
        </tr>
    `).join('');
}

/**
 * LOGIKA INTERAKSI & FILTER
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
        const payload = {
            user_id: user.id,
            tanggal: document.getElementById('tgl_input').value,
            kegiatan_id: document.getElementById('kegiatan_id').value,
            no_rm: document.getElementById('no_rm').value,
            jam_mulai: document.getElementById('jam_mulai').value,
            jam_selesai: document.getElementById('jam_selesai').value,
            jumlah: parseInt(document.getElementById('jumlah_kegiatan').value) || 1
        };

        if (!payload.kegiatan_id) return alert("Pilih butir kegiatan!");
        
        btn.innerText = "⏳ Memproses...";
        btn.disabled = true;

        let res;
        if (editingLogId) {
            res = await supabaseClient.from('logbook_harian').update(payload).eq('id', editingLogId);
        } else {
            res = await supabaseClient.from('logbook_harian').insert([payload]);
        }

        if (res.error) throw res.error;

        alert("✨ Data Berhasil Disimpan!");
        closeModalLogbook();
        fetchLogbookData();
    } catch (err) {
        alert("Gagal menyimpan: " + err.message);
    } finally {
        btn.innerText = "SIMPAN KE CLOUD";
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
    if (confirm("Hapus data ini dari cloud?")) {
        await supabaseClient.from('logbook_harian').delete().eq('id', id);
        fetchLogbookData();
    }
}

// Global Modal Helpers
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }