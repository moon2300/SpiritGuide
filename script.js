
// SKAL HUSKE AT SPØRGE HVAD DET HER ER -----------------------------------------------------
// Extend the base functionality of JavaScript
Array.prototype.last = function () {
    return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
};
// -------------------------------------------------------------------------------------------

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platformPattern = null;
let hellPattern = null;
let flamesPattern = null;

let platforms = [];
let sticks = [];
let trees = [];
let score = 0;
let gameRunning = false;

const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 25; // While waiting
const paddingX = 100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 25;


// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 475;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 375;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;

const hellBaseHeight = 270;

const flamesBaseHeight = 200

const grassBaseHeight = 290;
const grassAmplitude = 25;
const grassStretch = 150;

const stretchingSpeed = 4; // Milliseconds it takes to draw a pixel
const turningSpeed = 4; // Milliseconds it takes to turn a degree
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17; // 24
const heroHeight = 30; // 40

const flamesImage = new Image();
flamesImage.src = "flames.png";

const hellImage = new Image();
hellImage.src = "dirtS.jpg";

const platformImage = new Image();
platformImage.src = "texture3.png"; // Make sure the image path is correct

const canvas = document.getElementById("game");
canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");

const startOverlay= document.querySelector('.start-overlay');
const startButton = document.querySelector('#start')

const gameOverOverlay = document.querySelector('.game-over-overlay');
const nameInput = document.querySelector('.submit-name-input');
const submitButton = document.querySelector('.submit-button');
const gameOverScore = document.querySelector('.game-over-score');


// Initialize layout
flamesImage.onload = function () {
    let scaleFactor = 0.2; // Adjust as needed
    flamesPattern = createResizedPattern(flamesImage, scaleFactor);
}

hellImage.onload = function () {
    let hellScaleFactor = 0.9; // Adjust as needed
    hellPattern = createResizedPattern(hellImage, hellScaleFactor);;
}
platformImage.onload = function () {
    platformPattern = ctx.createPattern(platformImage, "repeat");
    resetGame(); // Ensure it draws after the pattern is set
}

// Resets game variables and layouts but does not start the game (game starts on keypress)
// --- Game Functions ---
function resetGame() {
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;
    gameRunning = true;

    introductionElement.style.opacity = 1;
    perfectElement.style.opacity = 0;
    scoreElement.innerText = score;

    // The first platform is always the same
    // x + w has to match paddingX
    platforms = [{ x: 50, w: 80 }];
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

    trees = [];
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();
    generateTree();

    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;

    draw();
}

function generateTree() {
    const minimumGap = 30;
    const maximumGap = 150;

    // X coordinate of the right edge of the furthest tree
    const lastTree = trees[trees.length - 1];
    let furthestX = lastTree ? lastTree.x : 0;

    const x =
        furthestX +
        minimumGap +
        Math.floor(Math.random() * (maximumGap - minimumGap));

    const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
    const color = treeColors[Math.floor(Math.random() * 3)];

    trees.push({ x, color });
}

function generatePlatform() {
    const minimumGap = 40;
    const maximumGap = 200;
    const minimumWidth = 25;
    const maximumWidth = 100;

    const lastPlatform = platforms[platforms.length - 1];
    let furthestX = lastPlatform.x + lastPlatform.w;

    const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
    const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

    platforms.push({ x, w });
}

resetGame();

window.addEventListener("mousedown", (event) => {
    if (phase === "waiting") {
        lastTimestamp = undefined;
        introductionElement.style.opacity = 0;
        phase = "stretching";
        window.requestAnimationFrame(animate);
    }
});

window.addEventListener("mouseup", (event) => {
    if (phase === "stretching") {
        phase = "turning";
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});

window.requestAnimationFrame(animate);

// The main game loop
function animate(timestamp) {
    if (!gameRunning) return;

    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    switch (phase) {
        case "waiting":
            return; // Stop the loop
        case "stretching": {
            sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
            break;
        }
        case "turning": {
            sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

            if (sticks.last().rotation > 90) {
                sticks.last().rotation = 90;

                const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                if (nextPlatform) {
                    // Increase score
                    score += perfectHit ? 2 : 1;
                    scoreElement.innerText = score;

                    if (perfectHit) {
                        perfectElement.style.opacity = 1;
                        setTimeout(() => (perfectElement.style.opacity = 0), 1000);
                    }

                    generatePlatform();
                    generateTree();
                    generateTree();

                }

                phase = "walking";
            }
            break;
        }
        case "walking": {
            heroX += (timestamp - lastTimestamp) / walkingSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (nextPlatform) {
                // If hero will reach another platform then limit it's position at it's edge
                const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "transitioning";
                }
            } else {
                // If hero won't reach another platform then limit it's position at the end of the pole
                const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "falling";
                }
            }
            break;
        }
        case "transitioning": {
            sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

            const [nextPlatform] = thePlatformTheStickHits();
            if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
                // Add the next step
                sticks.push({
                    x: nextPlatform.x + nextPlatform.w,
                    length: 0,
                    rotation: 0
                });
                phase = "waiting";
            }
            break;


        }
        case "falling": {
            if (sticks.last().rotation < 180)
                sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

            heroY += (timestamp - lastTimestamp) / fallingSpeed;
            const maxHeroY =
                platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
            if (heroY > maxHeroY) {
                endGame();
            }
            break;
        }
        default:
            throw Error("Wrong phase");
    }

    draw();
    window.requestAnimationFrame(animate);

    lastTimestamp = timestamp;
}


function thePlatformTheStickHits() {
    if (sticks.last().rotation != 90)
        throw Error(`Stick is ${sticks.last().rotation}°`);
    const stickFarX = sticks.last().x + sticks.last().length;

    const platformTheStickHits = platforms.find(
        (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );

    // If the stick hits the perfect area
    if (
        platformTheStickHits &&
        platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
        stickFarX &&
        stickFarX <
        platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
    )
        return [platformTheStickHits, true];

    return [platformTheStickHits, false];
}

function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();

    // Center canvas drawing and draw your game objects
    ctx.translate((window.innerWidth - canvasWidth) / 2 - sceneOffset, (window.innerHeight - canvasHeight) / 2);

    drawPlatforms();
    drawHero();
    drawSticks();

    // Restore transformation
    ctx.restore();
}

restartButton.addEventListener('click', (e) => {
    resetGame();
    gameOverOverlay.style.display = "none";
    gameRunning = true;
    window.requestAnimationFrame(animate);
});

// top radius
function drawRoundedTopRect(x, y, width, height, radius) {
    ctx.beginPath();
    // Start at the bottom left of the top-left corner
    ctx.moveTo(x, y + radius);
    // Top-left corner
    ctx.arcTo(x, y, x + radius, y, radius);
    // Top edge
    ctx.lineTo(x + width - radius, y);
    // Top-right corner
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    // Right edge
    ctx.lineTo(x + width, y + height);
    // Bottom edge
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();
}

function drawChristianCross(cx, cy, size, color) {
    // Choose a thickness that is a fraction of the vertical size.
    const thickness = size / 7;
    ctx.fillStyle = color;

    // Draw the vertical bar.
    // It spans from (cy - size/2) at the top to (cy + size/2) at the bottom.
    ctx.fillRect(
        cx - thickness / 2, // horizontally centered at cx
        cy - size / 2,      // top of the vertical bar
        thickness,          // width of the vertical bar
        size                // height of the vertical bar
    );

    // Draw the horizontal bar.
    // Position it so that its vertical center is 1/3 of the way down from the top.
    const horizCenterY = cy - size / 2 + size / 3;
    // Make its width half of the vertical bar's height.
    const horizWidth = size / 2;

    ctx.fillRect(
        cx - horizWidth / 2,         // left: centered horizontally on cx
        horizCenterY - thickness / 2,  // top: centered vertically on horizCenterY
        horizWidth,                  // width of the horizontal bar
        thickness                   // thickness of the horizontal bar
    );
}

function drawPlatforms() {
    if (platformPattern === null) {
        console.warn("Platform pattern not loaded yet.");
        return; // Prevents drawing if the pattern isn't ready
    }
    platforms.forEach(({ x, w }) => {
        ctx.fillStyle = platformPattern; // Use the loaded pattern

        drawRoundedTopRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2,
            10 // Adjust the radius as needed
        );

        if (sticks.last().x < x) {
            // Compute the center of the perfect area.
            const centerX = x + w / 2;
            const centerY = canvasHeight - platformHeight + perfectAreaSize / 2;
            drawChristianCross(centerX, centerY, perfectAreaSize, "white");
        }
    });
}


function drawSticks() {
    sticks.forEach((stick) => {
        ctx.save();
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();
        ctx.restore();
    });
}

// --- Start Button Setup ---
startButton.addEventListener('click', () => {
    // Hide the start overlay
    startOverlay.style.display = "none";
    // Reset and start the game
    resetGame();
    gameRunning = true;
    window.requestAnimationFrame(animate);
});

// --- Additional Event Listeners ---




// Set up event listeners for the buttons in the overlay:
submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    // Optionally hide the game over overlay first
    gameOverOverlay.style.display = "none";
    // Send the score (you can let the fetch complete or not)

  submitScore(nameInput.value, score);

    // Refresh the page after a brief delay (or immediately)
    setTimeout(() => {
        window.location.reload();
    }, 500);
});




// ANIMATION -----------------------------------------------------------------------------------------------------


// CANVAS TEGNE ---------------------------------------------------------------------------------------------------


// Returns the platform the stick hit (if it didn't hit any stick then return undefined)


function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    drawBackground();

    // Center main canvas area to the middle of the screen
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );

    // Draw scene
    drawPlatforms();
    drawHero();
    drawSticks();

    // Restore transformation
    ctx.restore();
}


function drawPlatforms() {
    if (platformPattern === null) {
        console.warn("Platform pattern not loaded yet.");
        return; // Prevents drawing if the pattern isn't ready
    }

    platforms.forEach(({ x, w }) => {
        ctx.fillStyle = platformPattern; // Use the pattern when available

        drawRoundedTopRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2,
            10 // Adjust the radius as needed
        );

        if (sticks.last().x < x) {
            // Compute the center of the perfect area.
            const centerX = x + w / 2;
            const centerY = canvasHeight - platformHeight + perfectAreaSize / 2;
            drawChristianCross(centerX, centerY, perfectAreaSize, "white");
        }

    });
}

function drawGhost(x, y, size) {
    ctx.fillStyle = "white";

    // Ghost body (symmetric version)
    ctx.beginPath();
    // Start at the top center of the ghost’s head
    ctx.moveTo(x, y - size * 1.5);
    // Draw the left side of the ghost
    ctx.quadraticCurveTo(x - size, y - size * 1.5, x - size * 0.8, y + size * 0.5);
    // Create the left bottom “wave” of the ghost’s skirt
    ctx.quadraticCurveTo(x - size * 0.6, y + size * 0.9, x - size * 0.3, y + size * 0.8);
    // Form the bottom dip/center of the ghost
    ctx.quadraticCurveTo(x, y + size * 1.1, x + size * 0.3, y + size * 0.8);
    // Mirror the left bottom wave on the right side
    ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.9, x + size * 0.8, y + size * 0.5);
    // Draw the right side up back to the top center
    ctx.quadraticCurveTo(x + size, y - size * 1.5, x, y - size * 1.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Eyes
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.7, size * 0.15, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.7, size * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.75, size * 0.05, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.75, size * 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Cheeks
    ctx.fillStyle = "pink";
    ctx.beginPath();
    ctx.arc(x - size * 0.45, y - size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.45, y - size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.fill();

    // Mouth
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.4, size * 0.1, 0, Math.PI, false);
    ctx.fill();
}

function drawHero() {
    ctx.save();

    // Choose a ghost size that roughly matches the original hero dimensions.
    // (With heroHeight = 30, a ghost size of 12 gives an overall ghost height ~31.2.)
    let ghostSize = 16;

    // The original hero drawing positions the hero’s bounding box center at:
    //   heroCenterX = heroX
    //   heroCenterY = heroY + canvasHeight - platformHeight - heroHeight/2
    let heroCenterX = heroX;
    let heroCenterY = heroY + canvasHeight - platformHeight - heroHeight / 1.2;

    // In your drawGhost function, the ghost’s vertical bounding box runs from:
    //    top: y - 1.5 * ghostSize
    //    bottom: y + 1.1 * ghostSize
    // so the vertical midpoint is: ( (y - 1.5*ghostSize) + (y + 1.1*ghostSize) ) / 2 = y - 0.2*ghostSize.
    // To have the ghost’s bounding box centered at the hero’s center, we need:
    //    y - 0.2 * ghostSize = heroCenterY  =>  y = heroCenterY + 0.2 * ghostSize.
    let ghostDrawingY = heroCenterY + 0.2 * ghostSize;

    // Translate the coordinate system so that (0,0) is at the intended ghost center.
    ctx.translate(heroCenterX, ghostDrawingY);

    // Now draw the ghost.
    // We call drawGhost with x = 0 so that the ghost is centered horizontally.
    // For the vertical parameter, we pass 0.2*ghostSize so that the ghost’s bounding box
    // (which is drawn from (0, 0.2*ghostSize) in our ghost code) becomes centered.
    drawGhost(0, 0.2 * ghostSize, ghostSize);

    ctx.restore();

}


function drawSticks() {
    sticks.forEach((stick) => {
        ctx.save();

        // Move the anchor point to the start of the stick and rotate
        ctx.translate(stick.x, canvasHeight - platformHeight);
        ctx.rotate((Math.PI / 180) * stick.rotation);

        // Draw stick
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -stick.length);
        ctx.stroke();

        // Restore transformations
        ctx.restore();
    });
}

function drawBackground() {
    // Draw sky
    var gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    // Draw hills
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629FF");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    drawGrass(grassBaseHeight, grassAmplitude, grassStretch, "#334a14");

    drawHell();
    drawFlames();

    // Draw trees
    trees.forEach((tree) => drawTree(tree.x, tree.color));
}



// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
    const groundY = window.innerHeight - hellBaseHeight;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
    for (let i = 0; i < window.innerWidth; i++) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, groundY);
    ctx.fillStyle = color;
    ctx.fill();
}

function drawGrass (baseHeight, amplitude, stretch, color) {
    ctx.beginPath();
    ctx.moveTo(0, window.innerHeight);
    ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
    for (let i = 0; i < window.innerWidth; i++) {
        ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
    }
    ctx.lineTo(window.innerWidth, window.innerHeight);
    ctx.fillStyle = color;
    ctx.fill();
}
function createResizedPattern(image, scaleFactor, repetition = "repeat") {
    // Create an offscreen canvas with the new scaled dimensions
    const offscreen = document.createElement("canvas");
    offscreen.width = image.width * scaleFactor;
    offscreen.height = image.height * scaleFactor;
    const offCtx = offscreen.getContext("2d");

    // Draw the image scaled down
    offCtx.drawImage(image, 0, 0, offscreen.width, offscreen.height);

    // Create and return the pattern
    return ctx.createPattern(offscreen, repetition);
}

function drawHell () {
    if (hellPattern === null) {
        console.warn("Hell pattern not loaded yet.");
        return; // Prevents drawing if the pattern isn't ready
    }

    let hellScaleFactor = 0.5;
    let matrix = new DOMMatrix().scale(hellScaleFactor, hellScaleFactor);
    hellPattern.setTransform(matrix);
    ctx.fillStyle = hellPattern; // Use the loaded pattern
    ctx.fillRect(0, window.innerHeight - hellBaseHeight, window.innerWidth, hellBaseHeight);
}



function drawFlames () {
    if (flamesPattern === null) {
        console.warn("Hell pattern not loaded yet.");
        return; // Prevents drawing if the pattern isn't ready
    }
    let scaleFactor = 1;
    let matrix = new DOMMatrix().scale(scaleFactor, scaleFactor);
    flamesPattern.setTransform(matrix);
    ctx.fillStyle = flamesPattern; // Use the loaded pattern
    ctx.fillRect(0, window.innerHeight - flamesBaseHeight, window.innerWidth, flamesBaseHeight);
}

function drawTree(x, color) {
    ctx.save();
    ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
        getTreeY(x, hill1BaseHeight, hill1Amplitude)
    );

    const treeTrunkHeight = 5;
    const treeTrunkWidth = 2;
    const treeCrownHeight = 25;
    const treeCrownWidth = 10;

    // Draw trunk
    ctx.fillStyle = "#7D833C";
    ctx.fillRect(
        -treeTrunkWidth / 2,
        -treeTrunkHeight,
        treeTrunkWidth,
        treeTrunkHeight
    );

    // Draw crown
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
    const sineBaseY = window.innerHeight - baseHeight;
    return (
        Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
        amplitude +
        sineBaseY
    );
}



function getTreeY(x, baseHeight, amplitude) {
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sinus(x) * amplitude + sineBaseY;
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate a random name as a default value
function generateRandomName() {
    const firstPart = ['Bæ', 'Poop', 'Prut', 'lækker', 'Numse'];
    const secondPart = ['fjæs', 'tærte', 'fis', 'mås', 'Hul'];
    return `${firstPart[randomBetween(0, firstPart.length - 1)]}${secondPart[randomBetween(0, secondPart.length - 1)]}`;
}

// Set up the name input with a generated name
function initializeNameInput() {
    nameInput.value = generateRandomName();
    nameInput.select();
}

// Temporarily disable the submit and exit buttons to prevent spamming
function disableButtonsTemporarily() {
    submitButton.setAttribute('disabled', 'true');


    setTimeout(() => {
        submitButton.removeAttribute('disabled');
    }, 1500); // Delay (in milliseconds)
}

// When the start button is clicked, hide the overlay and start the game
startButton.addEventListener('click', () => {
    // Hide the start overlay
    startOverlay.style.display = "none";

    // Reset game variables (if needed)
    resetGame();

    // Set gameRunning to true and start the animation loop
    gameRunning = true;
    window.requestAnimationFrame(animate);
});

// This function is called when the game is over:
function endGame() {
    gameRunning = false;  // Stop the animation loop
    gameOverOverlay.style.display = "flex"; // Show the overlay
    gameOverScore.textContent = score;       // Display the final score
    disableButtonsTemporarily();
    initializeNameInput();
}



// Submit the score to your server (adjust the URL and logic as needed)

function submitScore(player, score) {
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
        })
        .catch(function (error){
            console.error(error);
        });
}
