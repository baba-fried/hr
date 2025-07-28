class FullscreenManager {
    constructor() {
        this.isFullscreen = false;
        this.initialize();
    }

    initialize() {
        // Request fullscreen on page load
        document.addEventListener('DOMContentLoaded', () => {
            this.requestFullscreen();
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
        } catch (error) {
            console.error('Failed to enter fullscreen:', error);
            this.showWarning('Please allow fullscreen mode to continue the exam');
        }
    }

    handleFullscreenChange() {
        this.isFullscreen = !!(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );

        if (!this.isFullscreen) {
            this.showWarning('Please return to fullscreen mode to continue');
            // Add to event log if available
            if (window.faceUI) {
                window.faceUI.addEvent('⚠️ Exited fullscreen mode');
            }
            // Auto request fullscreen after warning
            setTimeout(() => this.requestFullscreen(), 1000);
        }
    }

    showWarning(message) {
        // Use existing alert system if available
        if (window.alerts && typeof window.alerts.showAlert === 'function') {
            window.alerts.showAlert(message, 'warning');
        } else {
            alert(message);
        }
    }
}

// Initialize fullscreen manager
window.fullscreenManager = new FullscreenManager();