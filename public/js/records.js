const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user'));

if (!token || !user) window.location.href = './index.html';

// Tampilkan form tambah rekam medis hanya jika user adalah dokter
if (user.role === 'doctor') {
  document.getElementById('doctor-form').style.display = 'block';
}

loadRecords();

async function loadRecords() {
  const el = document.getElementById('records-list');
  try {
    // Endpoint berbeda tergantung role pengguna
    const url = user.role === 'patient' ? '/api/records/my' : null;
    if (!url) {
      el.innerHTML = '<p style="color:#aaa">Gunakan form di atas untuk mengelola rekam medis pasien.</p>';
      return;
    }

    const res  = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || data.records.length === 0) {
      el.innerHTML = '<p style="color:#aaa">Belum ada rekam medis.</p>';
      return;
    }

    el.innerHTML = data.records.map(r => {
      const date = new Date(r.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric'
      });
      return `
        <div class="record-item">
          <div class="meta">${date} · Dokter: <strong>${r.doctor_name}</strong> (${r.specialization})</div>
          <p><strong>Diagnosis:</strong> ${r.diagnosis}</p>
          ${r.prescription ? `<p><strong>Resep:</strong> ${r.prescription}</p>` : ''}
          ${r.file_path
            ? `<button class="download-btn" onclick="downloadFile(${r.id})">⬇ Unduh Dokumen</button>`
            : ''}
        </div>`;
    }).join('');

  } catch (err) {
    el.innerHTML = '<p style="color:red">Gagal memuat rekam medis.</p>';
  }
}

async function submitRecord() {
  const msgEl = document.getElementById('rec-msg');

  // Gunakan FormData karena request ini mengandung file upload
  // FormData otomatis mengatur Content-Type menjadi multipart/form-data
  const formData = new FormData();
  formData.append('patient_id',   document.getElementById('rec-patient-id').value);
  formData.append('diagnosis',    document.getElementById('rec-diagnosis').value);
  formData.append('prescription', document.getElementById('rec-prescription').value);

  const fileInput = document.getElementById('rec-file');
  if (fileInput.files[0]) {
    formData.append('file', fileInput.files[0]);
  }

  try {
    // Saat menggunakan FormData, JANGAN set Content-Type secara manual
    // Browser akan mengisinya otomatis beserta boundary yang dibutuhkan
    const res  = await fetch('/api/records', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });
    const data = await res.json();

    msgEl.className   = res.ok ? 'msg success' : 'msg error';
    msgEl.textContent = data.message;

  } catch (err) {
    msgEl.className   = 'msg error';
    msgEl.textContent = 'Gagal menghubungi server.';
  }
}

async function downloadFile(recordId) {
  // Buka URL download di tab baru
  // Browser akan menangani dialog simpan file secara otomatis
  window.open(`/api/records/download/${recordId}?token=${token}`, '_blank');
}