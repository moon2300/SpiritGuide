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
<br>
<button id="reset-button">Reset Score</button>

<script>

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



</script>

</body>
</html>

