const express = require('express');
const bodyParser = require('body-parser');
const QRCode = require('qrcode');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.set('view engine', 'ejs');

// Veritabanını oluştur veya bağlan
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Veritabanı hatası:', err.message);
    } else {
        console.log('SQLite veritabanına bağlandı.');

        // Tabloyu oluştur (varsa yeniden oluşturmaz)
        db.run(`
            CREATE TABLE IF NOT EXISTS qr_data (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                target_url TEXT NOT NULL,
                scan_count INTEGER DEFAULT 0
            )
        `);

        // Eğer veri yoksa varsayılan bir hedef URL ekle
        db.get('SELECT * FROM qr_data WHERE id = 1', (err, row) => {
            if (!row) {
                db.run(`INSERT INTO qr_data (target_url, scan_count) VALUES (?, ?)`, ['https://example.com', 0]);
            }
        });
    }
});

// Ana sayfa: QR kodu ve mevcut verileri göster
app.get('/', (req, res) => {
    db.get('SELECT * FROM qr_data WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Veritabanı hatası:', err.message);
            res.status(500).send('Veritabanı hatası.');
        } else {
            const qrCodeUrl = `http://${req.headers.host}/redirect`;
            QRCode.toDataURL(qrCodeUrl, (err, qrCodeData) => {
                res.render('index', { qrCodeData, scanCount: row.scan_count, targetUrl: row.target_url });
            });
        }
    });
});

// QR kod yönlendirme
app.get('/redirect', (req, res) => {
    db.get('SELECT * FROM qr_data WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Veritabanı hatası:', err.message);
            res.status(500).send('Veritabanı hatası.');
        } else {
            const newCount = row.scan_count + 1;
            db.run('UPDATE qr_data SET scan_count = ? WHERE id = 1', [newCount], (err) => {
                if (err) {
                    console.error('Tarama sayısı güncellenemedi:', err.message);
                }
                res.redirect(row.target_url);
            });
        }
    });
});

// Hedef URL'yi değiştirme
app.post('/update', (req, res) => {
    const newUrl = req.body.newUrl;
    db.run('UPDATE qr_data SET target_url = ? WHERE id = 1', [newUrl], (err) => {
        if (err) {
            console.error('URL güncellenemedi:', err.message);
        }
        res.redirect('/');
    });
});

// İstatistik sayfası
app.get('/stats', (req, res) => {
    db.get('SELECT * FROM qr_data WHERE id = 1', (err, row) => {
        if (err) {
            console.error('Veritabanı hatası:', err.message);
            res.status(500).send('Veritabanı hatası.');
        } else {
            res.render('stats', { scanCount: row.scan_count, targetUrl: row.target_url });
        }
    });
});

// Sunucuyu başlat
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});
