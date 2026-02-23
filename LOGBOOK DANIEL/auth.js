/**
 * AUTH.JS - Authentication & Session Manager
 * Optimized for Logbook Pro - Daniel Edition
 */

// 1. TAMPILAN FORM SWITCHER
function toggleAuth(mode) {
    const containers = ['login-container', 'signup-container', 'forgot-container'];
    containers.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    const target = document.getElementById(`${mode}-container`);
    if (target) {
        target.classList.remove('hidden');
        // Animasi masuk (jika diperlukan tambahan class CSS)
        target.style.animation = 'slideUp 0.4s ease-out';
    }
}

// 2. FUNGSI PENDAFTARAN (SIGN UP)
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
            options: {
                emailRedirectTo: window.location.origin
            }
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

// 3. FUNGSI LOGIN
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

        // Login sukses, checkUser akan menangani perpindahan layar
        await checkUser();

    } catch (err) {
        let msg = err.message;
        if(msg === "Invalid login credentials") msg = "Email atau Password salah!";
        Swal.fire('Access Denied', msg, 'error');
    } finally {
        setLoading(btn, false, 'Initialize Session');
    }
}

// 4. FUNGSI LUPA PASSWORD (RECOVERY)
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

// 5. FUNGSI LOGOUT
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

// 6. SESSION MONITOR & UI SYNC
async function checkUser() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    const authSection = document.getElementById('auth-section');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const userDisplay = document.getElementById('user-display');

    if (user) {
        // User Login
        authSection.classList.add('hidden');
        sidebar.classList.remove('hidden');
        mainContent.classList.remove('hidden');
        
        if (userDisplay) userDisplay.innerText = user.email.split('@')[0].toUpperCase();
        
        // Load default page jika konten kosong
        if (!document.getElementById('page-content').innerHTML) {
            showPage('harian');
        }
    } else {
        // User Logout / No Session
        authSection.classList.remove('hidden');
        sidebar.classList.add('hidden');
        mainContent.classList.add('hidden');
    }
}

// --- HELPERS ---
function setLoading(button, isLoading, text) {
    if (button) {
        button.disabled = isLoading;
        button.innerText = text;
        button.style.opacity = isLoading ? "0.7" : "1";
    }
}

// Global Alert menggunakan SweetAlert2 (Opsional, jika tidak pakai bisa ganti alert biasa)
const Swal = window.Swal || { 
    fire: (t, m, i) => { 
        if(t === 'Berhasil!' || i === 'success') alert("✅ " + t + "\n" + m);
        else alert("❌ " + t + "\n" + m);
        return { isConfirmed: true };
    } 
};

// INITIAL RUN
document.addEventListener('DOMContentLoaded', checkUser);