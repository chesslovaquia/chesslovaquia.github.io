import { Chessground } from 'chessground';
import { Api as ChessgroundApi } from 'chessground/api';

import * as board from 'chessground/types';
import * as game  from 'chess.js';

import { ChessGamePromotion } from './ChessGamePromotion';
import { ChessGameState } from './ChessGameState';

import { ChessGameError, ChessGameConfig } from './types';

class ChessGame {
	private readonly game: game.Chess;
	private readonly board: ChessgroundApi;
	private statusElement?: HTMLElement;

	private promotion: ChessGamePromotion;
	private state: ChessGameState;

	private curMove: game.Move | null;
	private prevMove: game.Move | null;

	constructor(config: ChessGameConfig) {
		console.log('Game board.');
		this.curMove = null;
		this.prevMove = null;
		this.game = this.newGame();
		this.board = this.newBoard(config);
		this.promotion = new ChessGamePromotion(this.board);
		this.state = new ChessGameState();
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

	private newGame(): game.Chess {
		return new game.Chess(game.DEFAULT_POSITION);
	}

	private newBoard(config: ChessGameConfig): ChessgroundApi {
		if (!config.boardElement) {
			throw new ChessGameError('Init board element not found.');
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
					after: (orig: board.Key, dest: board.Key, metadata?: any) => {
						this.afterMove(orig, dest);
					},
				},
			},
			events: {
				move: (orig: board.Key, dest: board.Key, capturedPiece?: board.Piece) => {
					this.onMove(orig, dest, capturedPiece);
				},
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

	private possibleMoves(): Map<board.Key, board.Key[]> {
		const dests = new Map<board.Key, board.Key[]>();
		game.SQUARES.forEach((square: game.Square) => {
			const moves = this.game.moves({ square, verbose: true }) as game.Move[];
			if (moves.length > 0) {
				dests.set(square as board.Key, moves.map((move: game.Move) => move.to as board.Key));
			}
		});
		return dests;
	}

	private turnColor(): board.Color {
		return this.game.turn() === 'w' ? 'white' : 'black';
	}

	private afterMove(orig: board.Key, dest: board.Key): void {
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
	}

	private onMove(orig: board.Key, dest: board.Key, capturedPiece?: board.Piece): void {
		this.doMove(orig, dest, 'q');
	}

	private doMove(orig: board.Key, dest: board.Key, promotion: string): void {
		try {
			if (this.curMove) {
				this.prevMove = null;
				this.prevMove = this.curMove;
			}
			this.curMove = null;
			const move = this.game.move({
				from: orig as game.Square,
				to: dest as game.Square,
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
			} else if (this.curMove) {
				if (this.curMove.isPromotion()) {
					statusText += ' (pawn promotion)';
				}
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

	private handlePromotion(orig: board.Key, dest: board.Key): void {
		console.log('Pawn promotion handle:', orig, dest);
		this.updateStatus();
		this.undo();
		const side: board.Color = this.turnColor();
		console.log('Pawn promotion show modal:', side);
		this.promotion.showModal(side, (selectedPiece) => {
			this.execPromotion(orig, dest, side, selectedPiece);
		});
	}

	private execPromotion(orig: board.Key, dest: board.Key, side: board.Color, piece: board.Role): void {
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
		var lastMove: board.Key[] = [];
		if (this.prevMove) {
			lastMove[0] = this.prevMove.from;
			lastMove[1] = this.prevMove.to;
		}
		if (this.game.undo()) {
			this.board.set({
				fen: this.game.fen(),
				turnColor: this.turnColor(),
				movable: {
					color: this.turnColor(),
					dests: this.possibleMoves(),
				},
				lastMove: lastMove,
			});
			this.updateStatus();
		} else {
			console.log('No move to undo!');
		}
	}

	private redo(): void {
		console.log('Move redo.');
	}
}

export { ChessGame };
