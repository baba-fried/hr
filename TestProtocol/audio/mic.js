class MicrophoneManager {
    constructor() {
        this.audioContext = null;
        this.microphone = null;
        this.analyser = null;
        this.isInitialized = false;
        this.stream = null;
        this.onError = null;
    }

    /**
     * Initialize the microphone and audio context
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async initialize() {
        try {
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Get microphone stream
            this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            // Create microphone source
            this.microphone = this.audioContext.createMediaStreamSource(this.stream);
            
            // Create analyser node
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 1024;
            this.analyser.smoothingTimeConstant = 0.8;
            
            // Connect microphone to analyser
            this.microphone.connect(this.analyser);
            
            this.isInitialized = true;
            return true;
        } catch (error) {
            console.error('Error initializing microphone:', error);
            if (this.onError) this.onError(error);
            return false;
        }
    }

    /**
     * Get the audio analyser node
     * @returns {AnalyserNode|null} - The analyser node or null if not initialized
     */
    getAnalyser() {
        return this.isInitialized ? this.analyser : null;
    }

    /**
     * Get the audio context
     * @returns {AudioContext|null} - The audio context or null if not initialized
     */
    getAudioContext() {
        return this.isInitialized ? this.audioContext : null;
    }

    /**
     * Set error handler
     * @param {Function} callback - Function to call on error
     */
    setErrorHandler(callback) {
        this.onError = callback;
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.microphone) {
            this.microphone.disconnect();
            this.microphone = null;
        }
        
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        
        this.isInitialized = false;
    }
}

// Export the class
export default MicrophoneManager;