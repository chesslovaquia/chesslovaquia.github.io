import { Chessground } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';
import { Color, Key, Piece, Role } from 'chessground/types';

import {
	DEFAULT_POSITION,
	SQUARES,
	Chess,
	Move,
	Square,
} from 'chess.js';

import { ChessGamePromotion } from './ChessGamePromotion';
import { ChessGameError, ChessGameConfig } from './types';

class ChessGame {
	private readonly game: Chess;
	private readonly board: ChessgroundApi;
	private statusElement?: HTMLElement;

	private promotion: ChessGamePromotion;
	private curMove: Move | null;

	constructor(config: ChessGameConfig) {
		console.log('Game board.');
		this.game = this.newGame();
		this.board = this.newBoard(config);
		this.curMove = null;
		this.promotion = new ChessGamePromotion(this.board);
		if (this.board) {
			this.statusElement = config.statusElement;
			this.setupEventListeners(config);
			this.updateStatus();
		}
	}

	private setupEventListeners(cfg: ChessGameConfig): void {
		if (cfg.resetButton) {
			cfg.resetButton.addEventListener('click', () => this.reset());
		}
		if (cfg.undoButton) {
			cfg.undoButton.addEventListener('click', () => this.undo());
		}
		if (cfg.redoButton) {
			cfg.redoButton.addEventListener('click', () => this.redo());
		}
	}

	private newGame(): Chess {
		return new Chess(DEFAULT_POSITION);
	}

	private newBoard(config: ChessGameConfig): ChessgroundApi {
		if (!config.boardElement) {
			throw new ChessGameError('Game init ERROR: board element not found.');
		}
		return Chessground(config.boardElement, {
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
				events: {
					after: (orig: Key, dest: Key, metadata?: any) => {
						this.afterMove(orig, dest);
					},
				},
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
				duration: 200,
			},
			drawable: {
				enabled: false,
			},
			draggable: {
				enabled: false,
			},
		});
	}

	private possibleMoves(): Map<Key, Key[]> {
		const dests = new Map<Key, Key[]>();
		SQUARES.forEach((square: Square) => {
			const moves = this.game.moves({ square, verbose: true }) as Move[];
			if (moves.length > 0) {
				dests.set(square as Key, moves.map((move: Move) => move.to as Key));
			}
		});
		return dests;
	}

	private turnColor(): Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}

	private afterMove(orig: Key, dest: Key): void {
		console.log('Game move was:', orig, dest)
		if (!this.curMove) {
			return;
		}
		// Pawn promotion.
		if (this.curMove.isPromotion()) {
			console.log('Game move was pawn promotion.')
			this.handlePromotion(orig, dest);
			this.updateStatus();
		}
		this.curMove = null;
	}

	private onMove(orig: Key, dest: Key, metadata?: any): void {
		this.doMove(orig, dest, 'q');
	}

	private doMove(orig: Key, dest: Key, promotion: string): void {
		try {
			this.curMove = null;
			const move = this.game.move({
				from: orig as Square,
				to: dest as Square,
				promotion: promotion,
			});
			if (move) {
				this.board.set({
					fen: this.game.fen(),
					turnColor: this.turnColor(),
					movable: {
						color: this.turnColor(),
						dests: this.possibleMoves()
					}
				});
				this.updateStatus();
				this.curMove = move;
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
		console.log('Game reset!');
		this.game.reset();
		this.board.set({
			fen: this.game.fen(),
			turnColor: 'white',
			movable: {
				color: 'white',
				dests: this.possibleMoves(),
			},
			lastMove: [],
		});
		this.updateStatus();
	}

	public loadFen(fen: string): boolean {
		try {
			this.game.load(fen);
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.turnColor(),
				movable: {
					color: this.turnColor(),
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

	// Pawn promotion.

	private handlePromotion(orig: Key, dest: Key): void {
		console.log('Pawn promotion handle:', orig, dest);
		const piece: Piece = (this.board.state.pieces.get(dest) as Piece);
		this.undo();
		console.log('Pawn promotion show modal:', piece.color);
		this.promotion.showModal(piece.color, (selectedPiece) => {
			this.execPromotion(orig, dest, piece.color, selectedPiece);
		});
	}

	private execPromotion(orig: Key, dest: Key, side: Color, piece: Role): void {
		console.log('Pawn promotion exec:', orig, dest, side, piece);
		this.doMove(orig, dest, piece);
		this.board.set({
			lastMove: [orig, dest],
		});
		this.promotion.finish(orig, dest, side, piece);
	}

	// Moves undo/redo.

	private undo(): void {
		console.log('Move undo.');
		this.game.undo();
		this.board.set({
			fen: this.game.fen(),
			turnColor: this.turnColor(),
			movable: {
				color: this.turnColor(),
				dests: this.possibleMoves(),
			},
			lastMove: ['a2', 'a3'], // FIXME
		});
		this.updateStatus();
	}

	private redo(): void {
		console.log('Move redo.');
	}
}

export { ChessGame };
