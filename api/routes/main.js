const express = require('express');
const router = express.Router();
const { userAuth } = require('../middleware/auth');
const Category = require('../models/Category');
const Show = require('../models/Show');
const Episode = require('../models/Episode');
const HeroSlide = require('../models/HeroSlide');
const WatchHistory = require('../models/WatchHistory');

// --- Public Routes ---

// GET /api/categories
router.get('/categories', async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json(categories);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/shows
router.get('/shows', async (req, res) => {
    const categoryId = req.query.category;
    try {
        let query = {};
        if (categoryId) query.category = categoryId;
        
        // Populate category to get the name, just like the SQL JOIN did
        const shows = await Show.find(query).populate('category', 'name').sort({ title: 1 });
        
        // Flatten structure for frontend compatibility (optional but helpful)
        const formattedShows = shows.map(s => ({
            ...s.toJSON(),
            category_id: s.category ? s.category.id : null,
            category_name: s.category ? s.category.name : null
        }));
        
        res.json(formattedShows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/shows/:id
router.get('/shows/:id', async (req, res) => {
    try {
        const show = await Show.findById(req.params.id).populate('category', 'name');
        if (!show) return res.status(404).json({ error: 'Show not found.' });
        
        res.json({
            ...show.toJSON(),
            category_id: show.category ? show.category.id : null,
            category_name: show.category ? show.category.name : null
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/shows/:id/episodes
router.get('/shows/:id/episodes', async (req, res) => {
    try {
        // Find episodes for show, where publish_date <= now
        const episodes = await Episode.find({
            show: req.params.id,
            publish_date: { $lte: new Date() }
        }).sort({ ep_number: 1 });
        
        res.json(episodes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/episodes/:id
router.get('/episodes/:id', async (req, res) => {
    try {
        const episode = await Episode.findOne({
            _id: req.params.id,
            publish_date: { $lte: new Date() }
        }).populate('show', 'title');

        if (!episode) return res.status(404).json({ error: 'Episode not found.' });

        // Logic for "Next Episode"
        const nextEpisode = await Episode.findOne({
            show: episode.show._id,
            ep_number: episode.ep_number + 1,
            publish_date: { $lte: new Date() }
        }).select('_id');

        res.json({
            ...episode.toJSON(),
            show_title: episode.show.title,
            next_episode_id: nextEpisode ? nextEpisode.id : null
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/search
router.get('/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Query required' });

    try {
        // Regex search (case insensitive)
        const regex = new RegExp(query, 'i');
        const shows = await Show.find({
            $or: [
                { title: regex },
                { genres: regex },
                { description: regex }
            ]
        }).populate('category', 'name').limit(20);

        res.json(shows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /api/slides
router.get('/slides', async (req, res) => {
    try {
        const slides = await HeroSlide.find().sort({ _id: 1 });
        res.json(slides);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// --- User Routes ---

// GET /api/history
router.get('/history', userAuth, async (req, res) => {
    try {
        const history = await WatchHistory.find({ user: req.user.id })
            .populate('episode', 'title thumbnail ep_number') // Get ep details
            .populate({
                path: 'episode',
                populate: { path: 'show', select: 'title' } // Nested populate for show title
            })
            .sort({ last_watched_at: -1 })
            .limit(20);

        // Map to flat structure if needed, or keep nested
        res.json(history);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/history/update
router.post('/history/update', userAuth, async (req, res) => {
    const { episode_id, progress } = req.body;
    if (!episode_id || progress === undefined) return res.status(400).json({ error: 'Missing fields' });

    try {
        // Upsert: Update if exists, Insert if not
        await WatchHistory.findOneAndUpdate(
            { user: req.user.id, episode: episode_id },
            { progress: progress, last_watched_at: new Date() },
            { upsert: true, new: true }
        );
        res.json({ message: 'Progress saved.' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;