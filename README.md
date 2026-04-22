# ⚡ LifeSync AI – To-Do List

Aplikasi manajemen tugas berbasis web, bagian dari proyek **LifeSync AI**.

---

## 🚀 Cara Menjalankan di VS Code

### Metode 1 – Live Server (Rekomendasi)
1. Buka folder ini di **Visual Studio Code**
2. Install extension **Live Server** (Ritwick Dey)
   - Tekan `Ctrl+Shift+X` → cari "Live Server" → Install
3. Klik kanan `index.html` → pilih **"Open with Live Server"**
4. Browser akan otomatis terbuka di `http://127.0.0.1:5500`

### Metode 2 – Debugger Chrome
1. Install extension **Debugger for Chrome** (atau gunakan built-in pada VS Code terbaru)
2. Tekan `F5` atau buka menu **Run > Start Debugging**
3. Pilih konfigurasi **"🚀 Launch LifeSync AI"**

### Metode 3 – Buka Langsung
- Klik dua kali `index.html` untuk membuka langsung di browser
- Semua fitur berjalan tanpa server (pure HTML/CSS/JS)

---

## 📁 Struktur File

```
lifesync-todo/
├── index.html          ← Halaman utama
├── style.css           ← Semua styling (dark/light mode)
├── app.js              ← Logic aplikasi (CRUD, filter, storage)
├── README.md           ← Panduan ini
└── .vscode/
    ├── launch.json     ← Konfigurasi debug Chrome/Edge
    └── extensions.json ← Rekomendasi extension
```

---

## ✨ Fitur Aplikasi

| Fitur | Keterangan |
|-------|-----------|
| ✅ Tambah Task | Form lengkap: judul, deskripsi, prioritas, area, deadline |
| ✏️ Edit Task | Ubah semua detail task |
| 🗑️ Hapus Task | Konfirmasi sebelum hapus |
| ✓ Tandai Selesai | Toggle status selesai/belum |
| 🔍 Cari Task | Real-time search |
| 🗂️ Filter | Semua / Hari Ini / Belum Selesai / Selesai |
| 🌈 Life Areas | Karir, Kesehatan, Belajar, Personal |
| ⇅ Sortir | Berdasarkan: Terbaru / Deadline / Prioritas |
| ◑ Dark/Light Mode | Toggle tema, tersimpan di localStorage |
| 💾 Persistensi Data | Data tersimpan di localStorage browser |
| 📊 Progress Ring | Persentase task selesai hari ini |
| 🏷️ Badge Overdue | Penanda tugas yang sudah lewat deadline |

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Aksi |
|----------|------|
| `Ctrl + N` | Tambah task baru |
| `Ctrl + K` | Fokus ke kotak pencarian |
| `ESC` | Tutup modal |
| `Enter` (di form) | Simpan task |

---

## 🛠️ Teknologi

- **HTML5** – Struktur halaman
- **CSS3** – Styling + animasi + dark/light mode (CSS Variables)
- **Vanilla JavaScript** – Logic CRUD + localStorage
- **Google Fonts** – Syne + DM Sans
- **Tanpa Framework** – Zero dependencies!

---

## 💡 Tips

- Data tersimpan otomatis di browser (localStorage)
- Untuk reset data: buka DevTools (`F12`) → Application → localStorage → hapus key `lifesync_tasks`
- Aplikasi sudah responsive untuk mobile
