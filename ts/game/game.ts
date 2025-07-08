// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	if ((window as any).Clvq) {
		(window as any).Clvq.game.init();
	} else {
		console.log('Game init failed: Clvq not initialized');
	}
});
