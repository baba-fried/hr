class AudioAlerts {
    constructor(parentElement) {
        this.parentElement = parentElement || document.body;
        this.alertContainer = null;
        this.volumeBar = null;
        this.waveformCanvas = null;
        this.waveformCtx = null;
        this.activeAlerts = new Set();
        
        // Create UI elements
        this.createUIElements();
    }

    /**
     * Create UI elements for audio monitoring
     */
    createUIElements() {
        // Create alert container if it doesn't exist
        if (!this.alertContainer) {
            this.alertContainer = document.createElement('div');
            this.alertContainer.className = 'audio-alerts';
            this.alertContainer.style.position = 'absolute';
            this.alertContainer.style.top = '10px';
            this.alertContainer.style.right = '10px';
            this.alertContainer.style.zIndex = '1000';
            this.parentElement.appendChild(this.alertContainer);
        }

        // Create volume bar
        const visualizerContainer = document.getElementById('audio-visualizer');
        if (visualizerContainer) {
            // Create volume bar
            this.volumeBar = document.createElement('div');
            this.volumeBar.className = 'volume-bar';
            this.volumeBar.style.width = '100%';
            this.volumeBar.style.height = '20px';
            this.volumeBar.style.backgroundColor = '#333';
            this.volumeBar.style.position = 'relative';
            this.volumeBar.style.marginBottom = '10px';
            this.volumeBar.style.borderRadius = '3px';
            this.volumeBar.style.overflow = 'hidden';
            
            const volumeLevel = document.createElement('div');
            volumeLevel.className = 'volume-level';
            volumeLevel.style.width = '0%';
            volumeLevel.style.height = '100%';
            volumeLevel.style.backgroundColor = '#4CAF50';
            volumeLevel.style.transition = 'width 0.1s';
            this.volumeBar.appendChild(volumeLevel);
            
            visualizerContainer.appendChild(this.volumeBar);
            
            // Create waveform canvas
            this.waveformCanvas = document.createElement('canvas');
            this.waveformCanvas.className = 'waveform-canvas';
            this.waveformCanvas.width = visualizerContainer.clientWidth;
            this.waveformCanvas.height = 80;
            this.waveformCanvas.style.backgroundColor = '#222';
            this.waveformCanvas.style.borderRadius = '3px';
            
            this.waveformCtx = this.waveformCanvas.getContext('2d');
            visualizerContainer.appendChild(this.waveformCanvas);
            
            // Handle resize
            window.addEventListener('resize', () => {
                this.waveformCanvas.width = visualizerContainer.clientWidth;
                this.clearWaveform();
            });
        }
    }

    /**
     * Show an alert
     * @param {string} type - Alert type ('silence', 'spike', 'continuousNoise')
     * @param {string} message - Alert message
     * @param {number} duration - Duration in milliseconds (0 for persistent)
     */
    showAlert(type, message, duration = 5000) {
        // Check if this alert is already active
        const alertId = `${type}-${Date.now()}`;
        if (this.activeAlerts.has(type)) return;
        
        // Add to active alerts
        this.activeAlerts.add(type);
        
        // Create alert element
        const alert = document.createElement('div');
        alert.className = `audio-alert audio-alert-${type}`;
        alert.style.padding = '10px 15px';
        alert.style.marginBottom = '10px';
        alert.style.borderRadius = '5px';
        alert.style.color = 'white';
        alert.style.fontWeight = 'bold';
        alert.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        alert.style.display = 'flex';
        alert.style.alignItems = 'center';
        alert.style.justifyContent = 'space-between';
        alert.style.animation = 'fadeIn 0.3s';
        
        // Set background color based on type
        switch (type) {
            case 'silence':
                alert.style.backgroundColor = '#f44336'; // Red
                break;
            case 'spike':
                alert.style.backgroundColor = '#ff9800'; // Orange
                break;
            case 'continuousNoise':
                alert.style.backgroundColor = '#2196F3'; // Blue
                break;
            default:
                alert.style.backgroundColor = '#333'; // Dark gray
        }
        
        // Add message
        alert.textContent = message;
        
        // Add close button
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.background = 'none';
        closeBtn.style.border = 'none';
        closeBtn.style.color = 'white';
        closeBtn.style.fontSize = '20px';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.marginLeft = '10px';
        closeBtn.onclick = () => this.removeAlert(alert, type);
        alert.appendChild(closeBtn);
        
        // Add to container
        this.alertContainer.appendChild(alert);
        
        // Auto-remove after duration (if not persistent)
        if (duration > 0) {
            setTimeout(() => {
                this.removeAlert(alert, type);
            }, duration);
        }
        
        return alert;
    }

    /**
     * Remove an alert
     * @param {HTMLElement} alert - Alert element
     * @param {string} type - Alert type
     */
    removeAlert(alert, type) {
        // Remove from active alerts
        this.activeAlerts.delete(type);
        
        // Animate and remove
        alert.style.animation = 'fadeOut 0.3s';
        setTimeout(() => {
            if (alert.parentNode === this.alertContainer) {
                this.alertContainer.removeChild(alert);
            }
        }, 300);
    }

    /**
     * Update volume bar
     * @param {number} volume - Volume level (0-100)
     */
    updateVolumeBar(volume) {
        if (!this.volumeBar) return;
        
        const volumeLevel = this.volumeBar.querySelector('.volume-level');
        if (volumeLevel) {
            volumeLevel.style.width = `${volume}%`;
            
            // Change color based on volume
            if (volume < 10) {
                volumeLevel.style.backgroundColor = '#4CAF50'; // Green
            } else if (volume < 70) {
                volumeLevel.style.backgroundColor = '#FFC107'; // Yellow
            } else {
                volumeLevel.style.backgroundColor = '#F44336'; // Red
            }
        }
    }

    /**
     * Update waveform visualization
     * @param {Uint8Array} dataArray - Frequency data array
     */
    updateWaveform(dataArray) {
        if (!this.waveformCtx || !this.waveformCanvas) return;
        
        const width = this.waveformCanvas.width;
        const height = this.waveformCanvas.height;
        const bufferLength = dataArray.length;
        
        // Clear canvas
        this.clearWaveform();
        
        // Draw waveform
        this.waveformCtx.lineWidth = 2;
        this.waveformCtx.strokeStyle = '#4CAF50';
        this.waveformCtx.beginPath();
        
        const sliceWidth = width / bufferLength;
        let x = 0;
        
        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * height / 2;
            
            if (i === 0) {
                this.waveformCtx.moveTo(x, y);
            } else {
                this.waveformCtx.lineTo(x, y);
            }
            
            x += sliceWidth;
        }
        
        this.waveformCtx.lineTo(width, height / 2);
        this.waveformCtx.stroke();
    }

    /**
     * Clear waveform canvas
     */
    clearWaveform() {
        if (!this.waveformCtx || !this.waveformCanvas) return;
        this.waveformCtx.clearRect(0, 0, this.waveformCanvas.width, this.waveformCanvas.height);
        
        // Draw center line
        this.waveformCtx.beginPath();
        this.waveformCtx.strokeStyle = '#666';
        this.waveformCtx.lineWidth = 1;
        this.waveformCtx.moveTo(0, this.waveformCanvas.height / 2);
        this.waveformCtx.lineTo(this.waveformCanvas.width, this.waveformCanvas.height / 2);
        this.waveformCtx.stroke();
    }
}

// Export the class
export default AudioAlerts;