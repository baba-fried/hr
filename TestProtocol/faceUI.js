class FaceUI {
  constructor() {
    this.videoContainer = document.getElementById('video-container');
    this.faceOverlay = document.getElementById('face-overlay');
    this.faceStatus = document.getElementById('face-status');
    this.logContainer = document.querySelector('.log-entries');
    this.events = [];
  }

  updateFaceStatus(status) {
    const statusIcon = this.faceStatus.querySelector('.status-icon');
    const statusText = this.faceStatus.querySelector('span');

    // Remove all status classes
    statusIcon.classList.remove('status-active', 'status-warning', 'status-error');

    switch(status) {
      case 'detected':
        statusIcon.classList.add('status-active');
        statusText.textContent = 'Face Detected';
        break;
      case 'not_detected':
        statusIcon.classList.add('status-error');
        statusText.textContent = 'Face Not Detected';
        break;
      case 'multiple':
        statusIcon.classList.add('status-error');
        statusText.textContent = 'Multiple Faces Detected';
        break;
      case 'not_centered':
        statusIcon.classList.add('status-warning');
        statusText.textContent = 'Face Not Centered';
        break;
    }
  }

  addEvent(event) {
    const timestamp = new Date().toLocaleTimeString();
    this.events.unshift({ timestamp, message: event });
    this.events = this.events.slice(0, 3); // Keep only last 3 events
    this.updateEventLog();
  }

  updateEventLog() {
    this.logContainer.innerHTML = this.events
      .map(event => `
        <div class="log-entry">
          <small>${event.timestamp}</small>
          <div>${event.message}</div>
        </div>
      `)
      .join('');
  }

  drawFaceBox(detection) {
    const ctx = this.faceOverlay.getContext('2d');
    ctx.clearRect(0, 0, this.faceOverlay.width, this.faceOverlay.height);

    if (!detection) return;

    // Match canvas size to video
    const video = document.getElementById('video-feed');
    this.faceOverlay.width = video.videoWidth;
    this.faceOverlay.height = video.videoHeight;

    // Draw face box
    ctx.strokeStyle = '#2ecc71';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      detection.box.x,
      detection.box.y,
      detection.box.width,
      detection.box.height
    );
  }
}

window.faceUI = new FaceUI();