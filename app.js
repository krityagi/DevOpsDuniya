require('dotenv').config(); // Load environment variables
const mongoose = require('mongoose');
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const port = 3000;

// Set EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error: ', err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Set up session management using environment variable for secret
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to 'true' for HTTPS in production
}));

// Routes
app.use(authRoutes);
app.use('/admin', adminRoutes);

// Serve static files (CSS, JS, etc.)
app.use('/styles', express.static(path.join(__dirname, 'public/styles')));

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}/login`);
});
