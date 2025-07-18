document.addEventListener('DOMContentLoaded', async () => {
    const videoFeed = document.getElementById('video-feed');
    const questionContainer = document.getElementById('question-container');
    const submitExamBtn = document.getElementById('submit-exam-btn');

    // Get user media
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        videoFeed.srcObject = stream;
    } catch (error) {
        console.error('Error accessing media devices.', error);
        alert('Error accessing media devices. Please ensure you have a webcam and microphone enabled.');
    }

    // Fetch exam questions
    const testName = new URLSearchParams(window.location.search).get('testName');
    try {
        const res = await fetch(`/api/tests/questions?testName=${encodeURIComponent(testName)}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const questions = await res.json();
        displayQuestions(questions);
    } catch (error) {
        console.error('Error fetching questions.', error);
        questionContainer.innerHTML = '<p>Error loading questions. Please try again later.</p>';
    }

    function displayQuestions(questions) {
        let questionsHTML = '';
        questions.forEach((q, index) => {
            questionsHTML += `
                <div class="question">
                    <p>${index + 1}. ${q.questionText}</p>
                    ${q.options.map(opt => `
                        <label>
                            <input type="radio" name="question-${index}" value="${opt}">
                            ${opt}
                        </label>
                    `).join('<br>')}
                </div>
            `;
        });
        questionContainer.innerHTML = questionsHTML;
    }

    submitExamBtn.addEventListener('click', () => {
        // Placeholder for submission logic
        alert('Exam submitted successfully!');
        window.location.href = '/user-dashboard/user.html';
    });
});
