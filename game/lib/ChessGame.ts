import { Chessground } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';
import { Chess, Square, Move } from 'chess.js';
import { Key } from 'chessground/types';

interface ChessGameConfig {
	boardElement: HTMLElement;
	statusElement?: HTMLElement;
	resetButton?: HTMLElement;
}

class ChessGame {
	private game: Chess;
	private board: ChessgroundApi;
	private statusElement?: HTMLElement;
	private resetButton?: HTMLElement;

	constructor(config: ChessGameConfig) {
		console.log('Chesslovaquia game board.');
		this.game = new Chess();
		this.statusElement = config.statusElement;
		this.resetButton = config.resetButton;

		this.board = Chessground(config.boardElement, {
			disableContextMenu: true,
			coordinates: false,
			fen: this.game.fen(),
			orientation: 'white',
			turnColor: 'white',
			movable: {
				color: 'white',
				free: false,
				dests: this.possibleMoves(),
				showDests: true,
				rookCastle: true,
			},
			events: {
				move: (orig: Key, dest: Key, metadata?: any) => this.onMove(orig, dest, metadata)
			},
			highlight: {
				lastMove: true,
				check: true,
			},
			selectable: {
				enabled: true,
			},
			premovable: {
				enabled: false,
			},
			animation: {
				enabled: false,
			},
			drawable: {
				enabled: false,
			},
			draggable: {
				enabled: false,
			},
		});

		this.setupEventListeners();
		this.updateStatus();
	}

	private possibleMoves(): Map<Key, Key[]> {
		const dests = new Map<Key, Key[]>();
		const squares: Square[] = [
			'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7', 'a8',
			'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'b7', 'b8',
			'c1', 'c2', 'c3', 'c4', 'c5', 'c6', 'c7', 'c8',
			'd1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8',
			'e1', 'e2', 'e3', 'e4', 'e5', 'e6', 'e7', 'e8',
			'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8',
			'g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8',
			'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'h7', 'h8'
		];

		squares.forEach((square: Square) => {
			const moves = this.game.moves({ square, verbose: true }) as Move[];
			if (moves.length > 0) {
				dests.set(square as Key, moves.map((move: Move) => move.to as Key));
			}
		});

		return dests;
	}

	private onMove(orig: Key, dest: Key, metadata?: any): void {
		try {
			const move = this.game.move({
				from: orig as Square,
				to: dest as Square,
				promotion: 'q' // Always promote to queen for simplicity
			});

			if (move) {
				this.board.set({
					fen: this.game.fen(),
					turnColor: this.game.turn() === 'w' ? 'white' : 'black',
					movable: {
						color: this.game.turn() === 'w' ? 'white' : 'black',
						dests: this.possibleMoves()
					}
				});
				this.updateStatus();
			} else {
				// Invalid move - reset position
				this.board.set({ fen: this.game.fen() });
			}
		} catch (error) {
			console.error('Invalid move:', error);
			// Reset board to current position
			this.board.set({ fen: this.game.fen() });
		}
	}

	private updateStatus(): void {
		if (!this.statusElement) return;

		let statusText = '';

		if (this.game.isGameOver()) {
			if (this.game.isCheckmate()) {
				const winner = this.game.turn() === 'w' ? 'Black' : 'White';
				statusText = `Checkmate! ${winner} wins.`;
			} else if (this.game.isDraw()) {
				statusText = 'Draw!';
			} else if (this.game.isStalemate()) {
				statusText = 'Stalemate!';
			} else if (this.game.isThreefoldRepetition()) {
				statusText = 'Draw by threefold repetition!';
			} else if (this.game.isInsufficientMaterial()) {
				statusText = 'Draw by insufficient material!';
			}
		} else {
			const currentPlayer = this.game.turn() === 'w' ? 'White' : 'Black';
			statusText = `${currentPlayer} to move`;

			if (this.game.inCheck()) {
				statusText += ' (in check)';
			}
		}

		this.statusElement.textContent = statusText;
	}

	public reset(): void {
		this.game.reset();
		this.board.set({
			fen: this.game.fen(),
			turnColor: 'white',
			movable: {
				color: 'white',
				dests: this.possibleMoves()
			}
		});
		this.updateStatus();
	}

	public loadFen(fen: string): boolean {
		try {
			this.game.load(fen);
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.game.turn() === 'w' ? 'white' : 'black',
				movable: {
					color: this.game.turn() === 'w' ? 'white' : 'black',
					dests: this.possibleMoves()
				}
			});
			this.updateStatus();
			return true;
		} catch (error) {
			console.error('Invalid FEN:', error);
			return false;
		}
	}

	public getFen(): string {
		return this.game.fen();
	}

	public getPgn(): string {
		return this.game.pgn();
	}

	public getHistory(): string[] {
		return this.game.history();
	}

	private setupEventListeners(): void {
		if (this.resetButton) {
			this.resetButton.addEventListener('click', () => this.reset());
		}
	}
}

export { ChessGame };
