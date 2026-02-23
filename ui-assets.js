/**
 * UI-ASSETS.JS - PROFESSIONAL ASSETS & MODAL ENGINE
 * Optimized for Theme System & Rekapitulasi
 */

const injectCSS = () => {
    if (document.getElementById('modal-pro-style')) return;
    const style = document.createElement('style');
    style.id = 'modal-pro-style';
    style.innerHTML = `
        .modal-overlay { 
            position: fixed; inset: 0; 
            background: var(--modal-overlay); /* Mengikuti variabel CSS */
            backdrop-filter: blur(15px); z-index: 9999; 
            display: none; align-items: center; justify-content: center; padding: 20px; 
        }
        .modal-content { 
            background: var(--card-bg); /* Mengikuti tema Cyber/Light/OLED */
            width: 100%; max-width: 600px; /* Lebar maksimal diperbaiki */
            border-radius: 32px; border: 1px solid var(--border); 
            animation: modalAnim 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
            overflow: hidden; 
            box-shadow: var(--shadow);
        }
        .modal-header { 
            padding: 25px 35px; border-bottom: 1px solid var(--border); 
            display: flex; justify-content: space-between; align-items: center; 
        }
        .modal-body { 
            padding: 30px 35px; max-height: 75vh; overflow-y: auto; 
            color: var(--table-text) !important;
        }
        .modal-footer { 
            padding: 20px 35px; border-top: 1px solid var(--border); 
            display: flex; justify-content: flex-end; gap: 10px;
        }
        .modal-label { 
            font-size: 10px; font-weight: 800; color: var(--accent); 
            display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
        }
        .close-btn { 
            font-size: 24px; cursor: pointer; color: var(--text-body); 
            transition: 0.2s;
        }
        .close-btn:hover { color: #ef4444; transform: rotate(90deg); }
        
        @keyframes modalAnim { 
            from { transform: translateY(30px); opacity: 0; } 
            to { transform: translateY(0); opacity: 1; } 
        }

        /* Styling Scrollbar di dalam Modal */
        .modal-body::-webkit-scrollbar { width: 6px; }
        .modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    `;
    document.head.appendChild(style);
};

// Fungsi Global untuk memanggil modal secara profesional
const uiAsset = {
    openModal: (title, contentHTML) => {
        // Implementasi logika buka modal akan diletakkan di sini
    },
    closeModal: () => {
        const overlay = document.querySelector('.modal-overlay');
        if (overlay) overlay.style.display = 'none';
    }
};

injectCSS();