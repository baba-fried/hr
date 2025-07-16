// Report Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar navigation
    initializeSidebar();
    
    // Initialize report functionality
    initializeReports();
    
    // Initialize date filters
    initializeDateFilters();

    // Fetch and display all exam results
    fetchAndDisplayExamResults();
});

function initializeSidebar() {
    // Set active state for current page
    const currentPage = document.querySelector('.sidebar a[href="report.html"]');
    if (currentPage) {
        currentPage.classList.add('active');
    }
    
    // Add hover effects
    const sidebarLinks = document.querySelectorAll('.sidebar a');
    sidebarLinks.forEach(link => {
        link.addEventListener('mouseenter', () => {
            if (!link.classList.contains('active')) {
                link.classList.add('hover');
            }
        });
        link.addEventListener('mouseleave', () => {
            link.classList.remove('hover');
        });
    });
}

function initializeReports() {
    // Initialize report cards
    initializeReportCards();
    
    // Initialize report charts
    initializeCharts();
    
    // Initialize report tables
    initializeReportTables();
}

function initializeReportCards() {
    // Update report summary cards with data
    const reportCards = document.querySelectorAll('.report-card');
    reportCards.forEach(card => {
        // Add click handlers for report cards
        card.addEventListener('click', () => {
            const reportType = card.dataset.reportType;
            showDetailedReport(reportType);
        });
    });
}

function initializeCharts() {
    // Initialize charts for data visualization
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartType = container.dataset.chartType;
        createChart(container, chartType);
    });
}

function createChart(container, type) {
    // Implement chart creation based on type
    console.log('Creating chart:', type);
    // Add your chart initialization logic here
}

function initializeReportTables() {
    // Initialize tables with sorting and export functionality
    const tables = document.querySelectorAll('.report-table');
    tables.forEach(table => {
        // Add sorting functionality
        initializeTableSorting(table);
        
        // Add export functionality
        initializeTableExport(table);
    });
}

function initializeDateFilters() {
    const dateFilters = document.querySelectorAll('.date-filter');
    dateFilters.forEach(filter => {
        filter.addEventListener('change', () => {
            updateReports();
        });
    });
}

function updateReports() {
    // Get filter values
    const startDate = document.querySelector('#start-date').value;
    const endDate = document.querySelector('#end-date').value;
    
    // Update all report components
    console.log('Updating reports for date range:', { startDate, endDate });
    // Add your report update logic here
}

function showDetailedReport(reportType) {
    // Show detailed view for selected report type
    console.log('Showing detailed report for:', reportType);
    // Add your detailed report logic here
}

function initializeTableSorting(table) {
    // Add sorting functionality to table headers
    const headers = table.querySelectorAll('th');
    headers.forEach(header => {
        header.addEventListener('click', () => {
            const column = header.dataset.column;
            sortTable(table, column);
        });
    });
}

function initializeTableExport(table) {
    // Add export buttons and functionality
    const exportBtn = table.parentElement.querySelector('.export-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            exportTableData(table);
        });
    }
}

function exportTableData(table) {
    // Implement table data export functionality
    console.log('Exporting table data');
    // Add your export logic here
}

async function fetchAndDisplayExamResults() {
    try {
        const res = await fetch('/api/exam-results');
        const results = await res.json();
        const reportContent = document.getElementById('reportContent');
        if (!Array.isArray(results) || results.length === 0) {
            reportContent.innerHTML = '<div class="report-section">No exam results found.</div>';
            return;
        }
        let html = `<div class='report-section'><h2 class='text-2xl font-bold mb-4'>Exam Results</h2><table class='min-w-full bg-white border border-gray-200'><thead><tr><th class='px-4 py-2 border'>User ID</th><th class='px-4 py-2 border'>Test Name</th><th class='px-4 py-2 border'>Score</th><th class='px-4 py-2 border'>Total</th><th class='px-4 py-2 border'>Date</th><th class='px-4 py-2 border'>Download</th></tr></thead><tbody>`;
        results.forEach((r, idx) => {
            html += `<tr>
                <td class='border px-4 py-2'>${r.userId}</td>
                <td class='border px-4 py-2'>${r.testName}</td>
                <td class='border px-4 py-2'>${r.takenAt ? new Date(r.takenAt).toLocaleString() : ''}</td>
                <td class='border px-4 py-2'><button class='download-btn' data-idx='${idx}'>Download</button></td>
            </tr>`;
        });
        html += '</tbody></table></div>';
        reportContent.innerHTML = html;
        // Attach download logic
        document.querySelectorAll('.download-btn').forEach(btn => {
            btn.onclick = function() {
                const idx = this.getAttribute('data-idx');
                const result = results[idx];
                const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${result.testName}_result_${result.userId}.json`;
                a.click();
                URL.revokeObjectURL(url);
            };
        });
    } catch (err) {
        document.getElementById('reportContent').innerHTML = '<div class="report-section">Failed to load exam results.</div>';
    }
}

async function showReport(userId) {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const reportContent = document.getElementById("reportContent");
    const individualReport = document.getElementById("individualReport");

    // Hide list, show individual report
    reportContent.style.display = "none";
    individualReport.style.display = "block";

    // Personal Info
    document.getElementById("personalInfoSection").innerHTML = `
        <div class="report-section">
            <h3 class="text-xl font-semibold mb-2">Personal Information</h3>
            <p><strong>ID:</strong> ${user.id}</p>
            <p><strong>Name:</strong> ${user.name}</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Education:</strong> ${user.education}</p>
        </div>
    `;

    // Exam Results Section (formerly Interview Assessment)
    // Exam Results Section (formerly Interview Assessment)
const dropdownContainer = document.getElementById('examResultsDropdownContainer');
let examResults = [];

try {
    const res = await fetch(`/api/exam-results/${userId}`);
    examResults = await res.json();
} catch (err) {
    dropdownContainer.innerHTML = '<span class="text-red-600">Failed to load exam results.</span>';
    return;
}

if (!Array.isArray(examResults) || examResults.length === 0) {
    dropdownContainer.innerHTML = '<span class="text-gray-600">No exam results found for this user.</span>';
    return;
}

// Render each exam result
let resultsHtml = '<ul class="space-y-2">';
examResults.forEach((result, idx) => {
    resultsHtml += `<li class="flex items-center justify-between bg-white border rounded p-3">
        <div>
            <strong>${result.testName}</strong> — Score: ${result.score}/${result.total} — ${result.takenAt ? new Date(result.takenAt).toLocaleString() : 'No date'}
        </div>
        <button class="download-btn px-3 py-1 bg-black text-white rounded" data-idx="${idx}">Download</button>
    </li>`;
});
resultsHtml += '</ul>';
dropdownContainer.innerHTML = resultsHtml;

// Attach download logic
dropdownContainer.querySelectorAll('.download-btn').forEach(btn => {
    btn.onclick = function () {
        const idx = this.getAttribute('data-idx');
        const result = examResults[idx];
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${result.testName}_result_${result.userId}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };
});
};