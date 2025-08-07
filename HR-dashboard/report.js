let users = [];
let testSubmissions = [];
let candidateDecisions = [];

async function fetchUsersFromDB() {
  try {
    const res = await fetch('/api/users/students');
    const data = await res.json();
    users = data.map(user => ({
      id: user._id,
      name: user.fullName,
      email: user.email,
      dob: user.dob,
      college: user.collegeName,
      course: user.course,
      year: user.yearOfStudy,
      resume: user.resumeUrl || '',
      interview_score: Math.floor(Math.random() * 41) + 60,
      time: 'To be scheduled',
      skills: ['Not added'],
      experience: 'Not available',
      education: `${user.yearOfStudy}, ${user.course} at ${user.collegeName}`,
      notes: 'Pending interview feedback'
    }));
  } catch (error) {
    console.error('Failed to fetch users:', error);
  }
}

async function fetchTestSubmissions() {
  try {
    console.log('🔍 Fetching exam results...');
    const res = await fetch('/api/exam-results');
    const results = await res.json();
    console.log('📊 Exam results fetched:', results.length);
    testSubmissions = results.map(result => ({
      testId: result.testId,
      testName: result.testName,
      userId: result.userId,
      userName: result.userName,
      userEmail: result.userEmail,
      score: result.score,
      totalQuestions: result.total,
      submittedAt: result.takenAt,
      answers: result.answers,
      status: 'completed'
    }));
    console.log('📊 Final test submissions:', testSubmissions);
  } catch (error) {
    console.error('❌ Failed to fetch exam results:', error);
  }
}

async function fetchCandidateDecisions() {
  try {
    console.log('🔍 Fetching candidate decisions...');
    const res = await fetch('/api/candidate-decisions', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const data = await res.json();
    if (data.success) {
      candidateDecisions = data.decisions;
      console.log('📊 Candidate decisions fetched:', candidateDecisions.length);
    }
  } catch (error) {
    console.error('❌ Failed to fetch candidate decisions:', error);
  }
}

function populateReports() {
  console.log('🎯 Populating reports...');
  console.log('📊 Test submissions count:', testSubmissions.length);
  console.log('👥 Users count:', users.length);
  
  const reportContent = document.getElementById("reportContent");
  reportContent.innerHTML = "";

  if (testSubmissions.length === 0) {
    console.log('❌ No test submissions found, showing empty state');
    reportContent.innerHTML = `
      <div class="p-8 text-center">
        <h3 class="text-xl font-semibold text-gray-600 mb-4">No Test Submissions Found</h3>
        <p class="text-gray-500">No students have submitted any tests yet.</p>
        <div class="mt-4 p-4 bg-blue-50 rounded-lg">
          <p class="text-sm text-blue-600">Debug Info:</p>
          <p class="text-xs text-blue-500">Users loaded: ${users.length}</p>
          <p class="text-xs text-blue-500">Tests with participants: ${testSubmissions.length}</p>
        </div>
      </div>
    `;
    return;
  }

  console.log('✅ Showing test submissions:', testSubmissions);
  testSubmissions.forEach(submission => {
    const submissionDate = new Date(submission.submittedAt).toLocaleDateString();
    const submissionTime = new Date(submission.submittedAt).toLocaleTimeString();
    
    // Check if decision exists for this submission
    const decision = candidateDecisions.find(d => d.userId === submission.userId && d.testId === submission.testId);
    
    reportContent.innerHTML += `
      <div class="p-4 border rounded-lg hover:shadow-md transition-shadow bg-white">
        <div class="flex justify-between items-start">
          <div>
            <h3 class="text-xl font-semibold">${submission.userName}</h3>
            <p class="text-gray-600">${submission.userEmail}</p>
            <p class="text-sm text-gray-500">Test: ${submission.testName}</p>
            <p class="text-sm text-gray-500">Submitted: ${submissionDate} at ${submissionTime}</p>
          </div>
          <div class="text-right">
            <div class="text-2xl font-bold text-green-600">${submission.score}/${submission.totalQuestions}</div>
            <div class="text-sm text-gray-500">Score</div>
            <div class="text-sm text-gray-500">Status: ${submission.status}</div>
            ${decision ? `
              <div class="mt-2">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                  decision.decision === 'accepted' ? 'bg-green-100 text-green-800' : 
                  decision.decision === 'rejected' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }">
                  ${decision.decision.toUpperCase()}
                </span>
              </div>
            ` : ''}
          </div>
        </div>
        <div class="flex justify-end items-center mt-4 space-x-2">
          <button onclick="showReport('${submission.userId}', '${submission.testId}')" class="download-btn">View Details</button>
          ${!decision ? `
            <button onclick="showDecisionModal('${submission.userId}', '${submission.userName}', '${submission.userEmail}', '${submission.testId}', '${submission.testName}')" class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Make Decision</button>
          ` : `
            <button onclick="showDecisionModal('${submission.userId}', '${submission.userName}', '${submission.userEmail}', '${submission.testId}', '${submission.testName}', '${decision.decision}', '${decision.notes || ''}')" class="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700">Update Decision</button>
          `}
        </div>
      </div>
    `;
  });
}

function backToReports() {
  document.getElementById("reportContent").style.display = "block";
  const individualReport = document.getElementById("individualReport");
  individualReport.style.display = "none";
  // also remove the back button
  const backButton = individualReport.querySelector('button');
  if (backButton) {
    individualReport.removeChild(backButton);
  }
}

async function showReport(userId, testId) {
  const submission = testSubmissions.find(s => s.userId === userId && s.testId === testId);
  if (!submission) return;

  const reportContent = document.getElementById("reportContent");
  const individualReport = document.getElementById("individualReport");

  reportContent.style.display = "none";
  individualReport.style.display = "block";

  const submissionDate = new Date(submission.submittedAt).toLocaleDateString();
  const submissionTime = new Date(submission.submittedAt).toLocaleTimeString();

  const personalInfoSection = document.getElementById("personalInfoSection");
  personalInfoSection.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">${submission.userName} - Test Report</h2>
      <span class="text-lg text-gray-500">${submission.userId}</span>
    </div>
    <div class="report-section">
      <h3 class="text-xl font-semibold mb-2">Test Information</h3>
      <p><strong>Test Name:</strong> ${submission.testName}</p>
      <p><strong>Student Name:</strong> ${submission.userName}</p>
      <p><strong>Email:</strong> ${submission.userEmail}</p>
      <p><strong>Submission Date:</strong> ${submissionDate} at ${submissionTime}</p>
      <p><strong>Status:</strong> <span class="text-green-600 font-semibold">${submission.status}</span></p>
    </div>
    <div class="report-section">
      <h3 class="text-xl font-semibold mb-2">Test Results</h3>
      <div class="grid grid-cols-2 gap-4">
        <div class="bg-green-50 p-4 rounded-lg">
          <div class="text-3xl font-bold text-green-600">${submission.score}</div>
          <div class="text-sm text-gray-600">Correct Answers</div>
        </div>
        <div class="bg-blue-50 p-4 rounded-lg">
          <div class="text-3xl font-bold text-blue-600">${submission.totalQuestions}</div>
          <div class="text-sm text-gray-600">Total Questions</div>
        </div>
      </div>
      <div class="mt-4">
        <div class="text-2xl font-bold text-gray-800">
          ${Math.round((submission.score / submission.totalQuestions) * 100)}%
        </div>
        <div class="text-sm text-gray-600">Overall Score</div>
      </div>
    </div>
  `;

  const backButton = document.createElement('button');
  backButton.innerHTML = '← Back to Reports';
  backButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 mb-4';
  backButton.onclick = backToReports;
  individualReport.insertBefore(backButton, individualReport.firstChild);

  // Fetch detailed test information including questions
  try {
    const testRes = await fetch(`/api/tests/${testId}`);
    const testData = await testRes.json();
    
    // Show detailed exam results
    const examResultsContainer = document.getElementById('examResultsDropdownContainer');
    if (testData.questions && testData.questions.length > 0) {
      let examDetailsHtml = `
        <div class="mt-4">
          <h4 class="text-lg font-semibold mb-4">Detailed Exam Review</h4>
          <div class="space-y-4">
      `;
      
      testData.questions.forEach((question, index) => {
        const answerObj = submission.answers && submission.answers[index];
        const userAnswer = answerObj ? answerObj.userAnswer : undefined;
        let isCorrect = answerObj ? answerObj.isCorrect : false;
        
        examDetailsHtml += `
          <div class="bg-white border rounded-lg p-4 ${isCorrect ? 'border-green-200' : 'border-red-200'}">
            <div class="flex justify-between items-start mb-2">
              <h5 class="font-semibold text-lg">Question ${index + 1}</h5>
              <span class="text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}">${isCorrect ? '✅ Correct' : '❌ Incorrect'}</span>
            </div>
            <div class="mb-3">
              <p class="text-gray-800 mb-2"><strong>Question:</strong></p>
              <p class="text-gray-700">${question.questionText || 'No question text available'}</p>
            </div>
        `;
        
        // Show options for MCQ questions
        if (question.questionType === 'mcq' && question.options && question.options.length > 0) {
          examDetailsHtml += `
            <div class="mb-3">
              <p class="text-gray-800 mb-2"><strong>Options:</strong></p>
              <div class="space-y-1">
          `;
          question.options.forEach((option, optIndex) => {
            const isUserChoice = userAnswer === option;
            const isCorrectChoice = question.correctAnswer === optIndex;
            let optionClass = 'text-gray-700';
            let optionPrefix = '';
            
            if (isUserChoice && isCorrectChoice) {
              optionClass = 'text-green-600 font-semibold';
              optionPrefix = '✅ ';
            } else if (isUserChoice && !isCorrectChoice) {
              optionClass = 'text-red-600 font-semibold';
              optionPrefix = '❌ ';
            } else if (isCorrectChoice) {
              optionClass = 'text-green-600';
              optionPrefix = '✅ ';
            }
            
            examDetailsHtml += `
              <div class="${optionClass}">
                ${optionPrefix}${String.fromCharCode(65 + optIndex)}. ${option}
              </div>
            `;
          });
          examDetailsHtml += `
              </div>
            </div>
          `;
        }
        
        // Show user answer and correct answer
        examDetailsHtml += `
            <div class="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p class="font-semibold text-gray-800">Student's Answer:</p>
                <p class="text-gray-700">${
                  userAnswer !== null && userAnswer !== undefined
                    ? userAnswer
                    : 'Not answered'
                }</p>
              </div>
              <div>
                <p class="font-semibold text-gray-800">Correct Answer:</p>
                <p class="text-green-600">${
                  question.questionType === 'mcq' 
                    ? question.options[question.correctAnswer] 
                    : question.correctAnswer
                }</p>
              </div>
            </div>
          </div>
        `;
  });
      
      examDetailsHtml += `
          </div>
        </div>
      `;
      
      examResultsContainer.innerHTML = examDetailsHtml;
    } else {
      examResultsContainer.innerHTML = `
        <div class="mt-4">
          <h4 class="text-lg font-semibold mb-2">Answer Details</h4>
          <div class="bg-gray-50 p-4 rounded-lg">
            <p class="text-sm text-gray-600 mb-2">Answers submitted: ${submission.answers ? submission.answers.length : 0}</p>
            <div class="text-xs text-gray-500">
              ${submission.answers ? submission.answers.map((answer, index) => 
                `<div>Q${index + 1}: ${answer !== null && answer !== undefined ? JSON.stringify(answer) : 'Not answered'}</div>`
              ).join('') : 'No answers available'}
            </div>
          </div>
        </div>
      `;
    }
  } catch (error) {
    console.error('Error fetching test details:', error);
    const examResultsContainer = document.getElementById('examResultsDropdownContainer');
    examResultsContainer.innerHTML = `
      <div class="mt-4">
        <h4 class="text-lg font-semibold mb-2">Answer Details</h4>
        <div class="bg-gray-50 p-4 rounded-lg">
          <p class="text-sm text-gray-600 mb-2">Answers submitted: ${submission.answers ? submission.answers.length : 0}</p>
          <div class="text-xs text-gray-500">
            ${submission.answers ? submission.answers.map((answer, index) => 
              `<div>Q${index + 1}: ${answer !== null && answer !== undefined ? JSON.stringify(answer) : 'Not answered'}</div>`
            ).join('') : 'No answers available'}
          </div>
        </div>
      </div>
    `;
  }

  // --- Violation Report Section (HR only) ---
  // Only show if on HR dashboard (simple check: URL contains /HR-dashboard/)
  if (window.location.pathname.includes('/HR-dashboard/')) {
    const violationSectionId = 'violationReportSection';
    let violationSection = document.getElementById(violationSectionId);
    if (!violationSection) {
      violationSection = document.createElement('div');
      violationSection.id = violationSectionId;
      violationSection.className = 'report-section mt-6';
      individualReport.appendChild(violationSection);
    }
    violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3><p>Loading violations...</p>`;

    // Fetch violations for this user
    try {
      const today = new Date().toISOString().split('T')[0];
      fetch(`/api/proctoring/user-violations/${userId}?date=${today}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.violations && data.violations.length > 0) {
            // Filter for this test only
            const filtered = data.violations.filter(v => v.testId === testId);
            if (filtered.length > 0) {
              violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3>
                <div class="overflow-x-auto">
                  <table class="min-w-full text-sm border">
                    <thead><tr>
                      <th class="border px-2 py-1">Type</th>
                      <th class="border px-2 py-1">Time</th>
                      <th class="border px-2 py-1">Severity</th>
                      <th class="border px-2 py-1">Description</th>
                    </tr></thead>
                    <tbody>
                      ${filtered.map(v => `
                        <tr>
                          <td class="border px-2 py-1">${v.violationType}</td>
                          <td class="border px-2 py-1">${new Date(v.timestamp).toLocaleString()}</td>
                          <td class="border px-2 py-1">${v.severity}</td>
                          <td class="border px-2 py-1">${v.description}</td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>`;
            } else {
              violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3><p>No violations detected for this test.</p>`;
            }
          } else {
            violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3><p>No violations detected for this test.</p>`;
          }
        })
        .catch(err => {
          violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3><p class='text-red-600'>Failed to load violations.</p>`;
        });
    } catch (err) {
      violationSection.innerHTML = `<h3 class="text-xl font-semibold mb-2">Violation Report</h3><p class='text-red-600'>Failed to load violations.</p>`;
    }
  }
}

window.onload = async () => {
  console.log('🚀 Report page loading...');
  
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');
  console.log('🔍 URL params - userId:', userId);

  console.log('📥 Fetching users...');
  await fetchUsersFromDB();
  console.log('✅ Users fetched:', users.length);

  console.log('📥 Fetching test submissions...');
  await fetchTestSubmissions();
  console.log('✅ Test submissions fetched:', testSubmissions.length);

  console.log('📥 Fetching candidate decisions...');
  await fetchCandidateDecisions();
  console.log('✅ Candidate decisions fetched:', candidateDecisions.length);

  if (userId) {
    console.log('👤 Showing specific user report for:', userId);
    // Find the first submission for this user
    const userSubmission = testSubmissions.find(s => s.userId === userId);
    if (userSubmission) {
      showReport(userId, userSubmission.testId);
    } else {
      console.log('❌ No submissions found for user:', userId);
      populateReports();
    }
  } else {
    console.log('📊 Showing all reports');
    populateReports();
  }
};

document.getElementById('logoutBtn').addEventListener('click', function() {
  localStorage.removeItem('token');
  window.location.href = '/login-page/login.html';
});

// Decision Modal Functions
function showDecisionModal(userId, userName, userEmail, testId, testName, currentDecision = '', currentNotes = '') {
  const modal = document.createElement('div');
  modal.id = 'decisionModal';
  modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
  
  const isUpdate = currentDecision !== '';
  
  modal.innerHTML = `
    <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">${isUpdate ? 'Update Decision' : 'Make Decision'}</h3>
        <button onclick="closeDecisionModal()" class="text-gray-500 hover:text-gray-700 text-xl">&times;</button>
      </div>
      
      <div class="mb-4">
        <p class="text-sm text-gray-600 mb-2">Candidate: <strong>${userName}</strong></p>
        <p class="text-sm text-gray-600 mb-2">Test: <strong>${testName}</strong></p>
        <p class="text-sm text-gray-600">Email: <strong>${userEmail}</strong></p>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Decision:</label>
        <div class="flex space-x-4">
          <label class="flex items-center">
            <input type="radio" name="decision" value="accepted" ${currentDecision === 'accepted' ? 'checked' : ''} class="mr-2">
            <span class="text-green-600 font-medium">Accept</span>
          </label>
          <label class="flex items-center">
            <input type="radio" name="decision" value="rejected" ${currentDecision === 'rejected' ? 'checked' : ''} class="mr-2">
            <span class="text-red-600 font-medium">Reject</span>
          </label>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Notes (Optional):</label>
        <textarea id="decisionNotes" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Add any additional notes or feedback...">${currentNotes}</textarea>
      </div>
      
      <div class="flex justify-end space-x-3">
        <button onclick="closeDecisionModal()" class="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50">
          Cancel
        </button>
        <button onclick="submitDecision('${userId}', '${userName}', '${userEmail}', '${testId}', '${testName}', '${isUpdate}')" class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          ${isUpdate ? 'Update' : 'Submit'} Decision
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

function closeDecisionModal() {
  const modal = document.getElementById('decisionModal');
  if (modal) {
    modal.remove();
  }
}

async function submitDecision(userId, userName, userEmail, testId, testName, isUpdate) {
  const decision = document.querySelector('input[name="decision"]:checked');
  const notes = document.getElementById('decisionNotes').value;
  
  if (!decision) {
    alert('Please select a decision (Accept or Reject)');
    return;
  }
  
  try {
    const response = await fetch('/api/candidate-decisions/decide', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        userId,
        userName,
        userEmail,
        testId,
        testName,
        decision: decision.value,
        notes
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert(`Candidate ${decision.value} successfully! Email notification sent.`);
      closeDecisionModal();
      // Refresh the page to show updated status
      window.location.reload();
    } else {
      alert(result.message || 'Failed to submit decision');
    }
  } catch (error) {
    console.error('Error submitting decision:', error);
    alert('Failed to submit decision. Please try again.');
  }
}