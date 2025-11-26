const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { adminAuth } = require('../middleware/auth');

// Mongoose Models
const User = require('../models/User');
const Category = require('../models/Category');
const Show = require('../models/Show');
const Episode = require('../models/Episode');
const HeroSlide = require('../models/HeroSlide');

// --- Multer Config (Unchanged) ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let dir = path.join(__dirname, '../../public/uploads/other');
        if (file.fieldname === 'poster' || file.fieldname === 'banner' || file.fieldname === 'thumbnail') {
            dir = path.join(__dirname, '../../public/uploads/images');
        } else if (file.fieldname === 'image') {
             dir = path.join(__dirname, '../../public/uploads/slides');
        }
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

router.use(adminAuth);

// --- Analytics ---
router.get('/analytics', async (req, res) => {
    try {
        const [users, shows, episodes] = await Promise.all([
            User.countDocuments(),
            Show.countDocuments(),
            Episode.countDocuments()
        ]);
        res.json({ users, shows, episodes, daily_views: 0 });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Categories ---
router.post('/categories', async (req, res) => {
    try {
        const cat = await Category.create({ name: req.body.name });
        res.status(201).json(cat);
    } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put('/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndUpdate(req.params.id, { name: req.body.name });
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete('/categories/:id', async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Shows ---
router.post('/shows', upload.fields([{ name: 'poster' }, { name: 'banner' }]), async (req, res) => {
    try {
        const { title, description, genres, category_id } = req.body;
        const poster = req.files.poster ? `/uploads/images/${req.files.poster[0].filename}` : null;
        const banner = req.files.banner ? `/uploads/images/${req.files.banner[0].filename}` : null;

        const show = await Show.create({
            title, description, genres, poster, banner, category: category_id
        });
        res.status(201).json(show);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/shows/:id', upload.fields([{ name: 'poster' }, { name: 'banner' }]), async (req, res) => {
    try {
        const updateData = { ...req.body, category: req.body.category_id };
        if (req.files.poster) updateData.poster = `/uploads/images/${req.files.poster[0].filename}`;
        if (req.files.banner) updateData.banner = `/uploads/images/${req.files.banner[0].filename}`;

        await Show.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/shows/:id', async (req, res) => {
    try {
        // Cascade delete episodes
        await Episode.deleteMany({ show: req.params.id });
        await Show.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Episodes ---
router.post('/episodes', upload.single('thumbnail'), async (req, res) => {
    try {
        const { show_id, publish_date, ...rest } = req.body;
        const thumbnail = req.file ? `/uploads/images/${req.file.filename}` : null;
        const pubDate = publish_date ? new Date(publish_date) : new Date();

        const ep = await Episode.create({
            ...rest,
            show: show_id,
            thumbnail,
            publish_date: pubDate
        });
        res.status(201).json(ep);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/shows/:id/episodes', async (req, res) => {
    // Admin route to see ALL episodes for a show
    try {
        const episodes = await Episode.find({ show: req.params.id }).sort({ ep_number: 1 });
        res.json(episodes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/episodes/:id', async (req, res) => {
    // Admin route to get SINGLE episode for editing
    try {
        const ep = await Episode.findById(req.params.id);
        if(!ep) return res.status(404).json({error: 'Not found'});
        
        // Return show_id field compatible with frontend form
        res.json({ ...ep.toJSON(), show_id: ep.show });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/episodes/:id', upload.single('thumbnail'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) updateData.thumbnail = `/uploads/images/${req.file.filename}`;
        if (req.body.publish_date) updateData.publish_date = new Date(req.body.publish_date);

        await Episode.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/episodes/:id', async (req, res) => {
    try {
        await Episode.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- Slides ---
router.get('/slides', async (req, res) => {
    try {
        const slides = await HeroSlide.find();
        res.json(slides);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/slides/:id', async (req, res) => {
    try {
        const slide = await HeroSlide.findById(req.params.id);
        res.json(slide);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/slides', upload.single('image'), async (req, res) => {
    try {
        const image = req.file ? `/uploads/slides/${req.file.filename}` : null;
        if (!image) return res.status(400).json({ error: 'Image required' });
        
        const slide = await HeroSlide.create({ ...req.body, image });
        res.status(201).json(slide);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/slides/:id', upload.single('image'), async (req, res) => {
    try {
        const updateData = { ...req.body };
        if (req.file) updateData.image = `/uploads/slides/${req.file.filename}`;
        
        await HeroSlide.findByIdAndUpdate(req.params.id, updateData);
        res.json({ message: 'Updated' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/slides/:id', async (req, res) => {
    try {
        await HeroSlide.findByIdAndDelete(req.params.id);
        res.status(204).send();
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;