import MicrophoneManager from './mic.js';
import AudioAnalyzer from './analyzer.js';
import AudioMonitor from './monitor.js';
import AudioAlerts from './alerts.js';
import VoiceSeparation from './voiceSeparation.js';

class AudioProctoring {
    constructor() {
        this.micManager = new MicrophoneManager();
        this.analyzer = null;
        this.monitor = null;
        this.alerts = null;
        this.voiceSeparation = null;
        this.isInitialized = false;
        this.stream = null;
    }

    /**
     * Initialize the audio proctoring system
     * @returns {Promise<boolean>} - True if initialization was successful
     */
    async initialize() {
        try {
            // Initialize microphone
            const micInitialized = await this.micManager.initialize();
            if (!micInitialized) {
                console.error('Failed to initialize microphone');
                return false;
            }
            
            // Get the audio stream
            this.stream = this.micManager.getStream();
            if (!this.stream) {
                console.error('Failed to get audio stream');
                return false;
            }
            
            // Initialize analyzer
            this.analyzer = new AudioAnalyzer(this.micManager);
            const analyzerInitialized = this.analyzer.initialize();
            if (!analyzerInitialized) {
                console.error('Failed to initialize audio analyzer');
                return false;
            }
            
            // Initialize monitor
            this.monitor = new AudioMonitor(this.analyzer);
            window.audioMonitor = this.monitor; // Make available globally
            
            // Initialize voice separation
            this.voiceSeparation = new VoiceSeparation();
            const voiceInitialized = await this.voiceSeparation.initialize(this.stream);
            if (!voiceInitialized) {
                console.warn('Voice separation initialization failed, continuing without it');
            }
            
            // Initialize alerts
            const visualizerContainer = document.getElementById('audio-visualizer');
            this.alerts = new AudioAlerts(visualizerContainer);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start analyzing
            this.analyzer.startAnalyzing();
            
            // Start voice monitoring if available
            if (this.voiceSeparation) {
                this.voiceSeparation.startMonitoring();
            }
            
            this.isInitialized = true;
            console.log('Audio proctoring system fully initialized');
            return true;
        } catch (error) {
            console.error('Error initializing audio proctoring:', error);
            return false;
        }
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Volume updates
        this.monitor.addEventListener('volume', (volume) => {
            this.alerts.updateVolumeBar(volume);
            
            // Update waveform
            if (this.analyzer && this.analyzer.dataArray) {
                this.alerts.updateWaveform(this.analyzer.dataArray);
            }
        });
        
        // Silence detection
        this.monitor.addEventListener('silence', (duration) => {
            const seconds = Math.floor(duration / 1000);
            const message = `⚠️ No sound detected for ${seconds} seconds. Please check your microphone.`;
            // this.alerts.showAlert('silence', message); // Removed popup
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'audio_silence',
                    'medium',
                    message,
                    { duration: seconds }
                );
            }
        });
        
        // Spike detection
        this.monitor.addEventListener('spike', (volume) => {
            const message = `⚠️ Loud noise detected (${Math.round(volume)}%). Please maintain a quiet environment.`;
            // this.alerts.showAlert('spike', message); // Removed popup
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'audio_spike',
                    'high',
                    message,
                    { volume: Math.round(volume) }
                );
            }
        });
        
        // Continuous noise detection
        this.monitor.addEventListener('continuousNoise', (volume) => {
            const message = `⚠️ Continuous background noise detected. Please find a quieter environment.`;
            // this.alerts.showAlert('continuousNoise', message); // Removed popup
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'audio_continuous_noise',
                    'medium',
                    message,
                    { volume: Math.round(volume) }
                );
            }
        });
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.analyzer) {
            this.analyzer.stopAnalyzing();
        }
        
        if (this.voiceSeparation) {
            this.voiceSeparation.cleanup();
        }
        
        if (this.micManager) {
            this.micManager.cleanup();
        }
        
        this.isInitialized = false;
        console.log('Audio proctoring system cleaned up');
    }

    /**
     * Get voice separation statistics
     * @returns {Object} Voice statistics
     */
    getVoiceStatistics() {
        if (this.voiceSeparation) {
            return this.voiceSeparation.getVoiceStatistics();
        }
        return null;
    }

    /**
     * Check if voice separation is active
     * @returns {boolean} Voice separation status
     */
    isVoiceSeparationActive() {
        return this.voiceSeparation && this.voiceSeparation.isRecording;
    }
}

// Create and export a singleton instance
const audioProctoring = new AudioProctoring();
export default audioProctoring;