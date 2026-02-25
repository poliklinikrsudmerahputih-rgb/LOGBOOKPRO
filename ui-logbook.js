/**
 * UI-LOGBOOK.JS - Final Edition (Integrated with Master Data)
 * Fitur: Auto-Link Evidence from Master, Real-time Analysis
 */

let currentLogbookData = [];
let editingLogId = null;

function renderLogbookPage(container) {
    const today = new Date().toISOString().split('T')[0];
    
    container.innerHTML = `
        <div class="card fade-in">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:30px; flex-wrap:wrap; gap:20px;">
                <div>
                    <h2 style="font-weight:800; font-size:1.6rem; color:var(--accent);">📊 Riwayat Logbook</h2>
                    <p style="color:var(--text-body); font-size:13px;">Data terhubung otomatis dengan Master Butir Kegiatan</p>
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
                    <input type="date" id="filter-date" value="${today}" onchange="fetchLogbookData()" class="auth-input" style="margin:0; font-size:13px;">
                </div>
                <div style="display:flex; align-items:flex-end;">
                    <button onclick="resetFilters()" style="background:var(--border); border:none; color:var(--text-body); padding:12px; border-radius:12px; width:100%; cursor:pointer; font-size:11px; font-weight:700;">
                        <i class="fas fa-sync"></i> RESET HARI INI
                    </button>
                </div>
            </div>

            <div style="overflow-x:auto; border-radius:15px; border:1px solid var(--border); background: rgba(0,0,0,0.1);">
                <table style="width:100%; border-collapse: collapse; min-width:900px;">
                    <thead>
                        <tr style="text-align:left; background: var(--bg-side);">
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 15%;">Waktu & Tanggal</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 45%;">Butir Kegiatan & Analisa Capaian</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 10%; text-align:center;">No. RM</th>
                            <th style="padding:18px; font-size:11px; color:var(--accent); text-transform:uppercase; width: 8%; text-align:center;">Vol</th>
                            <th style="padding:18px 25px; font-size:11px; color:var(--accent); text-transform:uppercase; text-align:center; width: 22%;">Aksi</th>
                        </tr>
                    </thead>
                    <tbody id="table-logbook-body">
                        <tr><td colspan="5" style="text-align:center; padding:50px; opacity:0.5;">Sinkronisasi data...</td></tr>
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

async function fetchLogbookData() {
    const filterDate = document.getElementById('filter-date').value;
    const tbody = document.getElementById('table-logbook-body');
    if(!tbody) return;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        
        // Ambil logbook + JOIN Kamus (Pastikan kolom sesuai UI-MASTER)
        let query = supabaseClient
            .from('logbook_harian')
            .select(`
                *,
                kamus_kegiatan (
                    nama_kegiatan, 
                    target_tahunan, 
                    link_bukti_dukung, 
                    hasil_kerja
                )
            `)
            .eq('user_id', user.id);

        if (filterDate) query = query.eq('tanggal', filterDate);

        const { data, error } = await query.order('jam_mulai', { ascending: false });
        if (error) throw error;

        // Ambil total realisasi akumulatif
        const { data: allData } = await supabaseClient.from('logbook_harian').select('kegiatan_id, jumlah').eq('user_id', user.id);

        currentLogbookData = data;
        renderTableRows(data, allData || []);
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#ef4444;">Gagal memuat: ${err.message}</td></tr>`;
    }
}

function renderTableRows(viewData, allData) {
    const tbody = document.getElementById('table-logbook-body');
    if (!tbody) return;
    
    if (viewData.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:60px; opacity:0.3;">Tidak ada data pada tanggal ini.</td></tr>`;
        return;
    }

    tbody.innerHTML = viewData.map(item => {
        const master = item.kamus_kegiatan || {};
        const target = master.target_tahunan || 0;
        const totalReal = allData.filter(log => log.kegiatan_id === item.kegiatan_id).reduce((s, l) => s + (parseInt(l.jumlah) || 0), 0);
        const sisa = target - totalReal;
        
        // LINK BUKTI LOGIC (Disesuaikan dengan UI-MASTER.JS)
        const labelBukti = master.hasil_kerja || 'Kegiatan';
        const linkHtml = master.link_bukti_dukung 
            ? `<a href="${master.link_bukti_dukung}" target="_blank" style="text-decoration:none; background:rgba(56,189,248,0.1); color:#38bdf8; padding:4px 10px; border-radius:8px; font-size:10px; font-weight:800; border:1px solid rgba(56,189,248,0.2); display:inline-flex; align-items:center; gap:5px;">
                <i class="fas fa-file-alt"></i> BUKA ${labelBukti.toUpperCase()}
               </a>` 
            : `<span style="opacity:0.2; font-size:9px;">Belum ada link bukti</span>`;

        return `
            <tr style="border-bottom: 1px solid var(--border);">
                <td style="padding:15px 25px;">
                    <div style="font-weight:800; font-size:13px;">${item.tanggal}</div>
                    <div style="font-size:11px; color:var(--accent); font-family:monospace;">${item.jam_mulai?.slice(0,5)} - ${item.jam_selesai?.slice(0,5)}</div>
                </td>
                <td style="padding:15px;">
                    <div style="font-weight:700; font-size:13px; margin-bottom:10px; line-height:1.4;">${master.nama_kegiatan || 'Butir tidak ditemukan'}</div>
                    <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                        <div style="display:flex; gap:5px;">
                            <span style="font-size:9px; background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; color:#94a3b8;">TGT: ${target}</span>
                            <span style="font-size:9px; background:rgba(56,189,248,0.1); padding:2px 6px; border-radius:4px; color:var(--accent);">REAL: ${totalReal}</span>
                            <span style="font-size:9px; background:${sisa <= 0 ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)'}; padding:2px 6px; border-radius:4px; color:${sisa <= 0 ? '#22c55e' : '#ef4444'};">SISA: ${sisa < 0 ? 0 : sisa}</span>
                        </div>
                        <span style="color:var(--border)">|</span>
                        ${linkHtml}
                    </div>
                </td>
                <td style="padding:15px; text-align:center; font-family:monospace;">${item.no_rm || '-'}</td>
                <td style="padding:15px; text-align:center; font-weight:800;">${item.jumlah || 1}</td>
                <td style="padding:15px 25px; text-align:center;">
                    <div style="display:flex; gap:5px; justify-content:center;">
                        <button onclick="editLog('${item.id}')" style="background:var(--accent); color:#000; border:none; padding:6px 12px; border-radius:8px; font-size:10px; font-weight:800; cursor:pointer;">EDIT</button>
                        <button onclick="hapusLog('${item.id}')" style="background:rgba(239,68,68,0.1); color:#ef4444; border:none; padding:6px 12px; border-radius:8px; font-size:10px; font-weight:800; cursor:pointer;">HAPUS</button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

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

        if(!payload.kegiatan_id) return alert("Pilih kegiatan!");

        btn.disabled = true;
        btn.innerHTML = "Memproses...";

        const res = editingLogId 
            ? await supabaseClient.from('logbook_harian').update(payload).eq('id', editingLogId)
            : await supabaseClient.from('logbook_harian').insert([payload]);

        if (res.error) throw res.error;
        closeModalLogbook();
        fetchLogbookData();
    } catch (err) { alert(err.message); } 
    finally { btn.disabled = false; btn.innerHTML = "SIMPAN DATA"; }
}

function openModalLogbook() {
    editingLogId = null;
    document.getElementById('modal-title-log').innerText = "📝 Input Logbook Harian";
    document.getElementById('tgl_input').value = new Date().toISOString().split('T')[0];
    document.getElementById('no_rm').value = "";
    document.getElementById('kegiatan_id').value = "";
    openModal('modal-harian');
}

function closeModalLogbook() { closeModal('modal-harian'); }

function editLog(id) {
    const item = currentLogbookData.find(x => x.id === id);
    if (!item) return;
    editingLogId = id;
    openModal('modal-harian');
    document.getElementById('tgl_input').value = item.tanggal;
    document.getElementById('no_rm').value = item.no_rm;
    document.getElementById('kegiatan_id').value = item.kegiatan_id;
    document.getElementById('jam_mulai').value = item.jam_mulai;
    document.getElementById('jam_selesai').value = item.jam_selesai;
    document.getElementById('jumlah_kegiatan').value = item.jumlah;
}

async function hapusLog(id) {
    if(confirm("Hapus data ini?")) {
        await supabaseClient.from('logbook_harian').delete().eq('id', id);
        fetchLogbookData();
    }
}

async function loadDropdownKegiatan() {
    const select = document.getElementById('kegiatan_id');
    const { data } = await supabaseClient.from('kamus_kegiatan').select('id, nama_kegiatan').order('nama_kegiatan');
    if (data) {
        select.innerHTML = '<option value="">-- Pilih Butir Kegiatan --</option>' + 
            data.map(item => `<option value="${item.id}">${item.nama_kegiatan}</option>`).join('');
    }
}

function applyFilters() {
    const search = document.getElementById('search-rm').value.toLowerCase();
    const filtered = currentLogbookData.filter(item => item.no_rm?.toLowerCase().includes(search));
    renderTableRows(filtered, currentLogbookData);
}

function resetFilters() {
    document.getElementById('search-rm').value = "";
    document.getElementById('filter-date').value = new Date().toISOString().split('T')[0];
    fetchLogbookData();
}