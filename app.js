const express = require('express');
const session = require('express-session');
const app = express();
const path = require('path');
const fs = require('fs');
const PORT = process.env.PORT || 3000;

const DB_FILE = path.join(__dirname, 'bookings.json');
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify([], null, 2));
}

app.use(session({
    secret: 'bhutan-heritage-secret-key',
    resave: false,
    saveUninitialized: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

let globalPageViews = 0;
app.use((req, res, next) => {
    if (req.method === 'GET' && !req.url.includes('.')) { globalPageViews++; }
    next();
});

app.get('/', (req, res) => res.render('index', { title: 'Home | Hotel Pemayangsel' }));
app.get('/rooms', (req, res) => res.render('rooms', { title: 'Our Rooms | Comfort & Quality' }));
app.get('/dining', (req, res) => res.render('dining', { title: 'Dining & Bar | Culinary Experience' }));
app.get('/contact', (req, res) => res.render('contact', { title: 'Bookings & Contact Us' }));

app.post('/submit-booking', (req, res) => {
    const { name, email, checkin, checkout, room } = req.body;
    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        const bookings = JSON.parse(fileData);
        bookings.push({ name, email, checkin, checkout, room, dateSubmitted: new Date().toLocaleString() });
        fs.writeFileSync(DB_FILE, JSON.stringify(bookings, null, 2));
        res.send(`<script>alert('Booking Request Saved Successfully!'); window.location.href='/contact';</script>`);
    } catch (error) {
        res.send(`<script>alert('Error logging request.'); window.location.href='/contact';</script>`);
    }
});

app.get('/admin/login', (req, res) => res.render('admin-login', { title: 'Admin Login Panel', error: null }));
app.post('/admin/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'pemayangsel123') {
        req.session.isAdmin = true;
        res.redirect('/admin/dashboard');
    } else {
        res.render('admin-login', { title: 'Admin Login Panel', error: 'Invalid Credentials!' });
    }
});

app.get('/admin/dashboard', (req, res) => {
    if (!req.session.isAdmin) return res.redirect('/admin/login');
    try {
        const fileData = fs.readFileSync(DB_FILE, 'utf8');
        res.render('admin-dashboard', { title: 'Admin Control Panel', views: globalPageViews, inquiries: JSON.parse(fileData) });
    } catch (error) {
        res.render('admin-dashboard', { title: 'Admin Control Panel', views: globalPageViews, inquiries: [] });
    }
});

app.get('/admin/logout', (req, res) => { req.session.destroy(); res.redirect('/admin/login'); });

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
