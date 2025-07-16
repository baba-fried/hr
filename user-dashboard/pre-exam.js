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

  document.getElementById('test-details').innerHTML = `
    <p><strong>Name:</strong> ${testDetails.name || testName}</p>
    <p><strong>Role:</strong> ${testDetails.role || 'N/A'}</p>
    <p><strong>Duration:</strong> ${testDetails.duration || 'N/A'} minutes.</p>
  `;

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

  document.getElementById('user-details').innerHTML = `
    <p><strong>User ID:</strong> ${user.userId || 'N/A'}</p>
    <p><strong>Name:</strong> ${user.fullName || 'N/A'}</p>
    <p><strong>Email:</strong> ${user.email || 'N/A'}</p>
    <p><strong>College:</strong> ${user.collegeName || 'N/A'}</p>
    <p><strong>DOB:</strong> ${user.dob || 'N/A'}</p>
  `;

  document.getElementById('begin-exam-btn').addEventListener('click', () => {
    window.location.href = `/TestProtocol/index.html?testName=${encodeURIComponent(testName)}`;
  });
}); 