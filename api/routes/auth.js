const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Mongoose Model
const { JWT_SECRET, ADMIN_SECRET } = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing.' });

    try {
        let user = await User.findOne({ username });
        if (user) return res.status(400).json({ error: 'Username already exists.' });

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        user = await User.create({ username, password_hash });

        const payload = { user: { id: user.id, username: user.username } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.status(201).json({ token });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Required fields missing.' });

    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'Invalid credentials.' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        const payload = { user: { id: user.id, username: user.username } };
        jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// POST /api/auth/admin/login
router.post('/admin/login', async (req, res) => {
    const { username, password } = req.body;
    
    // In MongoDB seed, we marked the admin user with isAdmin: true
    try {
        const user = await User.findOne({ username });
        if (!user || !user.isAdmin) { 
             // Security: generic error or specific based on your preference
             return res.status(403).json({ error: 'Access denied.' });
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(400).json({ error: 'Invalid credentials.' });

        const payload = { user: { id: user.id, username: user.username, isAdmin: true } };
        jwt.sign(payload, ADMIN_SECRET, { expiresIn: '12h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;