// Ambil appointment_id dari URL, contoh: /chat.html?id=3
const params        = new URLSearchParams(window.location.search);
const appointmentId = params.get('id');
const token         = localStorage.getItem('token');
const currentUser   = JSON.parse(localStorage.getItem('user'));

// Muat pesan saat halaman dibuka
loadMessages();

// Auto-refresh pesan setiap 5 detik (polling sederhana)
setInterval(loadMessages, 5000);

async function loadMessages() {
  if (!appointmentId || !token) return;

  try {
    const res  = await fetch(`/api/chat/${appointmentId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();

    if (!res.ok) {
      document.getElementById('chat-box').innerHTML =
        `<p style="color:red;text-align:center">${data.message}</p>`;
      return;
    }

    const box = document.getElementById('chat-box');

    // Simpan posisi scroll sebelum render ulang
    const isAtBottom = box.scrollHeight - box.scrollTop <= box.clientHeight + 10;

    // Render ulang semua pesan
    if (data.messages.length === 0) {
      box.innerHTML = '<p style="color:#aaa;text-align:center;margin:auto">Belum ada pesan.</p>';
      return;
    }

    box.innerHTML = data.messages.map(msg => {
      const isMe = msg.sender_id === currentUser.id;
      const time = new Date(msg.created_at).toLocaleTimeString('id-ID', {
        hour: '2-digit', minute: '2-digit'
      });
      return `
        <div class="bubble ${isMe ? 'me' : 'other'}">
          ${!isMe ? `<div class="sender">${msg.sender_name} · ${msg.sender_role}</div>` : ''}
          ${msg.message}
          <div class="time">${time}</div>
        </div>`;
    }).join('');

    // Auto-scroll ke bawah hanya jika user sudah di posisi paling bawah
    if (isAtBottom) box.scrollTop = box.scrollHeight;

  } catch (err) {
    console.error('Gagal memuat pesan:', err);
  }
}

async function sendMsg() {
  const input   = document.getElementById('msg-input');
  const message = input.value.trim();
  if (!message) return;

  try {
    const res = await fetch('/api/chat/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ appointment_id: appointmentId, message })
    });

    if (res.ok) {
      input.value = '';
      loadMessages(); // langsung refresh setelah kirim
    }

  } catch (err) {
    console.error('Gagal mengirim pesan:', err);
  }
}