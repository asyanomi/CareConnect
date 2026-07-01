// Fungsi untuk pindah tab Login / Register
function showTab(tab) {
  document.getElementById('login-form').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('register-form').style.display = tab === 'register' ? 'block' : 'none';

  document.querySelectorAll('.tab-btn').forEach((btn, i) => {
    btn.classList.toggle('active', (tab === 'login' && i === 0) || (tab === 'register' && i === 1));
  });
}

// Fungsi Login
async function handleLogin() {
  const email    = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const msgEl    = document.getElementById('login-msg');

  try {
    const res  = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (res.ok) {
      // Simpan token dan data user ke localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('currentUser', JSON.stringify(data.user));
      msgEl.className = 'msg success';
      msgEl.textContent = `Selamat datang, ${data.user.name}! Mengalihkan...`;

      // Arahkan ke dashboard sesuai role
      setTimeout(() => {
        if (data.user.role === 'admin') {
          window.location.href = '/dashboard-admin.html';
        } else if (data.user.role === 'doctor') {
          window.location.href = '/dashboard-doctor.html';
        } else {
          window.location.href = '/dashboard-patient.html';
        }
      }, 1500);

    } else {
      msgEl.className = 'msg error';
      msgEl.textContent = data.message;
    }

  } catch (err) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'Gagal terhubung ke server.';
  }
}

// Fungsi Register
async function handleRegister() {
  const name     = document.getElementById('reg-name').value;
  const email    = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const role     = document.getElementById('reg-role').value;
  const msgEl    = document.getElementById('reg-msg');

  try {
    const res  = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    const data = await res.json();

    if (res.ok) {
      msgEl.className = 'msg success';
      msgEl.textContent = data.message + ' Silakan login.';
      setTimeout(() => showTab('login'), 1500);
    } else {
      msgEl.className = 'msg error';
      msgEl.textContent = data.message;
    }

  } catch (err) {
    msgEl.className = 'msg error';
    msgEl.textContent = 'Gagal terhubung ke server.';
  }
}