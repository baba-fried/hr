class AlertSystem {
  constructor() {
    this.alertTimeout = null;
  }

  showAlert(message, type = 'warning') {
    // Clear existing alert if any
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }

    // Create or get alert container
    let alertContainer = document.getElementById('alert-container');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.id = 'alert-container';
      alertContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1000;
        max-width: 300px;
      `;
      document.body.appendChild(alertContainer);
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.style.cssText = `
      padding: 12px 20px;
      margin-bottom: 10px;
      border-radius: 8px;
      color: white;
      background-color: ${this.getAlertColor(type)};
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
    `;
    alert.textContent = message;

    // Add to container
    alertContainer.appendChild(alert);

    // Remove after 3 seconds
    this.alertTimeout = setTimeout(() => {
      alert.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }, 3000);
  }

  getAlertColor(type) {
    const colors = {
      success: '#2ecc71',
      warning: '#f1c40f',
      error: '#e74c3c'
    };
    return colors[type] || colors.warning;
  }
}

window.alerts = new AlertSystem();