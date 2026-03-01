const board = document.getElementById("board");

let selected = null;
let turn = "white";
let gameOver = false;
let killingPiece = null;
let selectedCells = [];
gameOver
const moveSound = document.getElementById("moveSound");
const captureSound = document.getElementById("captureSound");
const queenSound = document.getElementById("queenSound");
const gameOverSound = document.getElementById("gameOver");

function createBoard() {
    for (let i = 0; i < 8; i++) {
        const row = document.createElement("div");
        row.classList.add("row");
        for (let j = 0; j < 8; j++) {
            const cell = document.createElement("div");
            cell.classList.add("cell");
            cell.classList.add((i + j) % 2 === 0 ? "white" : "black");
            cell.dataset.i = i;
            cell.dataset.j = j;

            if (i < 3 && (i + j) % 2 !== 0) {
                addPiece(cell, "black", i, j);
            } else if (i > 4 && (i + j) % 2 !== 0) {
                addPiece(cell, "white", i, j);
            }
            row.appendChild(cell);
        }
        board.appendChild(row);
    }
}

function addPiece(cell, color, row, col) {
    const piece = document.createElement("div");
    piece.classList.add('piece', color);
    piece.dataset.color = color;
    piece.dataset.col = col;
    piece.dataset.row = row;
    piece.dataset.dead = "0";
    cell.appendChild(piece);
}

function getPieceAt(row, col) {
    if (row < 0 || col < 0 || row >= 8 || col >= 8) return null;
    return document.querySelector(
      `.piece:not([data-dead="1"])[data-row="${row}"][data-col="${col}"]`
    );
}

function getCellAt(row, col) {
    if (row < 0 || col < 0 || row >= 8 || col >= 8) return null;
    return document.querySelector(
      `.cell[data-i="${row}"][data-j="${col}"]`
    );
}

function getCorrectMoves(piece) {
    const isQueen = piece.classList.contains("queen");
    const pieceKillMoves = findPieceKillMove(piece);
    const mustCapture = getKillMoves().length > 0;
  
    if (mustCapture) {
      return { isKillMove: true, moves: pieceKillMoves };
    }

    const fromRow = parseInt(piece.dataset.row);
    const fromCol = parseInt(piece.dataset.col);
  
    const inBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
    const result = [];
  
    if (!isQueen) {
      const step = turn === "white" ? -1 : 1;
      const candidates = [
        [fromRow + step, fromCol - 1],
        [fromRow + step, fromCol + 1],
      ];
  
      for (const [r, c] of candidates) {
        if (!inBoard(r, c)) continue;
        if (!getPieceAt(r, c)) result.push({ row: r, col: c });
      }
  
      return { isKillMove: false, moves: result };
    }

    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (const [dr, dc] of dirs) {
      let r = fromRow + dr;
      let c = fromCol + dc;

      while (inBoard(r, c) && !getPieceAt(r, c)) {
        result.push({ row: r, col: c });
        r += dr;
        c += dc;
      }
    }

    return { isKillMove: false, moves: result };
}

function selectAvailableCell(piece) {
    const moves = getCorrectMoves(piece).moves;
    if (moves.length === 0) return;

    for (const move of moves) {
        const cell = getCellAt(move.row, move.col);
        selectedCells.push(cell);
        cell?.classList.add("available");
    }
}

function selectPiece(piece) {
    selected?.classList.remove("selected");
    selected = piece;
    selected.classList.add("selected");
    selectAvailableCell(piece);
}

function findPieceKillMove(piece) {
    const fromRow = parseInt(piece.dataset.row);
    const fromCol = parseInt(piece.dataset.col);
    const isQueen = piece.classList.contains("queen");

    const dirs = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    const result = [];

    const inBoard = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;

    for (const [dr, dc] of dirs) {
      if (!isQueen) {
        const midRow = fromRow + dr;
        const midCol = fromCol + dc;
        const toRow = fromRow + 2 * dr;
        const toCol = fromCol + 2 * dc;
  
        if (!inBoard(toRow, toCol)) continue;
  
        const mid = getPieceAt(midRow, midCol);
        const dest = getPieceAt(toRow, toCol);
  
        if (!dest && mid && mid.dataset.color !== turn) {
            result.push({ row: toRow, col: toCol, victim: mid });
        }
        continue;
      }
  
      let r = fromRow + dr;
      let c = fromCol + dc;
  
      while (inBoard(r, c) && !getPieceAt(r, c)) {
        r += dr;
        c += dc;
      }

      if (!inBoard(r, c)) continue;

      const victim = getPieceAt(r, c);
      if (!victim || victim.dataset.color === turn) continue;

      r += dr;
      c += dc;
      while (inBoard(r, c) && !getPieceAt(r, c)) {
        result.push({ row: r, col: c, victim });
        r += dr;
        c += dc;
      }
    }

    return result;
  }

function getKillMoves() {
    let result = [];
    let turnPieces = board.querySelectorAll(`.piece.${turn}`);
    for (const piece of turnPieces) {
        result.push(...findPieceKillMove(piece));
    }
    return result;
}

function movePiece(piece, cell) {
    const from = piece.getBoundingClientRect();
    cell.appendChild(piece);
    const to = piece.getBoundingClientRect();

    const dx = from.left - to.left;
    const dy = from.top - to.top;

    piece.style.transition = "none";
    piece.style.transform = `translate(${dx}px, ${dy}px)`;

    requestAnimationFrame(() => {
        piece.style.transition = "";
        piece.style.transform = "";
    });

    piece.classList.remove("selected");
    selected = null;

    piece.dataset.row = cell.dataset.i;
    piece.dataset.col = cell.dataset.j;

    if (
      (turn === "white" && piece.dataset.row === "0") ||
      (turn === "black" && piece.dataset.row === "7")
    ) {
        if (!piece.classList.contains("queen")) {
            piece.classList.add("queen");
    
            queenSound.currentTime = 0;
            queenSound.play();
        }
    }
}

function createElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.classList.add(className);
    if (text) element.textContent = text;
    return element;
}

function checkAndShowWin() {
    let blackPiecesLoose = board.querySelectorAll(`.piece:not([data-dead="1"]).black`).length === 0;
    let whitePiecesLoose = board.querySelectorAll(`.piece:not([data-dead="1"]).white`).length === 0;
    if (!blackPiecesLoose && !whitePiecesLoose) return;

    gameOverSound.currentTime = 0;
    gameOverSound.play();

    gameOver = true;
    const gameOverElement = createElement("div", "gameOver");
    const title = createElement("p", "gameOverTitle", "Игра окончена");
    const text = createElement("p", "gameOverText", `Победили ${whitePiecesLoose ? "черные" : "белые"}`);
    const btn = createElement("button", "gameOverBtn", "Начать заново");
    gameOverElement.appendChild(title);
    gameOverElement.appendChild(text);
    gameOverElement.appendChild(btn);

    btn.addEventListener("click", () => {
        location.reload();
    });

    document.body.appendChild(gameOverElement);
}

function killPiece(piece) {
    if (!piece) return;

    captureSound.currentTime = 0;
    captureSound.play();

    piece.classList.add("dying");
    piece.dataset.dead = "1";
    setTimeout(() => {
        piece.remove();
      }, 260);
}

function checkAndMove(piece, cell) {
    const toRow = parseInt(cell.dataset.i);
    const toCol = parseInt(cell.dataset.j);

    if (killingPiece) {
        if (piece !== killingPiece) return;
    }

    const { isKillMove, moves } = getCorrectMoves(piece);
    const move = moves.find(m => m.row === toRow && m.col === toCol);
    if (!move) return;

    if (!isKillMove) {
        moveSound.currentTime = 0;
        moveSound.play();
    }

    movePiece(piece, cell);

    if (isKillMove) {
        console.log(move);
        killPiece(move.victim);

        checkAndShowWin();
        if (gameOver) return;

        let moreKills = findPieceKillMove(piece);
        if (moreKills.length > 0) {
            killingPiece = piece;
            return;
        }
    }

    turn = turn === "white" ? "black" : "white";
    killingPiece = null;
}

board.addEventListener("click", (e) => {
    if (gameOver) return;

    if (selectedCells.length > 0) {
        for (const cell of selectedCells) {
            cell?.classList.remove("available");
        }
    }

    const cell = e.target.closest(".cell");
    if (!cell) return;


    const piece = cell.querySelector('.piece:not([data-dead="1"])');
    if (piece && piece.dataset.color === turn) {
        selectPiece(piece, cell);
    } else if (selected && !piece) {
        checkAndMove(selected, cell);
        selected?.classList.remove("selected");
        selected = null;
    } else {
        selected?.classList.remove("selected");
        selected = null;
    }
});

createBoard();
