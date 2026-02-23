/**
 * UI-REKAP-BULANAN.JS - Versi Sinkronisasi Otomatis
 * Mengambil settingan KOP dari Rekap Harian
 */

window.uiRekap = window.uiRekap || {};

Object.assign(window.uiRekap, {
    // 1. RENDER HALAMAN UTAMA
    renderRekapBulanan: async () => {
        const container = document.getElementById('page-content');
        const now = new Date();
        const currMonth = now.getMonth() + 1;
        const currYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="card fade-in" style="max-width: 100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; gap:20px; flex-wrap:wrap;">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📅 Rekapitulasi Bulanan</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Data otomatis mengikuti pengaturan KOP di menu Rekap Harian.</p>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">PERIODE:</span>
                            <select id="bulan-filter" class="auth-input" style="width:130px; margin:0;">
                                ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
                .map((m, i) => `<option value="${i + 1}" ${currMonth === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                            </select>
                            <select id="tahun-filter" class="auth-input" style="width:90px; margin:0;">
                                ${[currYear - 1, currYear, currYear + 1].map(y => `<option value="${y}" ${currYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                            <button onclick="uiRekap.prosesTampilkanBulanan()" class="auth-btn" style="margin:0; width:auto; padding:0 20px; background:var(--accent-gradient);">TAMPILKAN</button>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">TANGGAL SURAT:</span>
                            <input type="date" id="tgl-cetak-surat" class="auth-input" style="width:140px; margin:0; font-size:11px;" value="${todayStr}">
                            <button onclick="uiRekap.downloadWordBulanan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#2b5797; font-size:10px;">
                                <i class="fa-solid fa-file-word"></i> DOWNLOAD WORD
                            </button>
                            <button onclick="uiRekap.printLaporanBulanan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#e11d48; font-size:10px;">
                                <i class="fa-solid fa-file-pdf"></i> CETAK PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="rekap-matrix-container" style="overflow-x:auto; border-radius:12px; border:1px solid var(--border); background:rgba(0,0,0,0.1); min-height:300px;">
                    <p style="text-align:center; padding:100px; opacity:0.5;">Silakan klik tombol Tampilkan Data...</p>
                </div>
            </div>`;
    },

    // 2. PROSES DATA & ANALISA TARGET (Sync dengan Harian)
    prosesTampilkanBulanan: async () => {
        const bln = document.getElementById('bulan-filter').value;
        const thn = document.getElementById('tahun-filter').value;
        const targetDiv = document.getElementById('rekap-matrix-container');
        const daysInMonth = new Date(thn, bln, 0).getDate();

        targetDiv.innerHTML = `<div style="text-align:center; padding:100px;"><i class="fa-solid fa-spinner fa-spin"></i> Memproses Matriks...</div>`;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            const [pResp, kResp, lResp, allResp] = await Promise.all([
                supabaseClient.from('profil_user').select('*').eq('user_id', user.id).single(),
                supabaseClient.from('kamus_kegiatan').select('*').eq('user_id', user.id).order('nama_kegiatan'),
                supabaseClient.from('logbook_harian').select('*').eq('user_id', user.id)
                    .filter('tanggal', 'gte', `${thn}-${bln.padStart(2, '0')}-01`)
                    .filter('tanggal', 'lte', `${thn}-${bln.padStart(2, '0')}-${daysInMonth}`),
                supabaseClient.from('logbook_harian').select('kegiatan_id, jumlah').eq('user_id', user.id)
            ]);

            // Hitung akumulasi realisasi global
            const realisasiMap = {};
            allResp.data.forEach(item => {
                realisasiMap[item.kegiatan_id] = (realisasiMap[item.kegiatan_id] || 0) + (item.jumlah || 0);
            });

            const matrix = {};
            kResp.data.forEach(item => {
                matrix[item.id] = { harian: Array(daysInMonth + 1).fill(0), total: 0 };
            });

            lResp.data.forEach(log => {
                const tgl = parseInt(log.tanggal.split('-')[2]);
                if (matrix[log.kegiatan_id]) {
                    matrix[log.kegiatan_id].harian[tgl] += (log.jumlah || 0);
                    matrix[log.kegiatan_id].total += (log.jumlah || 0);
                }
            });

            let tableHtml = `
                <table id="table-rekap-print" style="width:100%; border-collapse:collapse; font-size:10px; color:#fff; min-width:1100px;">
                    <thead>
                        <tr style="background:var(--input-bg); color:var(--accent);">
                            <th rowspan="2" style="padding:10px; border:1px solid var(--border); width:30px;">NO</th>
                            <th rowspan="2" style="padding:10px; border:1px solid var(--border); text-align:left;">BUTIR KEGIATAN & ANALISA TARGET</th>
                            <th colspan="${daysInMonth}" style="padding:5px; border:1px solid var(--border); text-align:center;">TANGGAL</th>
                            <th rowspan="2" style="padding:10px; border:1px solid var(--border); width:40px;">VOL</th>
                        </tr>
                        <tr style="background:var(--input-bg); color:var(--accent);">
                            ${Array.from({ length: daysInMonth }, (_, i) => `<th style="border:1px solid var(--border); width:22px; font-size:8px;">${i + 1}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>`;

            kResp.data.forEach((k, idx) => {
                const m = matrix[k.id];
                const target = k.target_tahunan || 0;
                const realisasi = realisasiMap[k.id] || 0;
                const sisa = target - realisasi;

                tableHtml += `
                    <tr>
                        <td style="border:1px solid var(--border); text-align:center;">${idx + 1}</td>
                        <td style="border:1px solid var(--border); padding:6px;">
                            <div style="font-weight:700; color:var(--accent);">${k.nama_kegiatan}</div>
                            <div style="font-size:8px; opacity:0.8; margin-top:3px; display:flex; gap:5px;">
                                <span>🎯 TARGET: ${target}</span> | <span>📈 REAL: ${realisasi}</span> | <span style="color:${sisa <= 0 ? '#4ade80' : '#fb7185'}">📉 SISA: ${sisa}</span>
                                ${k.link_bukti_dukung ? `| <a href="${k.link_bukti_dukung}" target="_blank" style="color:var(--accent);">[BUKTI]</a>` : ''}
                            </div>
                        </td>
                        ${m.harian.slice(1).map(val => `
                            <td style="border:1px solid var(--border); text-align:center; ${val > 0 ? 'color:var(--accent); font-weight:bold; background:rgba(255,255,255,0.05);' : 'opacity:0.2;'}">
                                ${val || '-'}
                            </td>
                        `).join('')}
                        <td style="border:1px solid var(--border); text-align:center; font-weight:bold;">${m.total}</td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>`;
            targetDiv.innerHTML = tableHtml;

            window.lastDataBulanan = {
                profil: pResp.data,
                bulanNama: document.getElementById('bulan-filter').options[bln - 1].text,
                tahun: thn,
                tabelHtml: tableHtml,
                tglCetak: document.getElementById('tgl-cetak-surat').value
            };

        } catch (err) {
            targetDiv.innerHTML = `<p style="color:red; text-align:center; padding:50px;">Gagal memuat data: ${err.message}</p>`;
        }
    },

    // 3. FUNGSI PRINT (Mengambil KOP dari Harian)
    generateFinalHTML: () => {
        const d = window.lastDataBulanan;
        const config = uiRekap.kopConfig; // Mengambil settingan dari Harian
        const p = d.profil;

        return `
            <html><head><style>
                @page { size: Legal landscape; margin: 1.2cm; }
                body { font-family: 'Arial', sans-serif; font-size: 9pt; background:#fff; color:#000; }
                .kop-header { text-align: center; border-bottom: 3pt double #000; padding-bottom: 5px; margin-bottom: 15px; text-transform: uppercase; }
                .id-box { margin-bottom: 10px; width: 100%; }
                .id-box td { font-size: 9pt; font-weight: bold; padding: 1px 0; }
                table.main { width: 100%; border-collapse: collapse; }
                table.main th, table.main td { border: 1pt solid #000; padding: 3px; }
                .ttd-box { margin-top: 30px; width: 100%; }
                .ttd-box td { text-align: center; width: 50%; font-size: 10pt; }
            </style></head><body>
                <div class="kop-header">
                    <div style="font-size: 12pt; font-weight: bold;">${config.judul.replace(/\n/g, '<br>')}</div>
                    <div style="font-size: 8pt; font-weight: normal; text-transform: none;">${config.subJudul.replace(/\n/g, '<br>')}</div>
                </div>
                <div style="text-align:center; font-weight:bold; text-decoration:underline; font-size:11pt;">REKAPITULASI LOGBOOK HARIAN</div>
                <div style="text-align:center; font-weight:bold; margin-bottom:15px;">Periode: ${d.bulanNama} ${d.tahun}</div>

                <table class="id-box">
                    <tr><td width="120">Nama Pegawai</td><td width="10">:</td><td>${p.p_nama}</td><td width="100">Unit Kerja</td><td width="10">:</td><td>${p.p_unit}</td></tr>
                    <tr><td>NIP</td><td>:</td><td>${p.p_nip}</td><td>Instansi</td><td>:</td><td>${p.p_instansi}</td></tr>
                    <tr><td>Pangkat/Gol</td><td>:</td><td>${p.p_golongan || '-'}</td><td>Jabatan</td><td>:</td><td>${p.p_jabatan}</td></tr>
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

    printLaporanBulanan: () => {
        if (!window.lastDataBulanan) return alert("Tampilkan data dahulu!");
        const win = window.open('', '_blank');
        win.document.write(uiRekap.generateFinalHTML());
        win.document.close();
        setTimeout(() => win.print(), 500);
    },

    downloadWordBulanan: () => {
        if (!window.lastDataBulanan) return alert("Tampilkan data dahulu!");
        const blob = new Blob(['\ufeff', uiRekap.generateFinalHTML()], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Bulanan_${window.lastDataBulanan.bulanNama}.doc`;
        a.click();
    }
});