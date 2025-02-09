const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Import the User model
const path = require('path');
const session = require('express-session');
const crypto = require('crypto'); // For password reset
const nodemailer = require('nodemailer'); // For sending emails
const rateLimit = require('express-rate-limit'); // Import rate-limiting
const router = express.Router();

// Load environment variables
require('dotenv').config();

// Email setup with Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER, // Your email address
        pass: process.env.EMAIL_PASS, // Your email password,
    },
});

// Middleware to protect routes
function isAuthenticated(req, res, next) {
    if (req.session && req.session.user) {
        return next(); // User is authenticated; proceed to the next middleware
    } else {
        return res.status(401).redirect('/login'); // User is not authenticated; redirect to login
    }
}

// Middleware for admin-only access
function isAdmin(req, res, next) {
    console.log('Checking admin role:', req.session.user); // Log session user
    if (req.session.user && req.session.user.role === 'admin') {
        return next();
    }
    return res.status(403).send('Access denied');
}


// Apply rate limiting to login routes
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many login attempts, please try again later.',
});

// Route: Login Page
router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/login.html'));
});

// Route: Registration Page
router.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../views/register.html'));
});

// Route: Dashboard (Protected)
router.get('/dashboard', isAuthenticated, (req, res) => {
    res.render('dashboard', { user: req.session.user });
});

// Routes for Tutorials (Protected)
router.get('/git-tutorial', isAuthenticated, (req, res) => {
    res.render('git-tutorial', { user: req.session.user });
});

router.get('/jenkins-tutorial', isAuthenticated, (req, res) => {
    res.render('jenkins-tutorial', { user: req.session.user });
});

router.get('/shell-tutorial', isAuthenticated, (req, res) => {
    res.render('shell-tutorial', { user: req.session.user });
});

router.get('/python-tutorial', isAuthenticated, (req, res) => {
    res.render('python-tutorial', { user: req.session.user });
});

// Route: Admin Dashboard (Admin-Only)
router.get('/admin', isAdmin, (req, res) => {
    res.send('Welcome to the Admin Dashboard');
});

// Register Route
router.post('/register', async (req, res) => {
    const { name, email, password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const existingUser = await User.findOne({ email: email });
        if (existingUser) {
            return res.status(400).send('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });

        await newUser.save();
        res.redirect('/login');
    } catch (err) {
        res.status(500).send('Error saving user: ' + err);
    }
});

// Login Route (with rate limiting)
router.post('/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email: email });
        if (!user) {
            console.error('User not found');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            console.error('Password mismatch');
            return res.status(400).json({ message: 'Invalid credentials' });
        }

        // Log the user role for debugging
        console.log('User role:', user.role);
        
        // Set up session
        req.session.user = user;
        console.log('Login successful');
        res.status(200).json({ message: 'Login successful', redirectUrl: '/dashboard' });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Error during login: ' + err });
    }
});


// Logout Route
router.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during logout:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }
        res.status(200).json({ message: 'Logout successful', redirectUrl: '/login' });
    });
});

// Forgot Password Route - Step 1: Send Reset Email
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        return res.status(400).send('No account found with that email');
    }

    const token = crypto.randomBytes(20).toString('hex');
    user.resetToken = token;
    user.resetTokenExpiry = Date.now() + 3600000; // Token valid for 1 hour
    await user.save();

    const resetLink = `http://localhost:3000/reset-password/${token}`;

    // Send reset email
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset',
        text: `You requested a password reset. Click the link below to reset your password:\n${resetLink}`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return res.status(500).send('Error sending email');
        }
        res.send('Password reset link sent');
    });
});

// Reset Password Route - Step 2: Reset User's Password
router.post('/reset-password/:token', async (req, res) => {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    if (password !== confirmPassword) {
        return res.status(400).send('Passwords do not match');
    }

    try {
        const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: Date.now() } });

        if (!user) {
            return res.status(400).send('Token is invalid or expired');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        user.password = hashedPassword;
        user.resetToken = undefined;
        user.resetTokenExpiry = undefined;

        await user.save();
        res.redirect('/login');
    } catch (err) {
        res.status(500).send('Error resetting password: ' + err);
    }
});

module.exports = router;
