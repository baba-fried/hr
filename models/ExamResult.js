const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionText: String,
  questionType: String,
  options: [String],
  correctAnswer: mongoose.Schema.Types.Mixed,
  userAnswer: mongoose.Schema.Types.Mixed,
  isCorrect: Boolean
});

const ExamResultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: String,
  userEmail: String,
  testId: { type: String, required: true },
  testName: { type: String, required: true },
  score: { type: Number, required: true },
  total: { type: Number, required: true },
  answers: [AnswerSchema],
  takenAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ExamResult', ExamResultSchema); 