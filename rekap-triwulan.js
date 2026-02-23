/**
 * UI-REKAP-TRIWULAN.JS
 * Fitur: Dropdown Triwulan, Auto-Sync KOP Harian, Analisa Target & Bukti
 */

window.uiRekap = window.uiRekap || {};

Object.assign(window.uiRekap, {
    // 1. RENDER HALAMAN UTAMA TRIWULAN
    renderRekapTriwulan: async () => {
        const container = document.getElementById('page-content');
        const now = new Date();
        const currYear = now.getFullYear();
        const todayStr = now.toISOString().split('T')[0];

        container.innerHTML = `
            <div class="card fade-in" style="max-width: 100%;">
                <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:25px; gap:20px; flex-wrap:wrap;">
                    <div>
                        <h3 style="font-weight:800; margin:0; color:var(--accent);">📊 Rekapitulasi Triwulan</h3>
                        <p style="margin:5px 0 0 0; opacity:0.6; font-size:12px;">Akumulasi data 3 bulanan sesuai pengaturan KOP Harian.</p>
                    </div>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; align-items:flex-end;">
                        <div style="display:flex; gap:8px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">PERIODE:</span>
                            <select id="triwulan-filter" class="auth-input" style="width:150px; margin:0;">
                                <option value="1">Triwulan 1 (Jan-Mar)</option>
                                <option value="2">Triwulan 2 (Apr-Jun)</option>
                                <option value="3">Triwulan 3 (Jul-Sep)</option>
                                <option value="4">Triwulan 4 (Okt-Des)</option>
                            </select>
                            <select id="tahun-triwulan" class="auth-input" style="width:90px; margin:0;">
                                ${[currYear - 1, currYear, currYear + 1].map(y => `<option value="${y}" ${currYear === y ? 'selected' : ''}>${y}</option>`).join('')}
                            </select>
                            <button onclick="uiRekap.prosesTampilkanTriwulan()" class="auth-btn" style="margin:0; width:auto; padding:0 20px; background:var(--accent-gradient);">TAMPILKAN</button>
                        </div>
                        <div style="display:flex; gap:10px; align-items:center;">
                            <span style="font-size:11px; font-weight:700;">TANGGAL SURAT:</span>
                            <input type="date" id="tgl-cetak-triwulan" class="auth-input" style="width:140px; margin:0; font-size:11px;" value="${todayStr}">
                            <button onclick="uiRekap.downloadWordTriwulan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#2b5797; font-size:10px;">
                                <i class="fa-solid fa-file-word"></i> WORD
                            </button>
                            <button onclick="uiRekap.printLaporanTriwulan()" class="auth-btn" style="margin:0; width:auto; padding:8px 12px; background:#e11d48; font-size:10px;">
                                <i class="fa-solid fa-file-pdf"></i> PDF
                            </button>
                        </div>
                    </div>
                </div>

                <div id="rekap-triwulan-container" style="overflow-x:auto; border-radius:12px; border:1px solid var(--border); background:rgba(0,0,0,0.1); min-height:300px;">
                    <p style="text-align:center; padding:100px; opacity:0.5;">Silakan pilih triwulan dan klik Tampilkan Data...</p>
                </div>
            </div>`;
    },

    // 2. LOGIKA PEMROSESAN DATA TRIWULAN
    prosesTampilkanTriwulan: async () => {
        const tw = document.getElementById('triwulan-filter').value;
        const thn = document.getElementById('tahun-triwulan').value;
        const targetDiv = document.getElementById('rekap-triwulan-container');

        // Mapping Bulan berdasarkan Triwulan
        const mapping = {
            "1": { bln: [1, 2, 3], nama: ['Januari', 'Februari', 'Maret'] },
            "2": { bln: [4, 5, 6], nama: ['April', 'Mei', 'Juni'] },
            "3": { bln: [7, 8, 9], nama: ['Juli', 'Agustus', 'September'] },
            "4": { bln: [10, 11, 12], nama: ['Oktober', 'November', 'Desember'] }
        };
        const currentTw = mapping[tw];

        targetDiv.innerHTML = `<div style="text-align:center; padding:100px;"><i class="fa-solid fa-spinner fa-spin"></i> Mengakumulasi Data Triwulan...</div>`;

        try {
            const { data: { user } } = await supabaseClient.auth.getUser();

            const [pResp, kResp, lResp, allResp] = await Promise.all([
                supabaseClient.from('profil_user').select('*').eq('user_id', user.id).single(),
                supabaseClient.from('kamus_kegiatan').select('*').eq('user_id', user.id).order('nama_kegiatan'),
                supabaseClient.from('logbook_harian').select('*').eq('user_id', user.id)
                    .filter('tanggal', 'gte', `${thn}-${String(currentTw.bln[0]).padStart(2, '0')}-01`)
                    .filter('tanggal', 'lte', `${thn}-${String(currentTw.bln[2]).padStart(2, '0')}-31`),
                supabaseClient.from('logbook_harian').select('kegiatan_id, jumlah').eq('user_id', user.id)
            ]);

            const realisasiGlobal = {};
            allResp.data.forEach(item => {
                realisasiGlobal[item.kegiatan_id] = (realisasiGlobal[item.kegiatan_id] || 0) + (item.jumlah || 0);
            });

            // Olah Matrix Triwulan
            const matrix = {};
            kResp.data.forEach(k => {
                matrix[k.id] = { b1: 0, b2: 0, b3: 0, total: 0 };
            });

            lResp.data.forEach(log => {
                const m = parseInt(log.tanggal.split('-')[1]);
                if (matrix[log.kegiatan_id]) {
                    if (m === currentTw.bln[0]) matrix[log.kegiatan_id].b1 += log.jumlah;
                    else if (m === currentTw.bln[1]) matrix[log.kegiatan_id].b2 += log.jumlah;
                    else if (m === currentTw.bln[2]) matrix[log.kegiatan_id].b3 += log.jumlah;
                    matrix[log.kegiatan_id].total += log.jumlah;
                }
            });

            let tableHtml = `
                <table id="table-triwulan-print" style="width:100%; border-collapse:collapse; font-size:11px; color:#fff;">
                    <thead>
                        <tr style="background:var(--input-bg); color:var(--accent);">
                            <th style="padding:10px; border:1px solid var(--border); width:40px;">NO</th>
                            <th style="padding:10px; border:1px solid var(--border); text-align:left;">BUTIR KEGIATAN & ANALISA TARGET</th>
                            <th style="padding:10px; border:1px solid var(--border); width:80px;">${currentTw.nama[0]}</th>
                            <th style="padding:10px; border:1px solid var(--border); width:80px;">${currentTw.nama[1]}</th>
                            <th style="padding:10px; border:1px solid var(--border); width:80px;">${currentTw.nama[2]}</th>
                            <th style="padding:10px; border:1px solid var(--border); width:80px;">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>`;

            kResp.data.forEach((k, idx) => {
                const m = matrix[k.id];
                const target = k.target_tahunan || 0;
                const realGlobal = realisasiGlobal[k.id] || 0;
                const sisa = target - realGlobal;

                tableHtml += `
                    <tr>
                        <td style="border:1px solid var(--border); text-align:center;">${idx + 1}</td>
                        <td style="border:1px solid var(--border); padding:8px;">
                            <div style="font-weight:700; color:var(--accent);">${k.nama_kegiatan}</div>
                            <div style="font-size:9px; opacity:0.7; margin-top:4px; display:flex; gap:8px;">
                                <span>🎯 TGT: ${target}</span> | <span>📈 REAL: ${realGlobal}</span> | 
                                <span style="color:${sisa <= 0 ? '#4ade80' : '#fb7185'}">📉 SISA: ${sisa}</span>
                                ${k.link_bukti_dukung ? ` | <a href="${k.link_bukti_dukung}" target="_blank" style="color:var(--accent);">[BUKTI]</a>` : ''}
                            </div>
                        </td>
                        <td style="border:1px solid var(--border); text-align:center;">${m.b1 || '-'}</td>
                        <td style="border:1px solid var(--border); text-align:center;">${m.b2 || '-'}</td>
                        <td style="border:1px solid var(--border); text-align:center;">${m.b3 || '-'}</td>
                        <td style="border:1px solid var(--border); text-align:center; font-weight:bold; background:rgba(255,255,255,0.05);">${m.total || '-'}</td>
                    </tr>`;
            });

            tableHtml += `</tbody></table>`;
            targetDiv.innerHTML = tableHtml;

            window.lastDataTriwulan = {
                profil: pResp.data,
                twNama: `TRIWULAN ${tw} (${currentTw.nama[0]} - ${currentTw.nama[2]})`,
                tahun: thn,
                tabelHtml: tableHtml,
                tglCetak: document.getElementById('tgl-cetak-triwulan').value
            };

        } catch (err) {
            targetDiv.innerHTML = `<p style="color:red; text-align:center; padding:50px;">Gagal: ${err.message}</p>`;
        }
    },

    // 3. FUNGSI EXPORT & CETAK (MENGGUNAKAN KOP HARIAN)
    generateTriwulanHTML: () => {
        const d = window.lastDataTriwulan;
        const config = uiRekap.kopConfig;
        const p = d.profil;

        return `
            <html><head><style>
                @page { size: Legal landscape; margin: 1.2cm; }
                body { font-family: 'Arial', sans-serif; font-size: 10pt; color:#000; }
                .kop-header { text-align: center; border-bottom: 3pt double #000; padding-bottom: 5px; margin-bottom: 15px; }
                .id-box { margin-bottom: 15px; width: 100%; border-collapse: collapse; }
                .id-box td { font-size: 9pt; font-weight: bold; padding: 2px; }
                table.main { width: 100%; border-collapse: collapse; margin-top:10px; }
                table.main th, table.main td { border: 1pt solid #000; padding: 5px; }
                .ttd-box { margin-top: 30px; width: 100%; }
                .ttd-box td { text-align: center; width: 50%; }
            </style></head><body>
                <div class="kop-header">
                    <div style="font-size: 14pt; font-weight: bold;">${config.judul.replace(/\n/g, '<br>')}</div>
                    <div style="font-size: 9pt;">${config.subJudul.replace(/\n/g, '<br>')}</div>
                </div>
                <div style="text-align:center; font-weight:bold; text-decoration:underline; font-size:12pt;">LAPORAN REKAPITULASI TRIWULAN</div>
                <div style="text-align:center; font-weight:bold; margin-bottom:20px;">Periode: ${d.twNama} ${d.tahun}</div>

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

    printLaporanTriwulan: () => {
        if (!window.lastDataTriwulan) return alert("Tampilkan data dahulu!");
        const win = window.open('', '_blank');
        win.document.write(uiRekap.generateTriwulanHTML());
        win.document.close();
        setTimeout(() => win.print(), 500);
    },

    downloadWordTriwulan: () => {
        if (!window.lastDataTriwulan) return alert("Tampilkan data dahulu!");
        const blob = new Blob(['\ufeff', uiRekap.generateTriwulanHTML()], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Rekap_Triwulan_${window.lastDataTriwulan.tahun}.doc`;
        a.click();
    }
});