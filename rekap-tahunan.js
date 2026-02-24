/**
 * UI-REKAP-TAHUNAN.JS
 * Fitur: Matriks 12 Bulan, Dropdown Tahun, Auto-Sync KOP & Analisa Target
 */

window.uiRekap = window.uiRekap || {};

Object.assign(window.uiRekap, {
    // 1. RENDER HALAMAN UTAMA TAHUNAN
    renderRekapTahunan: async () => {
        const container = document.getElementById('page-content');
        const now = new Date();
        const currYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="card fade-in" style="max-width: 100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; gap:20px; flex-wrap:wrap;">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📅 Rekapitulasi Tahunan</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Laporan akumulasi kegiatan per bulan selama satu tahun penuh.</p>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">TAHUN:</span>
                            <select id="tahun-tahunan" class="auth-input" style="width:100px; margin:0;">
                                ${[currYear - 2, currYear - 1, currYear, currYear + 1].map(y => `<option value="${y}" ${currYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                            <button onclick="uiRekap.prosesTampilkanTahunan()" class="auth-btn" style="margin:0; width:auto; padding:0 20px; background:var(--accent-gradient);">TAMPILKAN</button>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">TANGGAL CETAK:</span>
                            <input type="date" id="tgl-cetak-tahunan" class="auth-input" style="width:140px; margin:0; font-size:11px;" value="${todayStr}">
                            <button onclick="uiRekap.downloadWordTahunan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#2b5797; font-size:10px;">
                                <i class="fa-solid fa-file-word"></i> WORD
                            </button>
                            <button onclick="uiRekap.printLaporanTahunan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#e11d48; font-size:10px;">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="rekap-tahunan-container" style="overflow-x:auto; border-radius:12px; border:1px solid var(--border); background:rgba(0,0,0,0.1); min-height:300px;">
                    <p style="text-align:center; padding:100px; opacity:0.5;">Silakan pilih tahun dan klik Tampilkan Data...</p>
                </div>
            </div>`;
    },

    // 2. LOGIKA PEMROSESAN DATA TAHUNAN
    prosesTampilkanTahunan: async () => {
        const thn = document.getElementById('tahun-tahunan').value;
        const targetDiv = document.getElementById('rekap-tahunan-container');
        const namaBulan = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

        targetDiv.innerHTML = `<div style="text-align:center; padding:100px;"><i class="fa-solid fa-spinner fa-spin"></i> Mengolah Data Tahunan ${thn}...</div>`;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            // Ambil Profil, Kamus, dan Logbook selama 1 tahun
            const [pResp, kResp, lResp] = await Promise.all([
                supabaseClient.from('profil_user').select('*').eq('user_id', user.id).single(),
                supabaseClient.from('kamus_kegiatan').select('*').eq('user_id', user.id).order('nama_kegiatan'),
                supabaseClient.from('logbook_harian').select('*').eq('user_id', user.id)
                    .filter('tanggal', 'gte', `${thn}-01-01`)
                    .filter('tanggal', 'lte', `${thn}-12-31`)
            ]);

            // Olah Matrix Tahunan
            const matrix = {};
            kResp.data.forEach(k => {
                matrix[k.id] = {
                    bulanan: Array(12).fill(0),
                    totalTahun: 0
                };
            });

            lResp.data.forEach(log => {
                const bulanIndex = parseInt(log.tanggal.split('-')[1]) - 1;
                if (matrix[log.kegiatan_id]) {
                    matrix[log.kegiatan_id].bulanan[bulanIndex] += (log.jumlah || 0);
                    matrix[log.kegiatan_id].totalTahun += (log.jumlah || 0);
                }
            });

            let tableHtml = `
                <table id="table-tahunan-print" style="width:100%; border-collapse:collapse; font-size:10px; color:#fff; min-width:1200px;">
                    <thead>
                        <tr style="background:var(--input-bg); color:var(--accent);">
                            <th style="padding:10px; border:1px solid var(--border); width:30px;">NO</th>
                            <th style="padding:10px; border:1px solid var(--border); text-align:left;">BUTIR KEGIATAN & ANALISA TARGET</th>
                            ${namaBulan.map(b => `<th style="padding:5px; border:1px solid var(--border); width:45px; text-align:center;">${b.toUpperCase()}</th>`).join('')}
                            <th style="padding:10px; border:1px solid var(--border); width:60px; text-align:center;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>`;

            kResp.data.forEach((k, idx) => {
                const m = matrix[k.id];
                const target = k.target_tahunan || 0;
                const realisasi = m.totalTahun;
                const sisa = target - realisasi;

                tableHtml += `
                    <tr>
                        <td style="border:1px solid var(--border); text-align:center;">${idx + 1}</td>
                        <td style="border:1px solid var(--border); padding:8px;">
                            <div style="font-weight:700; color:var(--accent); line-height:1.2;">${k.nama_kegiatan}</div>
                            <div style="font-size:8px; opacity:0.7; margin-top:4px; display:flex; gap:6px; flex-wrap:wrap;">
                                <span>🎯 TGT: <b>${target}</b></span> | 
                                <span>📈 REAL: <b>${realisasi}</b></span> | 
                                <span style="color:${sisa <= 0 ? '#4ade80' : '#fb7185'}">📉 SISA: <b>${sisa}</b></span>
                                ${k.link_bukti_dukung ? ` | <a href="${k.link_bukti_dukung}" target="_blank" style="color:var(--accent); text-decoration:none;">[BUKTI]</a>` : ''}
                            </div>
                        </td>
                        ${m.bulanan.map(val => `
                            <td style="border:1px solid var(--border); text-align:center; ${val > 0 ? 'color:var(--accent); font-weight:bold;' : 'opacity:0.3;'}">
                                ${val || '-'}
                            </td>
                        `).join('')}
                        <td style="border:1px solid var(--border); text-align:center; font-weight:bold; background:rgba(255,255,255,0.05); color:var(--accent);">
                            ${realisasi || '-'}
                        </td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>`;
            targetDiv.innerHTML = tableHtml;

            window.lastDataTahunan = {
                profil: pResp.data,
                tahun: thn,
                tabelHtml: tableHtml,
                tglCetak: document.getElementById('tgl-cetak-tahunan').value
            };

        } catch (err) {
            targetDiv.innerHTML = `<p style="color:red; text-align:center; padding:50px;">Gagal memuat rekap tahunan: ${err.message}</p>`;
        }
    },

    // 3. GENERATE HTML UNTUK CETAK/WORD
    generateTahunanHTML: () => {
        const d = window.lastDataTahunan;
        const config = uiRekap.kopConfig;
        const p = d.profil;

        return `
            <html><head><style>
                @page { size: Legal landscape; margin: 1cm; }
                body { font-family: 'Arial', sans-serif; font-size: 9pt; color:#000; background:#fff; }
                .kop-header { text-align: center; border-bottom: 3pt double #000; padding-bottom: 5px; margin-bottom: 15px; }
                .id-box { margin-bottom: 10px; width: 100%; border-collapse: collapse; }
                .id-box td { font-size: 8.5pt; font-weight: bold; padding: 2px; }
                table.main { width: 100%; border-collapse: collapse; margin-top:10px; }
                table.main th, table.main td { border: 0.5pt solid #000; padding: 4px; font-size: 8pt; }
                table.main th { background: #f0f0f0; }
                .ttd-box { margin-top: 30px; width: 100%; }
                .ttd-box td { text-align: center; width: 50%; font-size: 9pt; }
            </style></head><body>
                <div class="kop-header">
                    <div style="font-size: 14pt; font-weight: bold;">${config.judul.replace(/\n/g, '<br>')}</div>
                    <div style="font-size: 8.5pt;">${config.subJudul.replace(/\n/g, '<br>')}</div>
                </div>
                <div style="text-align:center; font-weight:bold; text-decoration:underline; font-size:12pt;">REKAPITULASI CAPAIAN TAHUNAN</div>
                <div style="text-align:center; font-weight:bold; margin-bottom:15px;">TAHUN ANGGARAN ${d.tahun}</div>

                <table class="id-box">
                    <tr><td width="120">Nama Pegawai</td><td>: ${p.p_nama}</td><td width="100">Unit Kerja</td><td>: ${p.p_unit}</td></tr>
                    <tr><td>NIP</td><td>: ${p.p_nip}</td><td>Instansi</td><td>: ${p.p_instansi}</td></tr>
                    <tr><td>Pangkat/Gol</td><td>: ${p.p_golongan}</td><td>Jabatan</td><td>: ${p.p_jabatan}</td></tr>
                </table>

                ${d.tabelHtml.replace(/style=".*?"/g, 'border="1" class="main"')}

                <table class="ttd-box">
                    <tr>
                        <td>Mengetahui,<br>${p.a_jabatan}<br><br><br><br><b><u>${p.a_nama}</u></b><br>NIP. ${p.a_nip}</td>
                        <td>Magelang, ${new Date(d.tglCetak).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Pegawai Melaporkan,<br><br><br><br><b><u>${p.p_nama}</u></b><br>NIP. ${p.p_nip}</td>
                    </tr>
                </table>
            </body></html>`;
    },

    printLaporanTahunan: () => {
        if (!window.lastDataTahunan) return alert("Tampilkan data dahulu!");
        const win = window.open('', '_blank');
        win.document.write(uiRekap.generateTahunanHTML());
        win.document.close();
        setTimeout(() => win.print(), 500);
    },

    downloadWordTahunan: () => {
        if (!window.lastDataTahunan) return alert("Tampilkan data dahulu!");
        const blob = new Blob(['\ufeff', uiRekap.generateTahunanHTML()], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Tahunan_${window.lastDataTahunan.tahun}.doc`;
        a.click();
    }
});