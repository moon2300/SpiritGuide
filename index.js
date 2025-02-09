let score = 0;
let leaderboard = [];
let timeRemaining = 20;
let timerInterval;
let unsavedScore = false;

const container = document.getElementById('container');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startButton = document.getElementById('start-button');
const saveScoreSection = document.getElementById('save-score-section');
const playerNameInput = document.getElementById('player-name');
const saveScoreButton = document.getElementById('save-score-button');
const leaderboardEntries = document.getElementById('leaderboard-entries');


function updateLeaderboardDisplay() {
    leaderboard.sort((a, b) => b.score - a.score);
    leaderboard = leaderboard.slice(0, 5);
    leaderboardEntries.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.className = 'leaderboard-entry';
        entryDiv.innerHTML = `
      <span>${index + 1}. ${entry.name}</span>
      <span>${entry.score}</span>
    `;
        leaderboardEntries.appendChild(entryDiv);
    });
}

function startGame() {
    score = 0;
    timeRemaining = 20;
    scoreDisplay.textContent = score;
    timerDisplay.textContent = timeRemaining;


    container.style.pointerEvents = 'auto';
    saveScoreSection.style.display = 'none';
    startButton.style.display = 'none';
    playerNameInput.value = '';


    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        timeRemaining--;
        timerDisplay.textContent = timeRemaining;
        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
}


function endGame() {
    container.style.pointerEvents = 'none';
    // Mark the round's score as unsaved if the score is greater than 0.
    unsavedScore = score > 0;
    startButton.style.display = 'block';
}

container.addEventListener('click', () => {
    if (timeRemaining > 0) {
        score++;
        scoreDisplay.textContent = score;
    }
});

startButton.addEventListener('click', () => {
    if (unsavedScore) {
        saveScoreSection.style.display = 'block';
        startButton.style.display = 'none';
        playerNameInput.focus();
    } else {
        startGame();
    }
});

saveScoreButton.addEventListener('click', () => {
    const playerName = playerNameInput.value.trim();
    if (!playerName) {
        alert('Please enter your name to save your score!');
        return;
    }

    leaderboard.push({ name: playerName, score: score });
    updateLeaderboardDisplay();

    unsavedScore = false;
    saveScoreSection.style.display = 'none';

    startButton.style.display = 'block';
});
