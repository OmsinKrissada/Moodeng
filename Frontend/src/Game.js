class Game extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
        let player;
        let platforms;
        let cursors;
        let score = 0;
        let scoreText;
        let scoreTimer = 0;
        let gameActive = true;
        let background;
    }

    preload() {
        this.load.image('sky', 'src/assets/supersky.png');
        this.load.image('hoppybara', 'src/assets/Capybara_29.png'); // Replace with your capybara image
        this.load.image('obstacle_jump', 'src/assets/obtra.png');
        this.load.image('ground', 'src/assets/ground.png');
    }

    create() {
        background = this.add.tileSprite(0, 0, width, height, 'sky').setOrigin(0).setScale(2.2);
        // Background
        this.add.image(0,0, 'ground').setOrigin(0).setScale(2);

        // Platforms group
        platforms = this.physics.add.staticGroup();
        const invisibleGround = platforms.create(700, 700, null); // No texture
        invisibleGround.displayWidth = config.width + 500;
        invisibleGround.displayHeight = 32;
        invisibleGround.refreshBody();
        invisibleGround.setAlpha(0);

        // Player (Capybara character)
        player = this.physics.add.sprite(100, 500, 'hoppybara');
        player.setCollideWorldBounds(true);
        player.setBounce(0);
        player.setScale(0.1);
        player.setDrag(100, 0);
        player.body.gravity.y = 800;
        // obstacle
        obstacles = this.physics.add.group();
        // obstacle_jump
        obstacle_jump = this.physics.add.sprite(400, 100, 'obstacle_jump');
        obstacle_jump.setBounce(1);
        obstacle_jump.setCollideWorldBounds(true);
        obstacle_jump.setVelocity(Phaser.Math.Between(-200, 200), 20);

        // Player-platform collision
        this.physics.add.collider(player, platforms);
        this.physics.add.collider(obstacle_jump, platforms);

        // Cursor input for jumping
        cursors = this.input.keyboard.createCursorKeys();

        // Score
        scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' });
        
        // Collectibles / obstacle_jump overlap
        this.physics.add.overlap(player, obstacle_jump, hitobstacle_jump, null, this);
    }

    update(time, delta) {
        if (gameActive) {
            background.tilePositionX += 3; // Adjust speed as needed
            // Increase score every second
            scoreTimer += delta;
            if (scoreTimer >= 1000) { // 1000 ms = 1 second
                score += 1;
                scoreText.setText('Score: ' + score);
                scoreTimer = 0; // Reset timer
            }
        }

        if (!player.body.touching.down) {
            player.angle += 1.4; // Adjust the rotation speed as needed
        } else {
            player.angle = 0; // Reset angle when touching the ground
        }
        player.setVelocityX(0)
        if (cursors.left.isDown) {
            player.setVelocityX(-320);
        } else if (cursors.right.isDown) {
            player.setVelocityX(320);
        } 
        if (cursors.up.isDown && player.body.touching.down && Math.abs(player.body.velocity.y) < 5) {
            player.setVelocityY(-500); // Set jump velocity
        } 
    }
    hitobstacle_jump(player, obstacle_jump) {
        this.physics.pause();
        player.setTint(0xff0000);
        scoreText.setText('Game Over! Score: ' + score);
        gameActive = false;
    }
}