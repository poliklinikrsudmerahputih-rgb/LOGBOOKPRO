/**
 * UI-ASSETS.JS - PROFESSIONAL ASSETS & MODAL ENGINE
 * Optimized for Theme System, Rekapitulasi & Mobile Responsive
 */

const injectCSS = () => {
    if (document.getElementById('modal-pro-style')) return;
    const style = document.createElement('style');
    style.id = 'modal-pro-style';
    style.innerHTML = `
        .modal-overlay { 
            position: fixed; inset: 0; 
            background: var(--modal-overlay);
            backdrop-filter: blur(15px); z-index: 9999; 
            display: none; align-items: center; justify-content: center; 
            padding: 20px; 
            transition: opacity 0.3s ease;
        }
        .modal-content { 
            background: var(--card-bg);
            width: 100%; 
            max-width: 600px; 
            border-radius: 28px; 
            border: 1px solid var(--border); 
            animation: modalAnim 0.3s cubic-bezier(0.16, 1, 0.3, 1); 
            overflow: hidden; 
            box-shadow: var(--shadow);
            display: flex;
            flex-direction: column;
        }
        .modal-header { 
            padding: 20px 25px; 
            border-bottom: 1px solid var(--border); 
            display: flex; justify-content: space-between; align-items: center; 
        }
        .modal-header h3 { margin: 0; font-size: 18px; font-weight: 800; color: var(--accent); }
        
        .modal-body { 
            padding: 25px; 
            max-height: 70vh; 
            overflow-y: auto; 
            color: var(--table-text) !important;
        }
        .modal-footer { 
            padding: 15px 25px; 
            border-top: 1px solid var(--border); 
            display: flex; justify-content: flex-end; gap: 10px;
            background: rgba(0,0,0,0.05);
        }
        .modal-label { 
            font-size: 10px; font-weight: 800; color: var(--accent); 
            display: block; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;
        }

        /* Penyesuaian Mobile */
        @media (max-width: 768px) {
            .modal-overlay { padding: 10px; }
            .modal-content { 
                border-radius: 20px; 
                max-height: 95vh;
            }
            .modal-header { padding: 15px 20px; }
            .modal-body { padding: 20px; }
            .modal-footer { padding: 12px 20px; }
            
            /* Membuat input di dalam modal lebih besar di HP agar mudah diklik */
            .modal-body input, .modal-body select, .modal-body textarea {
                font-size: 16px !important; 
            }
        }

        .close-btn { 
            font-size: 20px; cursor: pointer; color: var(--text-body); 
            transition: 0.2s; width: 32px; height: 32px; 
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%;
        }
        .close-btn:hover { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        
        @keyframes modalAnim { 
            from { transform: translateY(20px) scale(0.98); opacity: 0; } 
            to { transform: translateY(0) scale(1); opacity: 1; } 
        }

        .modal-body::-webkit-scrollbar { width: 4px; }
        .modal-body::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
    `;
    document.head.appendChild(style);
};

// Fungsi Global untuk memanggil modal secara profesional
const uiAsset = {
    /**
     * @param {string} title - Judul Modal
     * @param {string} contentHTML - Isi Konten (HTML String)
     * @param {string} modalId - ID unik modal (default: 'global-modal')
     */
    openModal: (title, contentHTML, modalId = 'global-modal') => {
        // Hapus modal lama jika ada
        const oldModal = document.getElementById(modalId);
        if (oldModal) oldModal.remove();

        // Buat struktur Modal Baru
        const modalMarkup = `
            <div id="${modalId}" class="modal-overlay" onclick="if(event.target === this) uiAsset.closeModal('${modalId}')">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${title}</h3>
                        <div class="close-btn" onclick="uiAsset.closeModal('${modalId}')">
                            <i class="fa-solid fa-xmark"></i>
                        </div>
                    </div>
                    <div class="modal-body">
                        ${contentHTML}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalMarkup);
        const modal = document.getElementById(modalId);
        modal.style.display = 'flex';
        
        // Lock body scroll
        document.body.style.overflow = 'hidden';
    },

    closeModal: (modalId = 'global-modal') => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.opacity = '0';
            setTimeout(() => {
                modal.remove();
                // Unlock body scroll jika tidak ada modal lain yang terbuka
                if (!document.querySelector('.modal-overlay')) {
                    document.body.style.overflow = 'auto';
                }
            }, 300);
        }
    }
};

// Inisialisasi CSS saat file dimuat
injectCSS();