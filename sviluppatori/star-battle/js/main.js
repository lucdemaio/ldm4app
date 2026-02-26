(() => {
    const game = new Game();
    // Make game globally accessible for mobile controls
    window.currentGame = game;
    game.start();
})();