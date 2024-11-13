// Owlet.js
import Monster from "./Monster";

export default class Owletslol extends Monster {
    constructor(scene, x, y) {
        super(scene, x, y, 'Owlet', 3); // Texture name and initial hp

        // Set specific properties for Owlet
        this.setScale(2);
        this.setVelocityX(-100);
        this.flipX = true;
        this.play('runLeft'); // Assumes `runLeft` animation is defined in the scene

        // Throw rocks at intervals
        this.throwTimer = this.scene.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000),
            callback: () => this.throwRock(),
            callbackScope: this,
            loop: true
        });
    }

    throwRock() {
        if (this.active && this.hp > 0) {
            this.play('owletThrow'); // Assumes `owletThrow` animation is defined in the scene
            this.scene.throwRock(this); // Call throwRock method in the scene
            this.on('animationcomplete-owletThrow', () => {
                if (this.hp > 0) {
                    this.play('runLeft');
                }
            });
        }
    }

    // Override the die method to clean up the throw timer
    die() {
        if (this.throwTimer) this.throwTimer.remove(false);
        super.die();
    }
}
