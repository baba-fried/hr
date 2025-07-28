class ExamInitializer {
    constructor() {
        this.isInitialized = false;
        this.initializationSteps = [
            { name: 'Camera Access', status: 'pending', required: true },
            { name: 'Microphone Access', status: 'pending', required: true },
            { name: 'Face Detection', status: 'pending', required: true },
            { name: 'Audio Processing', status: 'pending', required: true },
            { name: 'Behavior Monitoring', status: 'pending', required: true },
            { name: 'Fullscreen Mode', status: 'pending', required: true },
            { name: 'Violation Logger', status: 'pending', required: true }
        ];
        this.examData = null;
        this.startTime = null;
    }

    /**
     * Initialize the exam system
     */
    async initialize() {
        try {
            // Show initialization UI
            this.showInitializationUI();
            
            // Get exam parameters
            this.examData = this.getExamParameters();
            
            // Initialize violation logger first
            await this.initializeViolationLogger();
            
            // Initialize all proctoring systems
            await this.initializeCamera();
            await this.initializeMicrophone();
            await this.initializeFaceDetection();
            await this.initializeAudioProcessing();
            await this.initializeBehaviorMonitoring();
            await this.initializeFullscreen();
            
            // Show start exam button
            this.showStartExamButton();
            
            console.log('Exam initialization completed successfully');
            return true;
            
        } catch (error) {
            console.error('Exam initialization failed:', error);
            this.showInitializationError(error);
            return false;
        }
    }

    /**
     * Get exam parameters from URL
     */
    getExamParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            testName: urlParams.get('testName'),
            userId: urlParams.get('userId'),
            testId: urlParams.get('testId') || 'unknown',
            token: urlParams.get('token')
        };
    }

    /**
     * Initialize violation logger
     */
    async initializeViolationLogger() {
        try {
            this.updateStepStatus('Violation Logger', 'initializing');
            
            if (window.violationLogger) {
                window.violationLogger.initialize(
                    this.examData.testId,
                    this.examData.testName,
                    this.examData.userId
                );
                
                this.updateStepStatus('Violation Logger', 'completed');
                return true;
            } else {
                throw new Error('Violation logger not available');
            }
        } catch (error) {
            this.updateStepStatus('Violation Logger', 'failed');
            throw error;
        }
    }

    /**
     * Initialize camera access
     */
    async initializeCamera() {
        try {
            this.updateStepStatus('Camera Access', 'initializing');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user'
                } 
            });
            
            const videoFeed = document.getElementById('video-feed');
            if (videoFeed) {
                videoFeed.srcObject = stream;
                await new Promise((resolve) => {
                    videoFeed.onloadedmetadata = resolve;
                });
            }
            
            this.updateStepStatus('Camera Access', 'completed');
            return stream;
            
        } catch (error) {
            this.updateStepStatus('Camera Access', 'failed');
            throw new Error(`Camera access failed: ${error.message}`);
        }
    }

    /**
     * Initialize microphone access
     */
    async initializeMicrophone() {
        try {
            this.updateStepStatus('Microphone Access', 'initializing');
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });
            
            this.updateStepStatus('Microphone Access', 'completed');
            return stream;
            
        } catch (error) {
            this.updateStepStatus('Microphone Access', 'failed');
            throw new Error(`Microphone access failed: ${error.message}`);
        }
    }

    /**
     * Initialize face detection
     */
    async initializeFaceDetection() {
        try {
            this.updateStepStatus('Face Detection', 'initializing');
            
            // Wait for face-api to be available
            while (typeof faceapi === 'undefined') {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Load face detection models
            await faceapi.nets.tinyFaceDetector.loadFromUri('./faceModels');
            await faceapi.nets.faceLandmark68Net.loadFromUri('./faceModels');
            
            // Test face detection
            const videoFeed = document.getElementById('video-feed');
            if (videoFeed && videoFeed.readyState === 4) {
                const detection = await faceapi.detectSingleFace(
                    videoFeed,
                    new faceapi.TinyFaceDetectorOptions()
                );
                
                if (!detection) {
                    console.warn('No face detected during initialization');
                }
            }
            
            this.updateStepStatus('Face Detection', 'completed');
            return true;
            
        } catch (error) {
            this.updateStepStatus('Face Detection', 'failed');
            throw new Error(`Face detection initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize audio processing
     */
    async initializeAudioProcessing() {
        try {
            this.updateStepStatus('Audio Processing', 'initializing');
            
            // Import and initialize audio proctoring
            const audioProctoring = await import('./audio/index.js');
            const initialized = await audioProctoring.default.initialize();
            
            if (!initialized) {
                throw new Error('Audio proctoring initialization failed');
            }
            
            this.updateStepStatus('Audio Processing', 'completed');
            return true;
            
        } catch (error) {
            this.updateStepStatus('Audio Processing', 'failed');
            throw new Error(`Audio processing initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize behavior monitoring
     */
    async initializeBehaviorMonitoring() {
        try {
            this.updateStepStatus('Behavior Monitoring', 'initializing');
            
            if (window.behaviorMonitor) {
                window.behaviorMonitor.initialize();
                this.updateStepStatus('Behavior Monitoring', 'completed');
                return true;
            } else {
                throw new Error('Behavior monitor not available');
            }
            
        } catch (error) {
            this.updateStepStatus('Behavior Monitoring', 'failed');
            throw new Error(`Behavior monitoring initialization failed: ${error.message}`);
        }
    }

    /**
     * Initialize fullscreen mode
     */
    async initializeFullscreen() {
        try {
            this.updateStepStatus('Fullscreen Mode', 'initializing');
            
            if (window.fullscreenManager) {
                // Check if fullscreen is supported
                if (!window.fullscreenManager.isFullscreenSupported()) {
                    throw new Error('Fullscreen mode not supported by browser');
                }
                
                this.updateStepStatus('Fullscreen Mode', 'completed');
                return true;
            } else {
                throw new Error('Fullscreen manager not available');
            }
            
        } catch (error) {
            this.updateStepStatus('Fullscreen Mode', 'failed');
            throw new Error(`Fullscreen initialization failed: ${error.message}`);
        }
    }

    /**
     * Show initialization UI
     */
    showInitializationUI() {
        const container = document.getElementById('exam-container');
        if (!container) return;

        const initUI = document.createElement('div');
        initUI.id = 'initialization-ui';
        initUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
            font-family: 'Inter', -apple-system, sans-serif;
        `;

        initUI.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 500px;
                width: 90%;
                text-align: center;
            ">
                <div style="
                    width: 80px;
                    height: 80px;
                    margin: 0 auto 30px;
                    background: linear-gradient(45deg, #667eea, #764ba2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 36px;
                    color: white;
                ">🔒</div>
                
                <h1 style="
                    color: #2c3e50;
                    margin-bottom: 10px;
                    font-size: 28px;
                    font-weight: 600;
                ">Exam Proctoring System</h1>
                
                <p style="
                    color: #7f8c8d;
                    margin-bottom: 30px;
                    line-height: 1.6;
                ">Initializing secure exam environment...</p>
                
                <div id="initialization-steps" style="
                    text-align: left;
                    margin-bottom: 30px;
                "></div>
                
                <div id="initialization-progress" style="
                    width: 100%;
                    height: 6px;
                    background: #ecf0f1;
                    border-radius: 3px;
                    overflow: hidden;
                    margin-bottom: 20px;
                ">
                    <div id="progress-bar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #667eea, #764ba2);
                        transition: width 0.3s ease;
                    "></div>
                </div>
                
                <div id="initialization-status" style="
                    color: #7f8c8d;
                    font-size: 14px;
                ">Starting initialization...</div>
            </div>
        `;

        document.body.appendChild(initUI);
        this.updateStepsUI();
    }

    /**
     * Update steps UI
     */
    updateStepsUI() {
        const stepsContainer = document.getElementById('initialization-steps');
        if (!stepsContainer) return;

        stepsContainer.innerHTML = this.initializationSteps.map(step => `
            <div style="
                display: flex;
                align-items: center;
                padding: 8px 0;
                border-bottom: 1px solid #ecf0f1;
            ">
                <div style="
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    margin-right: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    ${this.getStepStyles(step.status)}
                ">${this.getStepIcon(step.status)}</div>
                
                <span style="
                    flex: 1;
                    color: ${step.status === 'completed' ? '#27ae60' : step.status === 'failed' ? '#e74c3c' : '#2c3e50'};
                    font-weight: ${step.status === 'initializing' ? '600' : '400'};
                ">${step.name}</span>
                
                ${step.status === 'initializing' ? '<div class="spinner"></div>' : ''}
            </div>
        `).join('');

        // Add spinner CSS
        if (!document.getElementById('spinner-styles')) {
            const style = document.createElement('style');
            style.id = 'spinner-styles';
            style.textContent = `
                .spinner {
                    width: 16px;
                    height: 16px;
                    border: 2px solid #ecf0f1;
                    border-top: 2px solid #667eea;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }

        this.updateProgress();
    }

    /**
     * Get step styles based on status
     */
    getStepStyles(status) {
        switch (status) {
            case 'completed':
                return 'background: #27ae60; color: white;';
            case 'failed':
                return 'background: #e74c3c; color: white;';
            case 'initializing':
                return 'background: #3498db; color: white;';
            default:
                return 'background: #ecf0f1; color: #7f8c8d;';
        }
    }

    /**
     * Get step icon based on status
     */
    getStepIcon(status) {
        switch (status) {
            case 'completed':
                return '✓';
            case 'failed':
                return '✗';
            case 'initializing':
                return '⟳';
            default:
                return '';
        }
    }

    /**
     * Update step status
     */
    updateStepStatus(stepName, status) {
        const step = this.initializationSteps.find(s => s.name === stepName);
        if (step) {
            step.status = status;
            this.updateStepsUI();
            
            const statusElement = document.getElementById('initialization-status');
            if (statusElement) {
                if (status === 'initializing') {
                    statusElement.textContent = `Initializing ${stepName}...`;
                } else if (status === 'completed') {
                    statusElement.textContent = `${stepName} initialized successfully`;
                } else if (status === 'failed') {
                    statusElement.textContent = `${stepName} initialization failed`;
                }
            }
        }
    }

    /**
     * Update progress bar
     */
    updateProgress() {
        const completed = this.initializationSteps.filter(s => s.status === 'completed').length;
        const total = this.initializationSteps.length;
        const progress = (completed / total) * 100;

        const progressBar = document.getElementById('progress-bar');
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
    }

    /**
     * Show start exam button
     */
    showStartExamButton() {
        const initUI = document.getElementById('initialization-ui');
        if (!initUI) return;

        const statusElement = document.getElementById('initialization-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="margin-bottom: 20px; color: #27ae60; font-weight: 600;">
                    ✅ All systems initialized successfully!
                </div>
                <button id="start-exam-btn" style="
                    background: linear-gradient(45deg, #27ae60, #2ecc71);
                    color: white;
                    border: none;
                    padding: 15px 30px;
                    border-radius: 25px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.2s ease;
                    box-shadow: 0 4px 15px rgba(39, 174, 96, 0.3);
                " onmouseover="this.style.transform='translateY(-2px)'" 
                   onmouseout="this.style.transform='translateY(0)'">
                    🚀 Start Exam
                </button>
                <div style="
                    margin-top: 15px;
                    font-size: 12px;
                    color: #7f8c8d;
                    line-height: 1.4;
                ">
                    By clicking "Start Exam", you agree to be monitored throughout the exam.<br>
                    Any violations will be logged and reported.
                </div>
            `;
        }

        // Add click handler
        document.getElementById('start-exam-btn').addEventListener('click', () => {
            this.startExam();
        });
    }

    /**
     * Start the exam
     */
    async startExam() {
        try {
            // Hide initialization UI
            const initUI = document.getElementById('initialization-ui');
            if (initUI) {
                initUI.style.opacity = '0';
                initUI.style.transition = 'opacity 0.5s ease';
                setTimeout(() => initUI.remove(), 500);
            }

            // Record start time
            this.startTime = new Date();

            // Log exam start
            if (window.violationLogger) {
                window.violationLogger.logViolation(
                    'exam_started',
                    'low',
                    'Exam session started',
                    {
                        startTime: this.startTime.toISOString(),
                        examData: this.examData,
                        browserInfo: {
                            userAgent: navigator.userAgent,
                            language: navigator.language,
                            platform: navigator.platform,
                            cookieEnabled: navigator.cookieEnabled
                        },
                        screenInfo: {
                            width: screen.width,
                            height: screen.height,
                            colorDepth: screen.colorDepth,
                            pixelDepth: screen.pixelDepth
                        }
                    },
                    false
                );
            }

            // Start all monitoring systems
            this.startMonitoring();

            // Dispatch event to notify exam manager
            const examInitializedEvent = new CustomEvent('examInitialized', {
                detail: {
                    examData: this.examData,
                    startTime: this.startTime
                }
            });
            window.dispatchEvent(examInitializedEvent);

            this.isInitialized = true;
            console.log('Exam started successfully at:', this.startTime);

        } catch (error) {
            console.error('Failed to start exam:', error);
            this.showInitializationError(error);
        }
    }

    /**
     * Start all monitoring systems
     */
    startMonitoring() {
        // Start face detection monitoring
        setInterval(async () => {
            if (window.faceLogic) {
                const result = await window.faceLogic.detectFace();
                
                // Handle multiple faces specifically
                if (result.status === 'multiple' && result.detections) {
                    if (window.faceUI && window.faceUI.drawMultipleFaces) {
                        window.faceUI.drawMultipleFaces(result.detections);
                    }
                }
            }
        }, 3000);

        console.log('All monitoring systems started');
    }

    /**
     * Load exam questions
     */
    async loadExamQuestions() {
        try {
            const response = await fetch(`/api/tests/questions?testName=${encodeURIComponent(this.examData.testName)}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.statusText}`);
            }

            const questions = await response.json();
            
            // Initialize exam UI with questions
            if (window.examUI) {
                window.examUI.initialize(questions);
            }

            console.log(`Loaded ${questions.length} questions for exam`);
            
        } catch (error) {
            console.error('Failed to load exam questions:', error);
            throw error;
        }
    }

    /**
     * Show initialization error
     */
    showInitializationError(error) {
        const statusElement = document.getElementById('initialization-status');
        if (statusElement) {
            statusElement.innerHTML = `
                <div style="color: #e74c3c; margin-bottom: 15px;">
                    ❌ Initialization Failed
                </div>
                <div style="
                    background: #fdf2f2;
                    border: 1px solid #fecaca;
                    border-radius: 8px;
                    padding: 15px;
                    margin-bottom: 20px;
                    text-align: left;
                ">
                    <strong style="color: #dc2626;">Error:</strong><br>
                    <span style="color: #7f1d1d; font-size: 14px;">${error.message}</span>
                </div>
                <button onclick="location.reload()" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                ">Retry Initialization</button>
            `;
        }
    }

    /**
     * Get initialization status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            startTime: this.startTime,
            examData: this.examData,
            steps: this.initializationSteps.map(step => ({
                name: step.name,
                status: step.status,
                required: step.required
            }))
        };
    }

    /**
     * Cleanup
     */
    cleanup() {
        const initUI = document.getElementById('initialization-ui');
        if (initUI) {
            initUI.remove();
        }

        const spinnerStyles = document.getElementById('spinner-styles');
        if (spinnerStyles) {
            spinnerStyles.remove();
        }
    }
}

// Create and export singleton instance
window.examInitializer = new ExamInitializer();
export default window.examInitializer;