<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Document</title>
    <link rel="stylesheet" href="styles.css">
    <script src="script.js" defer></script>

</head>
<body>

<div class="start-overlay">

    <div class="start-container">

        <div class="start-indhold">
            <img src="piczz/Ghost.svg" id="ghost" alt="Ghost character">
            <br />
            <div class="start-button">
                <h2>Hold down the mouse to stretch the stick</h2>
                <img class="mus-gif" src="piczz/fabacc95e84c8d7e39667972aad1ed83.gif" alt="">

            </div>
            <div class="score-board">
                <iframe src="https://highscores.martindilling.com/games/43/embed?" title="Highscore table for Spirit Guide" width="100%" height="100%"></iframe>
            </div>
        </div>
        <button id="start">Start</button>
    </div>
</div>

<div class="container">
    <div id="perfect">SCORE MULTIPLIED</div>
    <div class="score-ui">
    <div id="score"></div>
    <div id="bonus"></div>
    </div>
    <canvas id="game" width="375" height="375"></canvas>
    <div id="introduction"></div>

</div>


<div class="game-over-overlay">

    <div class="game-over-container">
        <div class="indhold">
            <img src="piczz/GhostSlut.svg" id="ghost" alt="Ghost character">
        <h2>Game Over!</h2>
        <p>Your score: <span class="game-over-score"></span></p>
            <label for="playerName">Enter your name:</label>
            <input type="text" id="playerName" class="submit-name-input" placeholder="Enter your name" />

            <br />

            <div class="buttons">
        <button class="submit-button">Submit Score</button>
            <p>or</p>

            <button id="restart">RESTART</button>

            </div>
    </div>

    </div>


</div>


</body>
</html>

