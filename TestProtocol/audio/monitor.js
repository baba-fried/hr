class AudioMonitor {
    constructor(analyzer) {
        this.analyzer = analyzer;
        this.eventListeners = {
            'silence': [],
            'spike': [],
            'volume': []
        };
        
        // Set up analyzer callbacks
        this.setupCallbacks();
        
        // State tracking
        this.isSilenceAlertActive = false;
        this.lastSpikeTime = 0;
        this.spikeDebounceTime = 3000; // 3 seconds between spike alerts
        this.continuousNoiseThreshold = 60;
        this.continuousNoiseTime = 10000; // 10 seconds of continuous noise
        this.continuousNoiseStartTime = null;
    }

    /**
     * Set up analyzer callbacks
     */
    setupCallbacks() {
        // Volume update callback
        this.analyzer.onVolumeUpdate((volume) => {
            this.handleVolumeUpdate(volume);
            this.triggerEvent('volume', volume);
        });

        // Silence detection callback
        this.analyzer.onSilenceDetected((duration) => {
            this.handleSilence(duration);
            this.triggerEvent('silence', duration);
        });

        // Spike detection callback
        this.analyzer.onSpikeDetected((volume) => {
            this.handleSpike(volume);
            this.triggerEvent('spike', volume);
        });
    }

    /**
     * Handle volume updates
     * @param {number} volume - Current volume level
     */
    handleVolumeUpdate(volume) {
        // Check for continuous background noise
        const now = Date.now();
        
        if (volume > this.analyzer.silenceThreshold && 
            volume < this.continuousNoiseThreshold) {
            
            if (this.continuousNoiseStartTime === null) {
                this.continuousNoiseStartTime = now;
            } 
            else if ((now - this.continuousNoiseStartTime) >= this.continuousNoiseTime) {
                this.triggerEvent('continuousNoise', volume);
                // Reset to avoid repeated triggers
                this.continuousNoiseStartTime = now;
            }
        } else {
            // Reset if volume is outside the continuous noise range
            this.continuousNoiseStartTime = null;
        }
    }

    /**
     * Handle silence detection
     * @param {number} duration - Duration of silence in milliseconds
     */
    handleSilence(duration) {
        if (!this.isSilenceAlertActive) {
            this.isSilenceAlertActive = true;
            
            // Reset silence alert after 5 seconds
            setTimeout(() => {
                this.isSilenceAlertActive = false;
            }, 5000);
        }
    }

    /**
     * Handle spike detection
     * @param {number} volume - Volume level of the spike
     */
    handleSpike(volume) {
        const now = Date.now();
        
        // Debounce spike alerts
        if (now - this.lastSpikeTime > this.spikeDebounceTime) {
            this.lastSpikeTime = now;
        }
    }

    /**
     * Add event listener
     * @param {string} event - Event name ('silence', 'spike', 'volume', 'continuousNoise')
     * @param {Function} callback - Function to call when event occurs
     */
    addEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].push(callback);
        } else {
            this.eventListeners[event] = [callback];
        }
    }

    /**
     * Remove event listener
     * @param {string} event - Event name
     * @param {Function} callback - Function to remove
     */
    removeEventListener(event, callback) {
        if (this.eventListeners[event]) {
            this.eventListeners[event] = this.eventListeners[event].filter(cb => cb !== callback);
        }
    }

    /**
     * Trigger event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    triggerEvent(event, data) {
        if (this.eventListeners[event]) {
            this.eventListeners[event].forEach(callback => callback(data));
        }
    }

    /**
     * Set continuous noise threshold
     * @param {number} threshold - Volume level threshold (0-100)
     */
    setContinuousNoiseThreshold(threshold) {
        this.continuousNoiseThreshold = Math.min(100, Math.max(0, threshold));
    }

    /**
     * Set continuous noise time threshold
     * @param {number} time - Time in milliseconds
     */
    setContinuousNoiseTime(time) {
        this.continuousNoiseTime = time;
    }

    /**
     * Set spike debounce time
     * @param {number} time - Time in milliseconds
     */
    setSpikeDebounceTime(time) {
        this.spikeDebounceTime = time;
    }
}

// Export the class
export default AudioMonitor;