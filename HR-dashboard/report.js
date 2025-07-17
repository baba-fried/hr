let users = [];

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

function populateReports() {
  const reportContent = document.getElementById("reportContent");
  reportContent.innerHTML = "";

  users.forEach(user => {
    reportContent.innerHTML += `
      <div class="p-4 border rounded-lg hover:shadow-md transition-shadow">
        <div class="flex justify-between items-center">
          <h3 class="text-xl font-semibold">${user.name}</h3>
          <span class="text-sm text-gray-500">${user.id}</span>
        </div>
        <div class="flex justify-end items-center mt-4">
          <button onclick="showReport('${user.id}')" class="download-btn">View Details</button>
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

async function showReport(userId) {
  const user = users.find(u => u.id === userId);
  if (!user) return;

  const reportContent = document.getElementById("reportContent");
  const individualReport = document.getElementById("individualReport");

  reportContent.style.display = "none";
  individualReport.style.display = "block";

  const personalInfoSection = document.getElementById("personalInfoSection");
  personalInfoSection.innerHTML = `
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-3xl font-bold">${user.name} - Detailed Report</h2>
      <span class="text-lg text-gray-500">${user.id}</span>
    </div>
    <div class="report-section">
      <h3 class="text-xl font-semibold mb-2">Personal Information</h3>
      <p><strong>ID:</strong> ${user.id}</p>
      <p><strong>Name:</strong> ${user.name}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      <p><strong>Education:</strong> ${user.education}</p>
    </div>
  `;

  const individualReport = document.getElementById("individualReport");
  const backButton = document.createElement('button');
  backButton.innerHTML = '← Back to Reports';
  backButton.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300';
  backButton.onclick = backToReports;
  individualReport.appendChild(backButton);

  const dropdownContainer = document.getElementById('examResultsDropdownContainer');
  let examResults = [];

  try {
    const res = await fetch(`/api/exam-results/${userId}`);
    examResults = await res.json();
    console.log('examResults', examResults);
  } catch (err) {
    dropdownContainer.innerHTML = '<span class="text-red-600">Failed to load exam results.</span>';
    return;
  }

  if (!Array.isArray(examResults) || examResults.length === 0) {
    dropdownContainer.innerHTML = '<span class="text-gray-600">No exam results found for this user.</span>';
    return;
  }

  let resultsHtml = '<ul class="space-y-2">';
  examResults.forEach((result, idx) => {
    resultsHtml += `
      <li class="flex items-center justify-between bg-gray-100 p-3 rounded-md">
        <span class="font-semibold">${result.testName}</span>
        <button class="download-btn" data-result='${JSON.stringify(result)}'>Download</button>
      </li>
    `;
  });
  resultsHtml += '</ul>';
  dropdownContainer.innerHTML = resultsHtml;
  dropdownContainer.style.display = 'block';

  dropdownContainer.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const resultData = JSON.parse(this.getAttribute('data-result'));
      const blob = new Blob([JSON.stringify(resultData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${resultData.testName}_result.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  });
}

window.onload = async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('id');

  await fetchUsersFromDB();

  if (userId) {
    showReport(userId);
  } else {
    populateReports();
  }
};

document.getElementById('logoutBtn').addEventListener('click', function() {
  localStorage.removeItem('token');
  window.location.href = '/login-page/login.html';
});