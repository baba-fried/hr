import MicrophoneManager from './mic.js';
import AudioAnalyzer from './analyzer.js';
import AudioMonitor from './monitor.js';
import AudioAlerts from './alerts.js';

class AudioProctoring {
    constructor() {
        this.micManager = new MicrophoneManager();
        this.analyzer = null;
        this.monitor = null;
        this.alerts = null;
        this.isInitialized = false;
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
            
            // Initialize analyzer
            this.analyzer = new AudioAnalyzer(this.micManager);
            const analyzerInitialized = this.analyzer.initialize();
            if (!analyzerInitialized) {
                console.error('Failed to initialize audio analyzer');
                return false;
            }
            
            // Initialize monitor
            this.monitor = new AudioMonitor(this.analyzer);
            
            // Initialize alerts
            const visualizerContainer = document.getElementById('audio-visualizer');
            this.alerts = new AudioAlerts(visualizerContainer);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Start analyzing
            this.analyzer.startAnalyzing();
            
            this.isInitialized = true;
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
            this.alerts.showAlert('silence', `⚠️ No sound detected for ${seconds} seconds. Please check your microphone.`);
        });
        
        // Spike detection
        this.monitor.addEventListener('spike', (volume) => {
            this.alerts.showAlert('spike', `⚠️ Loud noise detected (${Math.round(volume)}%). Please maintain a quiet environment.`);
        });
        
        // Continuous noise detection
        this.monitor.addEventListener('continuousNoise', (volume) => {
            this.alerts.showAlert('continuousNoise', `⚠️ Continuous background noise detected. Please find a quieter environment.`);
        });
    }

    /**
     * Clean up resources
     */
    cleanup() {
        if (this.analyzer) {
            this.analyzer.stopAnalyzing();
        }
        
        if (this.micManager) {
            this.micManager.cleanup();
        }
        
        this.isInitialized = false;
    }
}

// Create and export a singleton instance
const audioProctoring = new AudioProctoring();
export default audioProctoring;