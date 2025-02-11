const express = require('express');
const User = require('../models/User');
const { isAdmin } = require('./auth');
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;
const router = express.Router();

require('dotenv').config();

console.log('CLIENT_ID:', process.env.CLIENT_ID);
console.log('CLIENT_SECRET:', process.env.CLIENT_SECRET);
console.log('REFRESH_TOKEN:', process.env.REFRESH_TOKEN);

console.log('isAdmin middleware:', isAdmin); // Verify import

// Load OAuth2 credentials
const oAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
);

// Set OAuth2 credentials
oAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});

// Function to create transporter
const createTransporter = async () => {
    try {
        const accessToken = await oAuth2Client.getAccessToken();

        if (!accessToken || !accessToken.token) {
            throw new Error('Failed to retrieve access token');
        }

        console.log('Access Token:', accessToken.token);

        // Use dynamic import to load node-fetch
        const fetch = (await import('node-fetch')).default;

        // Fetch token info
        const tokenInfo = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${accessToken.token}`)
            .then(response => response.json());

        console.log('Token Info:', tokenInfo);

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.EMAIL_USER,
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                refreshToken: process.env.REFRESH_TOKEN,
                accessToken: accessToken.token,
            },
        });

        console.log('Transporter created successfully:', transporter);
        return transporter;
    } catch (error) {
        console.error('Error creating transporter:', error);
        throw error;
    }
};

// View Users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin-users', { title: 'Manage Users', users: users });
    } catch (err) {
        res.status(500).send('Error fetching users: ' + err);
    }
});

// Edit User Details
router.post('/users/edit/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;
    const { name, email, role } = req.body;

    try {
        await User.findByIdAndUpdate(userId, { name, email, role });
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send('Error updating user: ' + err);
    }
});

// Delete Users
router.post('/users/delete/:id', isAdmin, async (req, res) => {
    const userId = req.params.id;

    try {
        await User.findByIdAndDelete(userId);
        res.redirect('/admin/users');
    } catch (err) {
        res.status(500).send('Error deleting user: ' + err);
    }
});

// Send Email Notification
router.post('/notify-users', isAdmin, async (req, res) => {
    const { subject, body } = req.body;

    try {
        const users = await User.find({});
        const emailList = users.map(user => user.email).join(',');

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: emailList,
            subject: subject,
            text: body,
        };

        console.log('Sending email to:', emailList);
        console.log('Email Subject:', subject);
        console.log('Email Body:', body);

        const transporter = await createTransporter();
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
                if (error.response) {
                    console.error('Error response:', error.response);
                }
                if (error.code) {
                    console.error('Error code:', error.code);
                }
                if (error.stack) {
                    console.error('Error stack:', error.stack);
                }
                return res.status(500).send('Error sending email: ' + error.message);
            }
            console.log('Email sent successfully');
            console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            console.log('Message ID:', info.messageId);
            res.redirect('/admin/users');
        });
    } catch (err) {
        console.error('Error fetching users or sending email:', err);
        res.status(500).send('Error fetching users or sending email: ' + err.message);
    }
});

module.exports = router;
