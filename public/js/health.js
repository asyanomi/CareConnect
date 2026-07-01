const token = localStorage.getItem('token');

// Set tanggal hari ini default
const dateInput = document.getElementById('log_date');
if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
}

// Muat riwayat
loadLogs();

// FUNGSI UTAMA
async function submitLog() {
    const msgEl = document.getElementById('form-msg');
    
    // Ambil nilai dari input HTML
    const payload = {
        weight:         document.getElementById('weight').value,
        height:         document.getElementById('height').value,
        blood_pressure: document.getElementById('blood_pressure').value,
        calories:       document.getElementById('calories').value,
        log_date:       document.getElementById('log_date').value,
        notes:          document.getElementById('notes').value,
    };

    if (!payload.log_date) {
        msgEl.textContent = 'Tanggal wajib diisi.';
        return;
    }

    try {
        const res = await fetch('/api/health', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok) {
            msgEl.style.color = 'green';
            msgEl.textContent = data.message;
            
            // Tampilkan hasil BMI
            if (data.bmi) {
                document.getElementById('bmi-value').textContent = `BMI: ${data.bmi}`;
                document.getElementById('bmi-cat').textContent = `Kategori: ${data.bmi_category}`;
                document.getElementById('bmi-result').classList.add('show');
            }
            loadLogs(); 
        } else {
            msgEl.style.color = 'red';
            msgEl.textContent = data.message || 'Gagal menyimpan.';
        }
    } catch (err) {
        console.error('Error:', err);
    }
}

async function loadLogs() {
    try {
        const res = await fetch('/api/health/all', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        const container = document.getElementById('log-table');

        if (!data.logs || data.logs.length === 0) {
            container.innerHTML = '<p>Belum ada data.</p>';
            return;
        }

        container.innerHTML = `<table>
            <thead><tr><th>Tanggal</th><th>BB</th><th>TB</th><th>BMI</th><th>Aksi</th></tr></thead>
            <tbody>
                ${data.logs.map(log => `<tr>
                    <td>${log.log_date}</td>
                    <td>${log.weight}</td>
                    <td>${log.height}</td>
                    <td>${log.bmi}</td>
                    <td><button onclick="deleteLog(${log.id})">Hapus</button></td>
                </tr>`).join('')}
            </tbody>
        </table>`;
    } catch (err) { console.error(err); }
}

async function deleteLog(id) {
    await fetch(`/api/health/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
    loadLogs();
}