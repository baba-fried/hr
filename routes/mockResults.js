const express = require('express');
const router = express.Router();
const MockTestResult = require('../models/MockTestResult');

router.post('/', async (req, res) => {
  const { userId, testName, score, total } = req.body;

  console.log('🟢 Incoming request:', req.body);

  if (!userId || !testName) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }

  const existing = await MockTestResult.findOne({ userId, testName });
  if (existing) {
    return res.status(400).json({ message: 'Test already submitted.' });
  }

  const result = await MockTestResult.create({ userId, testName, score, total });
  return res.status(201).json(result);
});


router.get('/:userId', async (req, res) => {
    try {
      const results = await MockTestResult.find({ userId: req.params.userId });
      res.json(results);
    } catch (err) {
      console.error('Error fetching results:', err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;
