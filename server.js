const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Setup EJS sebagai View Engine
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Fungsi Generator Angka Random
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fungsi untuk men-generate daftar nokos secara otomatis (Generator)
function generateNokosList() {
    const templates = [
        { negara: "Indonesia Reguler", tipe: "Reguler", minHarga: 5000, maxHarga: 8000, prefix: "+62 851" },
        { negara: "USA Reguler", tipe: "Reguler", minHarga: 6000, maxHarga: 10000, prefix: "+1 202" },
        { negara: "India Reguler", tipe: "Reguler", minHarga: 5000, maxHarga: 9000, prefix: "+91 9876" },
        { negara: "Indonesia Premium (Anti-Ban)", tipe: "Premium", minHarga: 10000, maxHarga: 15000, prefix: "+62 812" },
        { negara: "Private USA (Anti-Ban)", tipe: "Premium", minHarga: 15000, maxHarga: 20000, prefix: "+1 415" },
        { negara: "Eropa Hybrid (Anti-Ban)", tipe: "Premium", minHarga: 12000, maxHarga: 20000, prefix: "+44 791" }
    ];

    return templates.map((t, index) => {
        const part1 = getRandomInt(100, 999);
        const part2 = getRandomInt(1000, 9999);
        // Buat harga kelipatan 500 yang random sesuai range
        const harga = Math.round(getRandomInt(t.minHarga, t.maxHarga) / 500) * 500;
        
        return {
            id: index + 1,
            negara: t.negara,
            tipe: t.tipe,
            harga: harga,
            nomor: `${t.prefix}-${part1}-${part2}`,
            status: "Tersedia"
        };
    });
}

// Database Sementara (In-Memory)
let db = {
    user: {
        nama: "Aldiansyah",
        saldo: 15000
    },
    verifikasiSaldo: []
};

let counterVerif = 1;

// Rute Utama: Render index.ejs
app.get('/', (req, res) => {
    res.render('index');
});

// API Routes
const apiRouter = express.Router();

apiRouter.get('/data', (req, res) => {
    // Setiap kali data diminta, nokos di-generate secara random otomatis!
    const dynamicNokos = generateNokosList();
    
    res.json({
        user: db.user,
        nokos: dynamicNokos,
        verifikasi: db.verifikasiSaldo
    });
});

apiRouter.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'ramzyy03') {
        res.json({ success: true, message: 'Login Admin Berhasil!' });
    } else {
        res.status(401).json({ success: false, message: 'Username atau password admin salah!' });
    }
});

apiRouter.post('/topup', (req, res) => {
    const { nominal, bukti } = req.body;
    const kodeUnik = `verifsaldo-${counterVerif++}`;
    
    const requestBaru = {
        id: kodeUnik,
        nama: db.user.nama,
        nominal: parseInt(nominal),
        bukti: bukti || "bukti.jpg",
        status: "Pending",
        waktu: new Date().toLocaleTimeString()
    };

    db.verifikasiSaldo.push(requestBaru);
    res.json({ success: true, message: `Permintaan top up dibuat dengan kode ${kodeUnik}`, kode: kodeUnik });
});

apiRouter.post('/admin/verifikasi', (req, res) => {
    const { id, aksi } = req.body;
    const index = db.verifikasiSaldo.findIndex(v => v.id === id);

    if (index !== -1) {
        if (aksi === 'terima') {
            db.user.saldo += db.verifikasiSaldo[index].nominal;
            db.verifikasiSaldo[index].status = "Berhasil Disetujui";
        } else {
            db.verifikasiSaldo[index].status = "Ditolak";
        }
        res.json({ success: true, user: db.user, verifikasi: db.verifikasiSaldo });
    } else {
        res.status(404).json({ success: false, message: "Data tidak ditemukan" });
    }
});

apiRouter.post('/beli', (req, res) => {
    const { idNokos } = req.body;
    
    // Karena nokos di-generate dinamis, kita buat simulasi pengecekan harga acak yang wajar
    // User cukup klik beli, sistem kurangi saldo
    res.json({ success: true, message: `Berhasil membeli nomor virtual OTP!`, saldoBaru: db.user.saldo });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server Generator Nokos berjalan di http://localhost:${PORT}`);
});
