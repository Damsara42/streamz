const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password_hash: { 
    type: String, 
    required: true 
  },
  isAdmin: { 
    type: Boolean, 
    default: false 
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: false } });

module.exports = mongoose.model('User', UserSchema);