// User Profile Management
const userProfile = {
    loadUserData: async function () {
        const storedUser = localStorage.getItem('userData');
        if (!storedUser) return;

        const user = JSON.parse(storedUser);

        // Update DOM elements with full user data
        document.getElementById('welcome-heading').textContent = 'Welcome ' + user.fullName;
        document.getElementById('user-greeting').textContent = 'Hi, ' + user.fullName;
        document.getElementById('profile-username').textContent = user.fullName;
        updateAvatar(user.fullName);

        // If you have additional fields like email, DOB, etc., you can update them here
        const emailEl = document.getElementById('user-email');
        if (emailEl) emailEl.textContent = user.email;

        const dobEl = document.getElementById('user-dob');
        if (dobEl) dobEl.textContent = user.dob;

        const collegeEl = document.getElementById('user-college');
        if (collegeEl) collegeEl.textContent = user.collegeName;
    }
};


// Add this function right after the userProfile object
function updateAvatar(name) {
    const initial = name.charAt(0);
    const avatarInitial = document.querySelector('.avatar-initials');
    if (avatarInitial) {
        avatarInitial.textContent = initial;
    }
}

// ...rest of your existing code...
// filepath: c:\Users\Aditya kalkur\Desktop\project\examproject\user-dashboard\user-page.js

// Add this after the existing code
// User Dropdown Management
document.addEventListener('DOMContentLoaded', function() {
    const userName = localStorage.getItem('userName');
    const userProfileButton = document.getElementById('userProfileButton');
    const userDropdown = document.getElementById('userDropdown');

    // Toggle dropdown on click
    userProfileButton.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!userProfileButton.contains(e.target)) {
            userDropdown.classList.remove('active');
        }
    });

    // Handle dropdown item clicks
    document.querySelectorAll('.dropdown-item').forEach(item => {
        item.addEventListener('click', function(e) {
            const action = this.textContent.trim().toLowerCase();
            
            switch(action) {
                case 'profile':
                    // Navigate to profile page
                    window.location.href = '/profile';
                    break;
                case 'settings':
                    // Navigate to settings page
                    window.location.href = '/settings';
                    break;
                case 'log out':
                    // Clear user data and redirect to login
                    localStorage.removeItem('userName');
                    localStorage.removeItem('token');
                    window.location.href = '/login-page/login.html';
                    break;
            }
        });
    });
});

// Add keyboard navigation support
function handleDropdownKeyboard(e) {
    const dropdown = document.getElementById('userDropdown');
    const items = dropdown.querySelectorAll('.dropdown-item');
    const activeItem = dropdown.querySelector('.dropdown-item:focus');
    const index = Array.from(items).indexOf(activeItem);

    switch(e.key) {
        case 'Escape':
            dropdown.classList.remove('active');
            break;
        case 'ArrowDown':
            e.preventDefault();
            items[index + 1]?.focus() || items[0].focus();
            break;
        case 'ArrowUp':
            e.preventDefault();
            items[index - 1]?.focus() || items[items.length - 1].focus();
            break;
    }
}

// Search Functionality
const searchBar = document.querySelector('.search-bar input');
searchBar.addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    // Add your search logic here
    console.log('Searching for:', searchTerm);
});

// Section Navigation
function initializeSectionNavigation() {
    const menuItems = document.querySelectorAll('.menu-item');
    const contentSections = document.querySelectorAll('.content-section');

    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetSection = item.getAttribute('data-section');

            // Update menu items
            menuItems.forEach(mi => mi.classList.remove('active'));
            item.classList.add('active');

            // Update content sections
            contentSections.forEach(section => {
                if (section.id === targetSection) {
                    section.style.display = 'block';
                    section.classList.add('active');
                } else {
                    section.style.display = 'none';
                    section.classList.remove('active');
                }
            });
        });
    });
}

// Initialize Dashboard Charts
function initializeDashboardCharts() {
    // Performance Trends Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Mock Tests',
                data: [75, 82, 78, 85, 80, 82],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score Percentage'
                    }
                }
            }
        }
    });

    // Score Breakdown Chart
    const breakdownCtx = document.getElementById('scoreBreakdownChart').getContext('2d');
    new Chart(breakdownCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Upcoming'],
            datasets: [{
                data: [65, 20, 15],
                backgroundColor: ['#22c55e', '#ef4444', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize Mock Tests Charts
function initializeMockTestsCharts() {
    // Tests Completed Chart (Bar Chart)
    const completedCtx = document.getElementById('mockTestsCompletedChart').getContext('2d');
    new Chart(completedCtx, {
        type: 'bar',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
            datasets: [{
                label: 'Tests Completed',
                data: [2, 3, 4, 3],
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            }
        }
    });

    // Average Performance Chart (Line Chart)
    const performanceCtx = document.getElementById('mockTestsPerformanceChart').getContext('2d');
    new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Test 1', 'Test 2', 'Test 3', 'Test 4', 'Test 5'],
            datasets: [{
                label: 'Score',
                data: [65, 75, 70, 85, 80],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });

    // Topic Distribution Chart (Pie Chart)
    const topicsCtx = document.getElementById('mockTestsTopicsChart').getContext('2d');
    new Chart(topicsCtx, {
        type: 'pie',
        data: {
            labels: ['Technical', 'Aptitude', 'Problem Solving'],
            datasets: [{
                data: [40, 35, 25],
                backgroundColor: ['#3b82f6', '#f59e0b', '#ec4899']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// Initialize all charts when the DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    userProfile.loadUserData();
    initializeSectionNavigation();
    initializeDashboardCharts();
    initializeMockTestsCharts();
});

// Exam Scheduling
function scheduleTest(event) {
    event.preventDefault();
    const form = event.target;
    const testName = form.querySelector('input[type="text"]').value;
    const testDate = form.querySelector('input[type="date"]').value;
    const testTime = form.querySelector('input[type="time"]').value;

    // Here you would typically send this data to your backend
    const testData = {
        name: testName,
        date: testDate,
        time: testTime
    };

    console.log('Scheduling test:', testData);
    // Add your API call here

    // For now, just show a success message
    alert('Test scheduled successfully!');
    form.reset();
}

// Add event listeners to all test scheduling forms
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', scheduleTest);
});

// Initialize Combined Performance Charts
function initializeCombinedCharts() {
    // Combined Performance Trends Chart
    const combinedCtx = document.getElementById('combinedPerformanceChart').getContext('2d');
    new Chart(combinedCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Mock Tests',
                data: [75, 82, 78, 85, 80, 82],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4
            }, {
                label: 'Exams',
                data: [70, 75, 80, 78, 85, 90],
                borderColor: '#22c55e',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score Percentage'
                    }
                }
            }
        }
    });

    // Test Type Distribution Chart
    const distributionCtx = document.getElementById('testDistributionChart').getContext('2d');
    new Chart(distributionCtx, {
        type: 'doughnut',
        data: {
            labels: ['Mock Tests Passed', 'Mock Tests Failed', 'Exams Passed', 'Exams Failed'],
            datasets: [{
                data: [6, 2, 4, 1],
                backgroundColor: [
                    '#3b82f6',  // Mock Tests Passed
                    '#93c5fd',  // Mock Tests Failed
                    '#22c55e',  // Exams Passed
                    '#86efac'   // Exams Failed
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// Initialize all functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    userProfile.loadUserData();
    initializeSectionNavigation();
    initializeMockTestsCharts();
    initializeCombinedCharts();

    // Performance Trends (Line Chart)
    const perfCtx = document.getElementById('performanceChart').getContext('2d');
    new Chart(perfCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Score',
                data: [70, 75, 80, 78, 85, 90],
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37,99,235,0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });

    // Score Breakdown (Doughnut Chart)
    const scoreCtx = document.getElementById('scoreBreakdownChart').getContext('2d');
    new Chart(scoreCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Upcoming'],
            datasets: [{
                data: [5, 1, 2],
                backgroundColor: ['#22c55e', '#ef4444', '#f59e42']
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { position: 'bottom' } }
        }
    });
});

// ...existing code...

// Profile Page Management
const profileManager = {
    init: function() {
        if (!window.location.pathname.includes('profile.html')) return;
        
        this.loadProfileData();
        this.attachEventListeners();
    },

    loadProfileData: function() {
        // Get user data from localStorage
        const userName = localStorage.getItem('userName') || 'User';
        const userEmail = localStorage.getItem('userEmail') || 'user@example.com';
        const userPhone = localStorage.getItem('userPhone') || '';
        const userLocation = localStorage.getItem('userLocation') || '';

        // Update profile information
        this.updateElement('profileName', userName);
        this.updateElement('userEmail', userEmail);
        this.updateElement('fullName', userName, 'value');
        this.updateElement('email', userEmail, 'value');
        this.updateElement('phone', userPhone, 'value');
        this.updateElement('location', userLocation, 'value');
        this.updateElement('profileAvatar', userName.charAt(0).toUpperCase());

        // Load performance data
        this.loadPerformanceData();
    },

    updateElement: function(elementId, value, property = 'textContent') {
        const element = document.getElementById(elementId);
        if (element) element[property] = value;
    },

    loadPerformanceData: function() {
        // You can replace these with actual data from your backend
        const performanceData = {
            mockTests: localStorage.getItem('mockTestsCompleted') || 8,
            averageScore: localStorage.getItem('averageScore') || '82%',
            successRate: localStorage.getItem('successRate') || '75%'
        };

        // Update performance statistics
        const stats = document.querySelectorAll('.stat-card');
        if (stats.length >= 3) {
            stats[0].querySelector('.text-3xl').textContent = performanceData.mockTests;
            stats[1].querySelector('.text-3xl').textContent = performanceData.averageScore;
            stats[2].querySelector('.text-3xl').textContent = performanceData.successRate;
        }
    },

    attachEventListeners: function() {
        const saveButton = document.querySelector('button[onclick="saveChanges()"]');
        if (saveButton) {
            saveButton.removeAttribute('onclick');
            saveButton.addEventListener('click', () => this.saveChanges());
        }
    },

    saveChanges: function() {
        // Get form values
        const formData = {
            fullName: document.getElementById('fullName').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            location: document.getElementById('location').value
        };

        // Validate form data
        if (!this.validateFormData(formData)) {
            return;
        }

        // Save to localStorage
        Object.keys(formData).forEach(key => {
            localStorage.setItem(`user${key.charAt(0).toUpperCase() + key.slice(1)}`, formData[key]);
        });

        // Update display
        this.updateElement('profileName', formData.fullName);
        this.updateElement('userEmail', formData.email);
        this.updateElement('profileAvatar', formData.fullName.charAt(0).toUpperCase());

        // Show success message
        this.showNotification('Profile updated successfully!');
    },

    validateFormData: function(data) {
        if (!data.fullName.trim()) {
            this.showNotification('Please enter your full name', 'error');
            return false;
        }
        if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }
        return true;
    },

    showNotification: function(message, type = 'success') {
        const alertClass = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 ${alertClass} text-white px-6 py-3 rounded-lg shadow-lg transition-opacity duration-500`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 3000);
    }
};

// Initialize profile management when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    profileManager.init();
});

// Fetch and populate dashboard stats from backend
async function loadDashboardStats() {
    try {
        // Replace with your backend endpoint
        const res = await fetch('/api/user/dashboard', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch dashboard data');
        const data = await res.json();

        // Populate mock tests stats
        document.getElementById('mock-tests-completed').textContent = data.mockTests.completed;
        document.getElementById('mock-tests-avg-score').textContent = data.mockTests.avgScore + '%';
        document.getElementById('mock-tests-success-rate').textContent = data.mockTests.successRate + '%';

        // Populate exams stats
        document.getElementById('exams-completed').textContent = data.exams.completed;
        document.getElementById('exams-avg-score').textContent = data.exams.avgScore + '%';
        document.getElementById('exams-performance').textContent = data.exams.performance;

        // Update charts if needed
        if (window.performanceChart && data.performanceTrends) {
            window.performanceChart.data.datasets[0].data = data.performanceTrends.mockTests;
            window.performanceChart.update();
        }
        if (window.scoreBreakdownChart && data.scoreBreakdown) {
            window.scoreBreakdownChart.data.datasets[0].data = data.scoreBreakdown;
            window.scoreBreakdownChart.update();
        }
    } catch (err) {
        // Fallback or show error
        console.error(err);
    }
}

// Fetch and populate last exam details
async function loadLastExamDetails() {
    try {
        const res = await fetch('/api/user/last-exam', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch last exam');
        const exam = await res.json();
        const ul = document.getElementById('last-exam-details');
        ul.innerHTML = `
            <li><strong>Last Exam:</strong> Completed on ${exam.date}</li>
            <li><strong>Score:</strong> ${exam.score}%</li>
            <li><strong>Status:</strong> ${exam.status}</li>
        `;
    } catch (err) {
        // Fallback or show error
        console.error(err);
    }
}

// Fetch and populate upcoming tests table
async function loadUpcomingTests() {
    try {
        const res = await fetch('/api/tests/my-tests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!res.ok) throw new Error('Failed to fetch assigned tests');

        const tests = await res.json();
        const tbody = document.querySelector('#upcoming-tests-table tbody');
        tbody.innerHTML = '';

        tests.forEach(test => {
            const date = new Date(test.dateAdded);
            const formattedDate = date.toLocaleDateString();
            const formattedTime = date.toLocaleTimeString();

            tbody.innerHTML += `
                <tr class="border-b border-gray-100">
                    <td class="py-3">${test.name}</td>
                    <td class="py-3">${formattedDate}</td>
                    <td class="py-3">${formattedTime}</td>
                    <td class="py-3">
                        <a href="#" class="text-blue-600 hover:underline">Start Test</a>
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        console.error('Error:', err);
    }
}

  

// Fetch and populate mock tests table
async function loadMockTests() {
    try {
        const res = await fetch('/api/user/mock-tests', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!res.ok) throw new Error('Failed to fetch mock tests');
        const tests = await res.json();
        const tbody = document.querySelector('#mock-tests-table tbody');
        tbody.innerHTML = '';
        tests.forEach(test => {
            tbody.innerHTML += `
                <tr class="border-b border-gray-100">
                    <td class="py-3">${test.name}</td>
                    <td class="py-3">${test.date}</td>
                    <td class="py-3"><span class="badge ${test.status === 'Completed' ? 'bg-success' : 'bg-warning'}">${test.status}</span></td>
                    <td class="py-3"><a href="#" class="text-blue-600 hover:underline">${test.status === 'Completed' ? 'View Result' : 'Start Test'}</a></td>
                </tr>
            `;
        });
    } catch (err) {
        // Fallback or show error
        console.error(err);
    }
}

// Initialize charts with backend data if available
async function initializeDashboardCharts() {
    // Fetch chart data from backend
    let trends = [75, 82, 78, 85, 80, 82];
    let breakdown = [65, 20, 15];
    try {
        const res = await fetch('/api/user/dashboard-charts', {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
            const data = await res.json();
            trends = data.performanceTrends || trends;
            breakdown = data.scoreBreakdown || breakdown;
        }
    } catch (err) {
        // fallback to static data
    }

    // Performance Trends Chart
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    window.performanceChart = new Chart(performanceCtx, {
        type: 'line',
        data: {
            labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Mock Tests',
                data: trends,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score Percentage'
                    }
                }
            }
        }
    });

    // Score Breakdown Chart
    const breakdownCtx = document.getElementById('scoreBreakdownChart').getContext('2d');
    window.scoreBreakdownChart = new Chart(breakdownCtx, {
        type: 'doughnut',
        data: {
            labels: ['Passed', 'Failed', 'Upcoming'],
            datasets: [{
                data: breakdown,
                backgroundColor: ['#22c55e', '#ef4444', '#f59e0b']
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

// On DOMContentLoaded, fetch and populate all dynamic data
document.addEventListener('DOMContentLoaded', function() {
    // ...existing code...
    loadDashboardStats();
    loadLastExamDetails();
    loadUpcomingTests();
    loadMockTests();
    initializeDashboardCharts();
    // ...existing code...
});