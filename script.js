
const startBtn = document.getElementById("startBtn");
const welcomePage = document.getElementById("welcomePage");
const level1Page = document.getElementById("level1Page");
const nextLevelBtn = document.getElementById("nextLevelBtn");

startBtn.addEventListener("click", () => {
    welcomePage.classList.add("hidden");
    level1Page.classList.remove("hidden");

    window.scrollTo(0, 0);
});


const level2Page = document.getElementById("level2Page");
const level1Video = document.getElementById("level1Video");
const startChallengesBtn = document.getElementById("startChallengesBtn");

nextLevelBtn.addEventListener("click", () => {
    level1Video.pause();

    level1Page.classList.add("hidden");
    level2Page.classList.remove("hidden");

    window.scrollTo(0, 0);
});


const level3Page = document.getElementById("level3Page");
const level2Video = document.getElementById("level2Video");
const goBoard = document.getElementById("goBoard");
const feedback = document.getElementById("challengeFeedback");
const retryBtn = document.getElementById("retryBtn");
const nextChallengeBtn = document.getElementById("nextChallengeBtn");
const previousChallengeBtn =
    document.getElementById("previousChallengeBtn");
const BOARD_SIZE = 9;

const moveOverlay = document.getElementById("moveOverlay");
const moveOverlayIcon = document.getElementById("moveOverlayIcon");

function showMoveFeedback(isCorrect) {
    moveOverlay.classList.remove("show", "correct", "wrong");

    // Restart animation for consecutive moves.
    void moveOverlay.offsetWidth;

    moveOverlay.classList.add(isCorrect ? "correct" : "wrong");
    moveOverlayIcon.textContent = isCorrect ? "✓" : "✕";
    moveOverlay.classList.add("show");
}

function getNeighbors(row, col) {
    return [
        [row - 1, col],
        [row + 1, col],
        [row, col - 1],
        [row, col + 1]
    ].filter(([r, c]) =>
        r >= 0 && r < BOARD_SIZE &&
        c >= 0 && c < BOARD_SIZE
    );
}

// Find all connected stones and their shared liberties.
function getGroup(board, row, col) {
    const color = board[row][col];

    if (!color) return null;

    const stones = [];
    const liberties = new Set();
    const visited = new Set();
    const stack = [[row, col]];

    while (stack.length > 0) {
        const [r, c] = stack.pop();
        const key = `${r},${c}`;

        if (visited.has(key)) continue;
        visited.add(key);
        stones.push([r, c]);

        for (const [nr, nc] of getNeighbors(r, c)) {
            if (board[nr][nc] === null) {
                liberties.add(`${nr},${nc}`);
            } else if (
                board[nr][nc] === color &&
                !visited.has(`${nr},${nc}`)
            ) {
                stack.push([nr, nc]);
            }
        }
    }

    return { color, stones, liberties };
}

// Try a legal move and automatically remove captured groups.
function simulateMove(board, row, col, color) {
    if (board[row][col] !== null) return null;

    const nextBoard = board.map(line => [...line]);
    nextBoard[row][col] = color;

    const opponent = color === "black" ? "white" : "black";
    const checked = new Set();

    for (const [nr, nc] of getNeighbors(row, col)) {
        if (nextBoard[nr][nc] !== opponent) continue;

        const group = getGroup(nextBoard, nr, nc);
        const key = group.stones
            .map(([r, c]) => `${r},${c}`)
            .sort()
            .join("|");

        if (checked.has(key)) continue;
        checked.add(key);

        if (group.liberties.size === 0) {
            for (const [r, c] of group.stones) {
                nextBoard[r][c] = null;
            }
        }
    }

    // Suicide is not allowed.
    const ownGroup = getGroup(nextBoard, row, col);

    if (ownGroup.liberties.size === 0) {
        return null;
    }

    return nextBoard;
}


function findWhiteEscape(board) {
    // The original target stone is at (2, 3).
    if (board[2][3] !== "white") return null;

    const group = getGroup(board, 2, 3);

    if (!group || group.liberties.size !== 1) {
        return null;
    }

    // Find the only remaining liberty.
    const liberty = [...group.liberties][0];
    const [row, col] = liberty.split(",").map(Number);

    // Try escaping into that liberty.
    const escapedBoard = simulateMove(
        board, row, col, "white"
    );

    if (!escapedBoard) return null;

    const escapedGroup = getGroup(
        escapedBoard, row, col
    );

    // White still plays a legal escape even if it remains in atari.
    // This makes the final white move visible before Black captures.
    if (escapedGroup && escapedGroup.liberties.size >= 1) {
        return {
            row,
            col,
            board: escapedBoard
        };
    }

    return null;
}


let boardState = [];
let challengeSolved = false;
let challengeLocked = false;

// Challenge 1: White has only one liberty at (4, 5).

const challenges = [
    {
        title: "Your First Capture",
        instruction: "You are Black. Capture the white stone in one move!",
        stones: [
            { row: 4, col: 4, color: "white" },
            { row: 3, col: 4, color: "black" },
            { row: 4, col: 3, color: "black" },
            { row: 4, col: 5, color: "black" }
        ],
        answer: { row: 5, col: 4 },
        success: "Amazing! You captured your first stone!"
    },
    {
        title: "Capture a Group",
        instruction: "Two white stones are connected. Capture both in one move!",
        stones: [
            { row: 4, col: 4, color: "white" },
            { row: 4, col: 5, color: "white" },
            { row: 3, col: 4, color: "black" },
            { row: 3, col: 5, color: "black" },
            { row: 4, col: 3, color: "black" },
            { row: 4, col: 6, color: "black" },
            { row: 5, col: 4, color: "black" }
        ],
        answer: { row: 5, col: 5 },
        success: "Excellent! You captured a connected group!"
    },

    {
        title: "The Final Chase",
        instruction:
            "You are Black. White will try to escape. Capture all three white stones!",
        stones: [
            // White stones
            { row: 2, col: 3, color: "white" },
            { row: 3, col: 3, color: "white" },
            { row: 3, col: 4, color: "white" },

            // Black stones
            { row: 2, col: 4, color: "black" },
            { row: 3, col: 2, color: "black" },
            { row: 3, col: 5, color: "black" },
            { row: 4, col: 3, color: "black" },
            { row: 4, col: 4, color: "black" }
        ],
        answer: null,
        success:
            "Secret Technique Unlocked! This is called a Ladder!"
    }

];

let currentChallenge = 0;

let challenge3Mistakes = 0;

const challengeHint = document.getElementById("challengeHint");

function recordChallenge3Mistake() {
    challenge3Mistakes++;

    if (challenge3Mistakes >= 2) {
        challengeHint.classList.remove("hidden");
    }
}


const ladderTargets = [
    [2, 3],
    [3, 3],
    [3, 4]
];

function isLadderCaptured(board) {
    return ladderTargets.every(
        ([row, col]) => board[row][col] !== "white"
    );
}



function resetChallenge() {
    const challenge = challenges[currentChallenge];

    boardState = Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(null)
    );

    challenge.stones.forEach(stone => {
        boardState[stone.row][stone.col] = stone.color;
    });

    challengeSolved = false;
    challengeLocked = false;
    moveOverlay.classList.remove("show", "correct", "wrong");

    document.getElementById("challengeNumber").textContent =
        `CHALLENGE ${currentChallenge + 1} OF ${challenges.length}`;

    document.getElementById("challengeTitle").textContent =
        challenge.title;

    document.getElementById("challengeInstruction").textContent =
        challenge.instruction;

    feedback.textContent =
        "Tap an intersection to place your black stone.";

    retryBtn.classList.add("hidden");
    nextChallengeBtn.classList.add("hidden");
    previousChallengeBtn.classList.toggle(
        "hidden",
        currentChallenge === 0
    );
    challengeHint.classList.toggle(
        "hidden",
        currentChallenge !== 2 || challenge3Mistakes < 2
    );

    renderBoard();
}


function renderBoard() {
    goBoard.innerHTML = "";

    for (let i = 0; i < BOARD_SIZE; i++) {
        const pos = 5 + i * 11.25;

        const horizontal = document.createElement("div");
        horizontal.className = "board-line horizontal";
        horizontal.style.top = `${pos}%`;
        goBoard.appendChild(horizontal);

        const vertical = document.createElement("div");
        vertical.className = "board-line vertical";
        vertical.style.left = `${pos}%`;
        goBoard.appendChild(vertical);
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const point = document.createElement("button");
            point.className = "intersection";
            point.type = "button";

            point.style.top = `${5 + row * 11.25}%`;
            point.style.left = `${5 + col * 11.25}%`;

            const color = boardState[row][col];

            if (color) {
                point.classList.add(color);
                point.disabled = true;
            }

            if (challengeSolved || challengeLocked) {
                point.disabled = true;
            }

            point.setAttribute(
                "aria-label",
                `Row ${row + 1}, column ${col + 1}`
            );

            point.addEventListener("click", () => {
                playMove(row, col);
            });

            goBoard.appendChild(point);
        }
    }
}



function playMove(row, col) {
    if (challengeSolved || challengeLocked || boardState[row][col]) return;

    const challenge = challenges[currentChallenge];

    // Challenge 3: every wrong move ends the attempt immediately.
    if (currentChallenge === 2) {
        const failChallenge3 = (message) => {
            feedback.textContent = `${message} Press Retry to try again.`;
            challengeLocked = true;
            retryBtn.classList.remove("hidden");
            recordChallenge3Mistake();
            showMoveFeedback(false);
            renderBoard();
        };

        const result = simulateMove(boardState, row, col, "black");
        if (!result) {
            failChallenge3("Wrong move! That point is not a legal move.");
            return;
        }

        // Reject self-atari in this teaching puzzle (legal in Go, but
        // not a useful attacking move in this ladder).
        const blackGroup = getGroup(result, row, col);
        if (blackGroup.liberties.size === 1) {
            failChallenge3("Wrong move! Your black stones have only one liberty left.");
            return;
        }

        if (isLadderCaptured(result)) {
            boardState = result;
            challengeSolved = true;
            feedback.innerHTML = `
  <strong>SECRET TECHNIQUE UNLOCKED!</strong><br>
  You just discovered the Ladder!<br>
  A Ladder is a Weiqi technique where you repeatedly
  put your opponent's stones in atari,
  chasing them until they are captured.
`;
            nextChallengeBtn.classList.remove("hidden");
            nextChallengeBtn.textContent = "Complete Quest →";
            showMoveFeedback(true);
            renderBoard();
            return;
        }

        const targetGroup = getGroup(result, 2, 3);
        if (!targetGroup || targetGroup.liberties.size !== 1) {
            failChallenge3("Wrong move! Put the white group in atari (one liberty left).");
            return;
        }

        // Accept only moves that actually reduce the target group's
        // liberties. This avoids irrelevant moves that merely leave it
        // in atari and otherwise confuse the automated white reply.
        const previousTarget = getGroup(boardState, 2, 3);
        if (!previousTarget || targetGroup.liberties.size >= previousTarget.liberties.size) {
            failChallenge3("Wrong move! You need to tighten the chase on White.");
            return;
        }


        boardState = result;
        const escape = findWhiteEscape(boardState);

        if (escape) {
            boardState = escape.board;

            // Check White's liberties after escaping
            const escapedWhiteGroup = getGroup(
                boardState,
                escape.row,
                escape.col
            );

            // Wrong chase: White now has 3 or more liberties
            if (
                escapedWhiteGroup &&
                escapedWhiteGroup.liberties.size >= 3
            ) {
                failChallenge3(
                    "Wrong move! White escaped with three or more liberties. Keep White under pressure!"
                );
                return;
            }

            feedback.textContent =
                "White escaped! Your turn — keep chasing!";

        } else {
            feedback.textContent =
                "White has no legal escape. Your turn — capture White!";
        }

        renderBoard();
        return;

    }

    // Challenges 1 and 2: one-move capture puzzles.
    boardState[row][col] = "black";

    if (
        challenge.answer &&
        row === challenge.answer.row &&
        col === challenge.answer.col
    ) {
        challenge.stones.forEach(stone => {
            if (stone.color === "white") {
                boardState[stone.row][stone.col] = null;
            }
        });

        challengeSolved = true;
        feedback.textContent = challenge.success;
        nextChallengeBtn.classList.remove("hidden");
        showMoveFeedback(true);
        nextChallengeBtn.textContent = "Next Challenge →";

    } else {
        feedback.textContent =
            "Not quite! Look for the group's last liberty. Press Retry to try again.";

        challengeLocked = true; // Lock the board after a wrong move

        retryBtn.classList.remove("hidden");
        showMoveFeedback(false);
    }

    renderBoard();
}



retryBtn.addEventListener("click", resetChallenge);


nextChallengeBtn.addEventListener("click", () => {
    if (currentChallenge < challenges.length - 1) {
        currentChallenge++;
        resetChallenge();
        window.scrollTo(0, 0);
    } else {
        level3Page.classList.add("hidden");
        document.getElementById("completePage").classList.remove("hidden");
        window.scrollTo(0, 0);
    }
});


startChallengesBtn.addEventListener("click", () => {
    level2Video.pause();

    level2Page.classList.add("hidden");
    level3Page.classList.remove("hidden");

    currentChallenge = 0;
    challenge3Mistakes = 0;
    resetChallenge();
    window.scrollTo(0, 0);
});


previousChallengeBtn.addEventListener("click", () => {
    if (currentChallenge > 0) {
        currentChallenge--;
        resetChallenge();
        window.scrollTo(0, 0);
    }
});


const completePage = document.getElementById("completePage");
const backToChallengesBtn = document.getElementById("backToChallengesBtn");

backToChallengesBtn.addEventListener("click", () => {
    completePage.classList.add("hidden");
    level3Page.classList.remove("hidden");

    // Return to the first challenge.
    currentChallenge = 0;
    resetChallenge();

    window.scrollTo(0, 0);
});

const friendMatchPage = document.getElementById("friendMatchPage");
const friendGameBtn = document.getElementById("friendGameBtn");
const backToCompleteBtn = document.getElementById("backToCompleteBtn");

const friendRulesPage = document.getElementById("friendRulesPage");
const startFriendMatchBtn = document.getElementById("startFriendMatchBtn");
const rulesBackBtn = document.getElementById("rulesBackBtn");


friendGameBtn.addEventListener("click", () => {
    completePage.classList.add("hidden");
    friendRulesPage.classList.remove("hidden");

    window.scrollTo(0, 0);
});


startFriendMatchBtn.addEventListener("click", () => {
    friendRulesPage.classList.add("hidden");
    friendMatchPage.classList.remove("hidden");

    resetFriendMatch();

    window.scrollTo(0, 0);
});


rulesBackBtn.addEventListener("click", () => {
    friendRulesPage.classList.add("hidden");
    completePage.classList.remove("hidden");

    window.scrollTo(0, 0);
});


backToCompleteBtn.addEventListener("click", () => {
    friendMatchPage.classList.add("hidden");
    completePage.classList.remove("hidden");

    window.scrollTo(0, 0);
});


/* ==============================
   FRIEND MATCH - CAPTURE ONE
============================== */

const friendBoard = document.getElementById("friendBoard");
const friendTurnIndicator = document.getElementById("friendTurnIndicator");
const friendGameMessage = document.getElementById("friendGameMessage");

const blackPlayerPanel = document.getElementById("blackPlayerPanel");
const whitePlayerPanel = document.getElementById("whitePlayerPanel");

const blackPlayerStatus = document.getElementById("blackPlayerStatus");
const whitePlayerStatus = document.getElementById("whitePlayerStatus");

const restartFriendGameBtn = document.getElementById("restartFriendGameBtn");

const friendWinOverlay = document.getElementById("friendWinOverlay");
const friendWinnerText = document.getElementById("friendWinnerText");

let friendBoardState = [];
let friendCurrentPlayer = "black";
let friendGameOver = false;

// Start or restart the match.
function resetFriendMatch() {
    friendBoardState = Array.from(
        { length: BOARD_SIZE },
        () => Array(BOARD_SIZE).fill(null)
    );

    friendCurrentPlayer = "black";
    friendGameOver = false;

    friendGameMessage.textContent = "";

    updateFriendTurn();
    renderFriendBoard();
}

// Update player turn information.
function updateFriendTurn() {
    if (friendGameOver) return;

    const isBlack = friendCurrentPlayer === "black";
    friendBoard.classList.toggle("white-turn", !isBlack);

    friendTurnIndicator.textContent =
        isBlack ? "Black's Turn" : "White's Turn";

    blackPlayerPanel.classList.toggle("active", isBlack);
    whitePlayerPanel.classList.toggle("active", !isBlack);

    blackPlayerStatus.textContent =
        isBlack ? "Your turn!" : "Waiting...";

    whitePlayerStatus.textContent =
        isBlack ? "Waiting..." : "Your turn!";
}

// Draw the 9x9 board.
function renderFriendBoard() {
    friendBoard.innerHTML = "";

    // Horizontal and vertical grid lines.
    for (let i = 0; i < BOARD_SIZE; i++) {
        const position = 5 + i * 11.25;

        const horizontal = document.createElement("div");
        horizontal.className = "board-line horizontal";
        horizontal.style.top = `${position}%`;
        friendBoard.appendChild(horizontal);

        const vertical = document.createElement("div");
        vertical.className = "board-line vertical";
        vertical.style.left = `${position}%`;
        friendBoard.appendChild(vertical);
    }

    // Clickable intersections.
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const point = document.createElement("button");
            point.type = "button";
            point.className = "intersection";

            point.style.top = `${5 + row * 11.25}%`;
            point.style.left = `${5 + col * 11.25}%`;

            const stone = friendBoardState[row][col];

            if (stone) {
                point.classList.add(stone);
            }

            point.disabled = Boolean(stone) || friendGameOver;

            point.addEventListener("click", () => {
                playFriendMove(row, col);
            });

            friendBoard.appendChild(point);
        }
    }
}

// Play a move.
function playFriendMove(row, col) {
    if (friendGameOver) return;

    const player = friendCurrentPlayer;
    const opponent = player === "black" ? "white" : "black";

    const oldOpponentCount = friendBoardState
        .flat()
        .filter(stone => stone === opponent).length;

    // Reuse our Go capture rules.
    const nextBoard = simulateMove(
        friendBoardState,
        row,
        col,
        player
    );

    if (!nextBoard) {
        friendGameMessage.textContent =
            "Illegal move. Choose another intersection.";
        return;
    }

    const newOpponentCount = nextBoard
        .flat()
        .filter(stone => stone === opponent).length;

    friendBoardState = nextBoard;

    // Capture at least one stone = immediate win.
    if (newOpponentCount < oldOpponentCount) {
        friendGameOver = true;

        const winner = player === "black" ? "Black" : "White";

        friendTurnIndicator.textContent = `${winner} Wins!`;
        friendWinnerText.textContent = `${winner} Wins!`;
        friendWinOverlay.classList.remove("hidden");
        friendGameMessage.textContent =
            `${winner} captured a stone and won the match!`;

        blackPlayerPanel.classList.toggle(
            "active",
            player === "black"
        );

        whitePlayerPanel.classList.toggle(
            "active",
            player === "white"
        );

        blackPlayerStatus.textContent =
            player === "black" ? "Winner!" : "Good game!";

        whitePlayerStatus.textContent =
            player === "white" ? "Winner!" : "Good game!";

        renderFriendBoard();
        return;
    }

    // Switch turns.
    friendCurrentPlayer = opponent;
    friendGameMessage.textContent = "";

    updateFriendTurn();
    renderFriendBoard();
}

// Restart button.
restartFriendGameBtn.addEventListener("click", () => {
    resetFriendMatch();
    friendWinOverlay.classList.add("hidden");
});
