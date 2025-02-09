const express = require('express');
const User = require('../models/User'); // Adjust the path as needed
const router = express.Router();
const { isAdmin } = require('../routes/auth'); // Assuming you have an auth middleware

// View Users
router.get('/users', isAdmin, async (req, res) => {
    try {
        const users = await User.find({});
        res.render('admin-users', { users: users });
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

module.exports = router;
