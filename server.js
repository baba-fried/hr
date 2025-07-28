console.log("🚀 server.js is running");
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Import routes
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/testRoutes'); // <-- Add this after other route imports
const userRoutes = require('./routes/users');
const examResultsRouter = require('./routes/examResults');
const proctoringRoutes = require('./routes/proctoring');



// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const mockResultsRoute = require('./routes/mockResults');
// serve everything in your "public" (or however you've named it) folder:
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(cors());
app.use(express.json());

// Add this new middleware for Content Security Policy
app.use((req, res, next) => {
    res.setHeader(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com"
    );
    next();
});

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads', 'resumes');
fs.mkdirSync(uploadDir, { recursive: true });

// Serve static files
app.use('/components', express.static(path.join(__dirname, 'components')));
app.use('/HR-dashboard', express.static(path.join(__dirname, 'HR-dashboard')));
app.use('/user-dashboard', express.static(path.join(__dirname, 'user-dashboard')));
app.use('/TestProtocol', express.static(path.join(__dirname, 'TestProtocol')));
app.use('/models', express.static(path.join(__dirname, 'TestProtocol/models')));
app.use('/login-page', express.static(path.join(__dirname, 'login-page')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/users', userRoutes); // 👈 THIS LINE IS MISSING


// API routes

app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
// Mock results route
app.use('/api/mock-results', mockResultsRoute); // <-- Add this after examRoutes
app.use('/api/exam-results', examResultsRouter);
app.use('/api/proctoring', proctoringRoutes);

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'login-page', 'login.html'));
});

// GET /register will return that file automatically:
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'login-page', 'register.html'));
});

app.get('/HR-dashboard', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'HR-dashboard', 'index.html'));
});

app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'user-dashboard', 'index.html'));
});

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB Atlas'))
.catch(err => console.error('MongoDB connection error:', err));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});
// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`Access the application at: http://localhost:${PORT}`);
});