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

  drawFaceBox(detection, color = '#2ecc71') {
    const ctx = this.faceOverlay.getContext('2d');
    ctx.clearRect(0, 0, this.faceOverlay.width, this.faceOverlay.height);

    if (!detection) return;

    // Match canvas size to video
    const video = document.getElementById('video-feed');
    this.faceOverlay.width = video.videoWidth;
    this.faceOverlay.height = video.videoHeight;

    // Draw face box with dynamic color
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.strokeRect(
      detection.box.x,
      detection.box.y,
      detection.box.width,
      detection.box.height
    );

    // Draw center guide lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical center line
    ctx.beginPath();
    ctx.moveTo(video.videoWidth / 2, 0);
    ctx.lineTo(video.videoWidth / 2, video.videoHeight);
    ctx.stroke();
    
    // Horizontal center line
    ctx.beginPath();
    ctx.moveTo(0, video.videoHeight / 2);
    ctx.lineTo(video.videoWidth, video.videoHeight / 2);
    ctx.stroke();
    
    ctx.setLineDash([]); // Reset line dash
  }

  drawMultipleFaces(detections) {
    const ctx = this.faceOverlay.getContext('2d');
    ctx.clearRect(0, 0, this.faceOverlay.width, this.faceOverlay.height);

    if (!detections || detections.length === 0) return;

    // Match canvas size to video
    const video = document.getElementById('video-feed');
    this.faceOverlay.width = video.videoWidth;
    this.faceOverlay.height = video.videoHeight;

    // Draw all face boxes in red
    detections.forEach((detection, index) => {
      ctx.strokeStyle = '#e74c3c'; // Red for violations
      ctx.lineWidth = 3;
      ctx.strokeRect(
        detection.box.x,
        detection.box.y,
        detection.box.width,
        detection.box.height
      );

      // Add face number
      ctx.fillStyle = '#e74c3c';
      ctx.font = '16px Arial';
      ctx.fillText(
        `${index + 1}`,
        detection.box.x + 5,
        detection.box.y + 20
      );
    });

    // Add warning text
    ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
    ctx.fillRect(10, 10, 200, 30);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`${detections.length} faces detected!`, 15, 30);
  }
}

window.faceUI = new FaceUI();