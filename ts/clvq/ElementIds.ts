// Copyright (c) Jeremías Casteglione <jrmsdev@gmail.com>
// See LICENSE file.

export const ElementIds = {
	// Sidebar
	mainSidebar: 'mainSidebar',
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
	// Promotion modals
	promotionWhite: 'whitePawnPromotion',
	promotionBlack: 'blackPawnPromotion',
	// Lichess auth
	lichessLogin:  'lichessLogin',
	lichessLogout: 'lichessLogout',
	lichessUser:   'lichessUser',
	// Lichess seek modal
	lichessSeekModal: 'lichessSeekModal',
	// Lichess challenge modal
	lichessChallengeModal:    'lichessChallengeModal',
	lichessChallengerName:    'lichessChallengerName',
	lichessChallengerRating:  'lichessChallengerRating',
	lichessChallengeTimeCtrl: 'lichessChallengeTimeCtrl',
	// Online game actions bar — append player number ('1' or '2') for rating
	gameActionsBar:  'gameActionsBar',
	gameResign:      'gameResign',
	gameAbort:       'gameAbort',
	gameOfferDraw:   'gameOfferDraw',
	gamePlayerRating: 'gamePlayerRating',
	// Game history modal
	gameHistoryModal: 'gameHistoryModal',
	gameHistoryList:  'gameHistoryList',
	// System / error
	clvqInternalError:        'clvqInternalError',
	clvqInternalErrorMessage: 'clvqInternalErrorMessage',
	systemInfo: 'systemInfo',
} as const;
