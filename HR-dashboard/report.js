let users = [];
let testSubmissions = [];

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
    console.log('🔍 Fetching test submissions...');
    const res = await fetch('/api/tests');
    const tests = await res.json();
    console.log('📊 Tests fetched:', tests.length);
    console.log('📋 Tests data:', tests);
    
    testSubmissions = [];
    tests.forEach(test => {
      console.log(`🔍 Checking test: ${test.name} (ID: ${test._id})`);
      console.log(`📝 Participants:`, test.participants);
      
      if (test.participants && test.participants.length > 0) {
        console.log(`✅ Found ${test.participants.length} participants for test: ${test.name}`);
        test.participants.forEach(participant => {
          const user = users.find(u => u.id === participant.user);
          console.log(`👤 Participant user:`, participant.user, 'Found user:', user ? user.name : 'Not found');
          
          testSubmissions.push({
            testId: test._id,
            testName: test.name,
            userId: participant.user,
            userName: user ? user.name : 'Unknown User',
            userEmail: user ? user.email : 'Unknown Email',
            score: participant.score,
            totalQuestions: test.questions.length,
            submittedAt: participant.submittedAt,
            answers: participant.answers,
            status: participant.status || 'completed'
          });
        });
      } else {
        console.log(`❌ No participants found for test: ${test.name}`);
      }
    });
    
    console.log('📊 Final test submissions:', testSubmissions);
  } catch (error) {
    console.error('❌ Failed to fetch test submissions:', error);
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
          </div>
        </div>
        <div class="flex justify-end items-center mt-4">
          <button onclick="showReport('${submission.userId}', '${submission.testId}')" class="download-btn">View Details</button>
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
        const userAnswer = submission.answers && submission.answers[index];
        const isCorrect = userAnswer === question.correctAnswer;
        const answerStatus = isCorrect ? '✅ Correct' : '❌ Incorrect';
        const answerColor = isCorrect ? 'text-green-600' : 'text-red-600';
        
        examDetailsHtml += `
          <div class="bg-white border rounded-lg p-4 ${isCorrect ? 'border-green-200' : 'border-red-200'}">
            <div class="flex justify-between items-start mb-2">
              <h5 class="font-semibold text-lg">Question ${index + 1}</h5>
              <span class="text-sm font-medium ${answerColor}">${answerStatus}</span>
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
            const isUserChoice = userAnswer === optIndex;
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
                <p class="text-gray-700">${userAnswer !== null && userAnswer !== undefined ? 
                  (question.questionType === 'mcq' ? 
                    `Option ${String.fromCharCode(65 + userAnswer)}` : 
                    userAnswer) : 
                  'Not answered'}</p>
              </div>
              <div>
                <p class="font-semibold text-gray-800">Correct Answer:</p>
                <p class="text-green-600">${question.questionType === 'mcq' ? 
                  `Option ${String.fromCharCode(65 + question.correctAnswer)}` : 
                  question.correctAnswer}</p>
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