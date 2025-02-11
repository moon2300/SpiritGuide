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

// API

const playerElement = document.querySelector('[data-player]');
const scoreElement = document.querySelector('[data-score]');
const sendButton = document.querySelector('[data-send-button]');
const responsivePreviewElement = document.querySelector('[data-responsive-preview]');

// her skal vi finde ud af at implementere vores egne elementer (players, scores osv)
const player = generateSpiritName();
const score = Math.round(Math.random() * 1000);

playerElement.textContent = player;
scoreElement.textContent = score.toString();

function generatePirateName() {
    const firstNames = ["Blackbeard", "Salty", "One-Eyed", "Mad", "Captain", "Peg-Leg", "Red", "Stormy", "Jolly", "Barnacle"];
    const lastNames = ["McScurvy", "Silverhook", "Rumbelly", "Seadog", "Plankwalker", "Bones", "Squidbeard", "Driftwood", "Sharkbait", "Bootstraps"];

    const randomFirstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return `${randomFirstName} ${randomLastName}`;
}

sendButton.addEventListener('click', () => {
    fetch(
        'submit-highscore.php',
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                player: player,
                score: score,
            }),
        }
    )

        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            console.log(data);
            responsePreviewElement.textContent = JSON.stringify(data, null, 2);
        })
        .catch(function (error){
            console.error(error);
            responsePreviewElement.textContent = JSON.stringify(error, null, 2);
        });
});


