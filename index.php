<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Document</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
<h2>Spirit Guide</h2>
<p>Score: <span id="score">0</span></p>
<div id="container">
    <div class="cirkel"></div>

</div>

<p>Timer: <span id="timer">0</span></p>

<input id="save-score-section">
    <input type="text" id="player-name" class="player-name-input" placeholder="Enter your name">
    <button id="save-score-button">Save Score</button>

<button id="start-button">Start Game</button>

<div id="leaderboard">
    <h3>Leaderboard</h3>
    <div id="leaderboard-entries"></div>
</div>


<script src="index.js"></script>

</body>
</html>

