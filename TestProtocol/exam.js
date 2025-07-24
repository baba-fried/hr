document.addEventListener('DOMContentLoaded', async () => {
    const videoFeed = document.getElementById('video-feed');
    const questionContainer = document.getElementById('question-container');
    const submitExamBtn = document.getElementById('submit-exam-btn');
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');

    let questions = [];
    let currentQuestionIndex = 0;
    let userAnswers = {};
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

        // Add event listener for the radio buttons to save the answer
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
        // Placeholder for submission logic
        alert('Exam submitted successfully!');
        window.location.href = '/user-dashboard/user.html';
    });
});