const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const sendWelcomeMail = require('../sendWelcomeMail');

// Multer setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/resumes');
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only PDF and DOC/DOCX files are allowed.'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 5MB
});

// Register Route
router.post('/register', upload.single('resume'), async (req, res) => {
    try {
        const {
            email,
            password,
            role,
            full_name,
            dob,
            college_name,
            course,
            yearOfStudy
        } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = new User({
            fullName: full_name,
            email,
            password,
            role,
            dob,
            collegeName: college_name,
            course,
            yearOfStudy,
            resumeUrl: req.file ? `/uploads/resumes/${req.file.filename}` : null
        });

        await user.save();

        // Send welcome mail after user is saved
        try {
            await sendWelcomeMail(email, full_name);
        } catch (mailErr) {
            console.error('[SEND WELCOME MAIL ERROR]', mailErr);
            // Optionally, you can continue even if mail fails
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                resumeUrl: user.resumeUrl
            }
        });
    } catch (error) {
        console.error('[REGISTER ERROR]', error);
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login Route
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        console.log(`[LOGIN ATTEMPT] Email: ${email}`);

        const user = await User.findOne({ email });
        if (!user) {
            console.log('[LOGIN FAILED] No user found');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        console.log('[USER ROLE IN DB]', user.role);
        console.log('[ROLE FROM FRONTEND]', role);

        if (user.role !== role) {
            return res.status(403).json({ message: 'Access denied: role mismatch' });
        }
        
        console.log('[USER PASSWORD]', user.password);      // hashed from DB
        console.log('[INPUT PASSWORD]', password);          // raw from frontend
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('[PASSWORD MATCH]', isMatch);

        if (!isMatch) {
            console.log('[LOGIN FAILED] Incorrect password');
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        console.log('[LOGIN SUCCESSFUL]');

        let redirect = '/user-dashboard'; // default
        if (user.role === 'admin') redirect = '/HR-dashboard';


        res.json({
            success: true,
            message: 'Login successful',
            token,
            redirect, // send this to frontend
            user: {
                id: user._id,
                email: user.email,
                role: user.role,
                fullName: user.fullName,
                dob: user.dob,
                collegeName: user.collegeName,
                course: user.course,
                yearOfStudy: user.yearOfStudy,
                resumeUrl: user.resumeUrl
            }
        });
    } catch (error) {
        console.error('[LOGIN ERROR]', error);
        res.status(500).json({ message: 'Error logging in', error: error.message });
    }
});

// Get User Details by ID (for Dashboard/Profile Pre-fill)
router.get('/profile/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        console.error('[GET USER PROFILE ERROR]', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});
// Get all student users
    router.get('/hr/candidates', async (req, res) => {
        const users = await User.find({ role: 'student' });
        res.status(200).json({ users });
      });
  
// TEMPORARY: Admin Creation Route
/*router.post('/create-admin', async (req, res) => {
    const { email, password, fullName } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Admin already exists' });
        }

        const newUser = new User({
            email,
            password,
            fullName: fullName || 'Admin User',
            role: 'admin'
        });

        await newUser.save();

        res.status(201).json({ message: '✅ Admin user created successfully' });
    } catch (error) {
        console.error('[ADMIN CREATE ERROR]', error);
        res.status(500).json({ message: 'Server error while creating admin', error: error.message });
    }
});*/

module.exports = router;
