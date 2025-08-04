const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { auth } = require('../middleware/authMiddleware');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
// Create logs directory if it doesn't exist
(async () => {
    try {
        await fs.mkdir(logsDir, { recursive: true });
    } catch (error) {
        console.error('Error creating logs directory:', error);
        // Don't throw the error, just log it
        // The directory might already exist or will be created on next request
    }
})().catch(console.error);

// Log violation endpoint
router.post('/violations', auth, async (req, res) => {
    try {
        const {
            testId,
            testName,
            userId,
            violationType,
            severity,
            description,
            metadata
        } = req.body;

        const violation = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            userId,
            userEmail: req.user.email,
            userName: req.user.fullName,
            testId,
            testName,
            violationType,
            severity, // 'low', 'medium', 'high', 'critical'
            description,
            metadata,
            timestamp: new Date().toISOString(),
            userAgent: req.headers['user-agent'],
            ipAddress: req.ip || req.connection.remoteAddress
        };

        // Create filename with date
        const date = new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `violations-${userId}-${date}.json`);

        // Read existing violations or create empty array
        let violations = [];
        try {
            const existingData = await fs.readFile(logFile, 'utf8');
            violations = JSON.parse(existingData);
        } catch (error) {
            // File doesn't exist or is empty, start with empty array
            violations = [];
        }

        // Add new violation
        violations.push(violation);

        try {
            // Write back to file
            await fs.writeFile(logFile, JSON.stringify(violations, null, 2));

            // Also log to console for immediate monitoring
            console.log(`🚨 VIOLATION DETECTED:`, {
                user: violation.userName,
                test: violation.testName,
                type: violation.violationType,
                severity: violation.severity,
                time: violation.timestamp
            });
        } catch (writeError) {
            console.error('Error writing violation log:', writeError);
            // Don't throw the error, just log it and continue
            // This prevents the server from crashing due to file system issues
        }

        res.status(201).json({
            success: true,
            message: 'Violation logged successfully',
            violationId: violation.id
        });

    } catch (error) {
        console.error('Error logging violation:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to log violation',
            error: error.message
        });
    }
});

// Get violations for a specific test
router.get('/violations/:testId', auth, async (req, res) => {
    try {
        const { testId } = req.params;
        const { date } = req.query;

        const targetDate = date || new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `violations-${testId}-${targetDate}.json`);

        try {
            const data = await fs.readFile(logFile, 'utf8');
            const violations = JSON.parse(data);
            
            // Filter by testId if provided
            const filteredViolations = testId === 'all' 
                ? violations 
                : violations.filter(v => v.testId === testId);

            res.json({
                success: true,
                violations: filteredViolations,
                count: filteredViolations.length
            });
        } catch (error) {
            // File doesn't exist
            res.json({
                success: true,
                violations: [],
                count: 0
            });
        }
    } catch (error) {
        console.error('Error fetching violations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch violations',
            error: error.message
        });
    }
});

// Get violations for a specific user
router.get('/user-violations/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const { date } = req.query;

        const targetDate = date || new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `violations-${userId}-${targetDate}.json`);

        try {
            const data = await fs.readFile(logFile, 'utf8');
            const violations = JSON.parse(data);
            
            res.json({
                success: true,
                violations: violations,
                count: violations.length
            });
        } catch (error) {
            // File doesn't exist
            res.json({
                success: true,
                violations: [],
                count: 0
            });
        }
    } catch (error) {
        console.error('Error fetching user violations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user violations',
            error: error.message
        });
    }
});

// Get violation statistics
router.get('/stats/:testId', auth, async (req, res) => {
    try {
        const { testId } = req.params;
        const { date } = req.query;

        const targetDate = date || new Date().toISOString().split('T')[0];
        const logFile = path.join(logsDir, `violations-${testId}-${targetDate}.json`);

        let stats = {
            total: 0,
            byType: {},
            bySeverity: {},
            byUser: {},
            timeline: []
        };

        try {
            const data = await fs.readFile(logFile, 'utf8');
            let violations = [];
            
            try {
                violations = JSON.parse(data);
            } catch (parseError) {
                console.error('Error parsing violations file:', parseError);
                // Return empty stats if file is corrupted
                return res.json({ success: true, stats });
            }
            
            const filteredViolations = testId === 'all' 
                ? violations 
                : violations.filter(v => v.testId === testId);

            stats.total = filteredViolations.length;

            // Use try-catch for each violation processing to prevent crashes
            filteredViolations.forEach(violation => {
                try {
                    // By type
                    stats.byType[violation.violationType] = (stats.byType[violation.violationType] || 0) + 1;
                    
                    // By severity
                    stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
                    
                    // By user
                    stats.byUser[violation.userName] = (stats.byUser[violation.userName] || 0) + 1;
                    
                    // Timeline (hourly)
                    const timestamp = new Date(violation.timestamp);
                    if (!isNaN(timestamp)) {
                        const hour = timestamp.getHours();
                        const timeSlot = `${hour}:00`;
                        const existing = stats.timeline.find(t => t.time === timeSlot);
                        if (existing) {
                            existing.count++;
                        } else {
                            stats.timeline.push({ time: timeSlot, count: 1 });
                        }
                    }
                } catch (processError) {
                    console.error('Error processing violation:', processError);
                    // Continue processing other violations
                }
            });

            // Sort timeline
            stats.timeline.sort((a, b) => parseInt(a.time) - parseInt(b.time));

            res.json({
                success: true,
                stats
            });
        } catch (error) {
            // File doesn't exist
            res.json({
                success: true,
                stats: {
                    total: 0,
                    byType: {},
                    bySeverity: {},
                    byUser: {},
                    timeline: []
                }
            });
        }
    } catch (error) {
        console.error('Error fetching violation stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch violation statistics',
            error: error.message
        });
    }
});

// Real-time violation alert endpoint (for future Socket.IO integration)
router.post('/alert', auth, async (req, res) => {
    try {
        const { testId, violationType, severity, message } = req.body;
        
        // For now, just log the alert
        console.log(`🔔 REAL-TIME ALERT:`, {
            user: req.user.fullName,
            testId,
            type: violationType,
            severity,
            message,
            timestamp: new Date().toISOString()
        });

        // In future, emit Socket.IO event here
        // io.emit('violation-alert', { ... });

        res.json({
            success: true,
            message: 'Alert sent successfully'
        });
    } catch (error) {
        console.error('Error sending alert:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send alert',
            error: error.message
        });
    }
});

module.exports = router;