require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../models/User'); // Adjust the path to your User model

async function createAdminUser() {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

    const email = 'admin@example.com'; // Change as needed
    const password = 'adminpassword'; // Change as needed

    const hashedPassword = await bcrypt.hash(password, 10);
    const adminUser = new User({
        name: 'Admin',
        email: email,
        password: hashedPassword,
        role: 'admin', // Ensure role is set to 'admin'
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    await mongoose.disconnect();
}

createAdminUser().catch(console.error);