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
                    <div style="
                        background: #3498db;
                        color: white;
                        padding: 4px 12px;
                        border-radius: 12px;
                        font-size: 12px;
                        font-weight: 600;
                    ">${question.subject || 'General'}</div>
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
            // Show confirmation dialog
            const confirmed = confirm(
                `Are you sure you want to submit your exam?\n\n` +
                `Questions answered: ${Object.keys(this.userAnswers).length} of ${this.questions.length}\n` +
                `This action cannot be undone.`
            );

            if (!confirmed) return;

            console.log('📤 Submitting exam...');
            this.examEndTime = new Date();

            // Log exam submission
            if (violationLogger) {
                violationLogger.logViolation(
                    'exam_submitted',
                    'low',
                    'Exam submitted by user',
                    {
                        endTime: this.examEndTime.toISOString(),
                        duration: this.examEndTime - this.examStartTime,
                        questionsAnswered: Object.keys(this.userAnswers).length,
                        totalQuestions: this.questions.length,
                        answers: this.userAnswers
                    },
                    false
                );
            }

            // Calculate score (basic implementation)
            let score = 0;
            this.questions.forEach((question, index) => {
                if (this.userAnswers[index] === question.correctAnswer) {
                    score++;
                }
            });

            // Show submission success
            this.showSubmissionSuccess(score);

            // Cleanup and redirect
            setTimeout(() => {
                this.cleanup();
                window.location.href = '/user-dashboard/user.html';
            }, 3000);

        } catch (error) {
            console.error('❌ Error submitting exam:', error);
            this.showError('Failed to submit exam', error.message);
        }
    }

    /**
     * Show submission success message
     */
    showSubmissionSuccess(score) {
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
                <div style="
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    <strong style="color: #2c3e50;">Score: ${score}/${this.questions.length}</strong>
                </div>
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
        
        // Load questions
        this.loadQuestions(testName);
        
        // Try to load saved progress
        this.loadProgress();
        
        console.log('🎯 Exam started:', testName);
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
    
    // Initialize the exam
    const initialized = await examManager.initialize();
    
    if (initialized) {
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
  