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
            <button id="start">Start</button>
            </div>
            <div class="score-board">
                <iframe src="https://highscores.martindilling.com/games/43/embed?" title="Highscore table for Spirit Guide" width="100%" height="100%"></iframe>
            </div>
        </div>
    </div>
</div>

<div class="container">
    <div id="score"></div>
    <canvas id="game" width="375" height="375"></canvas>
    <div id="introduction">Hold down the mouse to stretch out a stick</div>
    <div id="perfect">DOUBLE SCORE</div>
</div>


<div class="game-over-overlay">

    <div class="game-over-container">
        <div class="indhold">
        <h2>Game Over!</h2>
        <p>Your score: <span class="game-over-score"></span></p>
        <input type="text" class="submit-name-input" placeholder="Enter your name" />
        <br />
        <button class="submit-button">Submit Score</button>
            <p>or</p>

            <button id="restart">RESTART</button>
    </div>

    </div>


</div>


</body>
</html>

