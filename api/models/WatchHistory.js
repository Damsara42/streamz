const mongoose = require('mongoose');

const WatchHistorySchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  episode: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Episode', 
    required: true 
  },
  progress: { type: Number, default: 0 },
  last_watched_at: { type: Date, default: Date.now }
});

// Compound index to ensure a user only has one history entry per episode
WatchHistorySchema.index({ user: 1, episode: 1 }, { unique: true });

module.exports = mongoose.model('WatchHistory', WatchHistorySchema);