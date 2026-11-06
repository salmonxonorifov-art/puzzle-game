const board = document.getElementById("board");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const bestDisplay = document.getElementById("best");
const difficulty = document.getElementById("difficulty");
const message = document.getElementById("message");
const soundButton = document.getElementById("sound-btn");
const winModal = document.getElementById("win-modal");
const winStats = document.getElementById("win-stats");

let size = 3;
let numbers = [];
let moves = 0;
let seconds = 0;
let timer = null;
let started = false;
let finished = false;
let soundEnabled = true;
let audioContext = null;

function getBest() {
    return localStorage.getItem("best-" + size) || "—";
}

function updateStats() {
    movesDisplay.textContent = moves;
    bestDisplay.textContent = getBest();
}

function playSound(frequency) {
    if (!soundEnabled) return;

    try {
        const AudioContextClass =
            window.AudioContext || window.webkitAudioContext;

        if (!AudioContextClass) return;

        if (audioContext === null) {
            audioContext = new AudioContextClass();
        }

        if (audioContext.state === "suspended") {
            audioContext.resume();
        }

        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.frequency.value = frequency || 400;
        oscillator.type = "sine";

        gain.gain.setValueAtTime(0.08, audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioContext.currentTime + 0.12
        );

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.12);
    } catch (error) {
        console.log("Audio unavailable");
    }
}

function neighbors(index) {
    const row = Math.floor(index / size);
    const col = index % size;
    const result = [];

    if (row > 0) result.push(index - size);
    if (row < size - 1) result.push(index + size);
    if (col > 0) result.push(index - 1);
    if (col < size - 1) result.push(index + 1);

    return result;
}

function renderBoard() {
    board.innerHTML = "";
    board.style.gridTemplateColumns = "repeat(" + size + ", 1fr)";

    numbers.forEach(function(number, index) {
        const tile = document.createElement("button");

        tile.type = "button";
        tile.className = number === 0 ? "tile empty" : "tile";
        tile.textContent = number === 0 ? "" : number;

        tile.setAttribute(
            "aria-label",
            number === 0 ? "Empty space" : "Tile " + number
        );

        tile.addEventListener("click", function() {
            moveTile(index);
        });

        board.appendChild(tile);
    });
}

function startTimer() {
    if (started) return;

    started = true;

    timer = setInterval(function() {
        seconds++;

        const min = String(Math.floor(seconds / 60)).padStart(2, "0");
        const sec = String(seconds % 60).padStart(2, "0");

        timerDisplay.textContent = min + ":" + sec;
    }, 1000);
}

function moveTile(index) {
    if (finished) return;

    const empty = numbers.indexOf(0);

    if (neighbors(empty).indexOf(index) === -1) return;

    startTimer();

    const temp = numbers[index];
    numbers[index] = numbers[empty];
    numbers[empty] = temp;

    moves++;

    updateStats();
    renderBoard();
    playSound(420);

    checkWin();
}

function checkWin() {
    const won = numbers.every(function(number, index) {
        const expected =
            index === numbers.length - 1 ? 0 : index + 1;

        return number === expected;
    });

    if (!won) return;

    finished = true;
    clearInterval(timer);
    playSound(700);

    const key = "best-" + size;
    const oldBest = localStorage.getItem(key);

    if (!oldBest || moves < Number(oldBest)) {
        localStorage.setItem(key, moves);
    }

    updateStats();
    winStats.innerHTML =
        "Moves: <strong>" + moves + "</strong><br>" +
        "Time: <strong>" + timerDisplay.textContent + "</strong>";

    winModal.classList.remove("hidden");
    message.textContent = "Puzzle completed!";
}

function newGame() {
    size = Number(difficulty.value);

    numbers = [];

    for (let i = 1; i <= size * size; i++) {
        numbers.push(i);
    }

    numbers[numbers.length - 1] = 0;

    moves = 0;
    seconds = 0;
    started = false;
    finished = false;

    clearInterval(timer);

    timerDisplay.textContent = "00:00";
    message.textContent = "";
    winModal.classList.add("hidden");

    let previousEmpty = -1;

    for (let i = 0; i < size * size * 30; i++) {
        const empty = numbers.indexOf(0);

        let options = neighbors(empty).filter(function(index) {
            return index !== previousEmpty;
        });

        if (options.length === 0) {
            options = neighbors(empty);
        }

        const randomIndex =
            Math.floor(Math.random() * options.length);

        const chosen = options[randomIndex];

        const temp = numbers[empty];
        numbers[empty] = numbers[chosen];
        numbers[chosen] = temp;

        previousEmpty = empty;
    }

    updateStats();
    renderBoard();
}

function restartGame() {
    newGame();
}

document.getElementById("shuffle-btn")
    .addEventListener("click", newGame);

document.getElementById("restart-btn")
    .addEventListener("click", restartGame);

document.getElementById("play-again")
    .addEventListener("click", newGame);

difficulty.addEventListener("change", newGame);

soundButton.addEventListener("click", function() {
    soundEnabled = !soundEnabled;

    soundButton.textContent = soundEnabled
        ? "🔊 Sound ON"
        : "🔇 Sound OFF";

    if (soundEnabled) {
        playSound(500);
    }
});

newGame();