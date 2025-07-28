class VoiceSeparation {
    constructor() {
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.isRecording = false;
        this.audioContext = null;
        this.analyser = null;
        this.dataArray = null;
        this.sampleRate = 44100;
        this.chunkDuration = 2000; // 2 seconds
        this.voicePatterns = [];
        this.currentPattern = null;
        this.multipleVoicesThreshold = 0.7;
        this.voiceActivityThreshold = 0.1;
        this.frequencyBands = {
            low: { min: 80, max: 250 },      // Male voice fundamental
            mid: { min: 250, max: 2000 },    // Speech formants
            high: { min: 2000, max: 8000 }   // Consonants and clarity
        };
    }

    /**
     * Initialize voice separation system
     * @param {MediaStream} stream - Audio stream from microphone
     * @returns {Promise<boolean>} Success status
     */
    async initialize(stream) {
        try {
            // Set up MediaRecorder for audio capture
            this.mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm;codecs=opus'
            });

            // Set up Web Audio API for analysis
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const source = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            source.connect(this.analyser);

            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);

            // Set up MediaRecorder event handlers
            this.setupMediaRecorderEvents();

            console.log('Voice separation system initialized');
            return true;
        } catch (error) {
            console.error('Failed to initialize voice separation:', error);
            return false;
        }
    }

    /**
     * Set up MediaRecorder event handlers
     */
    setupMediaRecorderEvents() {
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.audioChunks.push(event.data);
            }
        };

        this.mediaRecorder.onstop = () => {
            this.processAudioChunk();
        };

        this.mediaRecorder.onerror = (error) => {
            console.error('MediaRecorder error:', error);
        };
    }

    /**
     * Start voice monitoring
     */
    startMonitoring() {
        if (!this.mediaRecorder) {
            console.error('Voice separation not initialized');
            return;
        }

        this.isRecording = true;
        this.startRecordingChunk();
        this.startFrequencyAnalysis();
        
        console.log('Voice monitoring started');
    }

    /**
     * Stop voice monitoring
     */
    stopMonitoring() {
        this.isRecording = false;
        
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
        }
        
        console.log('Voice monitoring stopped');
    }

    /**
     * Start recording a chunk
     */
    startRecordingChunk() {
        if (!this.isRecording) return;

        this.audioChunks = [];
        this.mediaRecorder.start();

        // Stop recording after chunk duration
        setTimeout(() => {
            if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
                this.mediaRecorder.stop();
            }
        }, this.chunkDuration);
    }

    /**
     * Process recorded audio chunk
     */
    async processAudioChunk() {
        if (this.audioChunks.length === 0) {
            this.scheduleNextChunk();
            return;
        }

        try {
            const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
            const audioBuffer = await this.blobToArrayBuffer(audioBlob);
            const decodedAudio = await this.audioContext.decodeAudioData(audioBuffer);
            
            // Analyze the audio chunk
            const analysis = this.analyzeAudioChunk(decodedAudio);
            
            // Check for multiple voices
            if (analysis.multipleVoices) {
                this.handleMultipleVoicesDetected(analysis);
            }
            
            // Update voice patterns
            this.updateVoicePatterns(analysis);
            
        } catch (error) {
            console.error('Error processing audio chunk:', error);
        }

        this.scheduleNextChunk();
    }

    /**
     * Schedule next recording chunk
     */
    scheduleNextChunk() {
        if (this.isRecording) {
            setTimeout(() => this.startRecordingChunk(), 100);
        }
    }

    /**
     * Convert blob to array buffer
     * @param {Blob} blob - Audio blob
     * @returns {Promise<ArrayBuffer>} Array buffer
     */
    blobToArrayBuffer(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsArrayBuffer(blob);
        });
    }

    /**
     * Analyze audio chunk for voice patterns
     * @param {AudioBuffer} audioBuffer - Decoded audio buffer
     * @returns {Object} Analysis results
     */
    analyzeAudioChunk(audioBuffer) {
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Perform FFT analysis
        const fftSize = 1024;
        const fftResults = [];
        
        for (let i = 0; i < channelData.length - fftSize; i += fftSize / 2) {
            const segment = channelData.slice(i, i + fftSize);
            const fft = this.performFFT(segment);
            fftResults.push(fft);
        }
        
        // Analyze frequency patterns
        const frequencyAnalysis = this.analyzeFrequencyPatterns(fftResults, sampleRate);
        
        // Detect voice activity
        const voiceActivity = this.detectVoiceActivity(channelData);
        
        // Check for multiple speakers
        const multipleVoices = this.detectMultipleSpeakers(frequencyAnalysis, voiceActivity);
        
        return {
            timestamp: Date.now(),
            duration: audioBuffer.duration,
            voiceActivity,
            frequencyAnalysis,
            multipleVoices,
            confidence: this.calculateConfidence(frequencyAnalysis, voiceActivity)
        };
    }

    /**
     * Perform simple FFT (using a basic implementation)
     * @param {Float32Array} signal - Audio signal
     * @returns {Array} FFT results
     */
    performFFT(signal) {
        // Simplified FFT implementation for voice analysis
        const N = signal.length;
        const frequencies = [];
        
        for (let k = 0; k < N / 2; k++) {
            let real = 0;
            let imag = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                real += signal[n] * Math.cos(angle);
                imag += signal[n] * Math.sin(angle);
            }
            
            const magnitude = Math.sqrt(real * real + imag * imag);
            frequencies.push(magnitude);
        }
        
        return frequencies;
    }

    /**
     * Analyze frequency patterns for voice characteristics
     * @param {Array} fftResults - FFT results array
     * @param {number} sampleRate - Audio sample rate
     * @returns {Object} Frequency analysis
     */
    analyzeFrequencyPatterns(fftResults, sampleRate) {
        const analysis = {
            fundamentalFrequencies: [],
            formants: [],
            spectralCentroid: [],
            spectralRolloff: [],
            energyDistribution: { low: 0, mid: 0, high: 0 }
        };
        
        fftResults.forEach(fft => {
            // Find fundamental frequency (pitch)
            const fundamental = this.findFundamentalFrequency(fft, sampleRate);
            if (fundamental > 0) {
                analysis.fundamentalFrequencies.push(fundamental);
            }
            
            // Calculate spectral centroid
            const centroid = this.calculateSpectralCentroid(fft, sampleRate);
            analysis.spectralCentroid.push(centroid);
            
            // Calculate energy distribution
            const energy = this.calculateEnergyDistribution(fft, sampleRate);
            analysis.energyDistribution.low += energy.low;
            analysis.energyDistribution.mid += energy.mid;
            analysis.energyDistribution.high += energy.high;
        });
        
        // Normalize energy distribution
        const totalEnergy = analysis.energyDistribution.low + 
                           analysis.energyDistribution.mid + 
                           analysis.energyDistribution.high;
        
        if (totalEnergy > 0) {
            analysis.energyDistribution.low /= totalEnergy;
            analysis.energyDistribution.mid /= totalEnergy;
            analysis.energyDistribution.high /= totalEnergy;
        }
        
        return analysis;
    }

    /**
     * Find fundamental frequency in FFT data
     * @param {Array} fft - FFT data
     * @param {number} sampleRate - Sample rate
     * @returns {number} Fundamental frequency
     */
    findFundamentalFrequency(fft, sampleRate) {
        let maxMagnitude = 0;
        let maxIndex = 0;
        
        // Look for peak in voice frequency range (80-400 Hz)
        const minBin = Math.floor(80 * fft.length * 2 / sampleRate);
        const maxBin = Math.floor(400 * fft.length * 2 / sampleRate);
        
        for (let i = minBin; i < maxBin && i < fft.length; i++) {
            if (fft[i] > maxMagnitude) {
                maxMagnitude = fft[i];
                maxIndex = i;
            }
        }
        
        return maxIndex * sampleRate / (fft.length * 2);
    }

    /**
     * Calculate spectral centroid
     * @param {Array} fft - FFT data
     * @param {number} sampleRate - Sample rate
     * @returns {number} Spectral centroid
     */
    calculateSpectralCentroid(fft, sampleRate) {
        let weightedSum = 0;
        let magnitudeSum = 0;
        
        for (let i = 0; i < fft.length; i++) {
            const frequency = i * sampleRate / (fft.length * 2);
            weightedSum += frequency * fft[i];
            magnitudeSum += fft[i];
        }
        
        return magnitudeSum > 0 ? weightedSum / magnitudeSum : 0;
    }

    /**
     * Calculate energy distribution across frequency bands
     * @param {Array} fft - FFT data
     * @param {number} sampleRate - Sample rate
     * @returns {Object} Energy distribution
     */
    calculateEnergyDistribution(fft, sampleRate) {
        const energy = { low: 0, mid: 0, high: 0 };
        
        for (let i = 0; i < fft.length; i++) {
            const frequency = i * sampleRate / (fft.length * 2);
            const magnitude = fft[i] * fft[i]; // Energy = magnitude squared
            
            if (frequency >= this.frequencyBands.low.min && frequency <= this.frequencyBands.low.max) {
                energy.low += magnitude;
            } else if (frequency >= this.frequencyBands.mid.min && frequency <= this.frequencyBands.mid.max) {
                energy.mid += magnitude;
            } else if (frequency >= this.frequencyBands.high.min && frequency <= this.frequencyBands.high.max) {
                energy.high += magnitude;
            }
        }
        
        return energy;
    }

    /**
     * Detect voice activity in audio signal
     * @param {Float32Array} channelData - Audio channel data
     * @returns {Object} Voice activity analysis
     */
    detectVoiceActivity(channelData) {
        // Calculate RMS energy
        let energy = 0;
        for (let i = 0; i < channelData.length; i++) {
            energy += channelData[i] * channelData[i];
        }
        energy = Math.sqrt(energy / channelData.length);
        
        // Calculate zero crossing rate
        let zeroCrossings = 0;
        for (let i = 1; i < channelData.length; i++) {
            if ((channelData[i] >= 0) !== (channelData[i - 1] >= 0)) {
                zeroCrossings++;
            }
        }
        const zeroCrossingRate = zeroCrossings / channelData.length;
        
        // Voice activity detection
        const isVoiceActive = energy > this.voiceActivityThreshold && 
                             zeroCrossingRate > 0.01 && zeroCrossingRate < 0.3;
        
        return {
            energy,
            zeroCrossingRate,
            isActive: isVoiceActive,
            confidence: this.calculateVoiceActivityConfidence(energy, zeroCrossingRate)
        };
    }

    /**
     * Calculate voice activity confidence
     * @param {number} energy - Signal energy
     * @param {number} zcr - Zero crossing rate
     * @returns {number} Confidence score
     */
    calculateVoiceActivityConfidence(energy, zcr) {
        const energyScore = Math.min(energy / this.voiceActivityThreshold, 1);
        const zcrScore = (zcr > 0.01 && zcr < 0.3) ? 1 : 0;
        return (energyScore + zcrScore) / 2;
    }

    /**
     * Detect multiple speakers
     * @param {Object} frequencyAnalysis - Frequency analysis results
     * @param {Object} voiceActivity - Voice activity results
     * @returns {boolean} Multiple speakers detected
     */
    detectMultipleSpeakers(frequencyAnalysis, voiceActivity) {
        if (!voiceActivity.isActive) return false;
        
        // Check for multiple fundamental frequencies
        const fundamentals = frequencyAnalysis.fundamentalFrequencies;
        if (fundamentals.length < 2) return false;
        
        // Look for distinct frequency clusters
        const clusters = this.clusterFrequencies(fundamentals);
        
        // Multiple voices if we have distinct clusters with significant separation
        return clusters.length > 1 && this.validateVoiceClusters(clusters);
    }

    /**
     * Cluster fundamental frequencies
     * @param {Array} frequencies - Fundamental frequencies
     * @returns {Array} Frequency clusters
     */
    clusterFrequencies(frequencies) {
        if (frequencies.length === 0) return [];
        
        const clusters = [];
        const threshold = 30; // Hz threshold for clustering
        
        frequencies.forEach(freq => {
            let addedToCluster = false;
            
            for (let cluster of clusters) {
                if (Math.abs(freq - cluster.center) < threshold) {
                    cluster.frequencies.push(freq);
                    cluster.center = cluster.frequencies.reduce((a, b) => a + b) / cluster.frequencies.length;
                    addedToCluster = true;
                    break;
                }
            }
            
            if (!addedToCluster) {
                clusters.push({
                    center: freq,
                    frequencies: [freq]
                });
            }
        });
        
        return clusters;
    }

    /**
     * Validate voice clusters for multiple speakers
     * @param {Array} clusters - Frequency clusters
     * @returns {boolean} Valid multiple voice clusters
     */
    validateVoiceClusters(clusters) {
        if (clusters.length < 2) return false;
        
        // Check if clusters are sufficiently separated
        for (let i = 0; i < clusters.length - 1; i++) {
            for (let j = i + 1; j < clusters.length; j++) {
                const separation = Math.abs(clusters[i].center - clusters[j].center);
                if (separation > 50) { // 50 Hz minimum separation
                    return true;
                }
            }
        }
        
        return false;
    }

    /**
     * Calculate overall confidence score
     * @param {Object} frequencyAnalysis - Frequency analysis
     * @param {Object} voiceActivity - Voice activity
     * @returns {number} Confidence score
     */
    calculateConfidence(frequencyAnalysis, voiceActivity) {
        const voiceConfidence = voiceActivity.confidence;
        const frequencyConfidence = frequencyAnalysis.fundamentalFrequencies.length > 0 ? 1 : 0;
        
        return (voiceConfidence + frequencyConfidence) / 2;
    }

    /**
     * Handle multiple voices detection
     * @param {Object} analysis - Audio analysis results
     */
    handleMultipleVoicesDetected(analysis) {
        console.log('Multiple voices detected:', analysis);
        
        if (window.violationLogger) {
            window.violationLogger.logViolation(
                'multiple_voices_detected',
                'critical',
                'Multiple voices detected in audio',
                {
                    confidence: analysis.confidence,
                    fundamentalFrequencies: analysis.frequencyAnalysis.fundamentalFrequencies,
                    voiceActivity: analysis.voiceActivity.energy,
                    timestamp: analysis.timestamp
                }
            );
        }
    }

    /**
     * Update voice patterns for learning
     * @param {Object} analysis - Audio analysis results
     */
    updateVoicePatterns(analysis) {
        if (analysis.voiceActivity.isActive) {
            this.voicePatterns.push({
                timestamp: analysis.timestamp,
                fundamentalFreq: analysis.frequencyAnalysis.fundamentalFrequencies[0] || 0,
                spectralCentroid: analysis.frequencyAnalysis.spectralCentroid[0] || 0,
                energyDistribution: analysis.frequencyAnalysis.energyDistribution
            });
            
            // Keep only recent patterns (last 30 seconds)
            const cutoff = Date.now() - 30000;
            this.voicePatterns = this.voicePatterns.filter(p => p.timestamp > cutoff);
        }
    }

    /**
     * Start real-time frequency analysis
     */
    startFrequencyAnalysis() {
        const analyzeFrame = () => {
            if (!this.isRecording) return;
            
            this.analyser.getByteFrequencyData(this.dataArray);
            
            // Quick analysis for real-time feedback
            const energy = this.dataArray.reduce((sum, value) => sum + value, 0) / this.dataArray.length;
            
            // Emit energy update for UI
            if (window.audioMonitor) {
                window.audioMonitor.handleVolumeUpdate(energy / 255 * 100);
            }
            
            requestAnimationFrame(analyzeFrame);
        };
        
        analyzeFrame();
    }

    /**
     * Get current voice statistics
     * @returns {Object} Voice statistics
     */
    getVoiceStatistics() {
        return {
            patternsCollected: this.voicePatterns.length,
            isRecording: this.isRecording,
            averageFundamental: this.voicePatterns.length > 0 
                ? this.voicePatterns.reduce((sum, p) => sum + p.fundamentalFreq, 0) / this.voicePatterns.length 
                : 0,
            recentActivity: this.voicePatterns.filter(p => p.timestamp > Date.now() - 5000).length
        };
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        this.stopMonitoring();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        this.voicePatterns = [];
        console.log('Voice separation system cleaned up');
    }
}

export default VoiceSeparation;