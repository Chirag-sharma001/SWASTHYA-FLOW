const mongoose = require('mongoose');

const doctorSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  doctorName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'closed'],
    default: 'active'
  },
  consultationDurations: {
    type: [Number],
    default: []
  },
  startedAt: {
    type: Number,
    required: true,
    default: Date.now
  },
  closedAt: {
    type: Number,
    default: null
  }
});

module.exports = mongoose.model('DoctorSession', doctorSessionSchema);
