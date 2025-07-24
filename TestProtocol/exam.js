document.addEventListener('DOMContentLoaded', () => {
    (async () => {
      const videoFeed = document.getElementById('video-feed');
      const questionContainer = document.getElementById('question-container');
      const submitExamBtn = document.getElementById('submit-exam-btn');
      const prevBtn = document.getElementById('prev-btn');
      const nextBtn = document.getElementById('next-btn');
  
      let questions = [];
      let currentQuestionIndex = 0;
      let userAnswers = {};
  
      // Start webcam stream
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoFeed.srcObject = stream;
      } catch (error) {
        console.error('Error accessing media devices.', error);
        alert('Error accessing media devices. Please ensure you have a webcam and microphone enabled.');
        return;
      }
      while (typeof faceapi === 'undefined') {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      // Load face-api model from your faceModels folder
      await faceapi.nets.tinyFaceDetector.loadFromUri('./faceModels');
      await faceapi.nets.faceLandmark68Net.loadFromUri('./faceModels');
  
      // Start face detection + brightness checks every 3s
      setInterval(async () => {
        if (!videoFeed || videoFeed.readyState !== 4) return;
  
        const detections = await faceapi.detectAllFaces(videoFeed, new faceapi.TinyFaceDetectorOptions());
  
        if (detections.length === 0) {
          alert("⚠️ Face not detected. Please stay in the frame.");
        } else if (detections.length > 1) {
          alert("🚫 Multiple faces detected! Only one person allowed.");
        }
  
        const brightness = detectBrightness(videoFeed);
        if (brightness < 50) {
          alert("💡 Too dark. Please move to a well-lit place.");
        } else if (brightness > 200) {
          alert("☀️ Too bright. Please reduce lighting.");
        }
      }, 3000);
  
      function detectBrightness(videoElement) {
        const canvas = document.createElement('canvas');
        canvas.width = videoElement.videoWidth;
        canvas.height = videoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let total = 0;
        for (let i = 0; i < frame.data.length; i += 4) {
          const brightness = (frame.data[i] + frame.data[i + 1] + frame.data[i + 2]) / 3;
          total += brightness;
        }
        return total / (frame.data.length / 4);
      }
  
      // Fetch exam questions
      const testName = new URLSearchParams(window.location.search).get('testName');
      console.log('testName:', testName);
      try {
        const res = await fetch(`/api/tests/questions?testName=${encodeURIComponent(testName)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        questions = await res.json();
        displayQuestion();
      } catch (error) {
        console.error('Error fetching questions.', error);
        questionContainer.innerHTML = '<p>Error loading questions. Please try again later.</p>';
      }
  
      function displayQuestion() {
        if (questions.length === 0) {
          questionContainer.innerHTML = '<p>No questions available for this test.</p>';
          prevBtn.style.display = 'none';
          nextBtn.style.display = 'none';
          submitExamBtn.style.display = 'none';
          return;
        }
  
        const question = questions[currentQuestionIndex];
        let questionHTML = `
          <div class="question">
            <p>${currentQuestionIndex + 1}. ${question.questionText}</p>
            ${question.options.map(opt => `
              <label>
                <input type="radio" name="question-${currentQuestionIndex}" value="${opt}" ${userAnswers[currentQuestionIndex] === opt ? 'checked' : ''}>
                ${opt}
              </label>
            `).join('<br>')}
          </div>
        `;
        questionContainer.innerHTML = questionHTML;
  
        prevBtn.style.display = currentQuestionIndex === 0 ? 'none' : 'inline-block';
        nextBtn.style.display = currentQuestionIndex === questions.length - 1 ? 'none' : 'inline-block';
        submitExamBtn.style.display = 'inline-block';
  
        document.querySelectorAll(`input[name="question-${currentQuestionIndex}"]`).forEach(input => {
          input.addEventListener('change', (e) => {
            userAnswers[currentQuestionIndex] = e.target.value;
          });
        });
      }
  
      prevBtn.addEventListener('click', () => {
        if (currentQuestionIndex > 0) {
          currentQuestionIndex--;
          displayQuestion();
        }
      });
  
      nextBtn.addEventListener('click', () => {
        if (currentQuestionIndex < questions.length - 1) {
          currentQuestionIndex++;
          displayQuestion();
        }
      });
  
      submitExamBtn.addEventListener('click', () => {
        alert('Exam submitted successfully!');
        window.location.href = '/user-dashboard/user.html';
      });
    })(); // end of async IIFE
  });
  