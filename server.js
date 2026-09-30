const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

let db = {
    user: {
        nama: "Aldiansyah",
        saldo: 10000
    },
    nokos: [
        { id: 1, negara: "Indonesia Reguler", tipe: "Reguler", harga: 5000, nomor: "+62 851-4321-xxxx", status: "Tersedia" },
        { id: 2, negara: "USA Reguler", tipe: "Reguler", harga: 8000, nomor: "+1 202-555-xxxx", status: "Tersedia" },
        { id: 3, negara: "India Reguler", tipe: "Reguler", harga: 10000, nomor: "+91 9876-xxxx-xx", status: "Tersedia" },
        { id: 4, negara: "Indonesia Premium (Anti-Ban)", tipe: "Premium", harga: 15000, nomor: "+62 812-9876-xxxx", status: "Tersedia" },
        { id: 5, negara: "Private USA (Anti-Ban)", tipe: "Premium", harga: 20000, nomor: "+1 415-888-xxxx", status: "Tersedia" }
    ],
    verifikasiSaldo: [],
    transaksi: []
};

let counterVerif = 1;

const apiRouter = express.Router();

apiRouter.get('/data', (req, res) => {
    res.json({
        user: db.user,
        nokos: db.nokos,
        verifikasi: db.verifikasiSaldo
    });
});

// API: Login Admin
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
        bukti: bukti || "bukti_tf.jpg",
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
    const item = db.nokos.find(n => n.id === parseInt(idNokos));

    if (!item) return res.status(404).json({ success: false, message: "Nokos tidak ditemukan" });
    if (db.user.saldo < item.harga) return res.status(400).json({ success: false, message: "Saldo tidak mencukupi, silakan Top Up!" });

    db.user.saldo -= item.harga;
    res.json({ success: true, message: `Berhasil membeli ${item.negara}!`, saldoBaru: db.user.saldo });
});

app.use('/api', apiRouter);

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
