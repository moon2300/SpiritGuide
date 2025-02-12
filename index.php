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
<div class="container">
    <div id="score"></div>
    <canvas id="game" width="375" height="375"></canvas>
    <div id="introduction">Hold down the mouse to stretch out a stick</div>
    <div id="perfect">DOUBLE SCORE</div>
    <button id="restart">RESTART</button>
</div>


<div class="game-over-overlay">
    <div class="game-over-container">
        <h2>Game Over!</h2>
        <p>Your score: <span class="game-over-score"></span></p>
        <input type="text" class="submit-name-input" placeholder="Enter your name" />
        <br /><br />
        <button class="submit-button">Submit Score</button>
        <button class="exit-button">Restart Game</button>
    </div>
</div>


</body>
</html>

