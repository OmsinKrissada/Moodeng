// Monster.js
import Phaser from 'phaser';

export default class Monster extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, texture, hp) {
        super(scene, x, y, texture);

        // Add the monster to the scene
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set monster properties
        this.hp = hp;
        this.scene = scene;

        // Default monster settings
        this.setCollideWorldBounds(false);
        this.setActive(true);
    }

    // Method to take damage
    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        }
    }

    // Method for death (can be overridden in subclasses)
    die() {
        this.setActive(false);
        this.setVisible(false);
        this.destroy();
    }

    // Placeholder for unique behavior in subclasses (e.g., moving left)
    update() {
        // Override in subclasses for unique behavior
    }
}
