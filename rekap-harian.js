/**
 * REKAP-HARIAN.JS - RESPONSIVE OPTIMIZED V4.2
 * Fixed: Persistent Dynamic Links & Right-Aligned Identity
 */

window.uiRekap = window.uiRekap || {};

if (!window.uiRekap.kopConfig) {
    window.uiRekap.kopConfig = {
        logoKiri: '',
        logoKanan: '',
        judul: 'PEMERINTAH KABUPATEN MAGELANG\nDINAS KESEHATAN\nRSUD MERAH PUTIH',
        subJudul: 'Jl. Raya Magelang – Yogyakarta KM. 5 Mertoyudan, Magelang 56172\nTelepon (0293) 3202654, 3202584\nWebsite: https://rsudmerahputih.magelangkab.go.id'
    };
}

Object.assign(window.uiRekap, {

    renderRekapHarian: async () => {
        const content = document.getElementById('page-content');
        const today = new Date().toISOString().split('T')[0];

        content.innerHTML = `
            <style>
                .rekap-container { max-width: 1400px; margin: 0 auto; padding: 10px; }
                .header-flex { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 20px; }
                .filter-card { display: flex; flex-direction: column; gap: 10px; align-items: flex-end; }
                .group-inputs { display: flex; gap: 8px; align-items: center; }
                .btn-action-group { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
                
                @media (max-width: 768px) {
                    .header-flex { flex-direction: column; align-items: stretch; text-align: center; }
                    .filter-card { align-items: center; }
                    .group-inputs { flex-direction: column; width: 100%; }
                    .group-inputs input { width: 100% !important; }
                    .btn-action-group { justify-content: center; width: 100%; }
                    .btn-action-group button { flex: 1; min-width: 120px; font-size: 10px !important; }
                }

                .badge-rm { background:var(--accent); color:#000; padding:2px 8px; border-radius:4px; font-weight:800; font-family:monospace; font-size:11px; }
                .link-output-dynamic { color:#60a5fa; text-decoration:none; font-weight:700; font-size:10px; text-transform: uppercase; border: 1px solid #60a5fa; padding: 2px 6px; border-radius: 4px; transition: 0.2s; display: inline-flex; align-items: center; gap: 4px; }
                .link-output-dynamic:hover { background: #60a5fa; color: #fff; }
            </style>

            <div class="card fade-in rekap-container">
                <div class="header-flex">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📅 Rekapitulasi Harian</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Rincian butir kegiatan dan capaian kinerja.</p>
                    </div>
                    
                    <div class="filter-card">
                        <div class="group-inputs">
                            <input type="date" id="tgl-mulai" class="auth-input" style="width:145px; margin:0;" value="${today}">
                            <span style="color:var(--text-body);">s/d</span>
                            <input type="date" id="tgl-selesai" class="auth-input" style="width:145px; margin:0;" value="${today}">
                            <button onclick="uiRekap.loadDataHarian()" class="auth-btn" style="margin:0; width:auto; padding:0 20px; background:var(--accent-gradient);">TAMPILKAN</button>
                        </div>
                        <div class="btn-action-group">
                            <button onclick="uiRekap.openKopModal()" class="auth-btn" style="margin:0; width:auto; background:rgba(255,255,255,0.05); border:1px solid var(--border);">
                                <i class="fa-solid fa-cog"></i> KOP
                            </button>
                            <button onclick="uiRekap.downloadWordHarian()" class="auth-btn" style="margin:0; width:auto; background:#2b5797;">
                                <i class="fa-solid fa-file-word"></i> WORD
                            </button>
                            <button onclick="uiRekap.printLaporanHarian()" class="auth-btn" style="margin:0; width:auto; background:#e11d48;">
                                <i class="fa-solid fa-print"></i> PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="area-tabel-rekap" style="overflow-x:auto; background: rgba(0,0,0,0.1); border-radius:12px; border:1px solid var(--border); min-height:200px;">
                    <p style="text-align:center; padding:50px; opacity:0.5;">Tentukan periode tanggal dan klik tampilkan...</p>
                </div>
            </div>

            <div id="modal-kop" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.9); z-index:9999; align-items:center; justify-content:center; padding:20px;">
                <div class="card" style="max-width:600px; width:100%; background:var(--bg-body); border:1px solid var(--accent);">
                    <h4 style="color:var(--accent); margin-top:0;">⚙️ Pengaturan KOP Surat</h4>
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:15px; margin-bottom:15px;">
                        <div>
                            <label style="font-size:10px; font-weight:bold;">LOGO KIRI</label>
                            <input type="file" id="input-logo-kiri" accept="image/*" class="auth-input">
                        </div>
                        <div>
                            <label style="font-size:10px; font-weight:bold;">LOGO KANAN</label>
                            <input type="file" id="input-logo-kanan" accept="image/*" class="auth-input">
                        </div>
                    </div>
                    <label style="font-size:10px; font-weight:bold;">JUDUL INSTANSI</label>
                    <textarea id="input-kop-judul" class="auth-input" style="height:70px; margin-bottom:10px;">${uiRekap.kopConfig.judul}</textarea>
                    <label style="font-size:10px; font-weight:bold;">SUB-JUDUL / ALAMAT</label>
                    <textarea id="input-kop-sub" class="auth-input" style="height:70px; margin-bottom:20px;">${uiRekap.kopConfig.subJudul}</textarea>
                    <div style="display:flex; gap:10px;">
                        <button onclick="uiRekap.saveKopConfig()" class="auth-btn" style="background:var(--accent-gradient);">SIMPAN</button>
                        <button onclick="document.getElementById('modal-kop').style.display='none'" class="auth-btn" style="background:#444;">BATAL</button>
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
        const toBase64 = file => new Promise((resolve) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
        });
        if (fileKiri) uiRekap.kopConfig.logoKiri = await toBase64(fileKiri);
        if (fileKanan) uiRekap.kopConfig.logoKanan = await toBase64(fileKanan);
        uiRekap.kopConfig.judul = document.getElementById('input-kop-judul').value;
        uiRekap.kopConfig.subJudul = document.getElementById('input-kop-sub').value;
        alert("KOP Berhasil Diperbarui!");
        document.getElementById('modal-kop').style.display = 'none';
    },

    loadDataHarian: async () => {
        const tglMulai = document.getElementById('tgl-mulai').value;
        const tglSelesai = document.getElementById('tgl-selesai').value;
        const container = document.getElementById('area-tabel-rekap');

        container.innerHTML = `<div style="text-align:center; padding:50px;"><i class="fa-solid fa-spinner fa-spin"></i> Memuat Data...</div>`;

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
                container.innerHTML = `<div style="padding:50px; text-align:center; opacity:0.5;">Tidak ada kegiatan pada periode ini.</div>`;
                return;
            }

            let htmlTabel = `
                <table id="table-rekap-main" style="width:100%; border-collapse:collapse; font-size:12px; color:#fff; min-width:900px;">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.05); color:var(--accent);">
                            <th style="padding:12px; border:1px solid var(--border);">NO</th>
                            <th style="padding:12px; border:1px solid var(--border);">WAKTU</th>
                            <th style="padding:12px; border:1px solid var(--border); text-align:left;">BUTIR KEGIATAN & ANALISA</th>
                            <th style="padding:12px; border:1px solid var(--border);">NO. RM</th>
                            <th style="padding:12px; border:1px solid var(--border);">VOL</th>
                        </tr>
                    </thead>
                    <tbody>`;

            respLog.data.forEach((item, index) => {
                const kamus = item.kamus_kegiatan || {};
                const target = kamus.target_tahunan || 0;
                const realisasi = realisasiMap[item.kegiatan_id] || 0;
                const sisa = target - realisasi;
                
                // DINAMIS: Menggunakan output_hasil (Laporan/Dokumen/Pasien)
                const labelOutput = kamus.output_hasil || 'BUKTI';
                const linkBukti = item.link_bukti ?
                    `<a href="${item.link_bukti}" target="_blank" class="link-output-dynamic"><i class="fa-solid fa-file-circle-check"></i> ${labelOutput}</a>` : '';

                htmlTabel += `
                    <tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">${index + 1}</td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">
                            <b>${item.tanggal.split('-').reverse().join('/')}</b><br>
                            <small style="opacity:0.7;">${item.jam_mulai?.slice(0, 5)} - ${item.jam_selesai?.slice(0, 5)}</small>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border);">
                            <div style="font-weight:700; color:var(--accent); margin-bottom:5px;">${kamus.nama_kegiatan || '-'}</div>
                            <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                                <span style="font-size:10px; opacity:0.8;">🎯 TGT: ${target} | 📈 REAL: ${realisasi} | 📉 SISA: <b style="color:${sisa <= 0 ? '#4ade80' : '#fb7185'}">${sisa}</b></span>
                                ${linkBukti}
                            </div>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center;">
                            <span class="badge-rm">${item.no_rm || '-'}</span>
                        </td>
                        <td style="padding:12px; border:1px solid var(--border); text-align:center; font-weight:800; font-size:14px;">${item.jumlah || 0}</td>
                    </tr>`;
            });

            htmlTabel += `</tbody></table>`;
            container.innerHTML = htmlTabel;

            window.lastDataHarian = {
                profil: respProfil.data,
                mulai: tglMulai,
                selesai: tglSelesai,
                tableBody: htmlTabel
            };

        } catch (err) {
            container.innerHTML = `<p style="color:red; text-align:center; padding:20px;">System Error: ${err.message}</p>`;
        }
    },

    generateFullDocHarian: () => {
        if (!window.lastDataHarian) return '';
        const { profil: p, mulai, selesai, tableBody } = window.lastDataHarian;
        const config = uiRekap.kopConfig;

        // FIXED: Jangan hapus <a> tag! Ubah saja style-nya agar terlihat profesional di Word/PDF
        const printableTable = tableBody
            .replace(/color:#fff/g, 'color:#000')
            .replace(/border:1px solid var\(--border\)/g, 'border:1pt solid #000')
            .replace(/background:rgba\(255,255,255,0.05\)/g, 'background:#f2f2f2')
            .replace(/color:var\(--accent\)/g, 'color:#000')
            // Ubah link biru agar bisa dipencet di Word
            .replace(/class="link-output-dynamic"/g, 'style="color:#0000FF; text-decoration:underline; font-weight:bold; font-size:8pt;"')
            // Buang icon i class karena sering error di Word
            .replace(/<i.*?<\/i>/g, ''); 

        return `
            <html><head><style>
                body { font-family: 'Times New Roman', serif; padding:30px; color:#000; line-height:1.4; }
                .kop-container { display: flex; align-items: center; border-bottom: 3pt double #000; padding-bottom: 5px; margin-bottom: 20px; }
                .kop-logo { height: 85px; width: 85px; object-fit: contain; }
                .kop-text { text-align: center; flex: 1; }
                .kop-judul { font-size: 14pt; font-weight: bold; text-transform: uppercase; margin: 0; white-space: pre-line; }
                .kop-sub { font-size: 8pt; margin: 5px 0 0 0; white-space: pre-line; font-style: italic; }
                
                .id-section { display: flex; justify-content: space-between; margin-bottom: 15px; align-items: flex-start; }
                .id-column-left { width: 48%; }
                .id-column-right { width: 48%; display: flex; justify-content: flex-end; }
                
                table.id-table { border: none !important; border-collapse: collapse; }
                table.id-table td { border: none !important; padding: 1px 0; font-size: 10pt; vertical-align: top; }

                table.main-table { width:100%; border-collapse:collapse; margin-top:10px; }
                table.main-table th, table.main-table td { border:1pt solid #000; padding:6px; font-size:9pt; }
                .ttd-table { width:100%; margin-top:40px; }
                .ttd-table td { border:none !important; width:50%; text-align:center; font-size:10pt; }
            </style></head><body>
                <div class="kop-container">
                    ${config.logoKiri ? `<img src="${config.logoKiri}" class="kop-logo">` : '<div style="width:85px"></div>'}
                    <div class="kop-text">
                        <div class="kop-judul">${config.judul}</div>
                        <div class="kop-sub">${config.subJudul}</div>
                    </div>
                    ${config.logoKanan ? `<img src="${config.logoKanan}" class="kop-logo">` : '<div style="width:85px"></div>'}
                </div>
                
                <h3 style="text-align:center; text-decoration:underline; margin:0; font-size:12pt;">REKAPITULASI HARIAN LOGBOOK</h3>
                <p style="text-align:center; font-size:10pt; margin:5px 0 15px 0;">Periode: ${mulai.split('-').reverse().join('/')} s/d ${selesai.split('-').reverse().join('/')}</p>
                
                <div class="id-section">
                    <div class="id-column-left">
                        <table class="id-table">
                            <tr><td style="width:100px">Nama Pegawai</td><td>: <b>${p.p_nama || '-'}</b></td></tr>
                            <tr><td>NIP</td><td>: ${p.p_nip || '-'}</td></tr>
                            <tr><td>Pangkat/Gol</td><td>: ${p.p_golongan || '-'}</td></tr>
                        </table>
                    </div>
                    <div class="id-column-right">
                        <table class="id-table">
                            <tr><td style="width:80px">Unit Kerja</td><td>: ${p.p_unit || '-'}</td></tr>
                            <tr><td>Instansi</td><td>: ${p.p_instansi || 'RSUD MERAH PUTIH'}</td></tr>
                            <tr><td>Jabatan</td><td>: ${p.p_jabatan || '-'}</td></tr>
                        </table>
                    </div>
                </div>

                <div class="main-table-container">
                    <table class="main-table">${printableTable.replace('<table id="table-rekap-main"', '<table')}</table>
                </div>

                <table class="ttd-table">
                    <tr>
                        <td>Mengetahui,<br>${p.a_jabatan || 'Atasan Penilai'}<br><br><br><br><u><b>${p.a_nama || '-'}</b></u><br>NIP. ${p.a_nip || '-'}</td>
                        <td>Magelang, ${new Date().toLocaleDateString('id-ID', {day:'numeric', month:'long', year:'numeric'})}<br>Pegawai Melaporkan,<br><br><br><br><u><b>${p.p_nama || '-'}</b></u><br>NIP. ${p.p_nip || '-'}</td>
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
        const win = window.open('', '', 'height=850,width=1150');
        win.document.write(uiRekap.generateFullDocHarian());
        win.document.close();
        setTimeout(() => { win.focus(); win.print(); }, 1200);
    }
});