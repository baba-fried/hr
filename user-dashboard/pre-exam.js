// Parse query params
function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

document.addEventListener('DOMContentLoaded', async () => {
  const testName = getQueryParam('testName');
  let testDetails = {};
  try {
    const res = await fetch('http://localhost:5001/api/tests/my-tests', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
    });
    const tests = await res.json();
    testDetails = tests.find(t => t.name === testName) || {};
  } catch (e) {
    // fallback
  }

  // Create test details with new styling
  const testDetailsHTML = `
    <div class="detail-row">
      <span class="detail-label">Test Name</span>
      <span class="detail-value">${testDetails.name || testName || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Role</span>
      <span class="detail-value">${testDetails.role || 'Candidate'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Duration</span>
      <span class="detail-value">${testDetails.duration || 'N/A'} minutes</span>
    </div>
  `;

  document.getElementById('test-details').innerHTML = testDetailsHTML;

  // Try to get user info from userData, else fallback to individual keys
  let user = {};
  try {
    user = JSON.parse(localStorage.getItem('userData')) || {};
  } catch (e) { user = {}; }
  if (!user.userId && localStorage.getItem('userId')) user.userId = localStorage.getItem('userId');
  if (!user.fullName && localStorage.getItem('userName')) user.fullName = localStorage.getItem('userName');
  if (!user.collegeName && localStorage.getItem('userCollegeName')) user.collegeName = localStorage.getItem('userCollegeName');
  if (!user.dob && localStorage.getItem('userDob')) user.dob = localStorage.getItem('userDob');
  if (!user.email && localStorage.getItem('userEmail')) user.email = localStorage.getItem('userEmail');

  // Create user details with new styling
  const userDetailsHTML = `
    <div class="detail-row">
      <span class="detail-label">User ID</span>
      <span class="detail-value">${user.userId || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Full Name</span>
      <span class="detail-value">${user.fullName || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Email</span>
      <span class="detail-value">${user.email || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">College</span>
      <span class="detail-value">${user.collegeName || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date of Birth</span>
      <span class="detail-value">${user.dob || 'N/A'}</span>
    </div>
  `;

  document.getElementById('user-details').innerHTML = userDetailsHTML;

  document.getElementById('begin-exam-btn').addEventListener('click', () => {
    window.location.href = `../TestProtocol/index.html?testName=${encodeURIComponent(testName)}&role=${encodeURIComponent(testDetails.role || 'Candidate')}&duration=${encodeURIComponent(testDetails.duration || 'N/A')} minutes`;
  });
}); 