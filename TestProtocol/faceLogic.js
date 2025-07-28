class FaceLogic {
  constructor() {
    this.videoFeed = document.getElementById('video-feed');
    this.lastStatus = null;
    this.lastBrightness = null;
    this.violationCounts = {
      noFace: 0,
      multipleFaces: 0,
      notCentered: 0,
      tooDark: 0,
      tooBright: 0
    };
    this.thresholds = {
      brightness: {
        min: 60,  // Too dark below this
        max: 200  // Too bright above this
      },
      face: {
        centerThreshold: 0.25, // 25% of video width
        minSize: 0.1, // Minimum face size relative to video
        maxSize: 0.8  // Maximum face size relative to video
      }
    };
    this.consecutiveViolations = {
      noFace: 0,
      multipleFaces: 0
    };
  }

  async detectFace() {
    if (!this.videoFeed || this.videoFeed.readyState !== 4) return;

    try {
      const detections = await faceapi.detectAllFaces(
        this.videoFeed,
        new faceapi.TinyFaceDetectorOptions()
      );

      // Check brightness
      const brightness = this.detectBrightness();
      this.handleBrightnessCheck(brightness);

      let status;
      if (detections.length === 0) {
        status = 'not_detected';
        this.consecutiveViolations.noFace++;
        this.handleNoFaceDetected();
      } else if (detections.length > 1) {
        status = 'multiple';
        this.consecutiveViolations.multipleFaces++;
        this.handleMultipleFaces(detections);
        this.consecutiveViolations.noFace = 0; // Reset no face counter
      } else {
        const detection = detections[0];
        
        // Reset consecutive violation counters
        this.consecutiveViolations.noFace = 0;
        this.consecutiveViolations.multipleFaces = 0;
        
        // Check face positioning and size
        const faceAnalysis = this.analyzeFace(detection);
        status = faceAnalysis.status;
        
        if (faceAnalysis.violations.length > 0) {
          this.handleFaceViolations(faceAnalysis.violations);
        }
        
        window.faceUI.drawFaceBox(detection, faceAnalysis.color);
      }

      if (status !== this.lastStatus) {
        window.faceUI.updateFaceStatus(status);
        window.faceUI.addEvent(this.getStatusMessage(status));
        this.lastStatus = status;
      }

      return {
        status,
        detections,
        brightness,
        violations: this.violationCounts
      };
    } catch (error) {
      console.error('Face detection error:', error);
      return { status: 'error', error: error.message };
    }
  }

  detectBrightness() {
    const canvas = document.createElement('canvas');
    canvas.width = this.videoFeed.videoWidth;
    canvas.height = this.videoFeed.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(this.videoFeed, 0, 0, canvas.width, canvas.height);

    const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let total = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      const brightness = (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
      total += brightness;
    }
    return total / (frame.data.length / 4);
  }

  handleBrightnessCheck(brightness) {
    let brightnessStatus = null;
    
    if (brightness < this.thresholds.brightness.min) {
      brightnessStatus = 'too_dark';
      if (this.lastBrightness !== 'too_dark') {
        this.violationCounts.tooDark++;
        if (window.violationLogger) {
          window.violationLogger.logViolation(
            'lighting_too_dark',
            'medium',
            'Too dark, please go to a brighter place',
            { brightness: Math.round(brightness) }
          );
        }
      }
    } else if (brightness > this.thresholds.brightness.max) {
      brightnessStatus = 'too_bright';
      if (this.lastBrightness !== 'too_bright') {
        this.violationCounts.tooBright++;
        if (window.violationLogger) {
          window.violationLogger.logViolation(
            'lighting_too_bright',
            'medium',
            'Too bright, please go to a dimmer place',
            { brightness: Math.round(brightness) }
          );
        }
      }
    }
    
    this.lastBrightness = brightnessStatus;
  }

  handleNoFaceDetected() {
    this.violationCounts.noFace++;
    
    // Log violation after 3 consecutive detections (about 9 seconds at 3s intervals)
    if (this.consecutiveViolations.noFace === 3) {
      if (window.violationLogger) {
        window.violationLogger.logViolation(
          'face_not_detected',
          'high',
          'Face not detected in frame for extended period',
          {
            consecutiveCount: this.consecutiveViolations.noFace,
            totalCount: this.violationCounts.noFace
          }
        );
      }
    }
  }

  handleMultipleFaces(detections) {
    this.violationCounts.multipleFaces++;
    
    // Log immediately for multiple faces (critical violation)
    if (window.violationLogger) {
      window.violationLogger.logViolation(
        'multiple_faces_detected',
        'critical',
        `Multiple faces detected (${detections.length} faces)`,
        {
          faceCount: detections.length,
          consecutiveCount: this.consecutiveViolations.multipleFaces,
          totalCount: this.violationCounts.multipleFaces
        }
      );
    }
  }

  analyzeFace(detection) {
    const violations = [];
    let status = 'detected';
    let color = '#2ecc71'; // Green for good

    // Check if face is centered
    const videoCenter = this.videoFeed.videoWidth / 2;
    const faceCenter = detection.box.x + (detection.box.width / 2);
    const threshold = this.videoFeed.videoWidth * this.thresholds.face.centerThreshold;

    if (Math.abs(videoCenter - faceCenter) > threshold) {
      status = 'not_centered';
      color = '#f1c40f'; // Yellow for warning
      violations.push({
        type: 'face_not_centered',
        severity: 'low',
        description: 'Please center your face in the frame',
        metadata: {
          faceCenter: Math.round(faceCenter),
          videoCenter: Math.round(videoCenter),
          deviation: Math.round(Math.abs(videoCenter - faceCenter))
        }
      });
    }

    // Check face size
    const faceArea = detection.box.width * detection.box.height;
    const videoArea = this.videoFeed.videoWidth * this.videoFeed.videoHeight;
    const faceRatio = faceArea / videoArea;

    if (faceRatio < this.thresholds.face.minSize) {
      violations.push({
        type: 'face_too_small',
        severity: 'medium',
        description: 'Please move closer to the camera',
        metadata: {
          faceRatio: faceRatio.toFixed(3),
          minRequired: this.thresholds.face.minSize
        }
      });
      color = '#e67e22'; // Orange for medium warning
    } else if (faceRatio > this.thresholds.face.maxSize) {
      violations.push({
        type: 'face_too_large',
        severity: 'medium',
        description: 'Please move away from the camera',
        metadata: {
          faceRatio: faceRatio.toFixed(3),
          maxAllowed: this.thresholds.face.maxSize
        }
      });
      color = '#e67e22'; // Orange for medium warning
    }

    return { status, violations, color };
  }

  handleFaceViolations(violations) {
    violations.forEach(violation => {
      if (violation.type === 'face_not_centered') {
        this.violationCounts.notCentered++;
      }
      
      if (window.violationLogger) {
        window.violationLogger.logViolation(
          violation.type,
          violation.severity,
          violation.description,
          violation.metadata,
          false // Don't show alert for minor positioning issues
        );
      }
    });
  }

  isFaceCentered(detection) {
    const videoCenter = this.videoFeed.videoWidth / 2;
    const faceCenter = detection.box.x + (detection.box.width / 2);
    const threshold = this.videoFeed.videoWidth * this.thresholds.face.centerThreshold;

    return Math.abs(videoCenter - faceCenter) < threshold;
  }

  getStatusMessage(status) {
    const messages = {
      'not_detected': '⚠️ Face not detected in frame',
      'multiple': '🚫 Multiple faces detected',
      'not_centered': '⚠️ Please center your face',
      'detected': '✅ Face position correct',
      'error': '❌ Face detection error'
    };
    return messages[status] || '❓ Unknown status';
  }

  getViolationSummary() {
    return {
      total: Object.values(this.violationCounts).reduce((sum, count) => sum + count, 0),
      breakdown: { ...this.violationCounts },
      consecutive: { ...this.consecutiveViolations }
    };
  }

  resetViolationCounts() {
    this.violationCounts = {
      noFace: 0,
      multipleFaces: 0,
      notCentered: 0,
      tooDark: 0,
      tooBright: 0
    };
    this.consecutiveViolations = {
      noFace: 0,
      multipleFaces: 0
    };
  }

  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    console.log('Face detection thresholds updated:', this.thresholds);
  }
}

window.faceLogic = new FaceLogic();