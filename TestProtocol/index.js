const startScreen = document.getElementById('start-screen');
const examContainer = document.getElementById('exam-container');

const startExamBtn = document.getElementById('start-exam-btn');
const webcamFeed = document.getElementById('webcam-feed');
const audioLevel = document.getElementById('audio-level');
const violationPopup = document.getElementById('violation-popup');
const violationMessage = document.getElementById('violation-message');
const closePopupBtn = document.getElementById('close-popup-btn');

const testHeader = document.getElementById('test-header');
const questionSection = document.getElementById('question-section');
const questionText = document.getElementById('question-text');
const optionsForm = document.getElementById('options-form');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const resultSection = document.getElementById('result-section');

let questions = [];
let current = 0;
let answers = [];
let score = 0;


function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const testName = getQueryParam('testName');
const userId = localStorage.getItem('userId') || (JSON.parse(localStorage.getItem('userData')||'{}').userId);

async function fetchQuestions() {
  try {
    const resTest = await fetch(`http://localhost:5001/api/tests/by-name/${encodeURIComponent(testName)}`);
    if (!resTest.ok) throw new Error('Test not found');
    const test = await resTest.json();
    const testId = test._id;

    const resQ = await fetch(`http://localhost:5001/api/tests/${testId}/questions`, {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    if (!resQ.ok) throw new Error('Failed to fetch questions');
    const data = await resQ.json();
    questions = data.questions || [];
  } catch (err) {
    questions = [];
    console.error('Error fetching questions:', err);
  }
}

function showQuestion() {
  const q = questions[current];
  questionText.textContent = `Q${current+1}. ${q.questionText}`;
  optionsForm.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const id = `option${idx}`;
    const label = document.createElement('label');
    label.className = 'option';
    label.innerHTML = `<input type="radio" name="option" value="${idx}" required> ${opt}`;
    optionsForm.appendChild(label);
  });
  nextBtn.style.display = (current < questions.length - 1) ? '' : 'none';
  submitBtn.style.display = (current === questions.length - 1) ? '' : 'none';
}

function showViolation(message) {
  violationMessage.textContent = message;
  violationPopup.style.display = 'block';
}

function hideViolation() {
  violationPopup.style.display = 'none';
}


async function startExam() {
  startScreen.style.display = 'none';
  examContainer.style.display = 'block';
  document.documentElement.requestFullscreen();


  await fetchQuestions();
  if (questions.length > 0) {
    questionSection.style.display = 'block';
    showQuestion();
  } else {
    questionSection.innerHTML = '<p>No questions found for this test.</p>';
  }
}


function showPopupMessage(message, type = 'info') {
  const popup = document.createElement('div');
  popup.className = `popup-message popup-${type}`;
  popup.style.position = 'fixed';
  popup.style.top = '30px';
  popup.style.left = '50%';
  popup.style.transform = 'translateX(-50%)';
  popup.style.background = type === 'error' ? '#ef4444' : '#2563eb';
  popup.style.color = '#fff';
  popup.style.padding = '1rem 2rem';
  popup.style.borderRadius = '8px';
  popup.style.zIndex = 2000;
  popup.style.fontSize = '1.1rem';
  popup.textContent = message;
  document.body.appendChild(popup);
  setTimeout(() => { popup.style.opacity = '0'; setTimeout(() => popup.remove(), 500); }, 3000);
}

async function requestPermissions() {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    return true;
  } catch (err) {
    showPopupMessage('Webcam and microphone permissions are required to start the exam.', 'error');
    return false;
  }
}

async function postResult() {
  try {
    await fetch('http://localhost:5001/api/exam-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify({
        userId,
        testName,
        score,
        total: questions.length,
        answers
      })
    });

    showPopupMessage('Your result has been submitted!', 'info');
  } catch (err) {
    showPopupMessage('Failed to submit result to server.', 'error');

    console.error('Failed to post result:', err);
  }
}

function showResult() {
    questionSection.style.display = 'none';
    resultSection.style.display = 'block';
    resultSection.innerHTML = `<h3>Test Completed!</h3>
    <p>Your test has been submitted. You will be able to view your results in the HR report section.</p>`;
    document.getElementById('exit-btn').style.display = 'block';
}

startExamBtn.addEventListener('click', async () => {
  await startExam();
  startProctoring();
});

closePopupBtn.addEventListener('click', () => {
  hideViolation();

});

document.addEventListener('fullscreenchange', () => {
  if (!document.fullscreenElement) {
    showViolation('You have exited fullscreen mode. Please resume fullscreen to continue.');
  }
});

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    showViolation('You have switched to another tab. This is a violation of the exam rules.');
  }
});

document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  showViolation('Right-clicking is disabled during the exam.');
});

document.addEventListener('copy', (e) => {
  e.preventDefault();
  showViolation('Copying is disabled during the exam.');
});

document.addEventListener('paste', (e) => {
  e.preventDefault();
  showViolation('Pasting is disabled during the exam.');
});

document.addEventListener('cut', (e) => {
    e.preventDefault();
    showViolation('Cutting is disabled during the exam.');
});

nextBtn.onclick = (e) => {
  e.preventDefault();
  const selected = optionsForm.querySelector('input[name="option"]:checked');
  if (!selected) {
    showPopupMessage('Please select an option.', 'error');
    return;
  }
  answers[current] = parseInt(selected.value);
  current++;
  showQuestion();
};

submitBtn.onclick = async (e) => {
  e.preventDefault();
  const selected = optionsForm.querySelector('input[name="option"]:checked');
  if (!selected) {
    showPopupMessage('Please select an option.', 'error');
    return;
  }
  answers[current] = parseInt(selected.value);
  score = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correctAnswer) score++;
  });
  showResult();
  await postResult();
};

document.getElementById('exit-btn').onclick = function() {
  window.location.href = '/user-dashboard/user.html';
};

async function startProctoring() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    webcamFeed.srcObject = stream;

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const microphone = audioContext.createMediaStreamSource(stream);
    microphone.connect(analyser);
    analyser.fftSize = 512;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    function checkAudio() {
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (const amplitude of dataArray) {
        sum += amplitude * amplitude;
      }
      const volume = Math.sqrt(sum / dataArray.length);
      audioLevel.style.width = `${volume}%`;
      if (volume > 50) {
        showViolation('Suspicious audio detected. Please remain silent.');
      }
      requestAnimationFrame(checkAudio);
    }

    checkAudio();

    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models');

    setInterval(async () => {
      const detections = await faceapi.detectAllFaces(webcamFeed, new faceapi.TinyFaceDetectorOptions()).withFaceLandmarks().withFaceExpressions();
      if (detections.length === 0) {
        showViolation('No face detected. Please ensure your face is visible.');
      } else if (detections.length > 1) {
        showViolation('Multiple faces detected. Please ensure you are alone.');
      } else {
        const face = detections[0].detection.box;
        if (face.width < 100 || face.height < 100) {
          showViolation('Face is too far from the camera. Please move closer.');
        }
      }
    }, 1000);
  } catch (error) {
    console.error('Error starting proctoring:', error);
    showViolation('Could not start proctoring. Please ensure you have a webcam and microphone connected and have granted the necessary permissions.');
  }

}

document.addEventListener('DOMContentLoaded', () => {
    testHeader.innerHTML = `<h2>Test: ${testName}</h2>`;
});

