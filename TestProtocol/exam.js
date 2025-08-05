// Import all required modules
import examInitializer from './examInitializer.js';
import violationLogger from './violationLogger.js';
import behaviorMonitor from './behaviorMonitor.js';

class ExamManager {
    constructor() {
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.examStartTime = null;
        this.examEndTime = null;
        this.isExamActive = false;
        this.autoSaveInterval = null;
        this.examTimer = null;
        this.examDuration = null;
        this.timeRemaining = null;
    }

    /**
     * Initialize the exam
     */
    async initialize() {
        try {
            console.log('🚀 Starting exam initialization...');
            
            // Initialize the exam system
            const initialized = await examInitializer.initialize();
            if (!initialized) {
                throw new Error('Exam initialization failed');
            }

            // Set up exam UI handlers
            this.setupExamUI();
            
            // Set up auto-save
            this.setupAutoSave();
            
            console.log('✅ Exam manager initialized successfully');
            return true;
            
        } catch (error) {
            console.error('❌ Exam initialization failed:', error);
            this.showError('Failed to initialize exam system', error.message);
            return false;
        }
    }

    /**
     * Set up exam UI event handlers
     */
    setupExamUI() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitExamBtn = document.getElementById('submit-exam-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousQuestion());
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextQuestion());
        }

        if (submitExamBtn) {
            submitExamBtn.addEventListener('click', () => this.submitExam());
        }

        // Set up cleanup on page unload
        window.addEventListener('beforeunload', (event) => this.handlePageUnload(event));
    }

    /**
     * Load exam questions
     */
    async loadQuestions(testName) {
        try {
            console.log(`Loading questions for test: ${testName}`);
            
            const response = await fetch(`/api/tests/questions?testName=${encodeURIComponent(testName)}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });

            if (!response.ok) {
                throw new Error(`Failed to load questions: ${response.statusText}`);
            }

            this.questions = await response.json();
            console.log(`✅ Loaded ${this.questions.length} questions`);
            
            // Display first question
            this.displayQuestion();
            
            return true;
            
        } catch (error) {
            console.error('❌ Error loading questions:', error);
            this.showError('Failed to load exam questions', error.message);
            return false;
        }
    }

    /**
     * Display current question
     */
    displayQuestion() {
        const questionContainer = document.getElementById('question-container');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitExamBtn = document.getElementById('submit-exam-btn');

        if (!questionContainer) return;

        if (this.questions.length === 0) {
            questionContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #7f8c8d;">
                    <h3>No questions available for this test.</h3>
                    <p>Please contact your administrator.</p>
                </div>
            `;
            this.hideNavigationButtons();
            return;
        }

        const question = this.questions[this.currentQuestionIndex];
        const questionHTML = `
            <div class="question" style="
                background: white;
                padding: 30px;
                border-radius: 12px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                margin-bottom: 20px;
            ">
                <div style="
                    display: flex;
                    justify-content: between;
                    align-items: center;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 2px solid #ecf0f1;
                ">
                    <h3 style="
                        color: #2c3e50;
                        margin: 0;
                        font-size: 18px;
                    ">Question ${this.currentQuestionIndex + 1} of ${this.questions.length}</h3>
                    <!-- Removed subject badge here -->
                </div>
                
                <div style="
                    font-size: 16px;
                    line-height: 1.6;
                    color: #2c3e50;
                    margin-bottom: 25px;
                ">${question.questionText}</div>
                
                <div class="options">
                    ${question.options.map((option, index) => `
                        <label style="
                            display: block;
                            padding: 12px 16px;
                            margin-bottom: 8px;
                            border: 2px solid #ecf0f1;
                            border-radius: 8px;
                            cursor: pointer;
                            transition: all 0.2s ease;
                            background: ${this.userAnswers[this.currentQuestionIndex] === option ? '#e3f2fd' : 'white'};
                            border-color: ${this.userAnswers[this.currentQuestionIndex] === option ? '#2196f3' : '#ecf0f1'};
                        " onmouseover="this.style.borderColor='#3498db'"
                           onmouseout="this.style.borderColor='${this.userAnswers[this.currentQuestionIndex] === option ? '#2196f3' : '#ecf0f1'}'">
                            <input type="radio"
                                   name="question-${this.currentQuestionIndex}"
                                   value="${option}"
                                   ${this.userAnswers[this.currentQuestionIndex] === option ? 'checked' : ''}
                                   style="margin-right: 12px; transform: scale(1.2);">
                            <span style="font-size: 15px; color: #2c3e50;">${option}</span>
                        </label>
                    `).join('')}
                </div>
            </div>
        `;

        questionContainer.innerHTML = questionHTML;

        // Update navigation buttons
        if (prevBtn) {
            prevBtn.style.display = this.currentQuestionIndex === 0 ? 'none' : 'inline-block';
        }
        if (nextBtn) {
            nextBtn.style.display = this.currentQuestionIndex === this.questions.length - 1 ? 'none' : 'inline-block';
        }
        if (submitExamBtn) {
            submitExamBtn.style.display = 'inline-block';
        }

        // Add event listeners for answer selection
        document.querySelectorAll(`input[name="question-${this.currentQuestionIndex}"]`).forEach(input => {
            input.addEventListener('change', (e) => {
                this.userAnswers[this.currentQuestionIndex] = e.target.value;
                this.saveProgress();
                
                // Log answer selection
                if (violationLogger) {
                    violationLogger.logViolation(
                        'answer_selected',
                        'low',
                        `Answer selected for question ${this.currentQuestionIndex + 1}`,
                        {
                            questionIndex: this.currentQuestionIndex,
                            selectedAnswer: e.target.value,
                            questionText: question.questionText.substring(0, 100)
                        },
                        false
                    );
                }
                
                // Update UI to show selection
                this.displayQuestion();
            });
        });
    }

    /**
     * Navigate to previous question
     */
    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.currentQuestionIndex--;
            this.displayQuestion();
            
            // Log navigation
            if (violationLogger) {
                violationLogger.logViolation(
                    'question_navigation',
                    'low',
                    'Navigated to previous question',
                    {
                        fromQuestion: this.currentQuestionIndex + 2,
                        toQuestion: this.currentQuestionIndex + 1,
                        direction: 'previous'
                    },
                    false
                );
            }
        }
    }

    /**
     * Navigate to next question
     */
    nextQuestion() {
        if (this.currentQuestionIndex < this.questions.length - 1) {
            this.currentQuestionIndex++;
            this.displayQuestion();
            
            // Log navigation
            if (violationLogger) {
                violationLogger.logViolation(
                    'question_navigation',
                    'low',
                    'Navigated to next question',
                    {
                        fromQuestion: this.currentQuestionIndex,
                        toQuestion: this.currentQuestionIndex + 1,
                        direction: 'next'
                    },
                    false
                );
            }
        }
    }

    /**
     * Submit the exam
     */
    async submitExam() {
        try {
            console.log('📝 Submitting exam...');
            
            // Get testId from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const testName = urlParams.get('testName');
            
            console.log('🔍 URL Parameters:', {
                testName: testName,
                answers: this.userAnswers,
                questionsCount: this.questions.length
            });
            
            // Get test details to find testId
            const testResponse = await fetch(`/api/tests/by-name/${encodeURIComponent(testName)}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            
            if (!testResponse.ok) {
                console.error('❌ Failed to get test details:', testResponse.status, testResponse.statusText);
                throw new Error('Failed to get test details');
            }
            
            const test = await testResponse.json();
            const testId = test._id;
            
            console.log('✅ Got test details:', { testId, testName: test.name });
            
            // Calculate score
            let score = 0;
            const totalQuestions = this.questions.length;
            
            this.questions.forEach((question, index) => {
                const userAnswer = this.userAnswers[index];
                if (userAnswer && userAnswer === question.correctAnswer) {
                    score += question.points || 1;
                }
            });
            
            const percentage = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;
            
            const submissionData = {
                answers: this.userAnswers,
                score: percentage,
                timeTaken: this.examStartTime ? Math.floor((Date.now() - this.examStartTime.getTime()) / 1000) : 0
            };
            
            console.log('📤 Sending submission data:', submissionData);
            
            // Submit to server
            const response = await fetch(`/api/tests/${testId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(submissionData)
            });
            
            console.log('📥 Response status:', response.status);
            
            if (response.ok) {
                // const result = await response.json(); // Don't use score
                // console.log('✅ Exam submitted successfully:', result);
                this.showSubmissionSuccess(); // No score passed
                setTimeout(() => {
                    window.location.href = '/user-dashboard/user.html';
                }, 3000);
            } else {
                const errorData = await response.json();
                console.error('❌ Submission failed:', errorData);
                throw new Error(errorData.message || 'Failed to submit exam');
            }
            
        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            this.showError('Submission Failed', 'Failed to submit exam. Please try again.');
        }
    }

    /**
     * Show submission success message (no score)
     */
    showSubmissionSuccess() {
        const container = document.getElementById('exam-container');
        if (!container) return;
        const successUI = document.createElement('div');
        successUI.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #27ae60 0%, #2ecc71 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: 'Inter', -apple-system, sans-serif;
        `;
        successUI.innerHTML = `
            <div style="
                background: white;
                padding: 40px;
                border-radius: 20px;
                text-align: center;
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                max-width: 400px;
            ">
                <div style="
                    font-size: 64px;
                    margin-bottom: 20px;
                ">✅</div>
                <h2 style="
                    color: #27ae60;
                    margin-bottom: 15px;
                    font-size: 24px;
                ">Exam Submitted Successfully!</h2>
                <p style="
                    color: #7f8c8d;
                    margin-bottom: 20px;
                    line-height: 1.6;
                ">Your exam has been submitted and recorded.</p>
                <p style="
                    font-size: 14px;
                    color: #95a5a6;
                ">Redirecting to dashboard...</p>
            </div>
        `;
        document.body.appendChild(successUI);
    }

    /**
     * Hide navigation buttons
     */
    hideNavigationButtons() {
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        const submitExamBtn = document.getElementById('submit-exam-btn');

        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        if (submitExamBtn) submitExamBtn.style.display = 'none';
    }

    /**
     * Set up auto-save functionality
     */
    setupAutoSave() {
        this.autoSaveInterval = setInterval(() => {
            this.saveProgress();
        }, 30000); // Save every 30 seconds
    }

    /**
     * Save exam progress
     */
    saveProgress() {
        try {
            const progress = {
                currentQuestionIndex: this.currentQuestionIndex,
                userAnswers: this.userAnswers,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem('examProgress', JSON.stringify(progress));
            console.log('💾 Progress saved');
            
        } catch (error) {
            console.error('Failed to save progress:', error);
        }
    }

    /**
     * Load saved progress
     */
    loadProgress() {
        try {
            const saved = localStorage.getItem('examProgress');
            if (saved) {
                const progress = JSON.parse(saved);
                this.currentQuestionIndex = progress.currentQuestionIndex || 0;
                this.userAnswers = progress.userAnswers || {};
                console.log('📂 Progress loaded');
                return true;
            }
        } catch (error) {
            console.error('Failed to load progress:', error);
        }
        return false;
    }

    /**
     * Handle page unload
     */
    handlePageUnload(event) {
        // Save progress
        this.saveProgress();

        // Log page unload attempt
        if (violationLogger) {
            violationLogger.logViolation(
                'page_unload_attempt',
                'high',
                'User attempted to leave exam page',
                {
                    currentQuestion: this.currentQuestionIndex + 1,
                    answeredQuestions: Object.keys(this.userAnswers).length,
                    timeSpent: Date.now() - (this.examStartTime?.getTime() || Date.now())
                }
            );
        }

        // Cleanup resources
        this.cleanup();

        // Show warning message
        const message = 'Are you sure you want to leave the exam? Your progress will be saved but this action will be logged.';
        event.returnValue = message;
        return message;
    }

    /**
     * Show error message
     */
    showError(title, message) {
        if (window.alerts) {
            window.alerts.showAlert(`${title}: ${message}`, 'error');
        } else {
            alert(`${title}\n\n${message}`);
        }
    }

    /**
     * Start the exam
     */
    startExam(testName) {
        this.examStartTime = new Date();
        this.isExamActive = true;
        
        // Parse exam duration from URL
        const urlParams = new URLSearchParams(window.location.search);
        const durationStr = urlParams.get('duration') || '';
        this.examDuration = this.parseDuration(durationStr);
        
        if (this.examDuration) {
            this.startTimer();
        }
        
        // Load questions
        this.loadQuestions(testName);
        
        // Try to load saved progress
        this.loadProgress();
        
        console.log('🎯 Exam started:', testName);
    }
   
    /**
     * Parse duration string to minutes
     * @param {string} durationStr - Duration string like "4 minutes" or "N/A minutes"
     * @returns {number|null} Duration in minutes or null if invalid
     */
    parseDuration(durationStr) {
        if (!durationStr || durationStr.includes('N/A')) {
            return null;
        }
        
        const match = durationStr.match(/(\d+)\s*minutes?/i);
        return match ? parseInt(match[1]) : null;
    }
    
    /**
     * Start the exam timer
     */
    startTimer() {
        if (!this.examDuration) return;
        
        this.timeRemaining = this.examDuration * 60; // Convert to seconds
        
        // Update timer display immediately
        this.updateTimerDisplay();
        
        this.examTimer = setInterval(() => {
            this.timeRemaining--;
            
            if (this.timeRemaining <= 0) {
                this.submitExam(); // Auto-submit when time runs out
                return;
            }
            
            this.updateTimerDisplay();
        }, 1000);
        
        console.log(`⏰ Timer started: ${this.examDuration} minutes`);
    }
    
    /**
     * Update timer display
     */
    updateTimerDisplay() {
        const timerContainer = document.getElementById('exam-timer');
        if (!timerContainer) return;
        
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // Update timer text
        timerContainer.textContent = timeStr;
        
        // Change badge color based on time remaining
        const timerBadge = document.getElementById('exam-timer-badge');
        if (timerBadge) {
            if (this.timeRemaining <= 300) { // 5 minutes or less
                timerBadge.style.background = '#e74c3c';
            } else if (this.timeRemaining <= 600) { // 10 minutes or less
                timerBadge.style.background = '#f39c12';
            } else {
                timerBadge.style.background = '#27ae60';
            }
        }
    }

    /**
     * Cleanup resources
     */
    cleanup() {
        console.log('🧹 Cleaning up exam resources...');
        
        // Clear auto-save interval
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }
        
        // Clear exam timer
        if (this.examTimer) {
            clearInterval(this.examTimer);
            this.examTimer = null;
        }
        
        // Reset timer display
        const timerContainer = document.getElementById('exam-timer');
        if (timerContainer) {
            timerContainer.textContent = '--:--';
        }
        
        // Reset timer badge color
        const timerBadge = document.getElementById('exam-timer-badge');
        if (timerBadge) {
            timerBadge.style.background = '#27ae60';
        }

        // Cleanup all monitoring systems
        if (window.behaviorMonitor) {
            window.behaviorMonitor.stop();
        }

        if (window.fullscreenManager) {
            window.fullscreenManager.cleanup();
        }

        // Cleanup audio proctoring
        import('./audio/index.js').then(audioProctoring => {
            audioProctoring.default.cleanup();
        }).catch(console.error);

        // Clear saved progress
        localStorage.removeItem('examProgress');
        
        this.isExamActive = false;
        console.log('✅ Cleanup completed');
    }

    /**
     * Get exam statistics
     */
    getStatistics() {
        return {
            isActive: this.isExamActive,
            startTime: this.examStartTime,
            endTime: this.examEndTime,
            currentQuestion: this.currentQuestionIndex + 1,
            totalQuestions: this.questions.length,
            answeredQuestions: Object.keys(this.userAnswers).length,
            progress: this.questions.length > 0 ? (Object.keys(this.userAnswers).length / this.questions.length * 100).toFixed(1) : 0
        };
    }
}

// Initialize exam manager when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initializing exam system...');
    
    const examManager = new ExamManager();
    window.examManager = examManager; // Make available globally
    
    // Function to set exam data in the UI
    const setExamData = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const examName = urlParams.get('testName') || '';
        const examRole = urlParams.get('role') || '';
        const examDuration = urlParams.get('duration') || '';
        const userId = urlParams.get('userId') || '';
        
        console.log('🔍 URL Parameters:', {
            testName: examName,
            role: examRole,
            duration: examDuration,
            userId: userId
        });
        
        const examNameSpan = document.getElementById('exam-name');
        const examRoleSpan = document.getElementById('exam-role');
        const examDurationSpan = document.getElementById('exam-duration');
        if (examNameSpan) examNameSpan.textContent = examName;
        if (examRoleSpan) examRoleSpan.textContent = examRole;
        if (examDurationSpan) examDurationSpan.textContent = examDuration;
        console.log('✅ Set exam data:', { examName, examRole, examDuration });
        
        // Also log the actual DOM elements
        console.log('🔍 DOM Elements:', {
            examNameSpan: examNameSpan,
            examRoleSpan: examRoleSpan,
            examDurationSpan: examDurationSpan
        });
    };
    
    // Set exam data immediately
    setExamData();
    
    // Also set exam data when window loads
    window.addEventListener('load', setExamData);
    
    // Make setExamData available globally for debugging
    window.setExamData = setExamData;
   
    // Debug: Log current URL
    console.log('🔍 Current URL:', window.location.href);
    console.log('🔍 URL Search:', window.location.search);
   
    // Test function to manually set exam data
    window.testExamData = () => {
        console.log('🧪 Testing exam data setting...');
        setExamData();
    };
    
    // Initialize the exam
    const initialized = await examManager.initialize();
    
    if (initialized) {
        // Set exam name and role in the badge/header
        if (window.examInitializer && window.examInitializer.examData) {
            const examName = window.examInitializer.examData.testName || '';
            const examRole = window.examInitializer.examData.role || '';
            const examDuration = window.examInitializer.examData.duration || '';
            const examNameSpan = document.getElementById('exam-name');
            const examRoleSpan = document.getElementById('exam-role');
            const examDurationSpan = document.getElementById('exam-duration');
            if (examNameSpan) examNameSpan.textContent = examName;
            if (examRoleSpan) examRoleSpan.textContent = examRole;
            if (examDurationSpan) examDurationSpan.textContent = examDuration;
            console.log('✅ Set exam data from examInitializer:', { examName, examRole, examDuration });
        } else {
            // Fallback: Get data directly from URL parameters
            const urlParams = new URLSearchParams(window.location.search);
            const examName = urlParams.get('testName') || '';
            const examRole = urlParams.get('role') || '';
            const examDuration = urlParams.get('duration') || '';
            const examNameSpan = document.getElementById('exam-name');
            const examRoleSpan = document.getElementById('exam-role');
            const examDurationSpan = document.getElementById('exam-duration');
            if (examNameSpan) examNameSpan.textContent = examName;
            if (examRoleSpan) examRoleSpan.textContent = examRole;
            if (examDurationSpan) examDurationSpan.textContent = examDuration;
            console.log('✅ Set exam data from URL params:', { examName, examRole, examDuration });
        }
        // Set exam data again after a short delay to ensure it's set
        setTimeout(setExamData, 1000);
        // Get test name from URL
        const urlParams = new URLSearchParams(window.location.search);
        const testName = urlParams.get('testName');
        
        if (testName) {
            // Start the exam after initialization is complete
            // This will be triggered by the examInitializer when user clicks "Start Exam"
            window.addEventListener('examInitialized', () => {
                examManager.startExam(testName);
            });
        } else {
            console.error('❌ No test name provided in URL');
            examManager.showError('Invalid Exam Link', 'No test name specified in the URL');
        }
    }
});

// Export for use in other modules
export default ExamManager;
  