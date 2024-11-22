const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));

// URL dosyası
const urlFile = path.join(__dirname, 'redirect_url.txt');

// Varsayılan URL
if (!fs.existsSync(urlFile)) {
  fs.writeFileSync(urlFile, 'https://www.example.com');
}

// Ana Yönlendirme Sayfası
app.get('/', (req, res) => {
    const currentUrl = fs.readFileSync(urlFile, 'utf8');
    res.redirect(currentUrl); // Kullanıcıyı doğrudan yönlendir
  });

// Dinamik Yönlendirme
app.get('/redirect', (req, res) => {
  const currentUrl = fs.readFileSync(urlFile, 'utf8');
  res.redirect(currentUrl);
});

// Admin Sayfası
app.get('/admin', (req, res) => {
  const currentUrl = fs.readFileSync(urlFile, 'utf8');
  res.render('admin', { url: currentUrl });
});

// URL Güncelleme
app.post('/update-url', (req, res) => {
  const newUrl = req.body.newUrl;
  fs.writeFileSync(urlFile, newUrl);
  res.redirect('/admin');
});

// Sunucuyu Başlat
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:3000);
});
