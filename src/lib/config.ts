// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

/** IndexedDB database names (include version suffix — bump on schema change). */
export const DB_ACCOUNTS = 'clvq.accounts.v1';
export const DB_GAMES = 'clvq.games.v1';
export const DB_GAME_STATE = 'clvq.game-state.v1';

/** localStorage keys. */
export const LS_DEBUG = 'clvq.debug';
export const LS_SELECTED_ACCOUNT = 'clvq.selectedAccount';
export const LS_ACTIVE_GAME = 'clvq.activeGame';
export const LS_BOARD_THEME = 'clvq.board.theme';
export const LS_BOARD_PIECES = 'clvq.board.pieces';

/** Lichess OAuth PKCE — transient verifier key prefix (appended with pending auth ID). */
export const LS_LICHESS_PENDING_PREFIX = 'clvq.lichess.pending.';
/** Lichess active game — JSON-serialised { gameId, accountId, color } for reconnect. */
export const LS_LICHESS_ACTIVE = 'clvq.lichess.active';
