// --- Extensions ---
Array.prototype.last = function () {
    return this[this.length - 1];
};
Math.sinus = function (degree) {
    return Math.sin((degree / 180) * Math.PI);
};

// --- Game Data & Variables ---
let phase = "waiting"; // "waiting" | "stretching" | "turning" | "walking" | "transitioning" | "falling"
let lastTimestamp;
let heroX;
let heroY;
let sceneOffset;
let platformPattern = null;
let flamesPattern = null;
let hellPattern = null;
let platforms = [];
let sticks = [];
let trees = [];
let graveStones = [];  // Use lower-case 'g' consistently
let score = 0;
let bonus = 0;
let gameRunning = false;

// --- Constants ---
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const heroDistanceFromEdge = 25;
const paddingX = 100;
const perfectAreaSize = 25;

const stretchingSpeed = 4;     // ms per pixel (stretching)
const turningSpeed = 4;        // ms per degree (turning)
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const heroWidth = 17;
const heroHeight = 30;

// Additional background constants
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHeight = 475;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 375;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const hellBaseHeight = 240;
const flamesBaseHeight = 200;
const grassBaseHeight = 230;
const grassAmplitude = 25;
const grassStretch = 150;

// --- Canvas Setup ---
const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// --- UI Elements ---
const restartButton = document.getElementById("restart");
const scoreElement = document.getElementById("score");
const bonusElement = document.getElementById("bonus");
const perfectElement = document.getElementById("perfect");
const startOverlay = document.querySelector('.start-overlay');
const startButton = document.querySelector('#start');
const gameOverOverlay = document.querySelector('.game-over-overlay');
const nameInput = document.querySelector('.submit-name-input');
const submitButton = document.querySelector('.submit-button');
const gameOverScore = document.querySelector('.game-over-score');

// --- Image Setup ---
const platformImage = new Image();
platformImage.src = "texture3.png"; // Ensure path is correct

const flamesImage = new Image();
flamesImage.src = "flames.png";

const hellImage = new Image();
hellImage.src = "dirtS.jpg";

// Create resized patterns using an offscreen canvas
function createResizedPattern(image, scaleFactor, repetition = "repeat") {
    const offscreen = document.createElement("canvas");
    offscreen.width = image.width * scaleFactor;
    offscreen.height = image.height * scaleFactor;
    const offCtx = offscreen.getContext("2d");
    offCtx.drawImage(image, 0, 0, offscreen.width, offscreen.height);
    return ctx.createPattern(offscreen, repetition);
}

flamesImage.onload = function () {
    let scaleFactor = 0.5; // adjust as needed
    flamesPattern = createResizedPattern(flamesImage, scaleFactor);
    resetGame();
};
hellImage.onload = function () {
    let hellScaleFactor = 0.5; // adjust as needed
    hellPattern = createResizedPattern(hellImage, hellScaleFactor, "repeat-x");
    resetGame();
};
platformImage.onload = function () {
    platformPattern = ctx.createPattern(platformImage, "repeat");
    resetGame(); // Initial draw once the platform pattern is ready
};

// --- Game Functions ---
function resetGame() {
    phase = "waiting";
    lastTimestamp = undefined;
    sceneOffset = 0;
    score = 0;
    bonus = 0;
    gameRunning = true;
    scoreElement.innerText = score;
    bonusElement.style.display = bonus !== 0 ? 'block' : 'none';

    // Reset platforms, trees, gravestones, and sticks
    platforms = [{x: 50, w: 80}];
    trees = [];
    graveStones = [];

    // Generate some platforms
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    // Reset sticks and hero positions
    sticks = [{x: platforms[0].x + platforms[0].w, length: 0, rotation: 0}];
    heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
    heroY = 0;

    // Generate trees and corresponding gravestones
    for (let i = 0; i < 10; i++) {
        let tree = generateTree();
        generateGravestoneForTree(tree);
    }

    draw();
}

    // --- Local Generation Functions ---
    function generatePlatform() {
        const minimumGap = 40;
        const maximumGap = 200;
        const minimumWidth = 25;
        const maximumWidth = 100;
        const lastPlatform = platforms[platforms.length - 1];
        const furthestX = lastPlatform.x + lastPlatform.w;
        const x = furthestX + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
        const w = minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));
        platforms.push({ x, w });
    }

    // Modified generateTree returns the tree object.
    function generateTree() {
        const minimumGap = 30;
        const maximumGap = 150;
        const lastTree = trees.length ? trees[trees.length - 1] : { x: 0 };
        const x = lastTree.x + minimumGap + Math.floor(Math.random() * (maximumGap - minimumGap));
        const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
        const color = treeColors[Math.floor(Math.random() * treeColors.length)];
        let tree = { x, color };
        trees.push(tree);
        return tree;
    }

    // New function: create a gravestone for a given tree.
    function generateGravestoneForTree(tree) {
        const offset = 30; // gravestone stands 20px to the right of the tree
        let gravestoneX = tree.x + offset;
        // Save the tree.x (the trunk's position) for vertical alignment.
        graveStones.push({ x: gravestoneX, color: tree.color, treeX: tree.x });
    }


// --- Main Animation Loop ---
function animate(timestamp) {
    if (!gameRunning) return;
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
        window.requestAnimationFrame(animate);
        return;
    }

    switch (phase) {
        case "waiting":
            return; // Do nothing until input

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
                    if (perfectHit) {
                        bonus++;
                        score+=1;
                        score *= bonus;
                        perfectElement.style.opacity = "1";
                        setTimeout(() => (perfectElement.style.opacity = "0"), 1000);
                    } else if (bonus <=0){
                        bonus = 0
                    }else{
                        bonus = 0;
                        score += 1;
                    }
                    scoreElement.innerText = score;

                    if(bonus !== 0) {
                        bonusElement.innerText = bonus + " x";
                        bonusElement.style.display = 'block'

                    }else{
                        bonusElement.style.display = 'none'
                    }

                    generatePlatform();
                    console.log("New platform generated at:", platforms[platforms.length - 1]);
                    let newTree = generateTree();
                    console.log("New tree generated at:", newTree);
                    generateGravestoneForTree(newTree);
                    console.log("New gravestone generated:", graveStones[graveStones.length - 1]);

                }
                phase = "walking";
            }
            break;
        }

        case "walking": {
            heroX += (timestamp - lastTimestamp) / walkingSpeed;
            const [nextPlatform] = thePlatformTheStickHits();
            if (nextPlatform) {
                const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
                if (heroX > maxHeroX) {
                    heroX = maxHeroX;
                    phase = "transitioning";
                }
            } else {
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
            const maxHeroY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
            if (heroY > maxHeroY) {
                endGame();
            }
            break;
        }

        default:
            throw Error("Wrong phase");
    }

    draw();
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
}

// --- Drawing Functions ---
function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    // Draw background elements (sky, hills, grass, hell, flames, trees, gravestones)
    drawBackground();
    // Center game scene
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );
    drawPlatforms();
    drawHero();
    drawSticks();
    ctx.restore();
}

function drawBackground() {
    // Sky gradient.
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#87CEEB");
    gradient.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw hills.
    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629FF");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    // Draw grass (overlapping the hills).
    drawGrass(grassBaseHeight, grassAmplitude, grassStretch, "#334a14");

    // Draw hell and flames.
    drawHell();
    drawFlames();

    // Draw trees.
    trees.forEach(tree => drawTree(tree.x, tree.color));
    // Draw gravestones, aligning them with their tree trunks.
    graveStones.forEach(gs => drawGravestones(gs.x, gs.color, gs.treeX));
}

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

function drawGrass(baseHeight, amplitude, stretch, color) {
    const grassBottomY = canvas.height - hellBaseHeight;
    const overlap = 50; // Adjust as needed.
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x++) {
        let y = getHillY(x, baseHeight, amplitude, stretch) - overlap;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, grassBottomY);
    ctx.lineTo(0, grassBottomY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) * amplitude + sineBaseY;
}

function drawHell() {
    if (hellPattern === null) {
        console.warn("Hell pattern not loaded yet.");
        return;
    }
    const matrix = new DOMMatrix()
        .translate(-sceneOffset, window.innerHeight - hellBaseHeight)
        .scale(0.5, 0.9);
    hellPattern.setTransform(matrix);
    ctx.fillStyle = hellPattern;
    ctx.fillRect(0, window.innerHeight - hellBaseHeight, window.innerWidth, hellBaseHeight);
}

function drawFlames() {
    if (flamesPattern === null) {
        console.warn("Flames pattern not loaded yet.");
        return;
    }
    const matrix = new DOMMatrix()
        .translate(-sceneOffset, window.innerHeight - flamesBaseHeight)
        .scale(0.4, 0.3);
    flamesPattern.setTransform(matrix);
    ctx.fillStyle = flamesPattern;
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
    ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight, treeTrunkWidth, treeTrunkHeight);
    // Draw crown
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

// New drawGravestones: takes an extra parameter (treeX) for vertical alignment.
function drawGravestones(x, color, treeX) {
    ctx.save();
    // Compute the y position based on the tree trunk position (treeX)
    let y = getTreeY(treeX, hill1BaseHeight, hill1Amplitude);
    ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, y
    );
    const gravestoneWidth = 10;
    const gravestoneHeight = 15;
    if (platformPattern) {
        ctx.fillStyle = platformPattern;
    } else {
        ctx.fillStyle = color;
    }
    drawRoundedTopRect(0, 0, gravestoneWidth, gravestoneHeight, 5);
    ctx.restore();
}

function getTreeY(x, baseHeight, amplitude) {
    const sineBaseY = window.innerHeight - baseHeight;
    return Math.sinus(x) * amplitude + sineBaseY;
}

function drawPlatforms() {
    if (platformPattern === null) {
        console.warn("Platform pattern not loaded yet.");
        return;
    }
    platforms.forEach(({ x, w }) => {
        ctx.fillStyle = platformPattern;
        drawRoundedTopRect(
            x,
            canvasHeight - platformHeight,
            w,
            platformHeight + (window.innerHeight - canvasHeight) / 2,
            10
        );
        // Draw perfect area indicator if appropriate.
        if (sticks.last().x < x) {
            const centerX = x + w / 2;
            const centerY = canvasHeight - platformHeight + perfectAreaSize / 2;
            drawChristianCross(centerX, centerY, perfectAreaSize, "white");
        }
    });
}

function drawRoundedTopRect(x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x, y + height);
    ctx.closePath();
    ctx.fill();
}

function drawChristianCross(cx, cy, size, color) {
    const thickness = size / 7;
    ctx.fillStyle = color;
    // Vertical bar
    ctx.fillRect(cx - thickness / 2, cy - size / 2, thickness, size);
    // Horizontal bar
    const horizCenterY = cy - size / 2 + size / 3;
    const horizWidth = size / 2;
    ctx.fillRect(cx - horizWidth / 2, horizCenterY - thickness / 2, horizWidth, thickness);
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

function drawGhost(x, y, size) {
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.5);
    ctx.quadraticCurveTo(x - size, y - size * 1.5, x - size * 0.8, y + size * 0.5);
    ctx.quadraticCurveTo(x - size * 0.6, y + size * 0.9, x - size * 0.3, y + size * 0.8);
    ctx.quadraticCurveTo(x, y + size * 1.1, x + size * 0.3, y + size * 0.8);
    ctx.quadraticCurveTo(x + size * 0.6, y + size * 0.9, x + size * 0.8, y + size * 0.5);
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
    const ghostSize = 16;
    const heroCenterX = heroX;
    const heroCenterY = heroY + canvasHeight - platformHeight - heroHeight / 1.2;
    const ghostDrawingY = heroCenterY + 0.2 * ghostSize;
    ctx.translate(heroCenterX, ghostDrawingY);
    drawGhost(0, 0.2 * ghostSize, ghostSize);
    ctx.restore();
}

// --- Collision / Hit Detection ---
function thePlatformTheStickHits() {
    if (Math.abs(sticks.last().rotation - 90) > 0.01)
        throw Error(`Stick is ${sticks.last().rotation}°`);
    const stickFarX = sticks.last().x + sticks.last().length;
    const platformHit = platforms.find(
        platform => platform.x < stickFarX && stickFarX < platform.x + platform.w
    );
    if (
        platformHit &&
        platformHit.x + platformHit.w / 2 - perfectAreaSize / 2 < stickFarX &&
        stickFarX < platformHit.x + platformHit.w / 2 + perfectAreaSize / 2
    ) {
        return [platformHit, true];
    }
    return [platformHit, false];
}

// --- Game Over ---
function endGame() {
    gameRunning = false;
    gameOverOverlay.style.display = "flex";
    gameOverScore.textContent = score;
    disableButtonsTemporarily();
    initializeNameInput();
}

// --- Utility Functions ---
function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateRandomName() {
    const firstPart = ['Bæ', 'Poop', 'Prut', 'lækker', 'Numse'];
    const secondPart = ['fjæs', 'tærte', 'fis', 'mås', 'Hul'];
    return `${firstPart[randomBetween(0, firstPart.length - 1)]}${secondPart[randomBetween(0, secondPart.length - 1)]}`;
}

function initializeNameInput() {
    nameInput.value = generateRandomName();
    nameInput.select();
}

function disableButtonsTemporarily() {
    submitButton.setAttribute('disabled', 'true');
    setTimeout(() => {
        submitButton.removeAttribute('disabled');
    }, 1500);
}

function submitScore(player, score) {
    fetch('submit-highscore.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, score }),
    })
        .then(response => response.json())
        .then(data => console.log(data))
        .catch(error => console.error(error));
}

// --- Event Listeners ---
// Start Button
startButton.addEventListener('click', () => {
    startOverlay.style.display = "none";
    resetGame();
    gameRunning = true;
    window.requestAnimationFrame(animate);
});

// Mouse Input for Stretching and Turning
window.addEventListener("mousedown", () => {
    if (phase === "waiting") {
        lastTimestamp = undefined;
        phase = "stretching";
        window.requestAnimationFrame(animate);
    }
});
window.addEventListener("mouseup", () => {
    if (phase === "stretching") {
        phase = "turning";
    }
});

// Resize canvas on window resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});

// Restart Button
restartButton.addEventListener('click', (e) => {
    e.preventDefault();
    resetGame();
    gameOverOverlay.style.display = "none";
    gameRunning = true;
    window.requestAnimationFrame(animate);
});

// Submit Score Button
submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    gameOverOverlay.style.display = "none";
    submitScore(nameInput.value, score);
    setTimeout(() => {
        window.location.reload();
    }, 500);
});
