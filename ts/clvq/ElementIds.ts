// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export const ElementIds = {
	// Board
	chessboard: 'chessboard',
	// Player elements — append player number ('1' or '2')
	gamePlayer:        'gamePlayer',
	gameClock:         'gameClock',
	gameMaterial:      'gameMaterial',
	gameMaterialCount: 'gameMaterialCount',
	// Game UI
	gameDescription: 'gameDescription',
	gameStatus:      'gameStatus',
	gameOutcome:     'gameOutcome',
	gameReset:       'gameReset',
	gameNavBackward:  'gameNavBackward',
	gameNavForward:   'gameNavForward',
	gameFlipBoard:    'gameFlipBoard',
	gameNavFirstMove: 'gameNavFirstMove',
	gameNavLastMove:  'gameNavLastMove',
	gameOutcomeModal: 'gameOutcomeModal',
	// Promotion modals — prepend board color ('white' or 'black')
	pawnPromotion: 'PawnPromotion',
	// Lichess auth
	lichessLogin:  'lichessLogin',
	lichessLogout: 'lichessLogout',
	lichessUser:   'lichessUser',
	// System / error
	clvqInternalError:        'clvqInternalError',
	clvqInternalErrorMessage: 'clvqInternalErrorMessage',
	systemInfo: 'systemInfo',
} as const;
