const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { auth, authorize } = require('../middleware/authMiddleware');
const sendTestAssignmentMail = require('../sendTestAssignmentMail');
const User = require('../models/User');
// Test Routes
// ✅ CREATE A NEW TEST (PUBLIC)
router.post('/', async (req, res) => {
    try {
        console.log('Received POST /api/tests with body:', req.body);

        const { name, role, duration } = req.body;

        if (!name || !role || !duration) {
            console.error('Missing required fields:', { name, role, duration });
            return res.status(400).json({ message: 'All fields (name, role, duration) are required.' });
        }

        const test = new Test({ name, role, duration });
        const savedTest = await test.save();

        console.log('Test created:', savedTest);
        res.status(201).json({ message: 'Test created successfully!', test: savedTest });
    } catch (err) {
        console.error('Error creating test:', err);
        res.status(500).json({ message: err.message || 'Error creating test' });
    }
});

// ✅ GET ALL TESTS
router.get('/', async (req, res) => {
    try {
        const tests = await Test.find().sort({ dateAdded: -1 });
        res.json(tests);
    } catch (err) {
        console.error('❌ Error fetching tests:', err);
        res.status(500).json({ message: 'Error fetching tests', error: err.message });
    }
});

// ✅ GET USER'S ASSIGNED TESTS
router.get('/my-tests', auth, async (req, res) => {
    try {
        const tests = await Test.find({
            candidates: req.user._id
        }).sort({ dateAdded: -1 });

        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching user tests', error: err.message });
    }
});

// ✅ GET QUESTIONS FOR A TEST
router.get('/questions', auth, async (req, res) => {
    try {
        console.log('Fetching questions for test:', req.query.testName);
        const test = await Test.findOne({ name: req.query.testName });
        if (!test) {
            console.log('Test not found');
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test.questions);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching questions', error: err.message });
    }
});


// ✅ GET SPECIFIC TEST
router.get('/:testId', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId).populate('candidates', 'fullName email');
        if (!test) return res.status(404).json({ message: 'Test not found' });
        res.json(test);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching test' });
    }
});

// ✅ UPDATE A TEST (HR only)
router.put('/:testId', auth, authorize('hr', 'admin'), async (req, res) => {
    try {
        const test = await Test.findByIdAndUpdate(
            req.params.testId,
            req.body,
            { new: true, runValidators: true }
        );
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json(test);
    } catch (err) {
        res.status(500).json({ message: 'Error updating test', error: err.message });
    }
});

// ✅ DELETE A TEST (HR only)
router.delete('/:testId', auth, authorize('hr', 'admin'), async (req, res) => {
    try {
        const test = await Test.findByIdAndDelete(req.params.testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found' });
        }
        res.json({ message: 'Test deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting test', error: err.message });
    }
});

// ✅ SUBMIT A TEST
router.post('/:testId/submit', auth, async (req, res) => {
    try {
        console.log('📝 Exam submission attempt:', {
            testId: req.params.testId,
            userId: req.user._id,
            userName: req.user.fullName,
            answersCount: req.body.answers ? Object.keys(req.body.answers).length : 0
        });

        const test = await Test.findById(req.params.testId);
        if (!test) {
            console.log('❌ Test not found:', req.params.testId);
            return res.status(404).json({ message: 'Test not found' });
        }

        // Check if the user is a candidate for the test (but don't block submission)
        const isCandidate = test.candidates.some(candidateId => candidateId.toString() === req.user._id.toString());
        if (!isCandidate) {
            console.log('⚠️ User not in candidates list, but allowing submission:', req.user._id);
        }

        const answers = req.body.answers;
        let score = 0;

        test.questions.forEach((question, index) => {
            if (answers[index] && answers[index] === question.correctAnswer) {
                score += question.points || 1;
            }
        });

        // Check if the user has already submitted
        const existingSubmission = test.participants.find(p => p.user.toString() === req.user._id.toString());
        if (existingSubmission) {
            console.log('❌ User already submitted this test:', req.user._id);
            return res.status(400).json({ message: 'You have already submitted this test.' });
        }

        // Add new submission
        test.participants.push({
            user: req.user._id,
            score,
            answers,
            submittedAt: new Date()
        });

        await test.save();

        console.log('✅ Exam submitted successfully:', {
            testId: req.params.testId,
            userId: req.user._id,
            score: score,
            totalQuestions: test.questions.length
        });

        // Only return score to HR or admin
        if (req.user.role === 'hr' || req.user.role === 'admin') {
            return res.json({
                message: 'Test submitted successfully',
                score,
                totalPoints: test.questions.reduce((sum, q) => sum + (q.points || 1), 0)
            });
        } else {
            return res.json({
                message: 'Test submitted successfully'
            });
        }
    } catch (err) {
        console.error('❌ Error submitting test:', err);
        res.status(500).json({ message: 'Error submitting test', error: err.message });
    }
});

// ✅ ADD QUESTION TO TEST
router.post('/:testId/add-question', async (req, res) => {
    try {
        const testId = req.params.testId;
        const { questionText, questionType, options, correctAnswer, subject, difficulty } = req.body;

        if (!questionText || !questionType || !subject || !difficulty) {
            return res.status(400).json({ message: 'Missing required fields.' });
        }

        if (questionType === 'mcq') {
            if (!Array.isArray(options) || options.length < 2) {
                return res.status(400).json({ message: 'MCQ needs at least two options.' });
            }
            if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer >= options.length) {
                return res.status(400).json({ message: 'Invalid correct answer index.' });
            }
        }

        if (['subjective', 'reasoning'].includes(questionType)) {
            if (!correctAnswer || typeof correctAnswer !== 'string') {
                return res.status(400).json({ message: 'Subjective/Reasoning answer required.' });
            }
        }

        const questionData = {
            questionText,
            questionType,
            subject,
            difficulty,
            ...(questionType === 'mcq' ? { options, correctAnswer } : { correctAnswer })
        };

        const updatedTest = await Test.findByIdAndUpdate(
            testId,
            { $push: { questions: questionData } },
            { new: true }
        );

        if (!updatedTest) return res.status(404).json({ message: 'Test not found.' });

        res.status(201).json({ message: 'Question added', test: updatedTest });
    } catch (err) {
        console.error('Add Question Error:', err);
        res.status(500).json({ message: 'Error adding question' });
    }
});

// ✅ FETCH QUESTIONS
router.get('/:testId/questions', async (req, res) => {
    try {
        const test = await Test.findById(req.params.testId);
        if (!test) return res.status(404).json({ message: 'Test not found.' });
        res.json({ questions: test.questions || [] });
    } catch (err) {
        res.status(500).json({ message: 'Error fetching questions' });
    }
});

// ✅ DELETE A QUESTION
router.delete('/:testId/questions/:questionId', async (req, res) => {
    try {
        const { testId, questionId } = req.params;
        const updatedTest = await Test.findByIdAndUpdate(
            testId,
            { $pull: { questions: { _id: questionId } } },
            { new: true }
        );
        if (!updatedTest) return res.status(404).json({ message: 'Test not found.' });
        res.json({ message: 'Question deleted', test: updatedTest });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting question' });
    }
});

// ✅ UPDATE A QUESTION
router.put('/:testId/questions/:questionId', async (req, res) => {
    try {
        const { testId, questionId } = req.params;
        const { questionText, options, correctAnswer } = req.body;

        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        const question = test.questions.id(questionId);
        if (!question) return res.status(404).json({ message: 'Question not found' });

        question.questionText = questionText;
        question.options = options;
        question.correctAnswer = correctAnswer;

        await test.save();
        res.json({ message: 'Question updated', question });
    } catch (err) {
        res.status(500).json({ message: 'Error updating question' });
    }
});

// ✅ ASSIGN CANDIDATE TO TEST
router.post('/:testId/assign', async (req, res) => {
    try {
        const { testId } = req.params;
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User ID is required' });
        }

        const test = await Test.findById(testId);
        if (!test) {
            return res.status(404).json({ message: 'Test not found.' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Add user to candidates if not already assigned
        if (!test.candidates.includes(userId)) {
            test.candidates.push(userId);
            await test.save();
        }

        // Save assignment under user profile
        await User.findByIdAndUpdate(
            userId,
            {
                $push: {
                    assignedTests: {
                        testId,
                        assignedAt: new Date()
                    }
                }
            }
        );

        // Build secure test link for direct exam access
        const uniqueToken = Math.random().toString(36).substr(2, 12) + Date.now();
        const link = `http://localhost:5000/TestProtocol/index.html?testName=${encodeURIComponent(test.name)}&userId=${user._id}&role=${user.role}&duration=${encodeURIComponent(test.duration)}&token=${uniqueToken}`;

        // Send email notification
        await sendTestAssignmentMail(
        user.email,
        user.fullName,
        test.name,
        link,
        test.duration
    );


        res.status(200).json({
            message: `Test "${test.name}" assigned to ${user.fullName} and email sent.`,
            test
        });

    } catch (err) {
        console.error('[ASSIGN TEST ERROR]', err);
        res.status(500).json({ message: 'Error assigning test', error: err.message });
    }
});


// ✅ REMOVE CANDIDATE FROM TEST
router.post('/:testId/remove', async (req, res) => {
    try {
        const { testId } = req.params;
        const { userId } = req.body;

        const test = await Test.findById(testId);
        if (!test) return res.status(404).json({ message: 'Test not found' });

        test.candidates = test.candidates.filter(id => id.toString() !== userId);
        await test.save();

        res.status(200).json({ message: 'Candidate removed', test });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// ✅ GET TEST BY NAME (for exam window)
router.get('/by-name/:testName', async (req, res) => {
    try {
        const test = await Test.findOne({ name: req.params.testName });
        if (!test) return res.status(404).json({ message: 'Test not found.' });
        res.json(test);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching test by name' });
    }
});

module.exports = router;
