let score = 0;

/*henter id */
const container = document.getElementById('container');
const scoreDisplay = document.getElementById('score')
const resetButton = document.getElementById('reset-button')


/* score bliver højere for hvert click*/
container.addEventListener('click', () => {
    score++;
    scoreDisplay.textContent = score;
});

resetButton.addEventListener('click', () => {
    score = 0;
    scoreDisplay.textContent = score;
});
