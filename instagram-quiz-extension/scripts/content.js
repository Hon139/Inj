let lastURL = location.href;
const shownQuizzes = new Array(lastURL);

let curInd = 0;
let curReelCount = 0;
const reelsPerQuiz = 5;

let curQuizHandler = null;
let quizReel = null;

let wrongMessageText = "Wrong!";

const quizQuestions = [
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correct: 1
    },
    {
      question: "What is the capital of France?",
      options: ["London", "Paris", "Berlin", "Madrid"],
      correct: 1
    },
    {
      question: "What is the largest planet in our solar system?",
      options: ["Earth", "Mars", "Jupiter", "Saturn"],
      correct: 2
    },
    // Add more questions
  ];

  // Add scroll control functions
function disableScroll() {
  document.body.style.overflow = 'hidden';
  document.addEventListener('wheel', preventScroll, { passive: false });
  document.addEventListener('touchmove', preventScroll, { passive: false });
  document.addEventListener('keydown', preventArrowScroll, { passive: false });
}

function enableScroll() {
  document.body.style.overflow = '';
  document.removeEventListener('wheel', preventScroll);
  document.removeEventListener('touchmove', preventScroll);
  document.removeEventListener('keydown', preventArrowScroll);
}

function preventScroll(e) {
  e.preventDefault();
}

function preventArrowScroll(e) {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    e.preventDefault();
  }
}

function createQuizElement() {
  const quizContainer = document.createElement('div');
  quizContainer.className = 'quiz-content';
  quizContainer.style.opacity = 0;
  quizContainer.style.transition = 'opacity 0.5s';

  const randomQuestion = quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
  console.log(chrome.runtime.getURL('/images/quizzler.png'));
  quizContainer.innerHTML = `
    <div style="
      width: 100%;
      text-align: center;
    ">
      <img src="${chrome.runtime.getURL('/images/quizzler.png')}" alt="Quizzler" style="width: 100px; height: 100px; margin: 20px auto; border-radius: 50%;">
      <h2 style="color: white; font-size: 30px; margin: 10px;">The quizzler queries?!</h2>
      <h3 style="
        font-size: 20px;
        margin: 20px;
        color: white;
        line-height: 1.5;
      ">${randomQuestion.question}</h3>
      <div class="quiz-options">
        ${randomQuestion.options.map((option, index) => `
          <button 
            class="quiz-option"
            data-index="${index}"
            data-correct="${randomQuestion.correct}"
          >${option}</button>
        `).join('')}
      </div>
    </div>
  `;

  quizContainer.querySelectorAll('.quiz-option').forEach(button => {
    button.addEventListener('click', function() {
      const selected = parseInt(this.getAttribute('data-index'));
      const correct = parseInt(this.getAttribute('data-correct'));
      handleQuizAnswer(selected, correct, this);
    });
  });

  setTimeout(() => {
    quizContainer.style.opacity = 1;
  }, 100);

  return quizContainer;
}
function handleQuizAnswer(selected, correct, buttonElement) {
  const isCorrect = selected === correct;
  const overlay = buttonElement.closest('.quiz-overlay');
  
  buttonElement.style.background = isCorrect ? 'rgba(0,255,0,0.5)' : 'rgba(255,0,0,0.5)';
  
  if (isCorrect) {
    setTimeout(() => {
      if (overlay) {
        overlay.style.transition = 'opacity 0.25s';
        overlay.style.opacity = 0;
        setTimeout(() => {
          overlay.remove();
          quizReel.style.display = 'block';
          enableScroll();
        }, 250);
      }
    }, 1500);
  } else {
    setTimeout(() => {
      const wrongMessage = document.createElement('div');
      wrongMessage.textContent = wrongMessageText;
      wrongMessage.style.cssText = `
        color: white;
        font-size: 24px;
        text-align: center;
        margin-top: 20px;
      `;
      
      const progressCircle = createProgressCircle();
      progressCircle.style.margin = '20px auto';
      
      overlay.removeChild(overlay.firstChild);
      overlay.appendChild(wrongMessage);
      overlay.appendChild(progressCircle);

      setTimeout(() => {
        overlay.style.transition = 'opacity 0.25s';
        overlay.style.opacity = 0;
        setTimeout(() => {
          if (overlay) {
            overlay.remove();
            quizReel.style.display = 'block';
            enableScroll();
          }
        }, 250);
      }, 10000);
    }, 1500);
  }
}

function createProgressCircle() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "progress-circle");
  svg.setAttribute("width", "50");
  svg.setAttribute("height", "50");
  svg.setAttribute("viewBox", "0 0 100 100");
  
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", "50");
  circle.setAttribute("cy", "50");
  circle.setAttribute("r", "40");
  circle.setAttribute("stroke-width", "8");
  
  svg.appendChild(circle);
  return svg;
}

function showQuiz() {
  const reelContainer = document.querySelectorAll('[role="presentation"]')[curInd];
  const reelBound = reelContainer.closest('[style*="height"][style*="width"]');

  console.log("trying to show quiz", reelBound);
  if (reelBound) {
    // Create quiz overlay
    const quizOverlay = document.createElement('div');
    quizOverlay.className = 'quiz-overlay';

    const quizContent = createQuizElement();
    console.log("created quiz content", quizContent);
    quizOverlay.appendChild(quizContent);
    console.log("appended quiz content?", quizOverlay);
    
    // Add to page
    reelBound.firstChild.style.display = 'none';
    quizReel = reelBound.firstChild;

    reelBound.insertBefore(quizOverlay, reelBound.firstChild);
    //shownQuizzes.add(currentReelID);
    console.log("appended quiz content", reelBound);
 
    setTimeout(() => {
      quizOverlay.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 1000);
  }
}

function getReelIDFromURL(url) {
  const match = url.match(/instagram\.com\/reels\/([^/]+)/);
  return match ? match[1] : null;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "urlChanged") {
    if (lastURL !== message.url && lastURL != "https://www.instagram.com/reels/" && lastURL != "https://www.instagram.com/") {
      console.log(lastURL, message.url);
      console.log("url changed", message.url);

      if (curInd == 0 || shownQuizzes[curInd - 1] != message.url) {
        curInd++;
        if (curInd == shownQuizzes.length) {
          shownQuizzes.push(message.url);
          curReelCount++;
        }
      }
      else {
        curInd--;
      }

      if (curReelCount == reelsPerQuiz) {
        disableScroll();
        showQuiz();
        curReelCount = 0;
      }
    }
    lastURL = message.url;
  }
});