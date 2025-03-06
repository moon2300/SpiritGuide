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
let ghostX;
let ghostY;
let ghostFloatOffset = 0;
let ghostFloatDirection = 1;
let isGhostFloating = false;
let sceneOffset;
let platformPattern = null;
let flames1Pattern = null;
let flames2Pattern = null;
let flames2Offset = 0; // offset for vertical movement
let flames2Direction = 1; // 1 for up, -1 for down
let hellPattern = null;
let platforms = [];
let sticks = [];
let trees = [];
let graveStones = [];
let score = 0;
let bonus = 0;
let gameRunning = false;
let gameStarted = false;

// NEW: Global variable to store the animation frame ID.
let animationFrameId = null;

// --- Constants ---
const canvasWidth = 375;
const canvasHeight = 375;
const platformHeight = 100;
const ghostDistanceFromEdge = 25;
const paddingX = 100;
const perfectAreaSize = 25;

const stretchingSpeed = 4;     // ms per pixel (stretching)
const turningSpeed = 4;        // ms per degree (turning)
const walkingSpeed = 4;
const transitioningSpeed = 2;
const fallingSpeed = 2;

const ghostWidth = 17;
const ghostHeight = 30;
const ghostFloatSpeed = 0.2;
const ghostFloatMaxOffset = 3.5;

// Additional background constants
const backgroundSpeedMultiplier = 0.2;
const hill1BaseHeight = 475;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 375;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const hellBaseHeight = 240;
const grassBaseHeight = 230;
const grassAmplitude = 25;
const grassStretch = 150;

// Flames
const flames1BaseHeight = 200;
const flames2BaseHeight = 350;
const flames2AnimationSpeed = 0.3; // Adjust speed of movement
const flames2AnimationMaxOffset = 10; // Maximum upward movement

// --- Canvas Setup ---
const canvas = document.getElementById("game");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext("2d");

// --- UI Elements ---
const instructionsElement = document.getElementById("instructions");
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
platformImage.src = "texture3.png";

const flames1Image = new Image();
flames1Image.src = "flames.png";

const flames2Image = new Image();
flames2Image.src = "flames.png";

const hellImage = new Image();
hellImage.src = "dirtS.jpg";

const createPattern = (image, scale = 1, repetition = "repeat") => {
    const canvas = document.createElement("canvas");
    [canvas.width, canvas.height] = [image.width * scale, image.height * scale];
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    return ctx.createPattern(canvas, repetition);
};

flames1Image.onload = () => {
    flames1Pattern = createPattern(flames1Image, 0.5, "repeat-x");
    resetGame();
};
flames2Image.onload = () => {
    flames2Pattern = createPattern(flames2Image, 0.8, "repeat-x");
    resetGame();
};
hellImage.onload = () => {
    hellPattern = createPattern(hellImage, 0.5, "repeat-x");
    resetGame();
};
platformImage.onload = () => {
    platformPattern = createPattern(platformImage);
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
    gameOverOverlay.classList.add("hidden");
    instructionsElement.style.opacity = "1";
    platforms = [{ x: 50, w: 80 }];
    trees = [];
    graveStones = [];

    // Generate some platforms
    generatePlatform();
    generatePlatform();
    generatePlatform();
    generatePlatform();

    // Reset sticks and ghost positions
    sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];
    ghostX = platforms[0].x + platforms[0].w - ghostDistanceFromEdge;
    ghostY = 0;

    // Generate trees and corresponding gravestones
    for (let i = 0; i < 10; i++) {
        let tree = generateTree();
        generateGravestoneForTree(tree);
    }

    // Reset ghost float variables if needed.
    ghostFloatOffset = 0;
    ghostFloatDirection = 1;

    // NEW: Start the animation loop (cancelling any previous one)
    startAnimation();
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

function generateGravestoneForTree(tree) {
    const offset = 30; // gravestone stands 20px to the right of the tree
    let gravestoneX = tree.x + offset;
    graveStones.push({ x: gravestoneX, color: tree.color, treeX: tree.x });
}

// --- NEW: Animation Control Functions ---
function startAnimation() {
    // Cancel any existing animation loop.
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    lastTimestamp = undefined; // Reset timestamp to avoid a large jump.
    animationFrameId = window.requestAnimationFrame(animate);
}

// --- Main Animation Loop ---
function animate(timestamp) {
    if (!gameRunning) return;
    if (!lastTimestamp) {
        lastTimestamp = timestamp;
    }

    // Call ghost float update only once per frame.
isGhostFloating = true;

    switch (phase) {
        case "waiting":
            // No extra ghost float call here.
            break;

        case "stretching":
            sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
            break;

        case "turning":
            sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
            if (sticks.last().rotation > 90) {
                sticks.last().rotation = 90;
                const [nextPlatform, perfectHit] = thePlatformTheStickHits();
                if (nextPlatform) {
                    if (perfectHit) {
                        bonus++;
                        score += 1;
                        score *= bonus;
                        perfectElement.style.opacity = "1";
                        perfectElement.textContent = bonus + "x";
                        setTimeout(() => {
                            perfectElement.style.opacity = "0";
                            setTimeout(() => perfectElement.textContent = "PERFECT", 1000);
                        }, 1000);
                    } else {
                        bonus = 0;
                        score += 1;
                    }
                    scoreElement.innerText = score;
                    bonusElement.style.display = 'none';
                    generatePlatform();
                    let newTree = generateTree();
                    generateGravestoneForTree(newTree);
                }
                phase = "walking";
            }
            break;

        case "walking":
            ghostX += (timestamp - lastTimestamp) / walkingSpeed;
            const [nextPlatform] = thePlatformTheStickHits();
            if (nextPlatform) {
                const maxGhostX = nextPlatform.x + nextPlatform.w - ghostDistanceFromEdge;
                if (ghostX > maxGhostX) {
                    ghostX = maxGhostX;
                    phase = "transitioning";
                }
            } else {
                const maxGhostX = sticks.last().x + sticks.last().length + ghostWidth;
                if (ghostX > maxGhostX) {
                    ghostX = maxGhostX;
                    phase = "falling";
                }
            }
            break;

        case "transitioning":
            sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;
            const [nextPlat] = thePlatformTheStickHits();
            if (sceneOffset > nextPlat.x + nextPlat.w - paddingX) {
                sticks.push({
                    x: nextPlat.x + nextPlat.w,
                    length: 0,
                    rotation: 0
                });
                phase = "waiting";
            }
            break;

        case "falling":
            isGhostFloating = false;
            ghostFloatOffset = 0; // Reset float offset when falling
            if (sticks.last().rotation < 180)
                sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
            ghostY += (timestamp - lastTimestamp) / fallingSpeed;
            const maxGhostY = platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
            if (ghostY > maxGhostY) {
                endGame();
            }
            break;

        default:
            throw Error("Wrong phase");
    }

    animateFlames();
    animateGhostFloat();
    draw();
    lastTimestamp = timestamp;
    animationFrameId = window.requestAnimationFrame(animate);
}

// --- Drawing Functions ---
// (All your drawing functions remain unchanged.)

function draw() {
    ctx.save();
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    drawBackground();
    ctx.translate(
        (window.innerWidth - canvasWidth) / 2 - sceneOffset,
        (window.innerHeight - canvasHeight) / 2
    );
    drawPlatforms();
    drawGhostPosition();
    drawSticks();
    ctx.restore();
}

function drawBackground() {
    const gradientBackground = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradientBackground.addColorStop(0, "#87CEEB");
    gradientBackground.addColorStop(1, "#FEF1E1");
    ctx.fillStyle = gradientBackground;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629FF");
    drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

    ctx.save();
    const centerX = canvas.width / 2;
    const gradientLight = ctx.createRadialGradient(
        centerX, 0, 0,
        centerX, 0, canvas.height * 0.8
    );
    gradientLight.addColorStop(0, 'rgba(255,255,255,0.95)');
    gradientLight.addColorStop(0.2, 'rgba(255,255,255,0.75)');
    gradientLight.addColorStop(0.4, 'rgba(255,255,255,0.71)');
    gradientLight.addColorStop(0.7, 'rgba(255,255,255,0.2)');
    gradientLight.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradientLight;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();

    drawGrass(grassBaseHeight, grassAmplitude, grassStretch, "#263c0a");
    drawHell();
    drawFlames(2, flames2BaseHeight, { x: 0.4, y: 0.3 }, flames2Offset);
    drawFlames(1, flames1BaseHeight);
    trees.forEach(tree => drawTree(tree.x, tree.color));
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
    const overlap = 50;
    ctx.beginPath();
    for (let x = 0; x <= canvas.width; x++) {
        let y = getHillY(x + sceneOffset, baseHeight, amplitude, stretch, true) - overlap;
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, grassBottomY);
    ctx.lineTo(0, grassBottomY);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

function getHillY(windowX, baseHeight, amplitude, stretch, isGrass = false) {
    const sineBaseY = window.innerHeight - baseHeight;
    const offset = isGrass ? sceneOffset : sceneOffset * backgroundSpeedMultiplier;
    return Math.sinus((offset + windowX) * stretch) * amplitude + sineBaseY;
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

function drawFlames(patternType, baseHeight, scale = { x: 0.4, y: 0.3 }, yOffset = 0) {
    const pattern = patternType === 1 ? flames1Pattern : flames2Pattern;
    if (pattern === null) {
        console.warn(`Flames pattern ${patternType} not loaded yet.`);
        return;
    }
    const matrix = new DOMMatrix()
        .translate(-sceneOffset, window.innerHeight - baseHeight + yOffset)
        .scale(scale.x, scale.y);
    pattern.setTransform(matrix);
    ctx.fillStyle = pattern;
    ctx.fillRect(0, window.innerHeight - baseHeight + yOffset, window.innerWidth, baseHeight);
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
    ctx.fillStyle = "#7D833C";
    ctx.fillRect(-treeTrunkWidth / 2, -treeTrunkHeight, treeTrunkWidth, treeTrunkHeight);
    ctx.beginPath();
    ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
    ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
    ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

function drawGravestones(x, color, treeX) {
    ctx.save();
    let y = getTreeY(treeX, hill1BaseHeight, hill1Amplitude);
    ctx.translate(
        (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch, y
    );
    const gravestoneWidth = 10;
    const gravestoneHeight = 15;
    ctx.fillStyle = platformPattern ? platformPattern : color;
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
    ctx.fillRect(cx - thickness / 2, cy - size / 2, thickness, size);
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
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x - size * 0.3, y - size * 0.7, size * 0.15, 0, Math.PI * 2);
    ctx.arc(x + size * 0.3, y - size * 0.7, size * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "white";
    ctx.beginPath();
    ctx.arc(x - size * 0.25, y - size * 0.75, size * 0.05, 0, Math.PI * 2);
    ctx.arc(x + size * 0.35, y - size * 0.75, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "pink";
    ctx.beginPath();
    ctx.arc(x - size * 0.45, y - size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.arc(x + size * 0.45, y - size * 0.5, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "black";
    ctx.beginPath();
    ctx.arc(x, y - size * 0.4, size * 0.1, 0, Math.PI, false);
    ctx.fill();
}

function drawGhostPosition() {
    ctx.save();
    const ghostSize = 16;
    const ghostCenterX = ghostX;

    // Only apply float offset if ghost is floating
    const floatOffset = isGhostFloating ? ghostFloatOffset : 0;
    const ghostCenterY = ghostY + canvasHeight - platformHeight - ghostHeight / 1.2 + floatOffset;
    const ghostDrawingY = ghostCenterY + 0.2 * ghostSize;

    ctx.translate(ghostCenterX, ghostDrawingY);
    drawGhost(0, 0.2 * ghostSize, ghostSize);
    ctx.restore();

}

function animateGhostFloat() {
    if (!isGhostFloating) return;
    ghostFloatOffset += ghostFloatDirection * ghostFloatSpeed;
    if (Math.abs(ghostFloatOffset) >= ghostFloatMaxOffset) {
        ghostFloatDirection *= -1;
    }
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
function animateFlames() {
    flames2Offset += flames2Direction * flames2AnimationSpeed;
    if (Math.abs(flames2Offset) >= flames2AnimationMaxOffset) {
        flames2Direction *= -1;
    }
}

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
startButton.addEventListener('click', () => {
    startOverlay.style.display = "none";
    resetGame();
    gameStarted = true;
    gameRunning = true;
    // NEW: Use our startAnimation() helper.
    startAnimation();
});

window.addEventListener("mousedown", () => {
    if (!gameStarted) return;
    if (instructionsElement) {
        instructionsElement.style.opacity = "0";
    }
    if (phase === "waiting") {
        lastTimestamp = undefined;
        phase = "stretching";
        startAnimation();
    }
});

window.addEventListener("mouseup", () => {
    if (!gameStarted) return;
    if (phase === "stretching") {
        phase = "turning";
    }
});

window.addEventListener("keydown", (e) => {
    if (!gameStarted) return;
    if (e.code === "Space") {
        e.preventDefault();
        if (instructionsElement) {
            instructionsElement.style.opacity = "0";
        }
        if (phase === "waiting") {
            lastTimestamp = undefined;
            phase = "stretching";
            startAnimation();
        }
    }
});

window.addEventListener("keyup", (e) => {
    if (!gameStarted) return;
    if (e.code === "Space") {
        e.preventDefault();
        if (phase === "stretching") {
            phase = "turning";
        }
    }
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    draw();
});

restartButton.addEventListener('click', (e) => {
    e.preventDefault();
    resetGame();
    gameOverOverlay.style.display = "none";
    gameRunning = true;
    startAnimation();
});

submitButton.addEventListener('click', (e) => {
    e.preventDefault();
    gameOverOverlay.style.display = "none";
    submitScore(nameInput.value, score);
    setTimeout(() => {
        window.location.reload();
    }, 500);
});

window.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
        startOverlay.style.display = "none";
        gameOverOverlay.style.display = "none";
        resetGame();
        gameStarted = true;
        gameRunning = true;
        startAnimation();
    }
});
