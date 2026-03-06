"use strict";

/* ========================
   INTRO / START GELUID
   ======================== */

const introOverlay = document.getElementById("introOverlay");
const startBtn      = document.getElementById("startBtn");
const readySound    = document.getElementById("readySound");
const chompSound    = document.getElementById("chompSound");

let inputLocked = true; // blokkeert klikken tot na de intro
let gameOver    = false;

function showIntro() {
  if (introOverlay) introOverlay.classList.remove("hidden");
}

async function startIntro() {
  try {
    if (readySound) {
      readySound.currentTime = 0;
      await readySound.play();
    }
  } catch (_) {
    // Sommige browsers blokkeren audio; dat is oké na 1e klik
  }

  // Kleine pauze voor het "READY!" gevoel
  setTimeout(() => {
    if (introOverlay) introOverlay.classList.add("hidden");
    inputLocked = false;
  }, 1200);
}

if (startBtn) startBtn.addEventListener("click", startIntro);
document.addEventListener("DOMContentLoaded", showIntro);


/* ========================
   SPEL LOGICA
   ======================== */

const COLS = 7;
const ROWS = 6;

let currentPlayer = 1;       // 1 of 2
let board = [];              // 2D-array: 0 = leeg, 1 = speler 1, 2 = speler 2

const boardDiv       = document.getElementById("board");
const playerDisplay  = document.getElementById("player");

// Winner overlay elementen
const winnerOverlay  = document.getElementById("winnerOverlay");
const winnerText     = document.getElementById("winnerText");
const playAgainBtn   = document.getElementById("playAgainBtn");

// (Optioneel) AI toggle; werkt ook als de knop niet aanwezig is
let aiEnabled = false; // als true, speelt speler 2 door AI
const aiToggle = document.getElementById("aiToggle");
if (aiToggle) {
  aiToggle.textContent = "AI: UIT";
  aiToggle.addEventListener("click", () => {
    aiEnabled = !aiEnabled;
    aiToggle.textContent = aiEnabled ? "AI: AAN" : "AI: UIT";
    // Als midden in de beurt wordt aangezet en het is speler 2 → laat AI direct spelen
    if (aiEnabled && !gameOver && !inputLocked && currentPlayer === 2) {
      aiMove();
    }
  });
}

function createBoard() {
  gameOver = false;
  board = [];
  if (boardDiv) boardDiv.innerHTML = "";

  // (Grid-styling staat ook in CSS; hier extra zekerheid)
  if (boardDiv) {
    boardDiv.style.display = "grid";
    boardDiv.style.gridTemplateColumns = `repeat(${COLS}, 55px)`;
    boardDiv.style.gap = "6px";
  }

  for (let r = 0; r < ROWS; r++) {
    const row = [];
    for (let c = 0; c < COLS; c++) {
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.dataset.row = String(r);
      cell.dataset.col = String(c);

      cell.addEventListener("click", () => {
        if (!inputLocked && !gameOver) dropPiece(c);
      });

      boardDiv.appendChild(cell);
      row.push(0);
    }
    board.push(row);
  }

  // Toon huidige speler
  if (playerDisplay) playerDisplay.textContent = String(currentPlayer);
}

function dropPiece(col) {
  // Vind van onder naar boven de eerste lege plek in deze kolom
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) {
      board[r][col] = currentPlayer;

      // Visual: voeg een 'disk' toe als child zodat cell zelf klein blijft (fix tegen mega ovaal)
      const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${col}"]`);
      if (cell) {
        const disk = document.createElement("div");
        disk.className = `disk player${currentPlayer}`;
        cell.appendChild(disk);
      }

      // Geluid bij plaatsen
      try {
        if (chompSound) {
          chompSound.currentTime = 0;
          chompSound.play();
        }
      } catch (_) {}

      // Check winst
      const winningLine = checkWin(r, col);
      if (winningLine) {
        gameOver = true;
        inputLocked = true;
        highlightWinningCells(winningLine);
        showWinner(currentPlayer);
        return;
      }

      // (Optioneel) Gelijkspel: bovenste rij vol en geen win
      if (isBoardFull()) {
        gameOver = true;
        inputLocked = true;
        showWinner(0); // 0 = gelijkspel
        return;
      }

      // Wissel speler
      currentPlayer = currentPlayer === 1 ? 2 : 1;
      if (playerDisplay) playerDisplay.textContent = String(currentPlayer);

      // Als AI aan staat en het is speler 2 → AI zet
      if (currentPlayer === 2 && aiEnabled && !gameOver && !inputLocked) {
        aiMove();
      }

      return;
    }
  }
  // Als kolom vol is: doe niets
}

function checkWin(r, c) {
  const player = board[r][c];
  if (player === 0) return null;

  // 4 richtingen: verticaal, horizontaal, diagonaal /, diagonaal \
  const dirs = [
    [1, 0],
    [0, 1],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of dirs) {
    const line = [[r, c]];

    // vooruit
    for (let i = 1; i < 4; i++) {
      const nr = r + dr * i;
      const nc = c + dc * i;
      if (inBounds(nr, nc) && board[nr][nc] === player) line.push([nr, nc]);
      else break;
    }

    // achteruit
    for (let i = 1; i < 4; i++) {
      const nr = r - dr * i;
      const nc = c - dc * i;
      if (inBounds(nr, nc) && board[nr][nc] === player) line.push([nr, nc]);
      else break;
    }

    if (line.length >= 4) {
      // Neem de eerste 4 voor highlight
      return line.slice(0, 4);
    }
  }

  return null;
}

function inBounds(r, c) {
  return r >= 0 && r < ROWS && c >= 0 && c < COLS;
}

function isBoardFull() {
  for (let c = 0; c < COLS; c++) {
    if (board[0][c] === 0) return false;
  }
  return true;
}

function highlightWinningCells(coords) {
  coords.forEach(([r, c]) => {
    const cell = document.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
    const disk = cell ? cell.querySelector(".disk") : null;
    if (disk) {
      disk.style.boxShadow = "0 0 14px 6px rgba(255, 213, 79, 0.9)";
      disk.style.outline = "2px solid #ffd54f";
      // Klein pulserend effect
      disk.style.animation = "winPulse 0.6s infinite alternate";
    }
  });
}

function showWinner(player) {
  if (!winnerOverlay || !winnerText) return;

  if (player === 0) {
    winnerText.textContent = "Gelijkspel!";
  } else {
    winnerText.textContent = `Speler ${player} wint!`;
  }
  winnerOverlay.classList.remove("hidden");
}

if (playAgainBtn) {
  playAgainBtn.addEventListener("click", () => {
    if (winnerOverlay) winnerOverlay.classList.add("hidden");
    currentPlayer = 1;
    if (playerDisplay) playerDisplay.textContent = String(currentPlayer);
    inputLocked = false;
    gameOver = false;
    createBoard();
  });
}

/* ========================
   AI (eenvoudig, mid-game toggle)
   ======================== */

// Simpele AI: kies willekeurige geldige kolom
function aiMove() {
  if (!aiEnabled || gameOver || inputLocked) return;

  // Klein delay voor arcade-feel
  setTimeout(() => {
    const validCols = [];
    for (let c = 0; c < COLS; c++) {
      if (board[0][c] === 0) validCols.push(c);
    }
    if (validCols.length === 0) return;

    const choice = validCols[Math.floor(Math.random() * validCols.length)];
    dropPiece(choice);
  }, 450);
}

/* ========================
   RESET KNOP (HTML: onclick="resetGame()")
   ======================== */

function resetGame() {
  // Verberg overlay als die open staat
  if (winnerOverlay) winnerOverlay.classList.add("hidden");
  currentPlayer = 1;
  if (playerDisplay) playerDisplay.textContent = String(currentPlayer);
  gameOver = false;
  // Intro hoeft niet opnieuw; input gewoon open
  inputLocked = false;
  createBoard();
}

// Start bord
createBoard();