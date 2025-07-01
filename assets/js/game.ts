console.log('Chesslovaquia game board.');

// Interfaces and Types
class ChessProvider {
	name = '';

	async authenticate() {
		throw new Error('Not implemented');
	}

	async createGame(timeControl = '10+0') {
		throw new Error('Not implemented');
	}

	async makeMove(move) {
		throw new Error('Not implemented');
	}

	async resign() {
		throw new Error('Not implemented');
	}

	onGameUpdate(callback) {
		throw new Error('Not implemented');
	}
}

// Lichess Provider Implementation
class LichessProvider extends ChessProvider {
	constructor() {
		super();
		this.name = 'Lichess';
		this.socket = null;
		this.gameId = null;
		this.token = localStorage.getItem('lichess_token');
	}

	async authenticate() {
		if (!this.token) {
			// In real implementation, this would redirect to Lichess OAuth
			console.log('Would redirect to Lichess OAuth');
			// For demo, we'll simulate authentication
			this.token = 'demo_token_lichess';
			localStorage.setItem('lichess_token', this.token);
		}
		return true;
	}

	async createGame(timeControl = '10+0') {
		// Simulate API call to create game
		await new Promise(resolve => setTimeout(resolve, 1500));
		this.gameId = 'demo_game_' + Date.now();
		return {
			gameId: this.gameId,
			color: Math.random() > 0.5 ? 'white' : 'black',
			timeControl: timeControl
		};
	}

	async makeMove(move) {
		// Simulate move submission
		console.log('Lichess move:', move);
		return true;
	}

	async resign() {
		console.log('Lichess resign');
		return true;
	}

	onGameUpdate(callback) {
		// Simulate receiving moves
		this.gameUpdateCallback = callback;
	}
}

// Chess.com Provider Implementation
class ChessComProvider extends ChessProvider {
	constructor() {
		super();
		this.name = 'Chess.com';
		this.token = localStorage.getItem('chesscom_token');
	}

	async authenticate() {
		if (!this.token) {
			console.log('Would redirect to Chess.com OAuth');
			this.token = 'demo_token_chesscom';
			localStorage.setItem('chesscom_token', this.token);
		}
		return true;
	}

	async createGame(timeControl = '10+0') {
		await new Promise(resolve => setTimeout(resolve, 2000));
		return {
			gameId: 'chesscom_' + Date.now(),
			color: Math.random() > 0.5 ? 'white' : 'black',
			timeControl: timeControl
		};
	}

	async makeMove(move) {
		console.log('Chess.com move:', move);
		return true;
	}

	async resign() {
		console.log('Chess.com resign');
		return true;
	}

	onGameUpdate(callback) {
		this.gameUpdateCallback = callback;
	}
}

// Chess Game Logic
class ChessGame {
	constructor() {
		this.board = this.initializeBoard();
		this.currentPlayer = 'white';
		this.selectedSquare = null;
		this.lastMove = null;
		this.gameActive = true;
		this.playerColor = 'white';
		this.whiteTime = 600; // 10 minutes in seconds
		this.blackTime = 600;
		this.clockInterval = null;
	}

	initializeBoard() {
		const board = Array(8).fill(null).map(() => Array(8).fill(null));

		// Place pieces in starting position
		const pieces = {
			'r': '♜', 'n': '♞', 'b': '♝', 'q': '♛', 'k': '♚', 'p': '♟',
			'R': '♖', 'N': '♘', 'B': '♗', 'Q': '♕', 'K': '♔', 'P': '♙'
		};

		// Black pieces
		board[0] = ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'];
		board[1] = Array(8).fill('p');

		// White pieces
		board[6] = Array(8).fill('P');
		board[7] = ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R'];

		return board;
	}

	getPieceImageUrl(piece) {
		if (!piece) return '';

		const color = piece === piece.toUpperCase() ? 'white' : 'black';
		const pieceMap = {
			'p': 'pawn', 'r': 'rook', 'n': 'knight',
			'b': 'bishop', 'q': 'queen', 'k': 'king'
		};
		const pieceName = pieceMap[piece.toLowerCase()];

		return `https://lichess1.org/assets/_APEzSm/piece/cburnett/${color}_${pieceName}.svg`;
	}

	isValidMove(fromRow, fromCol, toRow, toCol) {
		// Simplified move validation for demo
		if (toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) return false;
		if (!this.board[fromRow][fromCol]) return false;

		const piece = this.board[fromRow][fromCol];
		const isWhitePiece = piece === piece.toUpperCase();

		// Check if it's the current player's piece
		if ((this.currentPlayer === 'white') !== isWhitePiece) return false;

		// Basic piece movement (simplified)
		const pieceType = piece.toLowerCase();
		const rowDiff = Math.abs(toRow - fromRow);
		const colDiff = Math.abs(toCol - fromCol);

		switch (pieceType) {
			case 'p': // Pawn
				const direction = isWhitePiece ? -1 : 1;
				const startRow = isWhitePiece ? 6 : 1;

				if (fromCol === toCol) { // Forward move
					if (toRow === fromRow + direction && !this.board[toRow][toCol]) return true;
					if (fromRow === startRow && toRow === fromRow + 2 * direction && !this.board[toRow][toCol]) return true;
				} else if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction) {
					// Capture
					return this.board[toRow][toCol] &&
						   (this.board[toRow][toCol] === this.board[toRow][toCol].toUpperCase()) !== isWhitePiece;
				}
				return false;

			case 'r': // Rook
				return (fromRow === toRow || fromCol === toCol) && this.isPathClear(fromRow, fromCol, toRow, toCol);

			case 'n': // Knight
				return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);

			case 'b': // Bishop
				return rowDiff === colDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);

			case 'q': // Queen
				return (fromRow === toRow || fromCol === toCol || rowDiff === colDiff) &&
					   this.isPathClear(fromRow, fromCol, toRow, toCol);

			case 'k': // King
				return rowDiff <= 1 && colDiff <= 1;
		}

		return false;
	}

	isPathClear(fromRow, fromCol, toRow, toCol) {
		const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
		const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

		let currentRow = fromRow + rowStep;
		let currentCol = fromCol + colStep;

		while (currentRow !== toRow || currentCol !== toCol) {
			if (this.board[currentRow][currentCol]) return false;
			currentRow += rowStep;
			currentCol += colStep;
		}

		return true;
	}

	makeMove(fromRow, fromCol, toRow, toCol) {
		if (!this.isValidMove(fromRow, fromCol, toRow, toCol)) return false;

		// Check if destination has opponent's piece
		const targetPiece = this.board[toRow][toCol];
		if (targetPiece) {
			const movingPiece = this.board[fromRow][fromCol];
			const movingIsWhite = movingPiece === movingPiece.toUpperCase();
			const targetIsWhite = targetPiece === targetPiece.toUpperCase();

			if (movingIsWhite === targetIsWhite) return false; // Can't capture own piece
		}

		// Make the move
		this.board[toRow][toCol] = this.board[fromRow][fromCol];
		this.board[fromRow][fromCol] = null;

		this.lastMove = { fromRow, fromCol, toRow, toCol };
		this.currentPlayer = this.currentPlayer === 'white' ? 'black' : 'white';

		return true;
	}

	startClock() {
		this.clockInterval = setInterval(() => {
			if (!this.gameActive) return;

			if (this.currentPlayer === 'white') {
				this.whiteTime--;
				if (this.whiteTime <= 0) {
					this.gameActive = false;
					this.updateStatus('Black wins on time!');
				}
			} else {
				this.blackTime--;
				if (this.blackTime <= 0) {
					this.gameActive = false;
					this.updateStatus('White wins on time!');
				}
			}

			this.updateClocks();
		}, 1000);
	}

	updateClocks() {
		const formatTime = (seconds) => {
			const mins = Math.floor(seconds / 60);
			const secs = seconds % 60;
			return `${mins}:${secs.toString().padStart(2, '0')}`;
		};

		document.getElementById('white-clock').textContent = formatTime(this.whiteTime);
		document.getElementById('black-clock').textContent = formatTime(this.blackTime);

		// Update active clock styling
		document.getElementById('white-clock').classList.toggle('active', this.currentPlayer === 'white');
		document.getElementById('black-clock').classList.toggle('active', this.currentPlayer === 'black');
	}

	updateStatus(message) {
		document.getElementById('game-status').textContent = message;
	}
}

// Global variables
let currentProvider = null;
let chessGame = null;
const providers = {
	'lichess': new LichessProvider(),
	'chess.com': new ChessComProvider()
};

// Provider selection
async function selectProvider(providerName) {
	if (providerName === 'random') {
		const providerNames = Object.keys(providers);
		providerName = providerNames[Math.floor(Math.random() * providerNames.length)];
	}

	currentProvider = providers[providerName];

	showScreen('loading-screen');

	try {
		await currentProvider.authenticate();
		const gameInfo = await currentProvider.createGame();

		// Initialize game
		chessGame = new ChessGame();
		chessGame.playerColor = gameInfo.color;

		document.getElementById('provider-info').textContent = `Provider: ${currentProvider.name}`;

		renderBoard();
		chessGame.startClock();
		chessGame.updateStatus(`You are playing as ${gameInfo.color}`);

		showScreen('game-screen');

	} catch (error) {
		console.error('Failed to start game:', error);
		alert('Failed to start game. Please try again.');
		showScreen('provider-selection');
	}
}

function showScreen(screenId) {
	['provider-selection', 'loading-screen', 'game-screen'].forEach(id => {
		document.getElementById(id).classList.add('hidden');
	});
	document.getElementById(screenId).classList.remove('hidden');
}

function renderBoard() {
	const boardElement = document.getElementById('chess-board');
	boardElement.innerHTML = '';

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			const square = document.createElement('div');
			square.className = `chess-square ${(row + col) % 2 === 0 ? 'light' : 'dark'}`;
			square.dataset.row = row;
			square.dataset.col = col;

			// Add last move highlighting
			if (chessGame.lastMove &&
				((chessGame.lastMove.fromRow === row && chessGame.lastMove.fromCol === col) ||
				 (chessGame.lastMove.toRow === row && chessGame.lastMove.toCol === col))) {
				square.classList.add('last-move');
			}

			// Add piece if present
			const piece = chessGame.board[row][col];
			if (piece) {
				const pieceElement = document.createElement('div');
				pieceElement.className = 'chess-piece';
				pieceElement.style.backgroundImage = `url(${chessGame.getPieceImageUrl(piece)})`;
				square.appendChild(pieceElement);
			}

			square.addEventListener('click', () => handleSquareClick(row, col));
			boardElement.appendChild(square);
		}
	}
}

function handleSquareClick(row, col) {
	if (!chessGame.gameActive) return;

	const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

	if (chessGame.selectedSquare) {
		// Try to make a move
		const [fromRow, fromCol] = chessGame.selectedSquare;

		if (fromRow === row && fromCol === col) {
			// Deselect the same square
			clearSelection();
			return;
		}

		if (chessGame.makeMove(fromRow, fromCol, row, col)) {
			// Move was successful
			currentProvider.makeMove(`${String.fromCharCode(97 + fromCol)}${8 - fromRow}-${String.fromCharCode(97 + col)}${8 - row}`);
			renderBoard();

			// Check if it's still the player's turn
			const isPlayerTurn = (chessGame.currentPlayer === 'white' && chessGame.playerColor === 'white') ||
							   (chessGame.currentPlayer === 'black' && chessGame.playerColor === 'black');

			if (isPlayerTurn) {
				chessGame.updateStatus('Your turn');
			} else {
				chessGame.updateStatus('Opponent\'s turn');
				// In a real implementation, we would wait for opponent's move via WebSocket
			}
		}

		clearSelection();
	} else {
		// Select a piece
		const piece = chessGame.board[row][col];
		if (piece) {
			const isWhitePiece = piece === piece.toUpperCase();
			const isPlayerPiece = (chessGame.playerColor === 'white' && isWhitePiece) ||
								 (chessGame.playerColor === 'black' && !isWhitePiece);

			if (isPlayerPiece &&
				((chessGame.currentPlayer === 'white' && isWhitePiece) ||
				 (chessGame.currentPlayer === 'black' && !isWhitePiece))) {
				chessGame.selectedSquare = [row, col];
				square.classList.add('selected');

				// Highlight possible moves (simplified)
				showPossibleMoves(row, col);
			}
		}
	}
}

function showPossibleMoves(fromRow, fromCol) {
	// Simple highlighting - in real implementation this would show legal moves
	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 8; col++) {
			if (chessGame.isValidMove(fromRow, fromCol, row, col)) {
				const square = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
				square.classList.add('possible-move');
			}
		}
	}
}

function clearSelection() {
	chessGame.selectedSquare = null;
	document.querySelectorAll('.chess-square').forEach(square => {
		square.classList.remove('selected', 'possible-move');
	});
}

async function resignGame() {
	if (confirm('Are you sure you want to resign?')) {
		chessGame.gameActive = false;
		chessGame.updateStatus('You resigned');
		clearInterval(chessGame.clockInterval);
		await currentProvider.resign();
	}
}

function newGame() {
	if (confirm('Start a new game?')) {
		showScreen('provider-selection');
		if (chessGame.clockInterval) {
			clearInterval(chessGame.clockInterval);
		}
	}
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
	showScreen('provider-selection');
});
