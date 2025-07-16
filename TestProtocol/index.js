// Helper to get query param
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

const testName = getQueryParam('testName');
const userId = localStorage.getItem('userId') || (JSON.parse(localStorage.getItem('userData')||'{}').userId);
let questions = [];
let current = 0;
let answers = [];
let score = 0;

const testHeader = document.getElementById('test-header');
const questionSection = document.getElementById('question-section');
const questionText = document.getElementById('question-text');
const optionsForm = document.getElementById('options-form');
const nextBtn = document.getElementById('next-btn');
const submitBtn = document.getElementById('submit-btn');
const resultSection = document.getElementById('result-section');

document.addEventListener('DOMContentLoaded', async () => {
  testHeader.innerHTML = `<h2>Test: ${testName}</h2>`;
  await fetchQuestions();
  if (questions.length > 0) {
    questionSection.style.display = '';
    showQuestion();
  } else {
    questionSection.innerHTML = '<p>No questions found for this test.</p>';
  }
});

async function fetchQuestions() {
  try {
    // First, get the test by name to find its ID
    const resTest = await fetch(`http://localhost:5001/api/tests/by-name/${encodeURIComponent(testName)}`);
    if (!resTest.ok) throw new Error('Test not found');
    const test = await resTest.json();
    const testId = test._id;

    // Now fetch the questions using the test ID
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

nextBtn.onclick = (e) => {
  e.preventDefault();
  const selected = optionsForm.querySelector('input[name="option"]:checked');
  if (!selected) {
    alert('Please select an option.');
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
    alert('Please select an option.');
    return;
  }
  answers[current] = parseInt(selected.value);
  // Calculate score
  score = 0;
  questions.forEach((q, idx) => {
    if (answers[idx] === q.correctAnswer) score++;
  });
  showResult();
  await postResult();
};

function showResult() {
  questionSection.style.display = 'none';
  resultSection.style.display = '';
  resultSection.innerHTML = `<h3>Test Completed!</h3>
    <p>Your test has been submitted. You will be able to view your results in the HR report section.</p>`;
  // Show Exit button
  document.getElementById('exit-btn').style.display = '';
}

document.getElementById('exit-btn').onclick = function() {
  window.location.href = '/user-dashboard/user.html';
};

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
  } catch (err) {
    console.error('Failed to post result:', err);
  }
} 