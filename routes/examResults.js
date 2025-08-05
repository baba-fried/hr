const express = require('express');
const router = express.Router();
const ExamResult = require('../models/ExamResult');

// POST: Submit a real exam result
router.post('/', async (req, res) => {
  try {
    const { userId, userName, userEmail, testId, testName, score, total, answers } = req.body;
    if (!userId || !testId || !testName || !answers) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }
    // Prevent duplicate submissions for same user/test
    const existing = await ExamResult.findOne({ userId, testId });
    if (existing) {
      return res.status(400).json({ message: 'Test already submitted.' });
    }
    const result = await ExamResult.create({ userId, userName, userEmail, testId, testName, score, total, answers });
    return res.status(201).json(result);
  } catch (err) {
    console.error('Error saving exam result:', err);
    res.status(500).json({ message: 'Failed to save exam result' });
  }
});

// GET: Fetch all results, or filter by userId/testId
router.get('/', async (req, res) => {
  try {
    const { userId, testId } = req.query;
    let query = {};
    if (userId) query.userId = userId;
    if (testId) query.testId = testId;
    const results = await ExamResult.find(query);
    res.json(results);
  } catch (err) {
    console.error('Error fetching exam results:', err);
    res.status(500).json({ message: 'Failed to fetch exam results' });
  }
});

// GET: Fetch by userId (legacy)
router.get('/:userId', async (req, res) => {
  try {
    const results = await ExamResult.find({ userId: req.params.userId });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch exam results' });
  }
});

module.exports = router;