class FaceLogic {
  constructor() {
    this.videoFeed = document.getElementById('video-feed');
    this.lastStatus = null;
  }

  async detectFace() {
    if (!this.videoFeed || this.videoFeed.readyState !== 4) return;

    const detections = await faceapi.detectAllFaces(
      this.videoFeed,
      new faceapi.TinyFaceDetectorOptions()
    );

    let status;
    if (detections.length === 0) {
      status = 'not_detected';
    } else if (detections.length > 1) {
      status = 'multiple';
    } else {
      const detection = detections[0];
      status = this.isFaceCentered(detection) ? 'detected' : 'not_centered';
      window.faceUI.drawFaceBox(detection);
    }

    if (status !== this.lastStatus) {
      window.faceUI.updateFaceStatus(status);
      window.faceUI.addEvent(this.getStatusMessage(status));
      this.lastStatus = status;
    }

    return status;
  }

  isFaceCentered(detection) {
    const videoCenter = this.videoFeed.videoWidth / 2;
    const faceCenter = detection.box.x + (detection.box.width / 2);
    const threshold = this.videoFeed.videoWidth * 0.2; // 20% threshold

    return Math.abs(videoCenter - faceCenter) < threshold;
  }

  getStatusMessage(status) {
    const messages = {
      'not_detected': '⚠️ Face not detected in frame',
      'multiple': '🚫 Multiple faces detected',
      'not_centered': '⚠️ Please center your face',
      'detected': '✅ Face position correct'
    };
    return messages[status];
  }
}

window.faceLogic = new FaceLogic();