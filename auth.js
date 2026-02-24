/**
 * AUTH.JS - Authentication & Session Manager
 * Optimized for Logbook Pro - Daniel Edition (Mobile Sync V3.8)
 * Update: Modern Logo UI Injector
 */

// 1. DYNAMIC LOGO INJECTOR (Ganti logo D dengan UI Modern)
function injectModernLogo() {
    const authContainers = ['login-container', 'signup-container', 'forgot-container'];
    
    // HTML Logo baru yang keren (CSS Gradient + Icon)
    const modernLogoHTML = `
        <div class="modern-logo-wrapper">
            <div class="logo-icon-circle">
                <i class="fa-solid fa-book-medical"></i>
            </div>
            <div class="logo-text-brand">
                <span class="brand-log">LOG</span><span class="brand-book">BOOK</span>
                <div class="brand-tagline">PROFESSIONAL SYSTEM</div>
            </div>
        </div>
        <style>
            .modern-logo-wrapper {
                display: flex;
                flex-direction: column;
                align-items: center;
                margin-bottom: 30px;
                animation: fadeInDown 0.8s ease;
            }
            .logo-icon-circle {
                width: 80px;
                height: 80px;
                background: linear-gradient(135deg, var(--accent) 0%, #3b82f6 100%);
                border-radius: 22px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 40px;
                color: white;
                box-shadow: 0 10px 25px rgba(59, 130, 246, 0.4);
                transform: rotate(-5deg);
                margin-bottom: 15px;
                border: 3px solid rgba(255,255,255,0.1);
            }
            .logo-text-brand {
                text-align: center;
                letter-spacing: 1px;
            }
            .brand-log { font-weight: 800; font-size: 24px; color: var(--accent); }
            .brand-book { font-weight: 300; font-size: 24px; color: #fff; opacity: 0.9; }
            .brand-tagline { 
                font-size: 10px; 
                font-weight: 700; 
                opacity: 0.5; 
                color: #fff; 
                text-transform: uppercase;
                margin-top: -5px;
            }
            @keyframes fadeInDown {
                from { opacity: 0; transform: translateY(-20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            /* Sembunyikan logo lama berinisial D */
            .auth-header h1, .old-logo { display: none !important; }
        </style>
    `;

    authContainers.forEach(id => {
        const container = document.getElementById(id);
        if (container && !container.querySelector('.modern-logo-wrapper')) {
            container.insertAdjacentHTML('afterbegin', modernLogoHTML);
        }
    });
}

// 2. TAMPILAN FORM SWITCHER
function toggleAuth(mode) {
    const containers = ['login-container', 'signup-container', 'forgot-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`${mode}-container`);
    if (target) {
        target.classList.remove('hidden');
        target.style.animation = 'slideUp 0.4s ease-out';
        injectModernLogo(); // Pastikan logo muncul saat pindah tab
    }
}

// 3. FUNGSI PENDAFTARAN (SIGN UP)
async function handleSignUp() {
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    const btn = document.querySelector('#signup-container .auth-btn');

    if (!email || !password) {
        return Swal.fire('Peringatan', 'Email dan Password wajib diisi!', 'warning');
    }

    if (password.length < 6) {
        return Swal.fire('Keamanan', 'Password minimal harus 6 karakter!', 'info');
    }

    try {
        setLoading(btn, true, 'Mendaftarkan...');
        
        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: { emailRedirectTo: window.location.origin }
        });

        if (error) throw error;

        Swal.fire({
            title: 'Berhasil!',
            text: 'Cek email Anda (Inbox/Spam) untuk verifikasi akun.',
            icon: 'success'
        });
        toggleAuth('login');

    } catch (err) {
        Swal.fire('Gagal Daftar', err.message, 'error');
    } finally {
        setLoading(btn, false, 'Confirm Register');
    }
}

// 4. FUNGSI LOGIN
async function handleLogin() {
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    const btn = document.querySelector('#login-container .auth-btn');

    if (!email || !password) return;

    try {
        setLoading(btn, true, 'Authenticating...');
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) throw error;
        await checkUser();

    } catch (err) {
        let msg = err.message;
        if(msg === "Invalid login credentials") msg = "Email atau Password salah!";
        Swal.fire('Access Denied', msg, 'error');
    } finally {
        setLoading(btn, false, 'Initialize Session');
    }
}

// 5. FUNGSI LUPA PASSWORD
async function handleForgotPassword() {
    const email = document.getElementById('forgot-email').value;
    const btn = document.querySelector('#forgot-container .auth-btn');

    if (!email) return Swal.fire('Info', 'Masukkan email Anda!', 'question');

    try {
        setLoading(btn, true, 'Sending Link...');
        const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin,
        });

        if (error) throw error;
        Swal.fire('Email Dikirim', 'Instruksi reset password telah dikirim ke email Anda.', 'success');
        toggleAuth('login');
    } catch (err) {
        Swal.fire('Error', err.message, 'error');
    } finally {
        setLoading(btn, false, 'Request Link');
    }
}

// 6. FUNGSI LOGOUT
async function handleLogout() {
    const confirm = await Swal.fire({
        title: 'Terminate Session?',
        text: "Anda harus login kembali untuk mengakses data.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f87171',
        confirmButtonText: 'Yes, Logout'
    });

    if (confirm.isConfirmed) {
        await supabaseClient.auth.signOut();
        window.location.reload();
    }
}

// 7. SESSION MONITOR & UI SYNC
async function checkUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    const authSection = document.getElementById('auth-section');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const userDisplay = document.getElementById('user-display');
    const burger = document.querySelector('.burger-menu');
    const overlay = document.getElementById('sidebar-overlay');

    if (user) {
        authSection.classList.add('hidden');
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
        if (burger) burger.style.display = 'flex';
        if (userDisplay) userDisplay.innerText = user.email.split('@')[0].toUpperCase();
        if (!document.getElementById('page-content').innerHTML) {
            showPage('profil');
        }
    } else {
        authSection.classList.remove('hidden');
        sidebar.classList.add('hidden');
        mainContent.classList.add('hidden');
        if (burger) burger.style.display = 'none';
        if (overlay) overlay.style.display = 'none';
        if (sidebar) sidebar.classList.remove('active');
        injectModernLogo(); // Jalankan Logo saat di halaman Auth
    }
}

// --- HELPERS ---
function setLoading(button, isLoading, text) {
    if (button) {
        button.disabled = isLoading;
        button.innerHTML = isLoading ? `<i class="fas fa-spinner fa-spin"></i>` : text;
        button.style.opacity = isLoading ? "0.7" : "1";
    }
}

const Swal = window.Swal || { 
    fire: (t, m, i) => { 
        alert((i === 'success' ? "✅ " : "❌ ") + t + "\n" + m);
        return { isConfirmed: true };
    } 
};

document.addEventListener('DOMContentLoaded', () => {
    checkUser();
    injectModernLogo();
});