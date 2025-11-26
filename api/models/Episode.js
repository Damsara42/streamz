const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  show: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Show', 
    required: true 
  },
  ep_number: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  drive_url: { type: String, required: true },
  thumbnail: { type: String },
  publish_date: { 
    type: Date, 
    default: Date.now 
  }
});

EpisodeSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Episode', EpisodeSchema);