const token = localStorage.getItem('token');
const user  = JSON.parse(localStorage.getItem('user'));

// Redirect ke login jika belum punya token
if (!token || !user) window.location.href = './index.html';

// Tampilkan sapaan personal
const greeting = document.getElementById("greeting");

if (greeting) {
    greeting.textContent =
        `Selamat datang, ${user.name}. Berikut ringkasan kesehatan Anda hari ini.`;
}
// Jalankan semua fungsi saat halaman dimuat
loadLatestHealth();
loadCharts();
loadAppointments();

// ─── 1. METRIC CARDS ─────────────────────────────────────────────
async function loadLatestHealth() {
  try {
    const res  = await fetch('/api/health/latest', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 404) return; // belum ada data, biarkan tampil '–'
    const data = await res.json();
    const log  = data.log;

    document.getElementById('m-weight').textContent = log.weight   ?? '–';
    document.getElementById('m-height').textContent = log.height   ?? '–';
    document.getElementById('m-bp').textContent     = log.blood_pressure ?? '–';
    document.getElementById('m-cal').textContent    = log.calories ?? '–';

    if (log.bmi) {
      const bmiEl  = document.getElementById('m-bmi');
      const catEl  = document.getElementById('m-bmi-cat');
      bmiEl.textContent = log.bmi;
      catEl.textContent = log.bmi_category;

      // Warnai nilai BMI sesuai kategori WHO
      const cls = `bmi-${log.bmi_category?.toLowerCase()}`;
      bmiEl.className = `value ${cls}`;
    }

  } catch (err) {
    console.error('Gagal memuat data kesehatan terbaru:', err);
  }
}

// ─── 2. GRAFIK CHART.JS ──────────────────────────────────────────
async function loadCharts() {
  try {
    const res  = await fetch('/api/health/chart', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok || !data.labels || data.labels.length === 0) return;

    // Konfigurasi umum yang dipakai oleh semua grafik
    // untuk menjaga konsistensi tampilan
    const commonOptions = {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: '#f0f0f0' }, beginAtZero: false }
      }
    };

    // Grafik 1 — Berat Badan (line chart)
    new Chart(document.getElementById('chartWeight'), {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.weightData,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,0.08)',
          tension: 0.4,         // kurva halus, bukan garis patah
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#2e7d32',
          spanGaps: true        // lewati nilai null di grafik
        }]
      },
      options: commonOptions
    });

    // Grafik 2 — BMI (line chart dengan garis referensi)
    new Chart(document.getElementById('chartBMI'), {
      type: 'line',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.bmiData,
          borderColor: '#1565c0',
          backgroundColor: 'rgba(21,101,192,0.08)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointBackgroundColor: '#1565c0',
          spanGaps: true
        }]
      },
      options: {
        ...commonOptions,
        plugins: {
          legend: { display: false },
          // Garis referensi BMI normal (18.5 – 24.9) ditampilkan sebagai tooltip info
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => {
                const v = ctx.parsed.y;
                if (v < 18.5)      return '⚠ Underweight';
                else if (v < 25)   return '✓ Normal';
                else if (v < 30)   return '⚠ Overweight';
                else               return '⚠ Obesitas';
              }
            }
          }
        }
      }
    });

    // Grafik 3 — Kalori Harian (bar chart)
    new Chart(document.getElementById('chartCalories'), {
      type: 'bar',
      data: {
        labels: data.labels,
        datasets: [{
          data: data.caloriesData,
          backgroundColor: 'rgba(239,108,0,0.7)',
          borderRadius: 6,
          spanGaps: true
        }]
      },
      options: {
        ...commonOptions,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: '#f0f0f0' }, beginAtZero: true }
        }
      }
    });

  } catch (err) {
    console.error('Gagal memuat data grafik:', err);
  }
}

// ─── 3. DAFTAR APPOINTMENT ───────────────────────────────────────
async function loadAppointments() {

    console.log("loadAppointments dipanggil");

    const el = document.getElementById("appt-list");

    try {

        console.log("Token:", token);

        const res = await fetch("/api/appointments/my",{
            headers:{
                Authorization:`Bearer ${token}`
            }
        });

        console.log("Status:", res.status);

        const data = await res.json();

        console.log("Response:", data);

        if(!res.ok){

            el.innerHTML=`<p>${data.message}</p>`;
            return;

        }

        if(data.appointments.length===0){

            el.innerHTML=
            "<p>Belum ada jadwal konsultasi.</p>";

            return;

        }

        el.innerHTML="";

        data.appointments.forEach(a=>{

            el.innerHTML+=`

            <div class="appt-item">

                <div>

                    <strong>Dr. ${a.doctor_name}</strong>

                    <br>

                    📅 ${a.date}

                    <br>

                    🕒 ${a.time}

                    <br>

                    Status :
                    <b>${a.status}</b>

                </div>

            </div>

            <hr>

            `;

        });

    }catch(err){

        console.error(err);

        el.innerHTML="<p>Gagal memuat jadwal.</p>";

    }

}
async function hapusAppointment(index){

    let appointments =
        JSON.parse(localStorage.getItem("appointmentBookings")) || [];

    const user =
        JSON.parse(localStorage.getItem("currentUser"));

    const myAppointments =
        appointments.filter(a =>
            a.patientName === user.name
        );

    const bookingYangDihapus =
        myAppointments[index];

    appointments = appointments.filter(a =>
        !(a.patientName === bookingYangDihapus.patientName &&
          a.doctorName === bookingYangDihapus.doctorName &&
          a.date === bookingYangDihapus.date &&
          a.time === bookingYangDihapus.time)
    );

    localStorage.setItem(
        "appointmentBookings",
        JSON.stringify(appointments)
    );
  }

// ─── 4. SISTEM NOTIFIKASI ────────────────────────────────────────
loadNotifications();

// Auto-refresh notifikasi setiap 60 detik
setInterval(loadNotifications, 60000);

async function loadNotifications() {
  try {
    const res  = await fetch('/api/notifications', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    // Tampilkan badge hanya jika ada notifikasi belum dibaca
    const badge = document.getElementById('notif-badge');
    if (data.unreadCount > 0) {
      badge.style.display  = 'inline';
      badge.textContent    = data.unreadCount;
    } else {
      badge.style.display  = 'none';
    }

    // Render daftar notifikasi di dalam panel
    const list = document.getElementById('notif-list');
    if (data.notifications.length === 0) {
      list.innerHTML = '<p style="text-align:center;color:#aaa;padding:1rem;font-size:0.85rem">Tidak ada notifikasi.</p>';
      return;
    }

    list.innerHTML = data.notifications.map(n => `
      <div onclick="readNotif(${n.id}, this)" style="
        padding:10px 14px; cursor:pointer; font-size:0.85rem;
        background:${n.is_read ? 'white' : '#f1f8e9'};
        border-bottom:1px solid #f5f5f5; transition:background 0.2s">
        <div style="font-weight:600; margin-bottom:3px">${n.title}</div>
        <div style="color:#555; line-height:1.4">${n.message}</div>
        <div style="color:#aaa; font-size:0.75rem; margin-top:4px">
          ${new Date(n.created_at).toLocaleString('id-ID')}
        </div>
      </div>`
    ).join('');

  } catch (err) {
    console.error('Gagal memuat notifikasi:', err);
  }
}

async function readNotif(id, el) {
  // Tandai sebagai dibaca dan ubah background secara visual
  el.style.background = 'white';
  await fetch(`/api/notifications/read/${id}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  loadNotifications();
}

async function markAllRead() {
  await fetch('/api/notifications/read-all', {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  loadNotifications();
}

function toggleNotifPanel() {
  const panel = document.getElementById('notif-panel');
  panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
}

// Tutup panel notifikasi jika klik di luar area panel
document.addEventListener('click', (e) => {
  const btn   = document.getElementById('notif-btn');
  const panel = document.getElementById('notif-panel');
  if (!btn.contains(e.target) && !panel.contains(e.target)) {
    panel.style.display = 'none';
  }
});

function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/index.html';
}