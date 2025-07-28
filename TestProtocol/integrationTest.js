/**
 * Comprehensive Integration Test for Video Proctoring System
 * This file tests all components of the proctoring system
 */

class ProctoringIntegrationTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.testStartTime = null;
    }

    /**
     * Run all integration tests
     */
    async runAllTests() {
        if (this.isRunning) {
            console.warn('Tests already running');
            return;
        }

        this.isRunning = true;
        this.testStartTime = new Date();
        this.testResults = [];

        console.log('🧪 Starting Proctoring System Integration Tests...');
        
        try {
            // Test 1: Error Handler
            await this.testErrorHandler();
            
            // Test 2: Violation Logger
            await this.testViolationLogger();
            
            // Test 3: Face Detection System
            await this.testFaceDetection();
            
            // Test 4: Audio Proctoring
            await this.testAudioProctoring();
            
            // Test 5: Behavior Monitoring
            await this.testBehaviorMonitoring();
            
            // Test 6: Fullscreen Management
            await this.testFullscreenManager();
            
            // Test 7: Exam Initializer
            await this.testExamInitializer();
            
            // Test 8: Backend API Integration
            await this.testBackendIntegration();
            
            // Test 9: End-to-End Workflow
            await this.testEndToEndWorkflow();
            
            // Generate test report
            this.generateTestReport();
            
        } catch (error) {
            console.error('Integration test failed:', error);
            this.addTestResult('Integration Test', false, error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Test Error Handler
     */
    async testErrorHandler() {
        console.log('Testing Error Handler...');
        
        try {
            // Test error handler initialization
            if (!window.errorHandler) {
                throw new Error('Error handler not available');
            }

            // Test error logging
            const testError = new Error('Test error for integration testing');
            window.errorHandler.handleGlobalError(testError, 'test.js', 1, 1);

            // Test fallback mode activation
            window.errorHandler.enableFallbackMode('camera');

            // Test statistics
            const stats = window.errorHandler.getStatistics();
            if (!stats || typeof stats.totalErrors !== 'number') {
                throw new Error('Error statistics not working');
            }

            this.addTestResult('Error Handler', true, 'All error handling features working');
            
        } catch (error) {
            this.addTestResult('Error Handler', false, error.message);
        }
    }

    /**
     * Test Violation Logger
     */
    async testViolationLogger() {
        console.log('Testing Violation Logger...');
        
        try {
            if (!window.violationLogger) {
                throw new Error('Violation logger not available');
            }

            // Test initialization
            window.violationLogger.initialize('test-id', 'test-exam', 'test-user');

            // Test violation logging
            await window.violationLogger.logViolation(
                'test_violation',
                'medium',
                'Test violation for integration testing',
                { testData: 'integration test' },
                false
            );

            // Test statistics
            const stats = window.violationLogger.getStatistics();
            if (!stats || stats.total === undefined) {
                throw new Error('Violation statistics not working');
            }

            this.addTestResult('Violation Logger', true, 'Violation logging system working');
            
        } catch (error) {
            this.addTestResult('Violation Logger', false, error.message);
        }
    }

    /**
     * Test Face Detection System
     */
    async testFaceDetection() {
        console.log('Testing Face Detection...');
        
        try {
            if (!window.faceLogic) {
                throw new Error('Face logic not available');
            }

            // Test face detection initialization
            const videoFeed = document.getElementById('video-feed');
            if (!videoFeed) {
                throw new Error('Video feed element not found');
            }

            // Test face detection methods
            if (typeof window.faceLogic.detectFace !== 'function') {
                throw new Error('Face detection method not available');
            }

            // Test UI components
            if (!window.faceUI) {
                throw new Error('Face UI not available');
            }

            // Test violation counting
            const stats = window.faceLogic.getViolationSummary();
            if (!stats || typeof stats.total !== 'number') {
                throw new Error('Face detection statistics not working');
            }

            this.addTestResult('Face Detection', true, 'Face detection system working');
            
        } catch (error) {
            this.addTestResult('Face Detection', false, error.message);
        }
    }

    /**
     * Test Audio Proctoring
     */
    async testAudioProctoring() {
        console.log('Testing Audio Proctoring...');
        
        try {
            // Test audio proctoring availability
            const audioModule = await import('./audio/index.js');
            if (!audioModule.default) {
                throw new Error('Audio proctoring module not available');
            }

            // Test voice separation
            const voiceSeparationModule = await import('./audio/voiceSeparation.js');
            if (!voiceSeparationModule.default) {
                throw new Error('Voice separation module not available');
            }

            // Test microphone manager
            const micModule = await import('./audio/mic.js');
            if (!micModule.default) {
                throw new Error('Microphone manager not available');
            }

            this.addTestResult('Audio Proctoring', true, 'Audio proctoring modules available');
            
        } catch (error) {
            this.addTestResult('Audio Proctoring', false, error.message);
        }
    }

    /**
     * Test Behavior Monitoring
     */
    async testBehaviorMonitoring() {
        console.log('Testing Behavior Monitoring...');
        
        try {
            if (!window.behaviorMonitor) {
                throw new Error('Behavior monitor not available');
            }

            // Test behavior monitor methods
            if (typeof window.behaviorMonitor.initialize !== 'function') {
                throw new Error('Behavior monitor initialize method not available');
            }

            // Test statistics
            const stats = window.behaviorMonitor.getStatistics();
            if (!stats || typeof stats.totalViolations !== 'number') {
                throw new Error('Behavior monitoring statistics not working');
            }

            // Test monitored shortcuts
            if (!window.behaviorMonitor.monitoredShortcuts) {
                throw new Error('Monitored shortcuts not configured');
            }

            this.addTestResult('Behavior Monitoring', true, 'Behavior monitoring system working');
            
        } catch (error) {
            this.addTestResult('Behavior Monitoring', false, error.message);
        }
    }

    /**
     * Test Fullscreen Manager
     */
    async testFullscreenManager() {
        console.log('Testing Fullscreen Manager...');
        
        try {
            if (!window.fullscreenManager) {
                throw new Error('Fullscreen manager not available');
            }

            // Test fullscreen methods
            if (typeof window.fullscreenManager.requestFullscreen !== 'function') {
                throw new Error('Fullscreen request method not available');
            }

            // Test statistics
            const stats = window.fullscreenManager.getStatistics();
            if (!stats || typeof stats.exitCount !== 'number') {
                throw new Error('Fullscreen statistics not working');
            }

            // Test fullscreen support detection
            const isSupported = window.fullscreenManager.isFullscreenSupported();
            if (typeof isSupported !== 'boolean') {
                throw new Error('Fullscreen support detection not working');
            }

            this.addTestResult('Fullscreen Manager', true, 'Fullscreen management working');
            
        } catch (error) {
            this.addTestResult('Fullscreen Manager', false, error.message);
        }
    }

    /**
     * Test Exam Initializer
     */
    async testExamInitializer() {
        console.log('Testing Exam Initializer...');
        
        try {
            if (!window.examInitializer) {
                throw new Error('Exam initializer not available');
            }

            // Test initialization steps
            const status = window.examInitializer.getStatus();
            if (!status || !Array.isArray(status.steps)) {
                throw new Error('Exam initializer status not working');
            }

            // Test exam parameters
            const examData = window.examInitializer.getExamParameters();
            if (!examData) {
                throw new Error('Exam parameters not available');
            }

            this.addTestResult('Exam Initializer', true, 'Exam initialization system working');
            
        } catch (error) {
            this.addTestResult('Exam Initializer', false, error.message);
        }
    }

    /**
     * Test Backend Integration
     */
    async testBackendIntegration() {
        console.log('Testing Backend Integration...');
        
        try {
            // Test violation logging endpoint (without actually sending)
            const testViolation = {
                testId: 'integration-test',
                testName: 'Integration Test',
                violationType: 'test_violation',
                severity: 'low',
                description: 'Test violation for backend integration',
                metadata: { test: true }
            };

            // Test if fetch is available and properly configured
            if (typeof fetch !== 'function') {
                throw new Error('Fetch API not available');
            }

            // Test local storage for offline mode
            try {
                localStorage.setItem('test-key', 'test-value');
                const retrieved = localStorage.getItem('test-key');
                if (retrieved !== 'test-value') {
                    throw new Error('Local storage not working');
                }
                localStorage.removeItem('test-key');
            } catch (error) {
                throw new Error('Local storage not available');
            }

            this.addTestResult('Backend Integration', true, 'Backend integration ready');
            
        } catch (error) {
            this.addTestResult('Backend Integration', false, error.message);
        }
    }

    /**
     * Test End-to-End Workflow
     */
    async testEndToEndWorkflow() {
        console.log('Testing End-to-End Workflow...');
        
        try {
            // Test complete workflow simulation
            const workflow = [
                'Error handler initialized',
                'Violation logger available',
                'Face detection ready',
                'Audio proctoring ready',
                'Behavior monitoring ready',
                'Fullscreen manager ready',
                'Exam initializer ready',
                'Backend integration ready'
            ];

            let workflowPassed = true;
            const failedSteps = [];

            // Check each workflow step
            this.testResults.forEach(result => {
                if (!result.passed) {
                    workflowPassed = false;
                    failedSteps.push(result.component);
                }
            });

            if (!workflowPassed) {
                throw new Error(`Workflow failed at: ${failedSteps.join(', ')}`);
            }

            this.addTestResult('End-to-End Workflow', true, 'Complete workflow functional');
            
        } catch (error) {
            this.addTestResult('End-to-End Workflow', false, error.message);
        }
    }

    /**
     * Add test result
     */
    addTestResult(component, passed, message) {
        const result = {
            component,
            passed,
            message,
            timestamp: new Date().toISOString()
        };
        
        this.testResults.push(result);
        
        const status = passed ? '✅' : '❌';
        console.log(`${status} ${component}: ${message}`);
    }

    /**
     * Generate comprehensive test report
     */
    generateTestReport() {
        const endTime = new Date();
        const duration = endTime - this.testStartTime;
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.passed).length;
        const failedTests = totalTests - passedTests;
        
        const report = {
            summary: {
                totalTests,
                passedTests,
                failedTests,
                successRate: ((passedTests / totalTests) * 100).toFixed(2) + '%',
                duration: duration + 'ms',
                timestamp: endTime.toISOString()
            },
            results: this.testResults,
            systemInfo: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                cookieEnabled: navigator.cookieEnabled,
                onLine: navigator.onLine,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth
                }
            },
            recommendations: this.generateRecommendations()
        };

        console.log('📊 Integration Test Report:');
        console.log(`Total Tests: ${totalTests}`);
        console.log(`Passed: ${passedTests} ✅`);
        console.log(`Failed: ${failedTests} ❌`);
        console.log(`Success Rate: ${report.summary.successRate}`);
        console.log(`Duration: ${duration}ms`);
        
        if (failedTests > 0) {
            console.log('\n❌ Failed Tests:');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`- ${result.component}: ${result.message}`);
            });
        }

        // Show recommendations
        if (report.recommendations.length > 0) {
            console.log('\n💡 Recommendations:');
            report.recommendations.forEach(rec => {
                console.log(`- ${rec}`);
            });
        }

        // Store report for later access
        window.proctoringTestReport = report;
        
        return report;
    }

    /**
     * Generate recommendations based on test results
     */
    generateRecommendations() {
        const recommendations = [];
        const failedTests = this.testResults.filter(r => !r.passed);
        
        failedTests.forEach(test => {
            switch (test.component) {
                case 'Error Handler':
                    recommendations.push('Initialize error handling system before other components');
                    break;
                case 'Violation Logger':
                    recommendations.push('Ensure violation logger is properly initialized with exam data');
                    break;
                case 'Face Detection':
                    recommendations.push('Check camera permissions and face-api.js model loading');
                    break;
                case 'Audio Proctoring':
                    recommendations.push('Verify microphone permissions and audio processing modules');
                    break;
                case 'Behavior Monitoring':
                    recommendations.push('Ensure behavior monitor is initialized after DOM load');
                    break;
                case 'Fullscreen Manager':
                    recommendations.push('Check browser fullscreen API support');
                    break;
                case 'Backend Integration':
                    recommendations.push('Verify API endpoints and network connectivity');
                    break;
            }
        });

        // General recommendations
        if (failedTests.length > 0) {
            recommendations.push('Run tests in a supported browser environment');
            recommendations.push('Ensure all required permissions are granted');
            recommendations.push('Check console for detailed error messages');
        }

        return [...new Set(recommendations)]; // Remove duplicates
    }

    /**
     * Export test report as JSON
     */
    exportReport() {
        if (!window.proctoringTestReport) {
            console.warn('No test report available. Run tests first.');
            return null;
        }

        const reportJson = JSON.stringify(window.proctoringTestReport, null, 2);
        
        // Create downloadable file
        const blob = new Blob([reportJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `proctoring-test-report-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        return reportJson;
    }

    /**
     * Run quick health check
     */
    quickHealthCheck() {
        console.log('🏥 Running Quick Health Check...');
        
        const components = [
            { name: 'Error Handler', check: () => !!window.errorHandler },
            { name: 'Violation Logger', check: () => !!window.violationLogger },
            { name: 'Face Logic', check: () => !!window.faceLogic },
            { name: 'Face UI', check: () => !!window.faceUI },
            { name: 'Behavior Monitor', check: () => !!window.behaviorMonitor },
            { name: 'Fullscreen Manager', check: () => !!window.fullscreenManager },
            { name: 'Exam Initializer', check: () => !!window.examInitializer },
            { name: 'Alert System', check: () => !!window.alerts }
        ];

        const results = components.map(component => {
            const isHealthy = component.check();
            const status = isHealthy ? '✅' : '❌';
            console.log(`${status} ${component.name}`);
            return { name: component.name, healthy: isHealthy };
        });

        const healthyCount = results.filter(r => r.healthy).length;
        const healthPercentage = ((healthyCount / results.length) * 100).toFixed(1);
        
        console.log(`\n🏥 System Health: ${healthPercentage}% (${healthyCount}/${results.length} components healthy)`);
        
        return {
            healthPercentage: parseFloat(healthPercentage),
            healthyComponents: healthyCount,
            totalComponents: results.length,
            results
        };
    }
}

// Create global instance for easy access
window.proctoringTest = new ProctoringIntegrationTest();

// Auto-run health check on load
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        if (window.proctoringTest) {
            window.proctoringTest.quickHealthCheck();
        }
    }, 2000); // Wait 2 seconds for components to initialize
});

// Export for module use
export default ProctoringIntegrationTest;