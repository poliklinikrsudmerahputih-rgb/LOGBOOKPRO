/**
 * REKAP-HARIAN.JS - FINAL V3.6 FIXED
 * Update: Support Sinkronisasi Multi-Modul (Harian & Bulanan)
 */

// 1. TEKNIK SAFE-MERGE: Cek jika sudah ada objek uiRekap agar tidak menimpa data dari file lain
window.uiRekap = window.uiRekap || {};

// 2. Tambahkan properti KOP jika belum ada (agar tidak hilang saat pindah antar file)
if (!window.uiRekap.kopConfig) {
    window.uiRekap.kopConfig = {
        logoKiri: '',
        logoKanan: '',
        judul: 'PEMERINTAH KABUPATEN MAGELANG\nDINAS KESEHATAN\nRSUD MERAH PUTIH',
        subJudul: 'Jl. Raya Magelang – Yogyakarta KM. 5 Mertoyudan, Magelang 56172\nTelepon (0293) 3202654, 3202584\nWebsite: https://rsudmerahputih.magelangkab.go.id'
    };
}

// 3. Gabungkan fungsi-fungsi Harian ke dalam objek global uiRekap
Object.assign(window.uiRekap, {

    renderRekapHarian: async () => {
        const content = document.getElementById('page-content');
        const today = new Date().toISOString().split('T')[0];

        content.innerHTML = `
            <div class="card fade-in" style="max-width: 1400px; margin: 0 auto;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; gap:20px; flex-wrap:wrap;">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📅 Rekapitulasi & Penilaian Harian</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Laporan rincian butir kegiatan, target, dan capaian realisasi.</p>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:11px; font-weight:700; color:var(--text-body);">FILTER PERIODE:</span>
                            <input type="date" id="tgl-mulai" class="auth-input" style="width:145px; margin:0;" value="${today}">
                            <span style="color:var(--text-body);">s/d</span>
                            <input type="date" id="tgl-selesai" class="auth-input" style="width:145px; margin:0;" value="${today}">
                            <button onclick="uiRekap.loadDataHarian()" class="auth-btn" style="margin:0; width:auto; padding:0 20px; background:var(--accent-gradient);">TAMPILKAN</button>
                        </div>
                        <div style="display:flex; gap:10px;">
                            <button onclick="uiRekap.openKopModal()" class="auth-btn" style="margin:0; width:auto; padding:8px 15px; background:var(--bg-card); border:1px solid var(--accent); font-size:11px;">
                                <i class="fa-solid fa-cog"></i> PENGATURAN KOP SURAT
                            </button>
                            <button onclick="uiRekap.downloadWordHarian()" class="auth-btn" style="margin:0; width:auto; padding:8px 15px; background:#2b5797; font-size:11px;">
                                <i class="fa-solid fa-file-word"></i> DOWNLOAD WORD
                            </button>
                            <button onclick="uiRekap.printLaporanHarian()" class="auth-btn" style="margin:0; width:auto; padding:8px 15px; background:#e11d48; font-size:11px;">
                                <i class="fa-solid fa-print"></i> CETAK PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="area-tabel-rekap" style="overflow-x:auto; background: rgba(0,0,0,0.1); border-radius:12px; border:1px solid var(--border);">
                    <p style="text-align:center; padding:50px; opacity:0.5;">Silahkan tentukan tanggal dan klik tampilkan data...</p>
                </div>
            </div>

            <div id="modal-kop" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width:600px; width:100%; background:var(--bg-body); border:1px solid var(--accent);">
                    <h4 style="color:var(--accent); margin-top:0;">⚙️ Konfigurasi KOP Surat</h4>
                    <hr style="opacity:0.1; margin-bottom:15px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:10px; display:block; margin-bottom:5px; font-weight:bold;">LOGO KIRI</label>
                            <input type="file" id="input-logo-kiri" accept="image/*" class="auth-input" style="font-size:10px;">
                        </div>
                        <div>
                            <label style="font-size:10px; display:block; margin-bottom:5px; font-weight:bold;">LOGO KANAN</label>
                            <input type="file" id="input-logo-kanan" accept="image/*" class="auth-input" style="font-size:10px;">
                        </div>
                    </div>
                    <label style="font-size:10px; font-weight:bold;">JUDUL INSTANSI</label>
                    <textarea id="input-kop-judul" class="auth-input" style="height:80px; margin-bottom:15px; font-family:serif;">${uiRekap.kopConfig.judul}</textarea>
                    
                    <label style="font-size:10px; font-weight:bold;">SUB-JUDUL / ALAMAT</label>
                    <textarea id="input-kop-sub" class="auth-input" style="height:80px; margin-bottom:15px;">${uiRekap.kopConfig.subJudul}</textarea>
                    
                    <div style="display:flex; gap:10px;">
                        <button onclick="uiRekap.saveKopConfig()" class="auth-btn" style="background:var(--accent-gradient);">SIMPAN PERUBAHAN</button>
                        <button onclick="document.getElementById('modal-kop').style.display='none'" class="auth-btn" style="background:#444;">TUTUP</button>
                    </div>
                </div>
            </div>`;
    },

    openKopModal: () => {
        document.getElementById('modal-kop').style.display = 'flex';
    },

    saveKopConfig: async () => {
        const fileKiri = document.getElementById('input-logo-kiri').files[0];
        const fileKanan = document.getElementById('input-logo-kanan').files[0];

        const toBase64 = file => new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        if (fileKiri) uiRekap.kopConfig.logoKiri = await toBase64(fileKiri);
        if (fileKanan) uiRekap.kopConfig.logoKanan = await toBase64(fileKanan);

        uiRekap.kopConfig.judul = document.getElementById('input-kop-judul').value;
        uiRekap.kopConfig.subJudul = document.getElementById('input-kop-sub').value;

        alert("Berhasil! KOP telah diperbarui.");
        document.getElementById('modal-kop').style.display = 'none';
    },

    loadDataHarian: async () => {
        const tglMulai = document.getElementById('tgl-mulai').value;
        const tglSelesai = document.getElementById('tgl-selesai').value;
        const container = document.getElementById('area-tabel-rekap');

        container.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin"></i> Memproses Analisa Data...</div>`;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            const [respProfil, respLog, respAll] = await Promise.all([
                supabaseClient.from('profil_user').select('*').eq('user_id', user.id).single(),
                supabaseClient.from('logbook_harian')
                    .select('*, kamus_kegiatan(*)')
                    .eq('user_id', user.id)
                    .gte('tanggal', tglMulai)
                    .lte('tanggal', tglSelesai)
                    .order('tanggal', { ascending: true })
                    .order('jam_mulai', { ascending: true }),
                supabaseClient.from('logbook_harian').select('kegiatan_id, jumlah').eq('user_id', user.id)
            ]);

            const realisasiMap = {};
            if (respAll.data) {
                respAll.data.forEach(item => {
                    realisasiMap[item.kegiatan_id] = (realisasiMap[item.kegiatan_id] || 0) + (item.jumlah || 0);
                });
            }

            if (!respLog.data || respLog.data.length === 0) {
                container.innerHTML = `<div style="padding:50px; text-align:center; opacity:0.5;">Data logbook tidak ditemukan pada periode ini.</div>`;
                return;
            }

            let htmlTabel = `
                <table id="table-rekap-main" style="width:100%; border-collapse:collapse; font-size:12px; color:#fff; min-width:1000px;">
                    <thead>
                        <tr style="background:var(--input-bg); color:var(--accent);">
                            <th style="padding:12px; border:1px solid var(--border); width:40px;">NO</th>
                            <th style="padding:12px; border:1px solid var(--border); width:150px;">TANGGAL & WAKTU</th>
                            <th style="padding:12px; border:1px solid var(--border); text-align:left;">BUTIR KEGIATAN & ANALISA TARGET</th>
                            <th style="padding:12px; border:1px solid var(--border); width:150px;">REKAM MEDIS (RM)</th>
                            <th style="padding:12px; border:1px solid var(--border); width:60px; text-align:center;">VOL</th>
                        </tr>
                    </thead>
                    <tbody>`;

            respLog.data.forEach((item, index) => {
                const kamus = item.kamus_kegiatan || {};
                const target = kamus.target_tahunan || 0;
                const realisasi = realisasiMap[item.kegiatan_id] || 0;
                const sisa = target - realisasi;
                const linkBukti = kamus.link_bukti_dukung ?
                    `<a href="${kamus.link_bukti_dukung}" target="_blank" style="color:#60a5fa; text-decoration:none; margin-left:10px;"><i class="fa-solid fa-link"></i> BUKTI</a>` : '';

                htmlTabel += `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">${index + 1}</td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">
                            <b>${item.tanggal}</b><br>
                            <small style="opacity:0.7;">${item.jam_mulai?.slice(0, 5)} - ${item.jam_selesai?.slice(0, 5)}</small>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border);">
                            <div style="font-weight:700; color:var(--accent); margin-bottom:5px;">${kamus.nama_kegiatan || '-'}</div>
                            <div style="display:flex; gap:12px; font-size:10px; background:rgba(255,255,255,0.05); padding:4px 8px; border-radius:4px; width:fit-content;">
                                <span>🎯 TARGET: <b>${target}</b></span>
                                <span>📈 REAL: <b>${realisasi}</b></span>
                                <span style="color:${sisa <= 0 ? '#4ade80' : '#fb7185'}">📉 SISA: <b>${sisa}</b></span>
                                ${linkBukti}
                            </div>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">
                            <span style="background:var(--accent); color:#000; padding:2px 8px; border-radius:4px; font-weight:800; font-family:monospace;">${item.no_rm || '-'}</span>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center; font-weight:800;">${item.jumlah || 0}</td>
                    </tr>`;
            });

            htmlTabel += `</tbody></table>`;
            container.innerHTML = htmlTabel;

            // Simpan ke state global khusus harian
            window.lastDataHarian = {
                profil: respProfil.data,
                mulai: tglMulai,
                selesai: tglSelesai,
                tableBody: htmlTabel
            };

        } catch (err) {
            container.innerHTML = `<p style="color:red; text-align:center; padding:20px;">Error System: ${err.message}</p>`;
        }
    },

    generateFullDocHarian: () => {
        if (!window.lastDataHarian) return '';
        const { profil: p, mulai, selesai, tableBody } = window.lastDataHarian;
        const config = uiRekap.kopConfig;

        const printableTable = tableBody
            .replace(/color:#fff/g, 'color:#000')
            .replace(/border:1px solid var\(--border\)/g, 'border:1.5pt solid #000')
            .replace(/background:var\(--input-bg\)/g, 'background:#eeeeee')
            .replace(/background:rgba\(255,255,255,0.05\)/g, 'background:none')
            .replace(/color:var\(--accent\)/g, 'color:#000');

        return `
            <html><head><meta charset="utf-8"><title>Laporan Logbook</title><style>
                body { font-family: 'Times New Roman', Times, serif; padding:20px; color:#000; background:#fff; }
                .kop-container { display: flex; align-items: center; border-bottom: 3.5pt double #000; padding-bottom: 5px; margin-bottom: 15px; }
                .kop-logo { width: 70px; height: auto; }
                .kop-text { text-align: center; flex: 1; }
                .kop-judul { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; white-space: pre-line; line-height:1.2; }
                .kop-sub { font-size: 8pt; margin: 5px 0 0 0; white-space: pre-line; font-style: italic; line-height:1.1; }
                .title-main { text-align: center; font-size: 12pt; font-weight: bold; text-decoration: underline; margin-top: 10px; }
                .title-sub { text-align: center; font-size: 10pt; margin-bottom: 15px; }
                table { width:100%; border-collapse:collapse; }
                th, td { border:1pt solid #000; padding:6px; font-size:9pt; }
                .id-table { border:none !important; margin-bottom: 10px; }
                .id-table td { border:none !important; padding: 1px 0; font-size: 10pt; }
                .ttd-table { width:100%; margin-top:30px; border:none !important; }
                .ttd-table td { border:none !important; width:50%; text-align:center; font-size:10pt; }
            </style></head><body>
                <div class="kop-container">
                    ${config.logoKiri ? `<img src="${config.logoKiri}" class="kop-logo">` : '<div style="width:70px"></div>'}
                    <div class="kop-text">
                        <div class="kop-judul">${config.judul}</div>
                        <div class="kop-sub">${config.subJudul}</div>
                    </div>
                    ${config.logoKanan ? `<img src="${config.logoKanan}" class="kop-logo">` : '<div style="width:70px"></div>'}
                </div>
                <div class="title-main">REKAPITULASI HARIAN LOGBOOK</div>
                <div class="title-sub">Periode: ${mulai} s/d ${selesai}</div>
                <table class="id-table">
                    <tr><td style="width:120px">Nama Pegawai</td><td>: <b>${p.p_nama || '-'}</b></td><td style="width:100px">Unit Kerja</td><td>: ${p.p_unit || '-'}</td></tr>
                    <tr><td>NIP</td><td>: ${p.p_nip || '-'}</td><td>Instansi</td><td>: ${p.p_instansi || '-'}</td></tr>
                    <tr><td>Pangkat/Gol</td><td>: ${p.p_golongan || '-'}</td> <td>Jabatan</td><td>: ${p.p_jabatan || '-'}</td></tr>
                </table>
                ${printableTable}
                <table class="ttd-table">
                    <tr>
                        <td>Mengetahui,<br>${p.a_jabatan || 'Atasan Penilai'}<br><br><br><br><u><b>${p.a_nama || '-'}</b></u><br>NIP. ${p.a_nip || '-'}</td>
                        <td>Magelang, ${new Date().toLocaleDateString('id-ID')}<br>Pegawai Melaporkan,<br><br><br><br><u><b>${p.p_nama || '-'}</b></u><br>NIP. ${p.p_nip || '-'}</td>
                    </tr>
                </table>
            </body></html>`;
    },

    downloadWordHarian: () => {
        if (!window.lastDataHarian) return alert("Tampilkan data dahulu!");
        const content = uiRekap.generateFullDocHarian();
        const blob = new Blob(['\ufeff', content], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Harian_${window.lastDataHarian.mulai}.doc`;
        a.click();
    },

    printLaporanHarian: () => {
        if (!window.lastDataHarian) return alert("Tampilkan data dahulu!");
        const win = window.open('', '', 'height=800,width=1100');
        win.document.write(uiRekap.generateFullDocHarian());
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 1000);
    }
});