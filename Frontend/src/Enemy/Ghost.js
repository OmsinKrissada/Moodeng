// Ghost.js
import Monster from './Monster';

export default class Ghosts extends Monster {
    constructor(scene, x, y) {
        super(scene, x, y, 'ghost', 2); // Texture name and initial hp

        // Set specific properties for Ghost
        this.setScale(0.3);
        this.setVelocityX(-200);
    }
}
