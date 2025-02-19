import MainMenuScene from './MainMenuScene.js';
import GameScene from './GameScene.js';
import { loginUser } from '../scripts/api.js';

const config = {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    scene: [MainMenuScene, GameScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 150 },
            debug: false,
        },
    },
};

const game = new Phaser.Game(config);
