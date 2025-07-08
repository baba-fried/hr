const mongoose = require('mongoose');

const mockTestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testName: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  takenAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('MockTestResult', mockTestResultSchema);
