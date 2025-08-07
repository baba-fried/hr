const mongoose = require('mongoose');

const candidateDecisionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    userEmail: {
        type: String,
        required: true
    },
    testId: {
        type: String,
        required: true
    },
    testName: {
        type: String,
        required: true
    },
    decision: {
        type: String,
        enum: ['accepted', 'rejected', 'pending'],
        default: 'pending'
    },
    decisionDate: {
        type: Date,
        default: Date.now
    },
    decisionBy: {
        type: String,
        required: true
    },
    emailSent: {
        type: Boolean,
        default: false
    },
    emailSentDate: {
        type: Date
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Create compound index to ensure one decision per user per test
candidateDecisionSchema.index({ userId: 1, testId: 1 }, { unique: true });

module.exports = mongoose.model('CandidateDecision', candidateDecisionSchema);
