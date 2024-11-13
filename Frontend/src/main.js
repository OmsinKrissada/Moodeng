
const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.RESIZE,  // Automatically adjust to the screen size
        autoCenter: Phaser.Scale.CENTER_BOTH,  // Center the game horizontally and vertically
    },
    scene: [MainMenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 150 },
            debug: false
        }
    },
};


const game =  new Phaser.Game(config);

window.addEventListener('resize', () => {
    game.scale.resize(window.innerWidth, window.innerHeight);
});