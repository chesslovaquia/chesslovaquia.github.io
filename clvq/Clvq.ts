import { ChessGameAction } from '../game/ChessGameAction';

class Clvq {
	public readonly game: ChessGameAction;

	constructor() {
		console.log('Welcome to Chesslovaquia.');
		this.game = new ChessGameAction();
	}

	// Utils

	public w3ToggleMenu(id: string): void {
		var x = document.getElementById(id);
		if (x.className.indexOf("w3-show") === -1) {
			x.className += " w3-show";
		} else {
			x.className = x.className.replace(" w3-show", "");
		}
	}

}

export { Clvq };
