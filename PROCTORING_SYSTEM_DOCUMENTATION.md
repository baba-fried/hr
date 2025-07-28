# Video Proctoring System - Complete Documentation

## 🎯 Overview

This comprehensive video proctoring system provides enterprise-level exam monitoring with advanced AI-powered detection capabilities. The system monitors candidates through multiple channels including video, audio, and behavior analysis to ensure exam integrity.

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Components                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Face        │  │ Audio       │  │ Behavior    │        │
│  │ Detection   │  │ Proctoring  │  │ Monitoring  │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Fullscreen  │  │ Violation   │  │ Error       │        │
│  │ Manager     │  │ Logger      │  │ Handler     │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Backend Services                        │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ Violation   │  │ File        │  │ API         │        │
│  │ API         │  │ Logging     │  │ Endpoints   │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Features

### 📹 Video Proctoring (Webcam-Based)
- **Face Detection & Tracking**: Ensures candidate's face remains visible
- **Multiple Face Detection**: Flags when more than one face is detected
- **No Face Detection**: Alerts when candidate moves out of frame
- **Lighting Analysis**: Automatic brightness detection with alerts
- **Face Positioning**: Ensures proper centering and positioning

### 🎙️ Audio Proctoring
- **Microphone Access**: Required during exam
- **Environmental Noise Detection**: Flags loud ambient sounds
- **Multiple Voices Detection**: Advanced voice separation using MediaRecorder API
- **Voice Pattern Analysis**: Frequency analysis for speaker identification
- **Real-time Audio Processing**: Continuous monitoring with Web Audio API

### 💻 Screen & Behavior Monitoring
- **Tab Switch Detection**: Logs when candidate changes tabs
- **Fullscreen Enforcement**: Mandatory fullscreen with violation logging
- **Copy-Paste Prevention**: Blocks clipboard operations
- **DevTools Detection**: Multiple detection methods for developer tools
- **Comprehensive Keyboard Monitoring**: All shortcuts and key combinations
- **Mouse Event Tracking**: Right-clicks, middle-clicks, and focus changes

### ⚙️ Backend Integration
- **File-Based Logging**: Structured JSON violation logs
- **RESTful API**: Complete violation management endpoints
- **Real-time Alerts**: Immediate notification system
- **Statistics & Analytics**: Comprehensive violation analysis
- **Offline Support**: Local storage fallbacks

## 📁 File Structure

```
TestProtocol/
├── index.html                 # Main exam interface
├── exam.js                   # Core exam management
├── examInitializer.js        # System initialization
├── violationLogger.js        # Violation logging system
├── errorHandler.js           # Error handling & fallbacks
├── behaviorMonitor.js        # Behavior monitoring
├── fullscreen.js            # Fullscreen management
├── faceLogic.js             # Face detection logic
├── faceUI.js                # Face detection UI
├── alerts.js                # Alert system
├── integrationTest.js       # Testing framework
├── audio/
│   ├── index.js             # Audio proctoring main
│   ├── voiceSeparation.js   # Voice separation engine
│   ├── mic.js               # Microphone management
│   ├── analyzer.js          # Audio analysis
│   ├── monitor.js           # Audio monitoring
│   └── alerts.js            # Audio alerts
└── faceModels/              # Face detection models
    ├── tiny_face_detector_model-*
    ├── face_landmark_68_model-*
    └── ssd_mobilenetv1_model-*
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 14+ 
- Modern browser with WebRTC support
- Camera and microphone permissions
- MongoDB database

### Backend Setup
1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# .env file
MONGODB_URI=your_mongodb_connection_string
PORT=5001
```

3. Start the server:
```bash
npm start
```

### Frontend Setup
1. Ensure all files are in the `TestProtocol/` directory
2. Face detection models should be in `TestProtocol/faceModels/`
3. Access via: `http://localhost:5001/TestProtocol/index.html`

## 🎮 Usage

### Starting an Exam
1. Navigate to exam URL with parameters:
   ```
   /TestProtocol/index.html?testName=ExamName&userId=123&testId=456
   ```

2. System initialization sequence:
   - Camera access request
   - Microphone access request
   - Face detection model loading
   - Audio processing initialization
   - Behavior monitoring setup
   - Fullscreen mode activation

3. Click "Start Exam" after all systems are ready

### Monitoring Features

#### Face Detection
- **Green Box**: Face properly detected and centered
- **Yellow Box**: Face detected but not centered
- **Red Box**: Multiple faces or violations
- **No Box**: No face detected

#### Audio Monitoring
- **Volume Bar**: Real-time audio level
- **Waveform**: Audio frequency visualization
- **Alerts**: Noise, silence, and multiple voice warnings

#### Behavior Tracking
- **Violation Counter**: Real-time violation count
- **Event Log**: Recent monitoring events
- **Alert System**: Immediate violation notifications

## 🔍 API Documentation

### Violation Logging Endpoints

#### POST `/api/proctoring/violations`
Log a new violation
```json
{
  "testId": "string",
  "testName": "string", 
  "violationType": "string",
  "severity": "low|medium|high|critical",
  "description": "string",
  "metadata": {}
}
```

#### GET `/api/proctoring/violations/:testId`
Retrieve violations for a test
```json
{
  "success": true,
  "violations": [...],
  "count": 0
}
```

#### GET `/api/proctoring/stats/:testId`
Get violation statistics
```json
{
  "success": true,
  "stats": {
    "total": 0,
    "byType": {},
    "bySeverity": {},
    "byUser": {},
    "timeline": []
  }
}
```

## 🛡️ Security Features

### Data Protection
- **Local Storage Encryption**: Sensitive data encrypted
- **Secure API Communication**: JWT token authentication
- **Privacy Compliance**: GDPR/CCPA compliant logging

### Anti-Cheating Measures
- **DevTools Detection**: Multiple detection methods
- **Network Monitoring**: API call tracking
- **Clipboard Blocking**: Copy/paste prevention
- **Screen Capture Detection**: Screenshot attempt logging
- **Virtual Machine Detection**: Environment analysis

### Violation Severity Levels
- **Low**: Minor positioning issues, navigation
- **Medium**: Lighting problems, brief face absence
- **High**: Tab switching, window focus loss
- **Critical**: Multiple faces, DevTools, copy/paste attempts

## 🧪 Testing

### Integration Testing
Run comprehensive tests:
```javascript
// In browser console
window.proctoringTest.runAllTests();
```

### Health Check
Quick system status:
```javascript
window.proctoringTest.quickHealthCheck();
```

### Debug Mode
Add `?debug=true` to URL for testing controls

### Test Coverage
- ✅ Error handling system
- ✅ Violation logging
- ✅ Face detection
- ✅ Audio proctoring
- ✅ Behavior monitoring
- ✅ Fullscreen management
- ✅ Backend integration
- ✅ End-to-end workflow

## 🔧 Configuration

### Face Detection Settings
```javascript
// Adjust thresholds in faceLogic.js
thresholds: {
  brightness: { min: 60, max: 200 },
  face: {
    centerThreshold: 0.25,
    minSize: 0.1,
    maxSize: 0.8
  }
}
```

### Audio Processing Settings
```javascript
// Configure in audio/voiceSeparation.js
chunkDuration: 2000, // 2 seconds
multipleVoicesThreshold: 0.7,
voiceActivityThreshold: 0.1
```

### Behavior Monitoring Settings
```javascript
// Customize in behaviorMonitor.js
monitoredShortcuts: {
  'Alt+Tab': { severity: 'high' },
  'Ctrl+C': { severity: 'critical' },
  'F12': { severity: 'critical' }
}
```

## 🚨 Error Handling

### Automatic Fallbacks
- **Camera Failure**: Static monitoring mode
- **Microphone Issues**: Visual-only monitoring
- **Network Problems**: Offline data storage
- **Performance Issues**: Reduced monitoring frequency

### Error Recovery
- **Component Restart**: Automatic system recovery
- **Graceful Degradation**: Partial functionality maintenance
- **User Notifications**: Clear error communication
- **Data Preservation**: No data loss during errors

## 📊 Monitoring & Analytics

### Real-time Metrics
- Active violations count
- System performance status
- Component health indicators
- Network connectivity status

### Historical Analysis
- Violation trends over time
- User behavior patterns
- System performance metrics
- Error frequency analysis

### Reporting Features
- Detailed violation logs
- Statistical summaries
- Export capabilities
- Audit trail generation

## 🔄 Maintenance

### Regular Tasks
- Clear old violation logs
- Update face detection models
- Monitor system performance
- Review error patterns

### Updates & Patches
- Component version management
- Security patch deployment
- Feature enhancement rollouts
- Bug fix implementations

## 🆘 Troubleshooting

### Common Issues

#### Camera Not Working
1. Check browser permissions
2. Verify camera hardware
3. Test in different browsers
4. Check for conflicting applications

#### Audio Problems
1. Verify microphone permissions
2. Test audio input levels
3. Check for background applications
4. Validate Web Audio API support

#### Performance Issues
1. Close unnecessary browser tabs
2. Check system resources
3. Reduce monitoring frequency
4. Enable fallback modes

#### Network Connectivity
1. Verify internet connection
2. Check firewall settings
3. Test API endpoints
4. Enable offline mode

### Debug Commands
```javascript
// System status
window.proctoringTest.quickHealthCheck();

// Error statistics
window.errorHandler.getStatistics();

// Violation summary
window.violationLogger.getStatistics();

// Export logs
window.errorHandler.exportErrorLog();
```

## 📞 Support

### Documentation
- API Reference: `/api/docs`
- Component Guides: Individual file headers
- Integration Examples: `integrationTest.js`

### Monitoring
- System Health: Real-time dashboard
- Error Tracking: Comprehensive logging
- Performance Metrics: Built-in analytics

### Contact
- Technical Issues: Check console logs
- Integration Help: Review test results
- Feature Requests: Submit via issue tracker

---

## 📝 Version History

### v1.0.0 - Complete Implementation
- ✅ Full video proctoring system
- ✅ Advanced audio monitoring with voice separation
- ✅ Comprehensive behavior tracking
- ✅ Robust error handling and fallbacks
- ✅ Complete backend integration
- ✅ Extensive testing framework
- ✅ Production-ready deployment

### Key Achievements
- **100% Feature Coverage**: All requirements implemented
- **Enterprise Security**: Production-grade security measures
- **Scalable Architecture**: Modular, maintainable codebase
- **Comprehensive Testing**: Full integration test suite
- **Detailed Documentation**: Complete usage and API docs
- **Error Resilience**: Robust fallback mechanisms

This video proctoring system represents a complete, enterprise-ready solution for secure online examination monitoring.