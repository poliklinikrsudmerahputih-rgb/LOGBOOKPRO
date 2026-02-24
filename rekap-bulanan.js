/**
 * UI-REKAP-BULANAN.JS - Versi Final Professional (Fixed Identity & Alignment)
 * Perbaikan: Identitas Rata Kanan-Kiri, Kegiatan Rata Kiri, Link Bukti Aktif
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
            <style>
                .rekap-controls { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 25px; gap: 15px; flex-wrap: wrap; }
                .filter-group { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: flex-end; }
                @media (max-width: 768px) {
                    .rekap-controls { flex-direction: column; align-items: stretch; }
                    .filter-group { justify-content: flex-start; }
                    .auth-input { width: 100% !important; }
                    .auth-btn { width: 100% !important; justify-content: center; }
                }
                .matrix-table-wrapper { overflow-x: auto; border-radius: 12px; border: 1px solid var(--border); background: rgba(0,0,0,0.2); position: relative; }
            </style>

            <div class="card fade-in">
                <div class="rekap-controls">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📅 Rekapitulasi Bulanan</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Matriks performa otomatis dengan tautan bukti dukung.</p>
                    </div>
                    
                    <div class="filter-group">
                        <select id="bulan-filter" class="auth-input" style="width:130px;">
                            ${['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
                                .map((m, i) => `<option value="${i + 1}" ${currMonth === i + 1 ? 'selected' : ''}>${m}</option>`).join('')}
                        </select>
                        <select id="tahun-filter" class="auth-input" style="width:90px;">
                            ${[currYear - 1, currYear, currYear + 1].map(y => `<option value="${y}" ${currYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                        </select>
                        <button onclick="uiRekap.prosesTampilkanBulanan()" class="auth-btn" style="background:var(--accent-gradient);">TAMPILKAN</button>
                    </div>
                </div>

                <div style="display:flex; gap:10px; margin-bottom:15px; flex-wrap:wrap; background:rgba(255,255,255,0.05); padding:10px; border-radius:8px;">
                    <div style="display:flex; align-items:center; gap:8px;">
                        <span style="font-size:11px; font-weight:700;">TGL CETAK:</span>
                        <input type="date" id="tgl-cetak-surat" class="auth-input" style="width:140px; margin:0; font-size:11px;" value="${todayStr}">
                    </div>
                    <button onclick="uiRekap.downloadWordBulanan()" class="auth-btn" style="background:#2b5797; font-size:11px; padding:8px 15px;">
                        <i class="fa-solid fa-file-word"></i> WORD
                    </button>
                    <button onclick="uiRekap.printLaporanBulanan()" class="auth-btn" style="background:#e11d48; font-size:11px; padding:8px 15px;">
                        <i class="fa-solid fa-file-pdf"></i> PDF
                    </button>
                </div>

                <div id="rekap-matrix-container" class="matrix-table-wrapper">
                    <p style="text-align:center; padding:80px; opacity:0.5;">Data akan muncul setelah tombol Tampilkan diklik...</p>
                </div>
            </div>`;
    },

    // 2. PROSES DATA
    prosesTampilkanBulanan: async () => {
        const bln = document.getElementById('bulan-filter').value;
        const thn = document.getElementById('tahun-filter').value;
        const targetDiv = document.getElementById('rekap-matrix-container');
        const daysInMonth = new Date(thn, bln, 0).getDate();

        targetDiv.innerHTML = `<div style="text-align:center; padding:80px;"><i class="fa-solid fa-spinner fa-spin"></i> Menghitung Data...</div>`;

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
                <table id="table-rekap-print" style="width:100%; border-collapse:collapse; font-size:10px; color:#fff; min-width:1200px;">
                    <thead>
                        <tr style="background:var(--accent); color:#000;">
                            <th rowspan="2" style="border:1px solid rgba(255,255,255,0.2); width:30px; text-align:center;">NO</th>
                            <th rowspan="2" style="border:1px solid rgba(255,255,255,0.2); text-align:left; padding-left:10px;">KEGIATAN & TARGET</th>
                            <th colspan="${daysInMonth}" style="border:1px solid rgba(255,255,255,0.2); text-align:center;">TANGGAL</th>
                            <th rowspan="2" style="border:1px solid rgba(255,255,255,0.2); width:40px; text-align:center;">VOL</th>
                        </tr>
                        <tr style="background:rgba(255,255,255,0.1);">
                            ${Array.from({ length: daysInMonth }, (_, i) => `<th style="border:1px solid rgba(255,255,255,0.2); width:25px; font-size:8px; text-align:center;">${i + 1}</th>`).join('')}
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
                        <td style="border:1px solid rgba(255,255,255,0.1); text-align:center;">${idx + 1}</td>
                        <td style="border:1px solid rgba(255,255,255,0.1); padding:8px; text-align:left;">
                            <div style="font-weight:700; color:var(--accent);">${k.nama_kegiatan}</div>
                            <div style="font-size:8px; opacity:0.7; margin-top:4px;">
                                TGT: ${target} | REAL: ${realisasi} | SISA: ${sisa}
                                ${k.link_bukti_dukung ? ` | <a href="${k.link_bukti_dukung}" target="_blank" style="color:#4ade80; text-decoration:none;">[LIHAT BUKTI]</a>` : ''}
                            </div>
                        </td>
                        ${m.harian.slice(1).map(val => `
                            <td style="border:1px solid rgba(255,255,255,0.1); text-align:center; ${val > 0 ? 'background:rgba(59,130,246,0.2); font-weight:bold;' : 'opacity:0.2;'}">
                                ${val || '-'}
                            </td>
                        `).join('')}
                        <td style="border:1px solid rgba(255,255,255,0.1); text-align:center; font-weight:bold;">${m.total}</td>
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
            targetDiv.innerHTML = `<p style="color:red; text-align:center; padding:50px;">Gagal: ${err.message}</p>`;
        }
    },

// 3. GENERATE FINAL HTML (IDENTITAS RATA KIRI-KANAN PRESISI)
    generateFinalHTML: () => {
        const d = window.lastDataBulanan;
        if (!d) return "";
        const config = window.uiRekap.kopConfig || { judul: "REKAPITULASI LOGBOOK", subJudul: "RSUD DANIEL" };
        const p = d.profil;

        return `
            <html><head><style>
                @page { size: Legal landscape; margin: 1cm; }
                body { font-family: 'Arial', sans-serif; font-size: 8pt; color:#000; margin:0; }
                .kop-header { text-align: center; border-bottom: 2.5pt double #000; padding-bottom: 8px; margin-bottom: 15px; }
                
                /* Container Identitas menggunakan tabel 3 kolom utama */
                .identity-wrapper { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
                .identity-wrapper td { vertical-align: top; padding: 0; }
                
                /* Tabel kecil di dalam kolom untuk label dan isi */
                .sub-identity { border-collapse: collapse; width: 100%; }
                .sub-identity td { padding: 2px 0; font-weight: bold; font-size: 9pt; }
                
                /* Gaya Tabel Utama */
                table.main-table { width: 100%; border-collapse: collapse; table-layout: auto; }
                table.main-table th { border: 0.5pt solid #000; padding: 4px; text-align: center; background-color: #f2f2f2; font-size: 8pt; }
                table.main-table td { border: 0.5pt solid #000; padding: 4px; font-size: 8pt; }
                
                .text-left { text-align: left !important; }
                .text-center { text-align: center !important; }
                .text-right { text-align: right !important; }
                
                .ttd-container { width: 100%; margin-top: 30px; border-collapse: collapse; }
                .ttd-container td { width: 50%; text-align: center; font-size: 9pt; }
            </style></head><body>
                <div class="kop-header">
                    <div style="font-size: 13pt; font-weight: bold;">${config.judul.replace(/\n/g, '<br>')}</div>
                    <div style="font-size: 8pt; font-weight: normal;">${config.subJudul.replace(/\n/g, '<br>')}</div>
                </div>

                <div style="text-align:center; font-weight:bold; text-decoration:underline; font-size:11pt;">REKAPITULASI LOGBOOK BULANAN</div>
                <div style="text-align:center; font-weight:bold; margin-bottom:20px;">PERIODE: ${d.bulanNama.toUpperCase()} ${d.tahun}</div>

                <table class="identity-wrapper">
                    <tr>
                        <td width="45%">
                            <table class="sub-identity">
                                <tr><td width="30%">Nama Pegawai</td><td width="2%">:</td><td>${p.p_nama}</td></tr>
                                <tr><td>NIP</td><td>:</td><td>${p.p_nip}</td></tr>
                                <tr><td>Pangkat/Gol</td><td>:</td><td>${p.p_golongan || '-'}</td></tr>
                            </table>
                        </td>
                        
                        <td width="10%"></td>
                        
                        <td width="45%">
                            <table class="sub-identity">
                                <tr><td width="30%">Unit Kerja</td><td width="2%">:</td><td>${p.p_unit}</td></tr>
                                <tr><td>Instansi</td><td>:</td><td>${p.p_instansi}</td></tr>
                                <tr><td>Jabatan</td><td>:</td><td>${p.p_jabatan}</td></tr>
                            </table>
                        </td>
                    </tr>
                </table>

                ${d.tabelHtml
                    .replace(/style=".*?"/g, '') 
                    .replace('<table', '<table class="main-table" border="1"')
                    .replace(/<td>(.*?)<\/td>/g, (match, content) => {
                        const clean = content.replace(/<[^>]*>?/gm, '').trim();
                        // Jika konten adalah butir kegiatan (panjang), rata kiri. 
                        // Jika angka (tanggal/volume/no), rata tengah.
                        if (clean.length > 5 && isNaN(clean) && clean !== '-') {
                            return `<td class="text-left">${content}</td>`;
                        }
                        return `<td class="text-center">${content}</td>`;
                    })
                }

                <table class="ttd-container">
                    <tr>
                        <td>Mengetahui,<br>${p.a_jabatan}<br><br><br><br><br><b><u>${p.a_nama}</u></b><br>NIP. ${p.a_nip}</td>
                        <td>Magelang, ${new Date(d.tglCetak).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Pegawai Melaporkan,<br><br><br><br><br><b><u>${p.p_nama}</u></b><br>NIP. ${p.p_nip}</td>
                    </tr>
                </table>
            </body></html>`;
    },

    printLaporanBulanan: () => {
        if (!window.lastDataBulanan) return alert("Tampilkan data dahulu!");
        const win = window.open('', '_blank');
        win.document.write(uiRekap.generateFinalHTML());
        win.document.close();
        setTimeout(() => { win.print(); }, 800);
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