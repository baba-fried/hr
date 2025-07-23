const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: String,
  questionType: String,
  subject: String,
  difficulty: String,
  options: [String],          // only for MCQ
  correctAnswer: mongoose.Schema.Types.Mixed // string or number
});

const participantSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: Number,
    answers: [mongoose.Schema.Types.Mixed],
    submittedAt: Date,
    status: { type: String, default: 'completed' }
});

const testSchema = new mongoose.Schema({
  name: String,
  role: String,
  duration: Number,
  dateAdded: { type: Date, default: Date.now },
  questions: [questionSchema],
  candidates: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  participants: [participantSchema]
});

module.exports = mongoose.model('Test', testSchema);
