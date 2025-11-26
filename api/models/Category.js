const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    unique: true 
  }
});

// This ensures when you convert to JSON, you get 'id' instead of '_id'
// helping to minimize frontend breakage
CategorySchema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) { delete ret._id; }
});

module.exports = mongoose.model('Category', CategorySchema);