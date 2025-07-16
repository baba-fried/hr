const mongoose = require('mongoose');

const ExamResultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  testName: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  answers: { type: [Number], default: [] },
  takenAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamResult', ExamResultSchema); 