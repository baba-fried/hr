class ViolationLogger {
    constructor() {
        this.testId = null;
        this.testName = null;
        this.userId = null;
        this.violations = [];
        this.isInitialized = false;
        this.apiEndpoint = '/api/proctoring/violations';
        this.alertEndpoint = '/api/proctoring/alert';
        this.rateLimiter = new Map(); // Rate limiting for violations
        this.maxViolationsPerMinute = 10; // Limit violations per type per minute
        this._activeViolations = new Set();
    }

    /**
     * Initialize the violation logger
     * @param {string} testId - Test ID
     * @param {string} testName - Test name
     * @param {string} userId - User ID
     */
    initialize(testId, testName, userId) {
        this.testId = testId;
        this.testName = testName;
        this.userId = userId;
        this.isInitialized = true;
        
        console.log('ViolationLogger initialized:', {
            testId: this.testId,
            testName: this.testName,
            userId: this.userId
        });
    }

    /**
     * Log a violation
     * @param {string} violationType - Type of violation
     * @param {string} severity - Severity level (low, medium, high, critical)
     * @param {string} description - Description of the violation
     * @param {Object} metadata - Additional metadata
     * @param {boolean} showAlert - Whether to show real-time alert
     */
    async logViolation(violationType, severity, description, metadata = {}, showAlert = true) {
        if (!this.isInitialized || this._activeViolations.has(violationType)) {
            return false;
        }
        this._activeViolations.add(violationType);

        const violation = {
            testId: this.testId,
            testName: this.testName,
            userId: this.userId,
            violationType,
            severity,
            description,
            metadata: {
                ...metadata,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                url: window.location.href,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`
            }
        };

        // Store locally
        this.violations.push(violation);

        try {
            // Send to server
            const token = localStorage.getItem('token');
            const response = await fetch(this.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(violation)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log(`✅ Violation logged: ${violationType} (${severity})`);
                
                // Silently log violation without UI updates
                
                return true;
            } else {
                console.error('Failed to log violation:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error logging violation:', error);
            // Store for retry later
            this.storeForRetry(violation);
            return false;
        }
    }

    /**
     * Send real-time alert
     * @param {string} violationType - Type of violation
     * @param {string} severity - Severity level
     * @param {string} message - Alert message
     */
    async sendAlert(violationType, severity, message) {
        try {
            const token = localStorage.getItem('token');
            await fetch(this.alertEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    testId: this.testId,
                    violationType,
                    severity,
                    message
                })
            });
        } catch (error) {
            console.error('Error sending alert:', error);
        }
    }

    /**
     * Update violation UI
     * @param {Object} violation - Violation object
     */
    updateViolationUI(violation) {
        if (window.faceUI && typeof window.faceUI.addEvent === 'function') {
            const icon = this.getSeverityIcon(violation.severity);
            const message = `${icon} ${violation.description}`;
            window.faceUI.addEvent({ type: violation.violationType, message });
        }
        // Remove or comment out the updateViolationCounter method and its calls
        // updateViolationCounter() {
        //     let counter = document.getElementById('violation-counter');
        //     if (!counter) {
        //         counter = document.createElement('div');
        //         counter.id = 'violation-counter';
        //         counter.style.cssText = `
        //             position: fixed;
        //             top: 10px;
        //             left: 10px;
        //             background: rgba(231, 76, 60, 0.9);
        //             color: white;
        //             padding: 8px 12px;
        //             border-radius: 20px;
        //             font-size: 14px;
        //             font-weight: bold;
        //             z-index: 1001;
        //             box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        //         `;
        //         document.body.appendChild(counter);
        //     }
        //     counter.textContent = `Violations: ${this.violations.length}`;
        // }
        // Also remove any calls to this.updateViolationCounter();
    }

    /**
     * Get severity icon
     * @param {string} severity - Severity level
     * @returns {string} Icon
     */
    getSeverityIcon(severity) {
        const icons = {
            low: '⚠️',
            medium: '🔶',
            high: '🚨',
            critical: '🔴'
        };
        return icons[severity] || '⚠️';
    }

    /**
     * Get alert type for UI
     * @param {string} severity - Severity level
     * @returns {string} Alert type
     */
    getAlertType(severity) {
        const types = {
            low: 'warning',
            medium: 'warning',
            high: 'error',
            critical: 'error'
        };
        return types[severity] || 'warning';
    }

    /**
     * Store violation for retry
     * @param {Object} violation - Violation object
     */
    storeForRetry(violation) {
        const stored = JSON.parse(localStorage.getItem('pendingViolations') || '[]');
        stored.push(violation);
        localStorage.setItem('pendingViolations', JSON.stringify(stored));
    }

    /**
     * Retry pending violations
     */
    async retryPendingViolations() {
        const pending = JSON.parse(localStorage.getItem('pendingViolations') || '[]');
        if (pending.length === 0) return;

        console.log(`Retrying ${pending.length} pending violations...`);
        
        const successful = [];
        for (const violation of pending) {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(this.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(violation)
                });

                if (response.ok) {
                    successful.push(violation);
                }
            } catch (error) {
                console.error('Error retrying violation:', error);
            }
        }

        // Remove successful violations from pending
        const remaining = pending.filter(v => !successful.includes(v));
        localStorage.setItem('pendingViolations', JSON.stringify(remaining));
        
        console.log(`Successfully retried ${successful.length} violations`);
    }

    /**
     * Get violation statistics
     * @returns {Object} Statistics
     */
    getStatistics() {
        const stats = {
            total: this.violations.length,
            byType: {},
            bySeverity: {},
            timeline: []
        };

        this.violations.forEach(violation => {
            // By type
            stats.byType[violation.violationType] = (stats.byType[violation.violationType] || 0) + 1;
            
            // By severity
            stats.bySeverity[violation.severity] = (stats.bySeverity[violation.severity] || 0) + 1;
            
            // Timeline
            const time = new Date(violation.metadata.timestamp).toLocaleTimeString();
            stats.timeline.push({
                time,
                type: violation.violationType,
                severity: violation.severity
            });
        });

        return stats;
    }

    /**
     * Export violations as JSON
     * @returns {string} JSON string
     */
    exportViolations() {
        return JSON.stringify({
            testId: this.testId,
            testName: this.testName,
            userId: this.userId,
            violations: this.violations,
            statistics: this.getStatistics(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    /**
     * Check rate limit for violation type
     * @param {string} violationType - Type of violation
     * @returns {boolean} Whether violation can be logged
     */
    checkRateLimit(violationType) {
        const now = Date.now();
        const oneMinute = 60 * 1000;
        
        if (!this.rateLimiter.has(violationType)) {
            this.rateLimiter.set(violationType, []);
        }
        
        const violations = this.rateLimiter.get(violationType);
        
        // Remove violations older than 1 minute
        const recentViolations = violations.filter(timestamp => now - timestamp < oneMinute);
        
        // Check if we're under the limit
        if (recentViolations.length >= this.maxViolationsPerMinute) {
            return false;
        }
        
        // Add current violation timestamp
        recentViolations.push(now);
        this.rateLimiter.set(violationType, recentViolations);
        
        return true;
    }

    clearViolations() {
        this.violations = [];
        this.rateLimiter.clear();
        // Remove or comment out the updateViolationCounter method and its calls
        // updateViolationCounter() {
        //     let counter = document.getElementById('violation-counter');
        //     if (!counter) {
        //         counter = document.createElement('div');
        //         counter.id = 'violation-counter';
        //         counter.style.cssText = `
        //             position: fixed;
        //             top: 10px;
        //             left: 10px;
        //             background: rgba(231, 76, 60, 0.9);
        //             color: white;
        //             padding: 8px 12px;
        //             border-radius: 20px;
        //             font-size: 14px;
        //             font-weight: bold;
        //             z-index: 1001;
        //             box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        //         `;
        //         document.body.appendChild(counter);
        //     }
        //     counter.textContent = `Violations: ${this.violations.length}`;
        // }
        // Also remove any calls to this.updateViolationCounter();
        localStorage.removeItem('pendingViolations');
    }
    resolveViolation(violationType) {
        this._activeViolations.delete(violationType);
    }
}

// Create and export singleton instance
window.violationLogger = new ViolationLogger();
export default window.violationLogger;