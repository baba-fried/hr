const examData = {
    duration: 30 * 60, // 30 minutes in seconds
    questions: [
        {
            question: "What does the 4P's of marketing stand for?",
            options: ["Product, Price, Place, Promotion", "Plan, Process, People, Performance", "Push, Pull, Promote, Price"],
            answer: 0,
            originalIndex: 0
        },
        {
            question: "Which platform is best suited for B2B marketing?",
            options: ["Instagram", "LinkedIn", "Snapchat"],
            answer: 1,
            originalIndex: 1
        },
        {
            question: "SEO stands for?",
            options: ["Search Engine Optimization", "Sales Engagement Optimization", "Social Engagement Operations"],
            answer: 0,
            originalIndex: 2
        },
        {
            question: "What is a common metric to measure email campaign success?",
            options: ["Bounce Rate", "Open Rate", "Ad Impressions"],
            answer: 1,
            originalIndex: 3
        },
        {
            question: "Which color is often associated with trust in branding?",
            options: ["Red", "Blue", "Orange"],
            answer: 1,
            originalIndex: 4
        },
        {
            question: "Which tool is used for tracking website analytics?",
            options: ["Google Docs", "Google Analytics", "Google Slides"],
            answer: 1,
            originalIndex: 5
        },
        {
            question: "Which marketing funnel stage comes first?",
            options: ["Conversion", "Awareness", "Decision"],
            answer: 1,
            originalIndex: 6
        },
        {
            question: "What does 'CTR' stand for in digital marketing?",
            options: ["Click Through Rate", "Customer Trust Ratio", "Content Targeting Reach"],
            answer: 0,
            originalIndex: 7
        },
        {
            question: "Which of these is a type of paid marketing?",
            options: ["Organic SEO", "PPC", "Content Marketing"],
            answer: 1,
            originalIndex: 8
        },
        {
            question: "A/B testing is primarily used to:",
            options: ["Build brand identity", "Compare marketing strategies", "Test performance of two versions"],
            answer: 2,
            originalIndex: 9
        },
        {
            question: "Describe a successful marketing campaign you've seen recently and why it worked.",
            type: "written",
            maxLength: 500,
            originalIndex: 10
        },
        {
            question: "How would you market a new app for college students?",
            type: "written",
            maxLength: 500,
            originalIndex: 11
        },
        {
            question: "What strategies would you use to improve customer retention?",
            type: "written",
            maxLength: 500,
            originalIndex: 12
        },
        {
            question: "Explain how you would measure the success of a social media campaign.",
            type: "written",
            maxLength: 500,
            originalIndex: 13
        },
        {
            question: "Write a sample email pitch to promote a new product to potential customers.",
            type: "written",
            maxLength: 500,
            originalIndex: 14
        }
    ]
};

// ===== DOM Elements =====
const startScreen = document.getElementById('start-screen');
const examContainer = document.getElementById('exam-container');
const startBtn = document.getElementById('start-exam-btn');
const questionsContainer = document.getElementById('questions');
const timerElement = document.getElementById('timer');
const submitBtn = document.getElementById('submit-exam');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const timeWarning = document.getElementById('time-warning');
const questionNav = document.getElementById('question-nav');
const webcamFeed = document.getElementById('webcam-feed');
const submitConfirmation = document.getElementById('submit-confirmation');
const confirmSubmitBtn = document.getElementById('confirm-submit');
const backToExamBtn = document.getElementById('back-to-exam');

// ===== Question Status Indicator =====
function updateQuestionStatus() {
    const questionStatusContainer = document.getElementById('question-status');
    if (!questionStatusContainer) return;
    questionStatusContainer.innerHTML = '';
    examData.questions.forEach((_, index) => {
        const indicator = document.createElement('div');
        indicator.className = 'question-status-item';
        indicator.textContent = (index + 1).toString();
        const isAnswered = localStorage.getItem(`q${index}`) !== null;
        if (isAnswered) {
            indicator.classList.add('answered');
        }
        if (index === currentQuestion) {
            indicator.classList.add('active');
        }
        indicator.addEventListener('click', () => {
            saveAnswers();
            showQuestion(index);
        });
        questionStatusContainer.appendChild(indicator);
    });
}

// ===== Database Functions =====
let db;

function initDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('ExamProctorDB', 1);
        
        request.onerror = (event) => {
            console.error('Database error:', event.target.error);
            reject(event.target.error);
        };
        
        request.onsuccess = (event) => {
            db = event.target.result;
            console.log('Database opened successfully');
            resolve(db);
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('users')) {
                const userStore = db.createObjectStore('users', { keyPath: 'rollNumber' });
                userStore.createIndex('name', 'name', { unique: false });
                userStore.createIndex('dob', 'dob', { unique: false });
                console.log('User store created');
            }
            
            if (!db.objectStoreNames.contains('examResults')) {
                const resultStore = db.createObjectStore('examResults', { keyPath: 'sessionID' });
                resultStore.createIndex('rollNumber', 'rollNumber', { unique: false });
                resultStore.createIndex('timestamp', 'timestamp', { unique: false });
                console.log('Exam results store created');
            }
            
            if (!db.objectStoreNames.contains('violations')) {
                const violationStore = db.createObjectStore('violations', { keyPath: 'id', autoIncrement: true });
                violationStore.createIndex('sessionID', 'sessionID', { unique: false });
                violationStore.createIndex('type', 'type', { unique: false });
                console.log('Violations store created');
            }
        };
    });
}

function saveUserData(userData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['users'], 'readwrite');
        const userStore = transaction.objectStore('users');
        
        const request = userStore.put(userData);
        
        request.onsuccess = () => {
            console.log('User data saved successfully');
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error saving user data:', event.target.error);
            reject(event.target.error);
        };
    });
}

function saveExamResult(resultData) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['examResults'], 'readwrite');
        const resultStore = transaction.objectStore('examResults');
        
        const request = resultStore.put(resultData);
        
        request.onsuccess = () => {
            console.log('Exam result saved successfully');
            resolve();
        };
        
        request.onerror = (event) => {
            console.error('Error saving exam result:', event.target.error);
            reject(event.target.error);
        };
    });
}

function saveViolations(violations) {
    return new Promise((resolve, reject) => {
        if (!db) {
            reject(new Error('Database not initialized'));
            return;
        }
        
        const transaction = db.transaction(['violations'], 'readwrite');
        const violationStore = transaction.objectStore('violations');
        
        let completed = 0;
        let errors = 0;
        
        violations.forEach(violation => {
            const request = violationStore.add(violation);
            
            request.onsuccess = () => {
                completed++;
                if (completed + errors === violations.length) {
                    if (errors === 0) {
                        console.log('All violations saved successfully');
                        resolve();
                    } else {
                        reject(new Error(`${errors} violations failed to save`));
                    }
                }
            };
            
            request.onerror = (event) => {
                console.error('Error saving violation:', event.target.error);
                errors++;
                completed++;
                if (completed + errors === violations.length) {
                    reject(new Error(`${errors} violations failed to save`));
                }
            };
        });
        
        if (violations.length === 0) {
            resolve();
        }
    });
}

// ===== Security Variables =====
let warnings = 0;
let violations = 0;
let examStarted = false;
let timeLeft = examData.duration;
let timerInterval;
let violationLog = [];
let faceViolationLog = [];
let audioViolationLog = [];
let examEnded = false;
let currentQuestion = 0;
let answeredQuestions = new Array(examData.questions.length).fill(false);
let activePopups = [];
let lastScreenshotAttempt = 0;
let lastWindowSwitchAttempt = 0;
let lastViolationAttempt = 0;
let lastFaceDetectionIssue = 0;
const sessionID = Math.random().toString(36).substr(2, 12).toUpperCase();
const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
let mediaStream = null;
let faceDetectionInterval = null;
let activeFaceNotification = null;

// ===== Audio Monitoring Variables =====
let audioStream = null;
let audioContext = null;
let analyser = null;
let audioMonitorInterval = null;
let audioWarningActive = false;
let lastRms = 0;
let speechSegments = 0;

// ===== Audio Level Meter UI =====
const audioLevelBar = document.getElementById('audio-level-bar');
const audioLevelFill = document.getElementById('audio-level-fill');
const audioWarningContainer = document.getElementById('audio-warning-container');

// ===== Audio Configuration =====
const audioConfig = {
    highAudioThreshold: 20,
    speechRmsThreshold: 5,
    speechSegmentThreshold: 2,
    rmsChangeThreshold: 10
};

// ===== Utility Functions =====
function shuffleArray(array, shuffleOptions = false) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }

    if (shuffleOptions) {
        array.forEach(question => {
            if (!question.type && question.options) {
                const originalOptions = [...question.options];
                const originalAnswerIndex = question.answer;
                const shuffledIndices = Array.from({ length: question.options.length }, (_, index) => index);
                for (let i = shuffledIndices.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]];
                }
                question.options = shuffledIndices.map(index => originalOptions[index]);
                question.answer = shuffledIndices.indexOf(originalAnswerIndex);
            }
        });
    }

    return array;
}

// ===== Age Calculation Function =====
function calculateAge(dob) {
    // Validate the DOB input
    const birthDate = new Date(dob);
    if (isNaN(birthDate.getTime())) {
        // Invalid date format
        return -1;
    }

    const currentDate = new Date(); // Use the current date (2025-05-21)
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const monthDiff = currentDate.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && currentDate.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// ===== Webcam Functions =====
async function startWebcam() {
    try {
        mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (webcamFeed) {
            webcamFeed.srcObject = mediaStream;
            let faceWarningContainer = document.getElementById('face-warning-container');
            if (!faceWarningContainer) {
                faceWarningContainer = document.createElement('div');
                faceWarningContainer.id = 'face-warning-container';
                webcamFeed.parentNode.insertBefore(faceWarningContainer, webcamFeed.nextSibling);
            }
        } else {
            console.warn('Webcam feed element not found');
            return false;
        }
        await loadFaceApi();
        startFaceDetection();
        return true;
    } catch (err) {
        console.error('Webcam access denied:', err);
        showWebcamPermissionPopup();
        return false;
    }
}

function stopWebcam() {
    if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
        mediaStream = null;
        if (webcamFeed) webcamFeed.srcObject = null;
    }
    if (faceDetectionInterval) {
        clearInterval(faceDetectionInterval);
        faceDetectionInterval = null;
    }
    clearFaceNotification();
}

function showWebcamPermissionPopup() {
    const existingPopup = document.querySelector('.webcam-permission-popup');
    if (existingPopup) return;

    const popup = document.createElement('div');
    popup.className = 'webcam-permission-popup';
    popup.innerHTML = `
        <div class="webcam-permission-content">
            <h2>Webcam Access Required</h2>
            <p>Please allow webcam access to proceed with the exam.</p>
            <button class="webcam-retry-btn">Retry Webcam Access</button>
        </div>
    `;
    document.body.appendChild(popup);
    activePopups.push(popup);

    const retryButton = popup.querySelector('.webcam-retry-btn');
    retryButton.addEventListener('click', async () => {
        const success = await startWebcam();
        if (success && document.body.contains(popup)) {
            document.body.removeChild(popup);
            activePopups = activePopups.filter(p => p !== popup);
        }
    });
}

// ===== Face Detection Functions =====
async function loadFaceApi() {
    try {
        if (typeof faceapi === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/dist/face-api.min.js';
            document.head.appendChild(script);
            await new Promise((resolve, reject) => {
                script.onload = resolve;
                script.onerror = () => reject(new Error('Failed to load face-api.js'));
            });

            await Promise.all([
                faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/'),
                faceapi.nets.faceLandmark68Net.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model/')
            ]);
        }
    } catch (err) {
        console.error('Error loading face-api:', err);
        showViolationPopup('Failed to load face detection library. Please check your network connection.');
        throw err;
    }
}

function getBrightness(canvas) {
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let brightnessSum = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        brightnessSum += (0.299 * r + 0.587 * g + 0.114 * b);
    }
    return brightnessSum / (canvas.width * canvas.height);
}

function showFaceNotification(message) {
    clearFaceNotification();
    const container = document.getElementById('face-warning-container');
    if (!container) return;
    let notification = document.createElement('div');
    notification.id = 'face-warning';
    notification.textContent = message;
    notification.className = 'px-4 py-2 text-white font-semibold bg-red-600 rounded-lg mt-2';
    notification.style.position = 'fixed';
    notification.style.right = '10px';
    notification.style.top = '250px';
    notification.style.width = '280px';
    notification.style.textAlign = 'center';
    notification.style.zIndex = '999';
    container.appendChild(notification);
}

function clearFaceNotification() {
    const container = document.getElementById('face-warning-container');
    if (container) container.innerHTML = '';
}

async function startFaceDetection() {
    faceDetectionInterval = setInterval(async () => {
        if (!examStarted || examEnded || !mediaStream) return;

        const canvas = document.createElement('canvas');
        canvas.width = webcamFeed.videoWidth;
        canvas.height = webcamFeed.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(webcamFeed, 0, 0, canvas.width, canvas.height);

        const brightness = getBrightness(canvas);
        console.log(`Brightness: ${brightness.toFixed(2)}`);
        const now = Date.now();

        let message = null;
        if (brightness < 50) {
            message = 'Environment too dark. Please increase lighting.';
            console.log('Detected: Too dark');
        } else if (brightness > 200) {
            message = 'Environment too bright. Please reduce lighting.';
            console.log('Detected: Too bright');
        } else {
            const detections = await faceapi.detectAllFaces(canvas, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks();
            console.log(`Faces detected: ${detections.length}`);
            if (detections.length === 0) {
                message = 'No face detected. Please stay in frame.';
                console.log('Detected: No face');
            } else if (detections.length > 1) {
                message = 'Multiple faces detected. Only one person allowed.';
                console.log('Detected: Multiple faces');
            }
        }

        if (message) {
            if (now - lastFaceDetectionIssue >= 5001) {
                faceViolationLog.push({
                    type: message.toUpperCase(),
                    time: new Date().toLocaleTimeString(),
                    sessionID
                });
                lastFaceDetectionIssue = now;
                console.log(`Logged violation: ${message}`);
            }
            showFaceNotification(message);
        } else {
            clearFaceNotification();
            console.log('No issues detected');
        }
    }, 1000);
}

// ===== Audio Monitoring Functions =====
async function startAudioMonitoring() {
    if (audioLevelBar) audioLevelBar.parentElement.style.display = 'flex';
    if (!window.AudioContext && !window.webkitAudioContext) {
        console.error('AudioContext not supported in this browser');
        showViolationPopup('Audio monitoring is not supported in this browser.');
        return false;
    }
    try {
        audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(audioStream);
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 1024;
        source.connect(analyser);

        audioMonitorInterval = setInterval(checkAudioLevel, 500);
        return true;
    } catch (err) {
        console.error('Microphone access denied:', err);
        showAudioPermissionPopup();
        return false;
    }
}

function stopAudioMonitoring() {
    if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
        audioStream = null;
    }
    if (audioContext && audioContext.state !== 'closed') {
        audioContext.close();
        audioContext = null;
    }
    if (audioMonitorInterval) {
        clearInterval(audioMonitorInterval);
        audioMonitorInterval = null;
    }
    analyser = null;
    clearAudioNotification();
    if (audioLevelBar) audioLevelBar.parentElement.style.display = 'none';
}

function checkAudioLevel() {
    if (!analyser) return;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    analyser.getByteTimeDomainData(dataArray);

    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const value = dataArray[i] - 128;
        sum += value * value;
    }
    const rms = Math.sqrt(sum / dataArray.length);

    const percent = Math.min(100, Math.max(0, (rms / 50) * 100));
    if (audioLevelFill) {
        audioLevelFill.style.width = percent + '%';
        // Change color to black when sound is detected, otherwise revert to default gradient
        audioLevelFill.style.background = rms > 0 ? '#000000' : 'linear-gradient(90deg, #000000, #333333)';
    }
    
    if (Math.abs(rms - lastRms) > audioConfig.rmsChangeThreshold && rms > audioConfig.speechRmsThreshold) {
        speechSegments++;
    } else if (rms > audioConfig.highAudioThreshold && speechSegments === 0) {
        showAudioNotification('High environmental noise detected! Please be seated in a quiet environment.');
        audioWarningActive = true;
        audioViolationLog.push({
            type: 'HIGH ENVIRONMENTAL NOISE',
            time: new Date().toLocaleTimeString(),
            sessionID
        });
    } else if (speechSegments > audioConfig.speechSegmentThreshold) {
        showAudioNotification('Multiple users detected or multiple voices detected! Only one person should be present. Please be seated in a quiet environment.');
        audioWarningActive = true;
        audioViolationLog.push({
            type: 'MULTIPLE USERS DETECTED',
            time: new Date().toLocaleTimeString(),
            sessionID
        });
        speechSegments = 0;
    } else if (audioWarningActive) {
        clearAudioNotification();
        audioWarningActive = false;
    }
    lastRms = rms;
}

function showAudioNotification(message) {
    if (!audioWarningContainer) return;
    
    audioWarningContainer.style.position = 'fixed';
    audioWarningContainer.style.bottom = '40px';
    audioWarningContainer.style.left = '50%';
    audioWarningContainer.style.transform = 'translateX(-50%)';
    audioWarningContainer.style.width = '80%';
    audioWarningContainer.style.textAlign = 'center';
    audioWarningContainer.style.background = '#dc2626';
    audioWarningContainer.style.color = 'white';
    audioWarningContainer.style.padding = '10px';
    audioWarningContainer.style.borderRadius = '8px';
    audioWarningContainer.style.zIndex = '9999';
    
    audioWarningContainer.textContent = message;
    audioWarningContainer.style.display = 'block';
}

function clearAudioNotification() {
    if (audioWarningContainer) audioWarningContainer.style.display = 'none';
}

function showAudioPermissionPopup() {
    const existingPopup = document.querySelector('.audio-permission-popup');
    if (existingPopup) return;

    const popup = document.createElement('div');
    popup.className = 'audio-permission-popup';
    popup.innerHTML = `
        <div class="audio-permission-content">
            <h2>Microphone Access Required</h2>
            <p>Please allow microphone access to proceed with the exam.</p>
            <button class="audio-retry-btn">Retry Microphone Access</button>
        </div>
    `;
    document.body.appendChild(popup);
    activePopups.push(popup);

    const retryButton = popup.querySelector('.audio-retry-btn');
    retryButton.addEventListener('click', async () => {
        const success = await startAudioMonitoring();
        if (success && document.body.contains(popup)) {
            document.body.removeChild(popup);
            activePopups = activePopups.filter(p => p !== popup);
        }
    });
}

// ===== Initialize Exam =====
function initExam() {
    if (!startScreen || !examContainer || !questionsContainer) {
        console.error('Required DOM elements are missing');
        return;
    }

    if (!/Chrome/.test(navigator.userAgent)) {
        examContainer.innerHTML = '<p style="text-align: center;">This exam requires Google Chrome.</p>';
        startScreen.style.display = 'none';
        examContainer.style.display = 'block';
        return;
    }

    examData.questions = shuffleArray(examData.questions, true);
    examData.questions.forEach((_, index) => {
        localStorage.removeItem(`q${index}`);
    });
    sessionStorage.removeItem('examSubmitted');

    if (sessionStorage.getItem('examSubmitted') === 'true') {
        examContainer.innerHTML = '<p style="text-align: center;">You have already submitted this exam.</p>';
        startScreen.style.display = 'none';
        examContainer.style.display = 'block';
        return;
    }

    questionsContainer.innerHTML = examData.questions.map((q, index) => `
        <div class="question" id="question-${index}" style="${index !== 0 ? 'display: none;' : ''}">
            <h3 class="text-xl font-semibold mb-4">Q${index + 1}: ${q.question}</h3>
            ${q.type === "written" ? `
                <div class="written-answer">
                    <textarea id="written-${index}" maxlength="${q.maxLength || 500}"
                        placeholder="Type your answer here..." class="w-full p-4">${localStorage.getItem(`q${index}`) || ''}</textarea>
                    <div class="char-count text-gray-400 mt-2"><span id="count-${index}">${localStorage.getItem(`q${index}`) ? localStorage.getItem(`q${index}`).length : 0}</span>/${q.maxLength || 500} characters</div>
                </div>
            ` : `
                <div class="options space-y-3">
                    ${q.options.map((opt, i) => `
                        <div class="p-3">
                            <input type="radio" name="q${index}" id="q${index}o${i}" value="${i}"
                                ${localStorage.getItem(`q${index}`) === i.toString() ? 'checked' : ''}>
                            <label for="q${index}o${i}" class="ml-2">${opt}</label>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `).join('');

    if (questionNav) {
        questionNav.innerHTML = examData.questions.map((_, i) => `
            <button class="nav-btn px-3 py-1" data-index="${i}">${i + 1}</button>
        `).join('');
        questionNav.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                saveAnswers();
                showQuestion(parseInt(btn.dataset.index));
            });
        });
    }

    examData.questions.forEach((q, index) => {
        if (q.type === "written") {
            const textarea = document.getElementById(`written-${index}`);
            if (textarea) {
                textarea.addEventListener('input', () => {
                    const countElement = document.getElementById(`count-${index}`);
                    if (countElement) countElement.textContent = textarea.value.length;
                    saveAnswers();
                });
            }
        }
    });

    loadAnswers();
    updateProgressBar();
    updateNavigationButtons();
    updateQuestionStatus();
}

// ===== Start Exam =====
async function startExam() {
    if (!startBtn) {
        console.error('Start button not found');
        return;
    }

    startBtn.disabled = true;
    startBtn.textContent = 'Launching...';

    const userName = document.getElementById('user-name')?.value.trim();
    const userDob = document.getElementById('user-dob')?.value;
    const userRoll = document.getElementById('user-roll')?.value.trim();
    
    if (!userName || !userDob || !userRoll) {
        alert('Please fill in all required fields');
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    // Calculate age based on DOB
    const age = calculateAge(userDob);
    console.log(`User age: ${age}`);

    // Check if the DOB is invalid
    if (age === -1) {
        alert('Invalid date of birth. Please select a valid date using the calendar.');
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    // Check if the user is under 18 or over 80
    if (age < 18) {
        alert('You must be 18 or older to take this exam.\nIf you believe this is an error, please contact support at support@examapp.com.');
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    if (age > 80) {
        alert('You must be 80 or younger to take this exam.\nIf you believe this is an error, please contact support at support@examapp.com.');
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    try {
        await initDatabase();
        await saveUserData({
            name: userName,
            dob: userDob,
            rollNumber: userRoll,
            age: age, // Store the calculated age
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        console.error('Database error:', err);
    }
    
    const webcamSuccess = await startWebcam();
    if (!webcamSuccess) {
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    const audioSuccess = await startAudioMonitoring();
    if (!audioSuccess) {
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    }

    try {
        await document.documentElement.requestFullscreen();
        if (startScreen) startScreen.style.display = 'none';
        if (examContainer) examContainer.style.display = 'block';
        examStarted = true;
        startTimer();
        setupSecurityMeasures();
        addWatermark();
        updateQuestionStatus();
        violationLog.push({
            type: "EXAM STARTED",
            time: new Date().toLocaleTimeString(),
            details: `Session ID: ${sessionID}, Age: ${age}`,
            platform: navigator.platform,
            userAgent: navigator.userAgent,
            rollNumber: userRoll,
            isInformational: true
        });
    } catch (err) {
        console.error("Fullscreen not allowed:", err);
        handleViolation('FULLSCREEN REQUIRED');
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
        return;
    } finally {
        startBtn.disabled = false;
        startBtn.textContent = 'Begin Examination';
    }
}

// ===== Security Setup =====
function setupSecurityMeasures() {
    let fullscreenInitialized = false;
    setTimeout(() => {
        fullscreenInitialized = true;
    }, 2000);

    document.addEventListener('keydown', (e) => {
        if (examStarted && !examEnded) {
            const comboKeys = ['t', 'w', 'n', 'r', 'Tab'];
            if (e.key === 'Escape') {
                e.preventDefault();
                handleViolation('ESCAPE KEY PRESSED');
            }
            if ((e.ctrlKey || e.metaKey) && comboKeys.includes(e.key)) {
                e.preventDefault();
                handleViolation(`${e.metaKey ? 'CMD' : 'CTRL'} + ${e.key.toUpperCase()} DETECTED`);
                window.focus();
                document.documentElement.requestFullscreen().catch(() => {});
            }
            if ((isMac && e.metaKey && e.shiftKey && ['3','4','5','6'].includes(e.key)) ||
                e.key === 'PrintScreen' ||
                (e.ctrlKey && e.key === 'p') ||
                (e.altKey && e.key === 'PrintScreen')) {
                e.preventDefault();
                handleScreenshotAttempt('SCREENSHOT ATTEMPT');
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'i') {
                e.preventDefault();
                handleViolation('DEV TOOLS DETECTED');
            }
        }
    });

    document.addEventListener('fullscreenchange', () => {
        if (!document.fullscreenElement && examStarted && !examEnded && fullscreenInitialized) {
            handleViolation('ATTEMPTED TO EXIT FULLSCREEN');
            document.documentElement.requestFullscreen().catch(() => {});
        }
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden && examStarted && !examEnded) {
            handleViolation('ATTEMPTED TO SWITCH TABS');
            window.focus();
            document.documentElement.requestFullscreen().catch(() => {});
        }
    });

    window.addEventListener('blur', () => {
        if (examStarted && !examEnded) {
            const now = Date.now();
            if (now - lastWindowSwitchAttempt < 500) {
                console.log('Window switch ignored due to debounce');
                return;
            }
            lastWindowSwitchAttempt = now;
            handleViolation('ATTEMPTED TO SWITCH WINDOWS');
        }
    });

    document.addEventListener('contextmenu', (e) => {
        if (examStarted && !examEnded) {
            e.preventDefault();
            handleViolation('RIGHT CLICK DETECTED');
        }
    });

    document.addEventListener('copy', (e) => {
        if (examStarted && !examEnded) {
            e.preventDefault();
            handleViolation('COPY ATTEMPT');
        }
    });

    document.addEventListener('paste', (e) => {
        if (examStarted && !examEnded) {
            e.preventDefault();
            handleViolation('PASTE ATTEMPT');
        }
    });

    const devToolsCheck = setInterval(() => {
        if (examStarted && !examEnded) {
            const widthThreshold = window.outerWidth - window.innerWidth > 160;
            const heightThreshold = window.outerHeight - window.innerHeight > 160;
            if (widthThreshold || heightThreshold) {
                handleViolation('DEV TOOLS DETECTED');
            }
        } else {
            clearInterval(devToolsCheck);
        }
    }, 1000);

    setInterval(() => {
        if (examStarted && !examEnded && fullscreenInitialized) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
            if (!document.hasFocus()) {
                window.focus();
            }
        }
    }, 500);
}

// ===== Violation Handling =====
function handleViolation(message) {
    const now = Date.now();
    if (now - lastViolationAttempt < 2000) {
        console.log('Violation ignored due to debounce');
        return;
    }
    lastViolationAttempt = now;

    console.log(`Violation detected: ${message}. Warnings: ${warnings}, Violations: ${violations}`);
    if (warnings < 2) {
        warnings++;
        console.log(`Incremented warning to ${warnings}`);
        violationLog.push({
            type: `WARNING: ${message}`,
            time: new Date().toLocaleTimeString(),
            sessionID
        });
        showViolationPopup(message);
    } else {
        violations++;
        console.log(`Incremented violation to ${violations}`);
        violationLog.push({
            type: message,
            time: new Date().toLocaleTimeString(),
            sessionID
        });
        if (violations < 3) {
            showViolationPopup(message);
        } else {
            console.log('Terminating exam: 2 warnings and 3 violations reached');
            endExam(true);
        }
    }
}

function handleScreenshotAttempt(type) {
    const now = Date.now();
    if (now - lastScreenshotAttempt < 2000) {
        console.log('Screenshot attempt ignored due to debounce');
        return;
    }
    lastScreenshotAttempt = now;

    console.log(`Screenshot attempt detected. Warnings: ${warnings}, Violations: ${violations}`);
    if (warnings < 2) {
        warnings++;
        console.log(`Incremented warning to ${warnings}`);
        violationLog.push({
            type: `WARNING: ${type}`,
            time: new Date().toLocaleTimeString(),
            sessionID
        });
        showViolationPopup('SCREENSHOT ATTEMPT BLOCKED', true);
    } else {
        violations++;
        console.log(`Incremented violation to ${violations}`);
        violationLog.push({
            type: type,
            time: new Date().toLocaleTimeString(),
            sessionID
        });
        if (violations < 3) {
            showViolationPopup('SCREENSHOT ATTEMPT BLOCKED', true);
        } else {
            console.log('Terminating exam: 2 warnings and 3 violations reached');
            endExam(true);
        }
    }
}

function showViolationPopup(message, isScreenshot = false) {
    console.log(`Violation popup triggered: ${message}. Warnings: ${warnings}, Violations: ${violations}`);

    if (activePopups.length > 0) {
        const popup = activePopups[0];
        if (popup && document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
        activePopups = [];
    }

    if (warnings >= 2 && violations >= 3) {
        return;
    }

    const displayMessage = isScreenshot ? 'Screenshot attempt blocked' : message.replace(/^(WARNING: )?/, '');
    const popup = document.createElement('div');
    popup.className = 'violation-popup';
    popup.innerHTML = `
        <div class="violation-content">
            <h2 class="text-2xl font-bold">${warnings < 2 ? 'WARNING!' : 'SECURITY VIOLATION!'}</h2>
            <p class="text-lg">${displayMessage}</p>
            <p class="text-md"><strong>${warnings < 2 ? `Warning ${warnings}/2` : `Violation ${violations}/3 (after 2 warnings)`}</strong></p>
            <p class="text-md">${warnings < 2 ? 'First two incidents are warnings only' : 'Exam will terminate on third violation'}</p>
            <p class="text-sm">Attempt at ${new Date().toLocaleTimeString()}</p>
            <p class="text-sm">Session ID: ${sessionID}</p>
            <button class="popup-ok-btn">OK - Return to Exam</button>
        </div>
    `;
    document.body.appendChild(popup);
    activePopups.push(popup);

    const okButton = popup.querySelector('.popup-ok-btn');
    if (okButton) {
        okButton.addEventListener('click', () => {
            if (document.body.contains(popup)) {
                document.body.removeChild(popup);
            }
            activePopups = [];
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        });
    }

    setTimeout(() => {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
            activePopups = [];
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        }
    }, 3000);
}

function addWatermark() {
    const watermark = document.createElement('div');
    watermark.id = 'exam-watermark';
    watermark.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><text x='50%' y='50%' font-size='20' text-anchor='middle' fill='red' transform='rotate(-45 200,200)'>${sessionID}</text></svg>")`;
    watermark.style.position = 'fixed';
    watermark.style.top = '0';
    watermark.style.left = '0';
    watermark.style.width = '100%';
    watermark.style.height = '100%';
    watermark.style.opacity = '0.1';
    watermark.style.pointerEvents = 'none';
    document.body.appendChild(watermark);
}

// ===== Timer =====
function startTimer() {
    if (timerElement) {
        updateTimerDisplay();
        timerInterval = setInterval(() => {
            timeLeft--;
            updateTimerDisplay();
            if (timeLeft === 5 * 60 && timeWarning) timeWarning.style.display = 'block';
            if (timeLeft <= 0) endExam(true);
        }, 1000);
    } else {
        console.warn('Timer element not found');
    }
}

function updateTimerDisplay() {
    if (timerElement) {
        const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
        const secs = (timeLeft % 60).toString().padStart(2, '0');
        timerElement.textContent = `Time left: ${mins}:${secs}`;
    } else {
        console.warn('Timer element not found');
    }
}

// ===== Question Navigation =====
function showQuestion(index) {
    document.querySelectorAll('.question').forEach((q, i) => {
        if (q) q.style.display = i === index ? 'block' : 'none';
    });
    currentQuestion = index;
    updateNavigationButtons();
    updateQuestionStatus();
}

function updateNavigationButtons() {
    if (prevBtn) prevBtn.disabled = currentQuestion === 0;
    if (nextBtn) nextBtn.disabled = currentQuestion === examData.questions.length - 1;
}

// ===== Progress Tracking =====
function updateProgressBar() {
    if (progressBar) {
        const answeredCount = answeredQuestions.filter(Boolean).length;
        const progress = (answeredCount / examData.questions.length) * 100;
        progressBar.style.width = `${progress}%`;
    } else {
        console.warn('Progress bar element not found');
    }
}

function saveAnswers() {
    const saveIndicator = document.createElement('div');
    saveIndicator.id = 'save-indicator';
    saveIndicator.textContent = 'Saving...';
    saveIndicator.className = 'fixed top-4 right-4 px-4 py-2 bg-[#00cccc] text-[#1a1a1a] rounded-lg';
    document.body.appendChild(saveIndicator);

    examData.questions.forEach((q, index) => {
        if (q.type === "written") {
            const textarea = document.getElementById(`written-${index}`);
            if (textarea) {
                localStorage.setItem(`q${index}`, textarea.value);
                answeredQuestions[index] = textarea.value.trim() !== "";
            }
        } else {
            const selected = document.querySelector(`input[name="q${index}"]:checked`);
            if (selected) {
                localStorage.setItem(`q${index}`, selected.value);
                answeredQuestions[index] = true;
            }
        }
    });

    setTimeout(() => {
        if (document.body.contains(saveIndicator)) {
            document.body.removeChild(saveIndicator);
        }
    }, 1000);
    updateProgressBar();
    updateQuestionStatus();
}

function loadAnswers() {
    examData.questions.forEach((q, index) => {
        const savedValue = localStorage.getItem(`q${index}`);
        if (savedValue !== null) {
            if (q.type === "written") {
                const textarea = document.getElementById(`written-${index}`);
                if (textarea) {
                    textarea.value = savedValue;
                    answeredQuestions[index] = savedValue.trim() !== "";
                }
            } else {
                const radio = document.getElementById(`q${index}o${savedValue}`);
                if (radio) {
                    radio.checked = true;
                    answeredQuestions[index] = true;
                }
            }
        }
    });
    updateQuestionStatus();
}

// ===== End Exam =====
function endExam(force = false) {
    if (!force && !examEnded) {
        submitConfirmation.style.display = 'flex';
        return;
    }
    examEnded = true;
    clearInterval(timerInterval);
    if (audioLevelBar) audioLevelBar.parentElement.style.display = 'none';
    stopAudioMonitoring();
    stopWebcam();

    let score = 0;
    examData.questions.forEach((q, index) => {
        if (!q.type) {
            const selected = localStorage.getItem(`q${index}`);
            if (selected !== null && parseInt(selected) === q.answer) {
                score++;
            }
        }
    });

    const answers = examData.questions.map((q, index) => ({
        question: q.question,
        type: q.type || 'multiple-choice',
        answer: localStorage.getItem(`q${index}`) || 'Not answered',
        originalIndex: q.originalIndex
    }));

    const resultData = {
        sessionID,
        rollNumber: document.getElementById('user-roll')?.value,
        score,
        total: examData.questions.filter(q => !q.type).length,
        answers,
        timestamp: new Date().toISOString()
    };

    Promise.all([
        saveExamResult(resultData),
        saveViolations([...violationLog, ...faceViolationLog, ...audioViolationLog])
    ]).then(() => {
        sessionStorage.setItem('examSubmitted', 'true');
        examContainer.innerHTML = `
            <div class="text-center">
                <h2 class="text-2xl font-bold">Exam ${force ? 'Terminated' : 'Submitted'}</h2>
                <p class="mt-4">${force ? 'Your exam was terminated due to multiple violations.' : 'Thank you for completing the exam!'}</p>
                <p class="mt-2">Your score: ${score} / ${examData.questions.filter(q => !q.type).length}</p>
                <p class="mt-2">Violations recorded: ${violations} (after 2 warnings)</p>
                <p class="mt-2">Session ID: ${sessionID}</p>
            </div>
        `;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    }).catch(err => {
        console.error('Error saving exam data:', err);
        examContainer.innerHTML = `
            <div class="text-center">
                <h2 class="text-2xl font-bold">Error</h2>
                <p class="mt-4">There was an error saving your exam. Please contact support.</p>
                <p class="mt-2">Session ID: ${sessionID}</p>
            </div>
        `;
        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
        }
    });

    activePopups.forEach(popup => {
        if (document.body.contains(popup)) {
            document.body.removeChild(popup);
        }
    });
    activePopups = [];
}

if (submitBtn) submitBtn.addEventListener('click', () => endExam());
if (confirmSubmitBtn) confirmSubmitBtn.addEventListener('click', () => endExam(true));
if (backToExamBtn) backToExamBtn.addEventListener('click', () => {
    if (submitConfirmation) submitConfirmation.style.display = 'none';
});
if (prevBtn) prevBtn.addEventListener('click', () => {
    saveAnswers();
    if (currentQuestion > 0) showQuestion(currentQuestion - 1);
});
if (nextBtn) nextBtn.addEventListener('click', () => {
    saveAnswers();
    if (currentQuestion < examData.questions.length - 1) showQuestion(currentQuestion + 1);
});
if (startBtn) startBtn.addEventListener('click', startExam);

document.addEventListener('DOMContentLoaded', () => {
    initExam();
});