const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Set up session
app.use(session({ secret: 'your-secret-key', resave: true, saveUninitialized: true }));
// Set up EJS as the view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Set up Multer for image upload
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage: storage });

// Serve static files from the 'public' directory
// app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));


// Passport session setup
passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (obj, done) {
    done(null, obj);
});

// Use the GoogleStrategy within Passport
passport.use(
    new GoogleStrategy(
        {
            clientID: '832004256675-7o3gghsbd01fi04m520gi1a0nidrtfev.apps.googleusercontent.com',
            clientSecret: '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',
            callbackURL: 'http://localhost:3000/auth/google/callback',
        },
        function (token, tokenSecret, profile, done) {
            return done(null, profile);
        }
    )
);

// Middleware to check if the user is authenticated
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/');
}

// Routes

// Google authentication route
app.get(
    '/auth/google',
    passport.authenticate('google', { scope: ['https://www.googleapis.com/auth/plus.login'] })
);

// Google authentication callback
app.get(
    '/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    function (req, res) {
        res.redirect('/dashboard');
    }
);

// Logout route
app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// Dashboard route (requires authentication)
app.get('/dashboard', isAuthenticated, function (req, res) {
    res.sendFile(path.join(__dirname, 'public/dashboard.html'));
});

// Image upload route (requires authentication)
app.post('/upload', isAuthenticated, upload.single('image'), (req, res) => {
    const imageUrl = '/uploads/' + req.file.filename;
    res.json({ imageUrl: imageUrl });
});


// Image gallery route (requires authentication)
app.get('/gallery', isAuthenticated, function (req, res) {
    const imageFiles = fs.readdirSync('./uploads/');
    const imageUrls = imageFiles.map((filename) => '/uploads/' + filename);
    res.render('gallery', { imageUrls: imageUrls });
});
// Server start
app.listen(port, () => console.log(`Server is running on http://localhost:${port}`));
