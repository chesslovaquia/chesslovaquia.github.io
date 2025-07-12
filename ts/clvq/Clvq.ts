class Clvq {
	constructor() {
		console.log('Welcome to Chesslovaquia.')
	}

	public w3ToggleMenu(id: string): void {
		let x = document.getElementById(id)
		if (x) {
			if (x.className.indexOf("w3-show") === -1) {
				x.className += " w3-show"
			} else {
				x.className = x.className.replace(" w3-show", "")
			}
		} else {
			console.log('Clvq w3ToggleMenu ERROR:', id, 'not found')
		}
	}
}

export { Clvq }
