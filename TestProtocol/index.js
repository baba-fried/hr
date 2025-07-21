// Dashboard Index JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize sidebar navigation
    initializeSidebar();
    
    // Initialize dashboard components
    initializeDashboard();
    
    // Initialize notifications
    initializeNotifications();
});

function initializeSidebar() {
    // Set active state for current page
    const currentPage = document.querySelector('.sidebar a[href="/webapp/HR-Dashboard/index.html"]');
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

function initializeDashboard() {
    // Initialize dashboard cards
    initializeDashboardCards();
    
    // Initialize dashboard charts
    initializeDashboardCharts();
    
    // Initialize quick actions
    initializeQuickActions();
}

function initializeDashboardCards() {
    // Update dashboard summary cards with data
    const dashboardCards = document.querySelectorAll('.dashboard-card');
    dashboardCards.forEach(card => {
        // Add click handlers for dashboard cards
        card.addEventListener('click', () => {
            const cardType = card.dataset.cardType;
            showDetailedView(cardType);
        });
    });
}

function initializeDashboardCharts() {
    // Initialize charts for dashboard metrics
    const chartContainers = document.querySelectorAll('.chart-container');
    chartContainers.forEach(container => {
        const chartType = container.dataset.chartType;
        createDashboardChart(container, chartType);
    });
}

function createDashboardChart(container, type) {
    // Implement chart creation based on type
    console.log('Creating dashboard chart:', type);
    // Add your chart initialization logic here
}

function initializeQuickActions() {
    // Initialize quick action buttons
    const quickActions = document.querySelectorAll('.quick-action');
    quickActions.forEach(action => {
        action.addEventListener('click', () => {
            const actionType = action.dataset.actionType;
            performQuickAction(actionType);
        });
    });
}

function initializeNotifications() {
    // Initialize notification system
    const notificationBell = document.querySelector('.notification-bell');
    if (notificationBell) {
        notificationBell.addEventListener('click', () => {
            toggleNotificationPanel();
        });
    }
    
    // Check for new notifications
    checkNewNotifications();
}

function toggleNotificationPanel() {
    const panel = document.querySelector('.notification-panel');
    if (panel) {
        panel.classList.toggle('hidden');
    }
}

function checkNewNotifications() {
    // Check for new notifications periodically
    console.log('Checking for new notifications');
    // Add your notification checking logic here
}

function showDetailedView(cardType) {
    // Show detailed view for selected dashboard card
    console.log('Showing detailed view for:', cardType);
    // Add your detailed view logic here
}

function performQuickAction(actionType) {
    // Handle quick action button clicks
    console.log('Performing quick action:', actionType);
    // Add your quick action logic here
}