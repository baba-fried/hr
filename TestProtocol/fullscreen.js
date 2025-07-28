class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.exitCount = 0;
        this.lastExitTime = null;
        this.warningShown = false;
        this.autoReturnTimeout = null;
        this.initialize();
    }

    initialize() {
        // Request fullscreen on page load
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => this.requestFullscreen(), 1000); // Delay to ensure page is ready
        });

        // Monitor fullscreen changes
        document.addEventListener('fullscreenchange', () => {
            this.handleFullscreenChange();
        });
        document.addEventListener('webkitfullscreenchange', () => {
            this.handleFullscreenChange();
        });
        document.addEventListener('mozfullscreenchange', () => {
            this.handleFullscreenChange();
        });
        document.addEventListener('MSFullscreenChange', () => {
            this.handleFullscreenChange();
        });

        // Monitor escape key specifically for fullscreen exit
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isFullscreen) {
                this.handleEscapeKey();
            }
        });

        // Monitor F11 key for fullscreen toggle
        document.addEventListener('keydown', (event) => {
            if (event.key === 'F11') {
                event.preventDefault();
                this.handleF11Key();
            }
        });
    }

    async requestFullscreen() {
        const elem = document.documentElement;
        try {
            if (elem.requestFullscreen) {
                await elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                await elem.webkitRequestFullscreen();
            } else if (elem.msRequestFullscreen) {
                await elem.msRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                await elem.mozRequestFullScreen();
            }
            
            console.log('Fullscreen mode activated');
            
            // Log successful fullscreen entry
            if (window.violationLogger && this.exitCount > 0) {
                window.violationLogger.logViolation(
                    'fullscreen_restored',
                    'medium',
                    'Fullscreen mode restored',
                    {
                        exitCount: this.exitCount,
                        timeSinceLastExit: this.lastExitTime ? Date.now() - this.lastExitTime : null
                    },
                    false // Don't show alert for restoration
                );
            }
            
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
            this.showWarning('Please allow fullscreen mode to continue the exam');
            
            // Log fullscreen denial
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'fullscreen_denied',
                    'high',
                    'Fullscreen permission denied',
                    {
                        error: error.message,
                        userAgent: navigator.userAgent
                    }
                );
            }
        }
    }

    handleFullscreenChange() {
        const wasFullscreen = this.isFullscreen;
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (wasFullscreen && !this.isFullscreen) {
            // Exited fullscreen
            this.exitCount++;
            this.lastExitTime = Date.now();
            
            // Log the violation
            this.logFullscreenExit();
            
            // Show warning modal
            this.showFullscreenWarning();
            
            // Add to event log if available
            if (window.faceUI) {
                window.faceUI.addEvent('🚨 Exited fullscreen mode');
            }
            
            // Auto request fullscreen after warning
            this.autoReturnTimeout = setTimeout(() => {
                this.requestFullscreen();
            }, 3000); // 3 second delay
            
        } else if (!wasFullscreen && this.isFullscreen) {
            // Entered fullscreen
            this.warningShown = false;
            this.hideFullscreenWarning();
            
            if (this.autoReturnTimeout) {
                clearTimeout(this.autoReturnTimeout);
                this.autoReturnTimeout = null;
            }
        }
    }

    handleEscapeKey() {
        // Log escape key usage in fullscreen
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'escape_key_fullscreen',
                'medium',
                'Escape key pressed in fullscreen mode',
                {
                    exitCount: this.exitCount,
                    timestamp: Date.now()
                }
            );
        }
    }

    handleF11Key() {
        // Log F11 key usage
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'f11_key_pressed',
                'medium',
                'F11 key pressed (fullscreen toggle blocked)',
                {
                    currentFullscreen: this.isFullscreen,
                    exitCount: this.exitCount
                }
            );
        }
    }

    logFullscreenExit() {
        const severity = this.getSeverityByExitCount();
        const description = this.getExitDescription();
        
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'fullscreen_exit',
                severity,
                description,
                {
                    exitCount: this.exitCount,
                    lastExitTime: this.lastExitTime,
                    timeBetweenExits: this.getTimeBetweenExits(),
                    screenResolution: `${screen.width}x${screen.height}`,
                    windowSize: `${window.innerWidth}x${window.innerHeight}`
                }
            );
        }
    }

    getSeverityByExitCount() {
        if (this.exitCount === 1) return 'medium';
        if (this.exitCount <= 3) return 'high';
        return 'critical';
    }

    getExitDescription() {
        if (this.exitCount === 1) {
            return 'First fullscreen exit detected';
        } else if (this.exitCount <= 3) {
            return `Multiple fullscreen exits detected (${this.exitCount} times)`;
        } else {
            return `Repeated fullscreen violations (${this.exitCount} times) - Critical concern`;
        }
    }

    getTimeBetweenExits() {
        // This would need to track previous exit times for accurate calculation
        // For now, return null as we only track the last exit time
        return null;
    }

    showFullscreenWarning() {
        if (this.warningShown) return;
        
        this.warningShown = true;
        
        // Create modal warning
        const modal = document.createElement('div');
        modal.id = 'fullscreen-warning-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        
        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 10px;
            text-align: center;
            max-width: 500px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        const severity = this.getSeverityByExitCount();
        const warningColor = severity === 'critical' ? '#e74c3c' : severity === 'high' ? '#f39c12' : '#f1c40f';
        
        content.innerHTML = `
            <div style="color: ${warningColor}; font-size: 48px; margin-bottom: 20px;">⚠️</div>
            <h2 style="color: #2c3e50; margin-bottom: 20px;">Fullscreen Required</h2>
            <p style="color: #34495e; margin-bottom: 20px; line-height: 1.5;">
                The exam must be taken in fullscreen mode. Exiting fullscreen is a violation.
            </p>
            <p style="color: ${warningColor}; font-weight: bold; margin-bottom: 20px;">
                Violation Count: ${this.exitCount}
            </p>
            <button id="return-fullscreen-btn" style="
                background: #3498db;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 5px;
                font-size: 16px;
                cursor: pointer;
                margin-right: 10px;
            ">Return to Fullscreen</button>
            <div style="margin-top: 15px; font-size: 12px; color: #7f8c8d;">
                Returning to fullscreen automatically in <span id="countdown">3</span> seconds...
            </div>
        `;
        
        modal.appendChild(content);
        document.body.appendChild(modal);
        
        // Add click handler for button
        document.getElementById('return-fullscreen-btn').addEventListener('click', () => {
            this.requestFullscreen();
        });
        
        // Countdown timer
        let countdown = 3;
        const countdownElement = document.getElementById('countdown');
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdownElement) {
                countdownElement.textContent = countdown;
            }
            if (countdown <= 0) {
                clearInterval(countdownInterval);
            }
        }, 1000);
        
        // Use existing alert system as backup
        this.showWarning('Fullscreen is required. Click OK to continue.');
    }

    hideFullscreenWarning() {
        const modal = document.getElementById('fullscreen-warning-modal');
        if (modal) {
            modal.remove();
        }
    }

    showWarning(message) {
        // Use existing alert system if available
        if (window.alerts && typeof window.alerts.showAlert === 'function') {
            window.alerts.showAlert(message, 'warning');
        } else {
            // Fallback to browser alert
            alert(message);
        }
    }

    /**
     * Force fullscreen mode
     */
    forceFullscreen() {
        if (!this.isFullscreen) {
            this.requestFullscreen();
        }
    }

    /**
     * Get fullscreen statistics
     */
    getStatistics() {
        return {
            isFullscreen: this.isFullscreen,
            exitCount: this.exitCount,
            lastExitTime: this.lastExitTime,
            warningShown: this.warningShown
        };
    }

    /**
     * Reset violation count
     */
    resetViolations() {
        this.exitCount = 0;
        this.lastExitTime = null;
        this.warningShown = false;
    }

    /**
     * Check if fullscreen is supported
     */
    isFullscreenSupported() {
        const elem = document.documentElement;
        return !!(
            elem.requestFullscreen ||
            elem.webkitRequestFullscreen ||
            elem.msRequestFullscreen ||
            elem.mozRequestFullScreen
        );
    }

    /**
     * Cleanup
     */
    cleanup() {
        if (this.autoReturnTimeout) {
            clearTimeout(this.autoReturnTimeout);
        }
        this.hideFullscreenWarning();
    }
}

// Initialize fullscreen manager
window.fullscreenManager = new FullscreenManager();