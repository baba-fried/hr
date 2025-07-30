class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.exitCount = 0;
        this.lastExitTime = null;
        this.isFullscreenSupported = this.checkFullscreenSupport();
        this.initialize();
    }

    checkFullscreenSupport() {
        const elem = document.documentElement;
        return Boolean(
            elem.requestFullscreen ||
            elem.webkitRequestFullscreen ||
            elem.mozRequestFullScreen ||
            elem.msRequestFullscreen
        );
    }

    checkFullscreenSupport() {
        const elem = document.documentElement;
        return !!(elem.requestFullscreen || elem.webkitRequestFullscreen || 
                 elem.mozRequestFullScreen || elem.msRequestFullscreen);
    }

    initialize() {
        // Monitor fullscreen changes
        document.addEventListener('fullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('webkitfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('mozfullscreenchange', () => this.handleFullscreenChange());
        document.addEventListener('MSFullscreenChange', () => this.handleFullscreenChange());

        // Monitor escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isFullscreen) {
                e.preventDefault();
                this.handleEscapeKey();
            }
        });

        // Monitor tab visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isFullscreen) {
                this.showModal('Tabbing is not allowed during the exam.');
            }
        });

        // Setup modal button
        const modalOk = document.getElementById('modal-ok');
        if (modalOk) {
            modalOk.addEventListener('click', () => {
                this.hideModal();
                this.requestFullscreen();
            });
        }
    }

    async requestFullscreen() {
        if (!this.isFullscreenSupported) {
            console.error('Fullscreen mode is not supported in this browser');
            this.showModal('Fullscreen mode is not supported in your browser. Please use a modern browser to continue the exam.');
            return;
        }

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
            
            // Log successful fullscreen entry silently
            if (window.violationLogger && this.exitCount > 0) {
                window.violationLogger.logViolation(
                    'fullscreen_restored',
                    'medium',
                    'Fullscreen mode restored',
                    { exitCount: this.exitCount },
                    false // Don't show alert
                );
            }
        } catch (error) {
            console.error(JSON.stringify(error));
            this.showModal('Please allow fullscreen mode to continue the exam');
            
            // Log fullscreen denial silently
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'fullscreen_denied',
                    'high',
                    'Fullscreen permission denied',
                    { error: error.message },
                    false // Don't show alert
                );
            }
        }
    }

    handleFullscreenChange() {
        const wasFullscreen = this.isFullscreen;
        this.isFullscreen = !!(document.fullscreenElement || document.webkitFullscreenElement ||
                             document.mozFullScreenElement || document.msFullscreenElement);

        // Update status indicator
        const statusIcon = document.querySelector('#fullscreen-status .status-icon');
        if (statusIcon) {
            statusIcon.className = `status-icon ${this.isFullscreen ? 'status-active' : 'status-error'}`;
        }

        if (wasFullscreen && !this.isFullscreen) {
            this.exitCount++;
            this.lastExitTime = Date.now();
            
            // Show warning modal
            this.showModal('ESC is not allowed. Please remain in fullscreen.');
            
            // Log violation silently
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'fullscreen_exit',
                    this.exitCount > 3 ? 'critical' : 'high',
                    `Fullscreen exit detected (${this.exitCount} times)`,
                    { exitCount: this.exitCount },
                    false // Don't show alert
                );
            }
            
            // Add to event log if available
            if (window.faceUI) {
                window.faceUI.addEvent('🚨 Exited fullscreen mode');
            }
        }
    }

    handleEscapeKey() {
        // Show modal warning
        this.showModal('ESC is not allowed. Please remain in fullscreen.');
        
        // Log silently
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'escape_key_fullscreen',
                'medium',
                'Escape key pressed',
                { exitCount: this.exitCount },
                false // Don't show alert
            );
        }
    }

    showModal(message) {
        const overlay = document.getElementById('modal-overlay');
        const messageEl = document.getElementById('modal-message');
        if (overlay && messageEl) {
            messageEl.textContent = message;
            overlay.style.display = 'flex';
            document.getElementById('exam-container').style.filter = 'blur(8px)';
        }
    }

    hideModal() {
        const overlay = document.getElementById('modal-overlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.getElementById('exam-container').style.filter = 'none';
        }
    }
}

// Initialize fullscreen manager
const fullscreenManager = new FullscreenManager();

// Export for use in other modules
window.fullscreenManager = fullscreenManager;