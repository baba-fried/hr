const express = require('express');
const router = express.Router();
const ExamResult = require('../models/ExamResult');

// POST: Submit a real exam result
router.post('/', async (req, res) => {
  const { userId, testName, score, total, answers } = req.body;
  if (!userId || !testName) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  const existing = await ExamResult.findOne({ userId, testName });
  if (existing) {
    return res.status(400).json({ message: 'Test already submitted.' });
  }
  const result = await ExamResult.create({ userId, testName, score, total, answers });
  return res.status(201).json(result);
});
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