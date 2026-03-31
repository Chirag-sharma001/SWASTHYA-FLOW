const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  tokenNumber: {
    type: Number,
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'called', 'completed'],
    default: 'pending'
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'DoctorSession'
  },
  createdAt: {
    type: Number,
    required: true,
    default: Date.now
  },
  calledAt: {
    type: Number,
    default: null
  },
  completedAt: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('Token', tokenSchema);
