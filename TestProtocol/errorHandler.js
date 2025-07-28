class ErrorHandler {
    constructor() {
        this.errors = [];
        this.fallbackModes = {
            camera: false,
            microphone: false,
            faceDetection: false,
            audioProcessing: false,
            behaviorMonitoring: false,
            fullscreen: false
        };
        this.criticalErrors = [];
        this.warningThreshold = 5;
        this.criticalThreshold = 3;
        this.isInitialized = false;
    }

    /**
     * Initialize error handling system
     */
    initialize() {
        if (this.isInitialized) return;

        // Global error handlers
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, event.filename, event.lineno, event.colno);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.handleUnhandledRejection(event.reason);
        });

        // Console error override
        this.overrideConsoleError();

        // Network error monitoring
        this.setupNetworkErrorMonitoring();

        // Performance monitoring
        this.setupPerformanceMonitoring();

        this.isInitialized = true;
        console.log('Error handling system initialized');
    }

    /**
     * Handle global JavaScript errors
     */
    handleGlobalError(error, filename, lineno, colno) {
        const errorInfo = {
            type: 'javascript_error',
            message: error?.message || 'Unknown error',
            filename: filename || 'unknown',
            line: lineno || 0,
            column: colno || 0,
            stack: error?.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            severity: this.determineSeverity(error)
        };

        this.logError(errorInfo);
        this.handleErrorRecovery(errorInfo);
    }

    /**
     * Handle unhandled promise rejections
     */
    handleUnhandledRejection(reason) {
        const errorInfo = {
            type: 'unhandled_rejection',
            message: reason?.message || reason?.toString() || 'Unhandled promise rejection',
            stack: reason?.stack || 'No stack trace',
            timestamp: new Date().toISOString(),
            severity: 'high'
        };

        this.logError(errorInfo);
        this.handleErrorRecovery(errorInfo);
    }

    /**
     * Override console.error to capture application errors
     */
    overrideConsoleError() {
        const originalError = console.error;
        let isLogging = false; // Prevent recursive logging
        
        console.error = (...args) => {
            // Call original console.error
            originalError.apply(console, args);

            // Prevent recursive logging
            if (isLogging) return;
            
            // Skip logging our own violation messages to prevent loops
            const message = args.join(' ');
            if (message.includes('VIOLATION DETECTED') || message.includes('Error logging violation')) {
                return;
            }

            isLogging = true;
            try {
                // Log to our error handler
                const errorInfo = {
                    type: 'console_error',
                    message: message,
                    timestamp: new Date().toISOString(),
                    severity: 'low', // Reduced severity to prevent spam
                    args: args
                };

                this.logError(errorInfo);
            } finally {
                isLogging = false;
            }
        };
    }

    /**
     * Set up network error monitoring
     */
    setupNetworkErrorMonitoring() {
        // Monitor fetch failures
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch.apply(window, args);
                
                if (!response.ok) {
                    this.handleNetworkError({
                        type: 'fetch_error',
                        url: args[0],
                        status: response.status,
                        statusText: response.statusText
                    });
                }
                
                return response;
            } catch (error) {
                this.handleNetworkError({
                    type: 'fetch_failure',
                    url: args[0],
                    error: error.message
                });
                throw error;
            }
        };

        // Monitor XMLHttpRequest failures
        const originalXHROpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            this.addEventListener('error', () => {
                window.errorHandler?.handleNetworkError({
                    type: 'xhr_error',
                    url: args[1],
                    method: args[0]
                });
            });
            
            return originalXHROpen.apply(this, args);
        };
    }

    /**
     * Handle network errors
     */
    handleNetworkError(errorInfo) {
        const networkError = {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            severity: 'high'
        };

        this.logError(networkError);

        // Implement retry logic for critical API calls
        if (errorInfo.url?.includes('/api/proctoring/violations')) {
            this.handleViolationLogFailure(errorInfo);
        }
    }

    /**
     * Handle violation logging failures
     */
    handleViolationLogFailure(errorInfo) {
        console.warn('Violation logging failed, storing locally:', errorInfo);
        
        // Store failed violations locally
        const failedViolations = JSON.parse(localStorage.getItem('failedViolations') || '[]');
        failedViolations.push({
            error: errorInfo,
            timestamp: new Date().toISOString(),
            retryCount: 0
        });
        localStorage.setItem('failedViolations', JSON.stringify(failedViolations));

        // Attempt retry after delay
        setTimeout(() => {
            this.retryFailedViolations();
        }, 5000);
    }

    /**
     * Retry failed violation logs
     */
    async retryFailedViolations() {
        const failedViolations = JSON.parse(localStorage.getItem('failedViolations') || '[]');
        const maxRetries = 3;
        
        for (let i = failedViolations.length - 1; i >= 0; i--) {
            const failed = failedViolations[i];
            
            if (failed.retryCount < maxRetries) {
                try {
                    // Attempt to retry the violation logging
                    if (window.violationLogger) {
                        await window.violationLogger.retryPendingViolations();
                        failedViolations.splice(i, 1); // Remove on success
                    }
                } catch (error) {
                    failed.retryCount++;
                    console.warn(`Retry ${failed.retryCount} failed for violation:`, error);
                }
            } else {
                // Max retries reached, remove from queue
                failedViolations.splice(i, 1);
                console.error('Max retries reached for violation, discarding:', failed);
            }
        }
        
        localStorage.setItem('failedViolations', JSON.stringify(failedViolations));
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor memory usage
        if ('memory' in performance) {
            setInterval(() => {
                const memory = performance.memory;
                const memoryUsage = {
                    used: memory.usedJSHeapSize,
                    total: memory.totalJSHeapSize,
                    limit: memory.jsHeapSizeLimit
                };

                // Alert if memory usage is high
                if (memoryUsage.used / memoryUsage.limit > 0.8) {
                    this.handlePerformanceIssue({
                        type: 'high_memory_usage',
                        usage: memoryUsage,
                        percentage: (memoryUsage.used / memoryUsage.limit * 100).toFixed(2)
                    });
                }
            }, 30000); // Check every 30 seconds
        }

        // Monitor frame rate for video processing
        this.monitorFrameRate();
    }

    /**
     * Monitor frame rate for performance issues
     */
    monitorFrameRate() {
        let lastTime = performance.now();
        let frameCount = 0;
        
        const checkFrameRate = () => {
            const currentTime = performance.now();
            frameCount++;
            
            if (currentTime - lastTime >= 5000) { // Check every 5 seconds
                const fps = frameCount / ((currentTime - lastTime) / 1000);
                
                if (fps < 15) { // Low frame rate threshold
                    this.handlePerformanceIssue({
                        type: 'low_frame_rate',
                        fps: fps.toFixed(2),
                        threshold: 15
                    });
                }
                
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFrameRate);
        };
        
        requestAnimationFrame(checkFrameRate);
    }

    /**
     * Handle performance issues
     */
    handlePerformanceIssue(issue) {
        const performanceError = {
            type: 'performance_issue',
            issue: issue.type,
            details: issue,
            timestamp: new Date().toISOString(),
            severity: 'medium'
        };

        this.logError(performanceError);

        // Implement performance optimizations
        switch (issue.type) {
            case 'high_memory_usage':
                this.optimizeMemoryUsage();
                break;
            case 'low_frame_rate':
                this.optimizeVideoProcessing();
                break;
        }
    }

    /**
     * Optimize memory usage
     */
    optimizeMemoryUsage() {
        console.warn('High memory usage detected, implementing optimizations...');
        
        // Clear old violation logs
        if (window.violationLogger) {
            const stats = window.violationLogger.getStatistics();
            if (stats.timeline.length > 100) {
                // Keep only recent violations
                window.violationLogger.violations = window.violationLogger.violations.slice(-50);
            }
        }

        // Clear old face detection data
        if (window.faceLogic) {
            window.faceLogic.suspiciousKeySequences = window.faceLogic.suspiciousKeySequences.slice(-20);
        }

        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }

    /**
     * Optimize video processing
     */
    optimizeVideoProcessing() {
        console.warn('Low frame rate detected, optimizing video processing...');
        
        // Reduce face detection frequency
        if (window.faceLogic) {
            // This would need to be implemented in the face detection system
            console.log('Reducing face detection frequency to improve performance');
        }

        // Reduce audio processing complexity
        if (window.audioProctoring) {
            console.log('Optimizing audio processing for better performance');
        }
    }

    /**
     * Determine error severity
     */
    determineSeverity(error) {
        const message = error?.message?.toLowerCase() || '';
        
        if (message.includes('camera') || message.includes('microphone') || 
            message.includes('permission') || message.includes('access')) {
            return 'critical';
        }
        
        if (message.includes('network') || message.includes('fetch') || 
            message.includes('connection')) {
            return 'high';
        }
        
        if (message.includes('face') || message.includes('audio') || 
            message.includes('detection')) {
            return 'medium';
        }
        
        return 'low';
    }

    /**
     * Log error with violation logger
     */
    logError(errorInfo) {
        this.errors.push(errorInfo);
        
        // Keep only recent errors
        if (this.errors.length > 100) {
            this.errors = this.errors.slice(-50);
        }

        // Log to violation system if available
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'system_error',
                errorInfo.severity,
                `System error: ${errorInfo.message}`,
                {
                    errorType: errorInfo.type,
                    filename: errorInfo.filename,
                    line: errorInfo.line,
                    stack: errorInfo.stack,
                    errorCount: this.errors.length
                },
                errorInfo.severity === 'critical'
            );
        }

        // Track critical errors
        if (errorInfo.severity === 'critical') {
            this.criticalErrors.push(errorInfo);
            
            if (this.criticalErrors.length >= this.criticalThreshold) {
                this.handleCriticalErrorThreshold();
            }
        }

        console.error('Error logged:', errorInfo);
    }

    /**
     * Handle critical error threshold reached
     */
    handleCriticalErrorThreshold() {
        console.error('Critical error threshold reached, implementing emergency measures');
        
        // Show critical error modal
        this.showCriticalErrorModal();
        
        // Enable all fallback modes
        Object.keys(this.fallbackModes).forEach(key => {
            this.enableFallbackMode(key);
        });
    }

    /**
     * Show critical error modal
     */
    showCriticalErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'critical-error-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10001;
            font-family: Arial, sans-serif;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 30px;
                border-radius: 10px;
                text-align: center;
                max-width: 500px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            ">
                <div style="color: #e74c3c; font-size: 48px; margin-bottom: 20px;">⚠️</div>
                <h2 style="color: #2c3e50; margin-bottom: 20px;">System Error Detected</h2>
                <p style="color: #34495e; margin-bottom: 20px; line-height: 1.5;">
                    Multiple critical errors have been detected. The system is now running in fallback mode 
                    to ensure exam continuity. Your exam progress is being saved.
                </p>
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <strong>Fallback measures active:</strong><br>
                    • Reduced monitoring frequency<br>
                    • Local data backup enabled<br>
                    • Error recovery protocols active
                </div>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 5px;
                    font-size: 16px;
                    cursor: pointer;
                ">Continue Exam</button>
            </div>
        `;

        document.body.appendChild(modal);
    }

    /**
     * Handle error recovery
     */
    handleErrorRecovery(errorInfo) {
        switch (errorInfo.type) {
            case 'javascript_error':
                this.recoverFromJavaScriptError(errorInfo);
                break;
            case 'unhandled_rejection':
                this.recoverFromPromiseRejection(errorInfo);
                break;
            case 'network_error':
                this.recoverFromNetworkError(errorInfo);
                break;
        }
    }

    /**
     * Recover from JavaScript errors
     */
    recoverFromJavaScriptError(errorInfo) {
        // Attempt to restart failed components
        if (errorInfo.message.includes('face')) {
            this.restartFaceDetection();
        } else if (errorInfo.message.includes('audio')) {
            this.restartAudioProcessing();
        } else if (errorInfo.message.includes('behavior')) {
            this.restartBehaviorMonitoring();
        }
    }

    /**
     * Recover from promise rejections
     */
    recoverFromPromiseRejection(errorInfo) {
        console.warn('Attempting recovery from promise rejection:', errorInfo.message);
        
        // Implement specific recovery strategies
        if (errorInfo.message.includes('camera') || errorInfo.message.includes('video')) {
            this.enableFallbackMode('camera');
        } else if (errorInfo.message.includes('microphone') || errorInfo.message.includes('audio')) {
            this.enableFallbackMode('microphone');
        }
    }

    /**
     * Recover from network errors
     */
    recoverFromNetworkError(errorInfo) {
        console.warn('Network error detected, enabling offline mode');
        
        // Enable local storage fallbacks
        this.enableOfflineMode();
    }

    /**
     * Enable fallback mode for a component
     */
    enableFallbackMode(component) {
        this.fallbackModes[component] = true;
        console.warn(`Fallback mode enabled for: ${component}`);
        
        switch (component) {
            case 'camera':
                this.enableCameraFallback();
                break;
            case 'microphone':
                this.enableMicrophoneFallback();
                break;
            case 'faceDetection':
                this.enableFaceDetectionFallback();
                break;
            case 'audioProcessing':
                this.enableAudioProcessingFallback();
                break;
            case 'behaviorMonitoring':
                this.enableBehaviorMonitoringFallback();
                break;
            case 'fullscreen':
                this.enableFullscreenFallback();
                break;
        }
    }

    /**
     * Enable camera fallback
     */
    enableCameraFallback() {
        // Show static image or disable video monitoring
        const videoFeed = document.getElementById('video-feed');
        if (videoFeed) {
            videoFeed.style.display = 'none';
            
            // Show fallback message
            const fallbackDiv = document.createElement('div');
            fallbackDiv.style.cssText = `
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px;
                border-radius: 8px;
                text-align: center;
            `;
            fallbackDiv.innerHTML = `
                <div style="font-size: 24px; margin-bottom: 10px;">📷</div>
                <div>Camera monitoring disabled</div>
                <div style="font-size: 12px; margin-top: 5px;">Fallback mode active</div>
            `;
            
            const videoContainer = document.getElementById('video-container');
            if (videoContainer) {
                videoContainer.appendChild(fallbackDiv);
            }
        }
    }

    /**
     * Enable microphone fallback
     */
    enableMicrophoneFallback() {
        console.warn('Microphone fallback enabled - audio monitoring reduced');
        
        // Disable advanced audio processing
        if (window.audioProctoring) {
            try {
                window.audioProctoring.cleanup();
            } catch (error) {
                console.error('Error cleaning up audio proctoring:', error);
            }
        }
    }

    /**
     * Enable face detection fallback
     */
    enableFaceDetectionFallback() {
        console.warn('Face detection fallback enabled - using basic monitoring');
        
        // Reduce face detection frequency
        if (window.faceLogic) {
            window.faceLogic.updateThresholds({
                brightness: { min: 30, max: 250 }, // More lenient thresholds
                face: { centerThreshold: 0.4 } // More lenient positioning
            });
        }
    }

    /**
     * Enable audio processing fallback
     */
    enableAudioProcessingFallback() {
        console.warn('Audio processing fallback enabled - basic monitoring only');
        
        // Disable voice separation
        if (window.audioProctoring && window.audioProctoring.voiceSeparation) {
            window.audioProctoring.voiceSeparation.stopMonitoring();
        }
    }

    /**
     * Enable behavior monitoring fallback
     */
    enableBehaviorMonitoringFallback() {
        console.warn('Behavior monitoring fallback enabled - reduced sensitivity');
        
        // Reduce monitoring sensitivity
        if (window.behaviorMonitor) {
            // This would need to be implemented in the behavior monitor
            console.log('Reducing behavior monitoring sensitivity');
        }
    }

    /**
     * Enable fullscreen fallback
     */
    enableFullscreenFallback() {
        console.warn('Fullscreen fallback enabled - warnings only');
        
        // Disable automatic fullscreen enforcement
        if (window.fullscreenManager) {
            window.fullscreenManager.autoReturnTimeout = null;
        }
    }

    /**
     * Enable offline mode
     */
    enableOfflineMode() {
        console.warn('Offline mode enabled - storing data locally');
        
        // Enable local storage for all violations
        const offlineNotice = document.createElement('div');
        offlineNotice.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #f39c12;
            color: white;
            padding: 10px 15px;
            border-radius: 5px;
            font-size: 14px;
            z-index: 1002;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        offlineNotice.innerHTML = '📡 Offline Mode - Data stored locally';
        document.body.appendChild(offlineNotice);
    }

    /**
     * Restart face detection
     */
    async restartFaceDetection() {
        console.log('Attempting to restart face detection...');
        
        try {
            if (window.faceLogic) {
                // Reset violation counts
                window.faceLogic.resetViolationCounts();
                console.log('Face detection restarted successfully');
            }
        } catch (error) {
            console.error('Failed to restart face detection:', error);
            this.enableFallbackMode('faceDetection');
        }
    }

    /**
     * Restart audio processing
     */
    async restartAudioProcessing() {
        console.log('Attempting to restart audio processing...');
        
        try {
            const audioProctoring = await import('./audio/index.js');
            await audioProctoring.default.initialize();
            console.log('Audio processing restarted successfully');
        } catch (error) {
            console.error('Failed to restart audio processing:', error);
            this.enableFallbackMode('audioProcessing');
        }
    }

    /**
     * Restart behavior monitoring
     */
    restartBehaviorMonitoring() {
        console.log('Attempting to restart behavior monitoring...');
        
        try {
            if (window.behaviorMonitor) {
                window.behaviorMonitor.stop();
                window.behaviorMonitor.initialize();
                console.log('Behavior monitoring restarted successfully');
            }
        } catch (error) {
            console.error('Failed to restart behavior monitoring:', error);
            this.enableFallbackMode('behaviorMonitoring');
        }
    }

    /**
     * Get error statistics
     */
    getStatistics() {
        const errorsByType = {};
        const errorsBySeverity = {};
        
        this.errors.forEach(error => {
            errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
            errorsBySeverity[error.severity] = (errorsBySeverity[error.severity] || 0) + 1;
        });
        
        return {
            totalErrors: this.errors.length,
            criticalErrors: this.criticalErrors.length,
            errorsByType,
            errorsBySeverity,
            fallbackModes: { ...this.fallbackModes },
            recentErrors: this.errors.slice(-10)
        };
    }

    /**
     * Export error log
     */
    exportErrorLog() {
        const errorLog = {
            timestamp: new Date().toISOString(),
            statistics: this.getStatistics(),
            errors: this.errors,
            criticalErrors: this.criticalErrors,
            fallbackModes: this.fallbackModes,
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine
            }
        };
        
        return JSON.stringify(errorLog, null, 2);
    }

    /**
     * Clear error log
     */
    clearErrors() {
        this.errors = [];
        this.criticalErrors = [];
        console.log('Error log cleared');
    }

    /**
     * Test error handling system
     */
    testErrorHandling() {
        console.log('Testing error handling system...');
        
        // Test different error types
        setTimeout(() => {
            throw new Error('Test JavaScript error');
        }, 100);
        
        setTimeout(() => {
            Promise.reject(new Error('Test promise rejection'));
        }, 200);
        
        setTimeout(() => {
            console.error('Test console error');
        }, 300);
        
        console.log('Error handling tests initiated');
    }

    /**
     * Cleanup error handler
     */
    cleanup() {
        // Remove error modal if present
        const modal = document.getElementById('critical-error-modal');
        if (modal) {
            modal.remove();
        }
        
        // Clear intervals and timeouts
        // (Add any cleanup needed for monitoring intervals)
        
        console.log('Error handler cleaned up');
    }
}

// Create and export singleton instance
window.errorHandler = new ErrorHandler();
export default window.errorHandler;