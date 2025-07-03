class Clvq {

	constructor() {
		console.log('Welcome to chesslovaquia.');
		this.setupWPA();
	}

	private setupWPA(): void {
		if ('serviceWorker' in navigator) {
			console.log('Service Worker Setup.');
			navigator.serviceWorker.register('/sw.js');
		}
	}

}

export { Clvq };
