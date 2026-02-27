// ========================
// INTRO / GELUID
// ========================

// Intro overlay en knoppen
const introOverlay = document.getElementById("introOverlay");
const startBtn = document.getElementById("startBtn");

// GELUIDEN (EXACT ZELFDE STRUCTUUR ALS JOUW AUDIO-TAG)
const readySound = document.getElementById("readySound");
const chompSound = document.getElementById("chompSound");

let inputLocked = true; // geen klikken tot intro klaar is


// ------------------------
// Laat intro zien bij laden
// ------------------------
function showIntro() {
  introOverlay.classList.remove("hidden");
}

// ------------------------
// Start intro + geluid
// ------------------------
async function startIntro() {
  try {
    readySound.currentTime = 0;
    await readySound.play();   // speel pacman_beginning.wav
  } catch (e) {
    console.warn("Kon readySound niet direct afspelen:", e);
  }

  // na een korte delay het spel laten starten
  setTimeout(() => {
    introOverlay.classList.add("hidden");
    inputLocked = false;
  }, 1200);
}

if (startBtn) {
  startBtn.addEventListener("click", startIntro);
}

document.addEventListener("DOMContentLoaded", showIntro);


// ========================
// GAME LOGIC
// ========================

const COLS = 7;
const ROWS = 6;

let currentPlayer = 1;
let board = [];

const boardDiv = document.getElementById("board");
const playerDisplay = document.getElementById("player");


// ------------------------
// Bord maken
// ------------------------
function createBoard() {
  board = [];
  boardDiv.innerHTML = "";

  boardDiv.style.display = "grid";
  boardDiv.style.gridTemplateColumns = `repeat(${COLS}, 55px)`;
  boardDiv.style.gap = "6px";

  for (let r = 0; r < ROWS; r++) {
    let row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = r;
      cell.dataset.col = c;

      // klik, maar pas na intro
      cell.addEventListener("click", () => {
        if (!inputLocked) dropPiece(c);
      });

      boardDiv.appendChild(cell);
      row.push(0);
    }
    board.push(row);
  }
}


// ------------------------
// Steen plaatsen
// ------------------------
function dropPiece(col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = currentPlayer;

      const cell = document.querySelector(
        `.cell[data-row="${r}"][data-col="${col}"]`
      );

      // Maak nieuwe steen (disk)
      const disk = document.createElement("div");
      disk.className = `disk player${currentPlayer}`;
      cell.appendChild(disk);

      // ------------------------
      // 🎵 CHOMP SOUND
      // ------------------------
      chompSound.currentTime = 0;
      chompSound.play().catch(() => {});

      // speler wisselen
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      playerDisplay.textContent = currentPlayer;

      return;
    }
  }
}


// ------------------------
// Resetknop
// ------------------------
function resetGame() {
  currentPlayer = 1;
  playerDisplay.textContent = currentPlayer;
  createBoard();
}


// bord opbouwen bij opstart
createBoard();