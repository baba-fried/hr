class AudioAnalyzer {
    constructor(microphoneManager) {
        this.micManager = microphoneManager;
        this.analyser = null;
        this.dataArray = null;
        this.volumeCallback = null;
        this.silenceCallback = null;
        this.spikeCallback = null;
        
        // Configuration
        this.silenceThreshold = 5; // Volume below this is considered silence
        this.spikeThreshold = 75;  // Volume above this is considered a spike
        this.silenceDuration = 15000; // 15 seconds of silence before alert
        
        // State tracking
        this.lastVolume = 0;
        this.silenceStartTime = null;
        this.isAnalyzing = false;
        this.animationFrame = null;
    }

    /**
     * Initialize the analyzer
     * @returns {boolean} - True if initialization was successful
     */
    initialize() {
        if (!this.micManager.isInitialized) {
            console.error('Microphone manager must be initialized first');
            return false;
        }

        this.analyser = this.micManager.getAnalyser();
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        return true;
    }

    /**
     * Start analyzing audio
     */
    startAnalyzing() {
        if (!this.analyser) {
            console.error('Analyzer not initialized');
            return;
        }

        this.isAnalyzing = true;
        this.analyzeAudio();
    }

    /**
     * Stop analyzing audio
     */
    stopAnalyzing() {
        this.isAnalyzing = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }

    /**
     * Main audio analysis loop
     */
    analyzeAudio() {
        if (!this.isAnalyzing) return;

        // Get volume data
        this.analyser.getByteFrequencyData(this.dataArray);
        
        // Calculate RMS volume (0-100 scale)
        const volume = this.calculateVolume();
        this.lastVolume = volume;
        
        // Call volume callback if set
        if (this.volumeCallback) {
            this.volumeCallback(volume);
        }
        
        // Check for silence
        this.detectSilence(volume);
        
        // Check for volume spikes
        this.detectSpike(volume);
        
        // Continue analyzing
        this.animationFrame = requestAnimationFrame(() => this.analyzeAudio());
    }

    /**
     * Calculate volume level from frequency data
     * @returns {number} - Volume level (0-100)
     */
    calculateVolume() {
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i] * this.dataArray[i];
        }
        const rms = Math.sqrt(sum / this.dataArray.length);
        
        // Convert to a 0-100 scale
        return Math.min(100, Math.max(0, rms / 128 * 100));
    }

    /**
     * Detect periods of silence
     * @param {number} volume - Current volume level
     */
    detectSilence(volume) {
        const now = Date.now();
        
        if (volume <= this.silenceThreshold) {
            // Start tracking silence if not already tracking
            if (this.silenceStartTime === null) {
                this.silenceStartTime = now;
            } 
            // Check if silence duration threshold exceeded
            else if ((now - this.silenceStartTime) >= this.silenceDuration) {
                if (this.silenceCallback) {
                    this.silenceCallback(now - this.silenceStartTime);
                }
                // Reset silence start time to avoid repeated triggers
                this.silenceStartTime = now;
            }
        } else {
            // Reset silence tracking if volume is above threshold
            this.silenceStartTime = null;
        }
    }

    /**
     * Detect volume spikes
     * @param {number} volume - Current volume level
     */
    detectSpike(volume) {
        if (volume >= this.spikeThreshold) {
            if (this.spikeCallback) {
                this.spikeCallback(volume);
            }
        }
    }

    /**
     * Set callback for volume updates
     * @param {Function} callback - Function to call with volume level
     */
    onVolumeUpdate(callback) {
        this.volumeCallback = callback;
    }

    /**
     * Set callback for silence detection
     * @param {Function} callback - Function to call when silence is detected
     */
    onSilenceDetected(callback) {
        this.silenceCallback = callback;
    }

    /**
     * Set callback for spike detection
     * @param {Function} callback - Function to call when a spike is detected
     */
    onSpikeDetected(callback) {
        this.spikeCallback = callback;
    }

    /**
     * Set silence threshold
     * @param {number} threshold - Volume level below which is considered silence (0-100)
     */
    setSilenceThreshold(threshold) {
        this.silenceThreshold = Math.min(100, Math.max(0, threshold));
    }

    /**
     * Set spike threshold
     * @param {number} threshold - Volume level above which is considered a spike (0-100)
     */
    setSpikeThreshold(threshold) {
        this.spikeThreshold = Math.min(100, Math.max(0, threshold));
    }

    /**
     * Set silence duration threshold
     * @param {number} duration - Duration in milliseconds
     */
    setSilenceDuration(duration) {
        this.silenceDuration = duration;
    }
}

// Export the class
export default AudioAnalyzer;