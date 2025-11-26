const mongoose = require('mongoose');

const ShowSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  poster: { type: String },
  banner: { type: String },
  genres: { type: String }, // Stored as comma-separated string
  category: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category',
    required: true
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

ShowSchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Show', ShowSchema);