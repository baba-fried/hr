const express = require('express');
const router = express.Router();
const CandidateDecision = require('../models/CandidateDecision');
const { auth } = require('../middleware/authMiddleware');
const sendDecisionEmail = require('../sendDecisionEmail');

// Get all decisions
router.get('/', auth, async (req, res) => {
    try {
        const decisions = await CandidateDecision.find().sort({ createdAt: -1 });
        res.json({ success: true, decisions });
    } catch (error) {
        console.error('Error fetching decisions:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch decisions' });
    }
});

// Get decision for specific user and test
router.get('/:userId/:testId', auth, async (req, res) => {
    try {
        const { userId, testId } = req.params;
        const decision = await CandidateDecision.findOne({ userId, testId });
        res.json({ success: true, decision });
    } catch (error) {
        console.error('Error fetching decision:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch decision' });
    }
});

// Make a decision (accept/reject)
router.post('/decide', auth, async (req, res) => {
    try {
        const { userId, userName, userEmail, testId, testName, decision, notes } = req.body;
        
        // Check if decision already exists
        let existingDecision = await CandidateDecision.findOne({ userId, testId });
        
        if (existingDecision) {
            return res.status(400).json({ 
                success: false, 
                message: 'Decision already made for this candidate and test' 
            });
        }

        // Create new decision
        const newDecision = new CandidateDecision({
            userId,
            userName,
            userEmail,
            testId,
            testName,
            decision,
            decisionBy: req.user.fullName,
            notes
        });

        await newDecision.save();

        // Send email notification
        try {
            await sendDecisionEmail(userEmail, userName, testName, decision, notes);
            newDecision.emailSent = true;
            newDecision.emailSentDate = new Date();
            await newDecision.save();
        } catch (emailError) {
            console.error('Failed to send decision email:', emailError);
            // Continue even if email fails
        }

        res.status(201).json({ 
            success: true, 
            message: `Candidate ${decision} successfully`,
            decision: newDecision
        });

    } catch (error) {
        console.error('Error making decision:', error);
        res.status(500).json({ success: false, message: 'Failed to make decision' });
    }
});

// Remove the update decision endpoint. Only POST /decide is allowed for new decisions.
