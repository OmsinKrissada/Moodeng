class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.loadEffect();
        this.loadOwlet();
        this.loadImage();
        this.loadEagle();
        this.loadSky();
        this.load.image('hoppybara', 'src/assets/Capybara_29.png');
        this.load.image('obstacle_jump', 'src/assets/obtra.png');
        this.load.image('ghost', 'src/assets/Icon_Ghost.png');
        this.load.image('ground', 'src/assets/ground.png');
        this.load.image('restartIcon', 'src/assets/Icon_Return.png');
        this.load.image('heart', 'src/assets/Icon_Heart.png');
        this.load.image('fruit', 'src/assets/Icon_Food.png');

        this.load.audio('buttonClick1', 'src/assets/sounds/Coffee1.mp3');
    }

    create() {
        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.score = 0;
        this.scoreTimer = 0;
        this.gameActive = true;
        this.lives = 5;
        this.hearts = [];
        this.canShoot = true;
        this.shootDelay = 500;   

        this.setupBackground('sky', 'clouds', 'foreground', 'distantLand');
        this.setupSky('sky1', 'sky2', 'sky3', 'sky4');
        this.setupAnimation();

        // Cursor input for jumping
        this.cursors = this.input.keyboard.createCursorKeys();
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.setupPlatforms(700, 800);

        // Player (Capybara character)
        this.player = this.physics.add.sprite(100, 500, 'hoppybara');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.setScale(0.1);
        this.player.setDrag(100, 0);
        this.player.body.gravity.y = 800;

        this.jumpCount = 0; 
        this.maxJumps = 1;


        // Obstacle group
        this.fruits = this.physics.add.group();
        this.fallingHearts = this.physics.add.group();
        this.monsters = this.physics.add.group();
        this.bounceObjects = this.physics.add.group();

        // Timer to spawn obstacles
        let ghosttime = 4000;
        let hearttime = 5000;
        let owlettime = 6000;
        let eagletime = Phaser.Math.Between(4000, 5000);
        this.time.addEvent({ delay: ghosttime, callback: this.spawnObstacle, callbackScope: this, loop: true });
        this.time.addEvent({ delay: hearttime, callback: this.spawnHeart(this.scale.width - 50, 50), callbackScope: this, loop: true });
        this.time.addEvent({ delay: owlettime, callback: this.spawnOwlet, callbackScope: this, loop: true });
        this.time.addEvent({ delay: eagletime, callback: this.spawnEagle, callbackScope: this, loop: true });

        // Obstacle jump
        this.obstacle_jump = this.physics.add.sprite(400, 100, 'obstacle_jump');
        this.obstacle_jump.setBounce(1);
        this.obstacle_jump.setCollideWorldBounds(true);
        this.obstacle_jump.setVelocity(Phaser.Math.Between(-200, 200), 20);

        // Player-platform collision
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.fallingHearts, this.platforms);
        this.physics.add.collider(this.monsters, this.platforms);
        this.physics.add.collider(this.bounceObjects, this.platforms);


        this.physics.add.overlap(this.fruits, this.monsters, this.hitMonsterWithFruit, null, this);

        this.physics.add.overlap(this.player, this.monsters, this.hitMonster, null, this);
        this.physics.add.overlap(this.player, this.fallingHearts, this.collectHeart, null, this);
        this.physics.add.overlap(this.player, this.obstacle_jump, this.hitMonster, null, this);

        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '32px', fill: '#FFFFFF' });

        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(this.scale.width - 30 - i * 40, 30, 'heart').setScale(0.15);
            this.hearts.push(heart);
        }

    }

    update(time, delta) {
        if (this.gameActive) {

            this.sky.tilePositionX += 0.2;         // Move very slowly
            this.clouds.tilePositionX += 0.4;      // Move slowly
            this.distantLand.tilePositionX += 0.6; // Move at medium speed
            this.foreground.tilePositionX += 0.6;

            if (Phaser.Input.Keyboard.JustDown(this.shootKey) && this.canShoot) {
                this.shootFruit();
                this.canShoot = false; // Disable shooting
                this.time.delayedCall(this.shootDelay, () => {
                    this.canShoot = true; // Re-enable shooting after delay
                });
            }

            // Increase score every second
            this.scoreTimer += delta;
            if (this.scoreTimer >= 1000) { // 1000 ms = 1 second
                this.score += 1;
                this.scoreText.setText('Score: ' + this.score);
                this.scoreTimer = 0;
            }
        }

        // Spin player while jumping
        if (!this.player.body.touching.down) {
            this.player.angle += 1.4;
        } else {
            this.player.angle = 0;
        }

        if (this.player.body.touching.down) {
            this.jumpCount = 0;
        }

        // Stop horizontal movement if no keys are pressed
        this.player.setVelocityX(0);

        // Player movement controls
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-320);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(320);
        }

        if (this.cursors.down.isDown) {
            if (!this.isCrawling) {
                this.player.body.setSize(this.player.width, this.player.height * 0.5); // Halve the height for crawling
                this.player.body.setOffset(0, this.player.height * 0.5); // Adjust offset to keep the player on the ground
                this.isCrawling = true;
            }
        } else if (this.isCrawling) {
            this.player.body.setSize(this.player.width, this.player.height); // Reset to original height
            this.player.body.setOffset(0, 0); // Reset offset
            this.isCrawling = false;
        }

        // Jumping control
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-700); // Jump
            this.jumpCount++;
        }
    }

    shootFruit() {
        const fruit = this.fruits.create(this.player.x + 20, this.player.y, 'fruit');
        fruit.setScale(0.15); // Adjust the size if needed
        fruit.setVelocityX(400); // Speed of the fruit projectile
        fruit.body.allowGravity = false; // Disable gravity so it travels in a straight line
        fruit.checkWorldBounds = true;
        fruit.outOfBoundsKill = true; // Destroy fruit when it goes out of bounds
        fruit.setAngularVelocity(300);
    }
    
    hitMonsterWithFruit(fruit, monster) {
        fruit.destroy();
        monster.hp -= 1;
        if (monster.hp <= 0) {
            if (monster.texture.key === 'Owlet') {
                if (monster.throwTimer) {
                    monster.throwTimer.remove(false);
                }
                monster.play('owletdead'); // Optional: play an explosion or death animation
            
    
                monster.on('animationcomplete-owletdead', () => {
                    this.spawnHeart(monster.x, monster.y);
                    monster.destroy();
                });

            } else {
                this.explosionEffect(monster.x, monster.y);
                monster.destroy();
            }
            this.score += 10;
                this.scoreText.setText('Score: ' + this.score);
        }
    }

    spawnOwlet() {
        if (!this.gameActive) return;
    
        const owlet = this.monsters.create(this.scale.width, 700, 'Owlet').setScale(4).setVelocityX(-100).play('runLeft').setFlipX(true);
        owlet.hp = 3;
    
        // Set a timed event for the Owlet to throw rocks at intervals
        owlet.throwTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000), // Throw every 3-5 seconds
            callback: () => {
                if (this.gameActive && owlet.active && owlet.hp > 0) {
                    owlet.play('owletThrow'); // Play throw animation
                    this.throwRock(owlet, 500); // Spawn a rock
    
                    // When the throw animation completes, ensure it resumes running
                    owlet.on('animationcomplete-owletThrow', () => {
                        if (owlet.hp > 0) { // Check if it's still alive
                            owlet.play('runLeft'); // Resume running animation
                            owlet.setVisible(true); // Ensure it's visible
                            //owlet.setActive(true); // Ensure it's active in the game
                        }
                    });
                }
            },
            callbackScope: this,
            loop: true
        });
    }

    spawnHeart(x, y) {
        if (!this.gameActive) return;
        const xPosition = x;
        const yPosition = y; 

        const heart = this.fallingHearts.create(xPosition, yPosition, 'heart');

        heart.setBounce(0.6);
        heart.setScale(0.15);
        heart.setVelocityY(200);
        heart.setVelocityX(-200);
    }

    spawnObstacle() {
        if (!this.gameActive) return;
        const obstacleTypes = [
            { key: 'ghost', hp: 2 }
        ];
        const obstacleData = Phaser.Utils.Array.GetRandom(obstacleTypes);

        // Create the obstacle off-screen to the right
        const obstacle = this.monsters.create(this.scale.width, 550, obstacleData.key);
        obstacle.setScale(0.3); // Adjust scale as needed
        obstacle.setVelocityX(-200); // Move the obstacle leftward
        obstacle.body.allowGravity = true; // Prevent it from falling
        obstacle.hp = obstacleData.hp;

        // Adjust the hitbox size and offset
        const originalWidth = obstacle.width;
        const originalHeight = obstacle.height;
        const scaledWidth = originalWidth // scale by the same factor
        const scaledHeight = originalHeight;

        obstacle.body.setSize(scaledWidth, scaledHeight); // Set new hitbox size based on scale

        obstacle.body.setOffset(
            (originalWidth - scaledWidth) / 2.3, // Center the hitbox horizontally
            (originalHeight - scaledHeight) / 2.3 // Center the hitbox vertically
        );

        // Remove obstacle when it goes off-screen
        obstacle.checkWorldBounds = true;
        obstacle.outOfBoundsKill = true;
    }

    spawnEagle() {
        if (!this.gameActive) return;
        // Create the eagle at the right side of the screen, with a random vertical position
        const eagle = this.monsters.create(this.scale.width, Phaser.Math.Between(100, 300), 'Eagle');
    
        eagle.setScale(1.8); // Adjust scale if needed
        eagle.hp = 3; // Set HP for the eagle
        eagle.setVelocityX(-100); // Move eagle to the left
        eagle.play('EagleFly'); // Play flying animation
        eagle.body.setAllowGravity(false);
    
        // Set up bounds so eagle is removed when it leaves the screen
        eagle.setCollideWorldBounds(false);
        eagle.checkWorldBounds = true;
        eagle.outOfBoundsKill = true; // Automatically destroy the eagle when it goes out of bounds
    
        // Timer to drop rocks at intervals while the eagle is on screen
        eagle.dropTimer = this.time.addEvent({
            delay: Phaser.Math.Between(4000, 10000), // Drop rocks every 2-4 seconds
            callback: () => {
                if (eagle.active) {
                    this.throwRock(eagle, 250);
                }
            },
            loop: true
        });
    
        // Cleanup: Remove the timer when the eagle is destroyed
        eagle.on('destroy', () => {
            if (eagle.dropTimer) {
                eagle.dropTimer.remove(false);
            }
        });
    }
    

    collectHeart(player, heart) {
        heart.destroy(); // Remove the heart from the game
        
        // Increase lives and update heart display
        if (this.lives < 5) { // Limit lives to a maximum of 5
            this.hearts[this.lives].setVisible(true);
            this.lives += 1;
        }
    }

    hitMonster(player, monster) {
        if (this.lives > 0) {
            this.lives -= 1;
            this.hearts[this.lives].setVisible(false); // Hide one heart
            monster.destroy(); // Remove the obstacle after collision
            if (this.lives === 0) {
                this.gameOver(); // Trigger game over if lives reach 0
            }
        }
    }

    throwRock(owlet, speed) {
        const rock = this.bounceObjects.create(owlet.x, owlet.y, 'rock');
        rock.setScale(3);
        rock.setVelocityX(-speed);
        rock.setVelocityY(-100);
        rock.setBounce(1);
        rock.body.allowGravity = true;
    
        // Destroy the rock when it goes out of bounds
        rock.checkWorldBounds = true;
        rock.outOfBoundsKill = true;
    
        // Add collision with the player
        this.physics.add.overlap(this.player, rock, this.hitMonster, null, this);
    }

    gameOver() {
        this.gameActive = false;
        if (this.sound.get('backgroundMusic')) {
            this.sound.get('backgroundMusic').stop();
        }
        this.player.setTint(0xff0000);
        this.gameOverText = this.add.text(this.scale.width / 2, this.scale.height / 3, 'Game Over', {
            fontFamily: 'Arial',
            fontSize: '64px',
            color: '#f4e1d2',
            align: 'center'
        })
        .setOrigin(0.5)
        .setStroke('#5b3b2e', 10) // Dark brown outline
        .setPadding(10, 10, 10, 10) // Padding around text
        .setShadow(3, 3, '#3e2821', 0, true, true);// Shadow for 3D effect

        this.restartButton = this.add.image(this.scale.width / 2, this.scale.height / 1.5, 'restartIcon')
            .setOrigin(0.5)
            .setScale(0.5) // Scale to fit the design
            .setInteractive();// Initially hidden

        this.restartButton.on('pointerover', () => this.restartButton.setScale(0.55)); // Scale up on hover
        this.restartButton.on('pointerout', () => this.restartButton.setScale(0.5)); // Scale back down on hover out
        this.restartButton.on('pointerdown', () => this.restartButton.setScale(0.45)); // Scale slightly down on click
        this.restartButton.on('pointerup', () => {
            this.sound.play('buttonClick1');
            this.sound.get('backgroundMusic').play();
            this.scene.restart(); // Restart the scene
        });

        this.physics.pause();
        this.player.setTint(0xff0000);
        this.scoreText.setText('Game Over! Score: ' + this.score);
        
    }

    scaleBackgrounds() {
        // Scale each tileSprite based on the game width and height
        const width = this.scale.width;
        const height = this.scale.height;

        this.sky.setScale(1.5*width / this.sky.width, 2.82*height / this.sky.height);
        this.clouds.setScale(1.5*width / this.clouds.width, 2.82*height / this.clouds.height);
        this.distantLand.setScale(1.5*width / this.distantLand.width, 2.82*height / this.distantLand.height);
        this.foreground.setScale(1.5*width / this.foreground.width, 2.82*height / this.foreground.height);
    }

    resize(gameSize, baseSize, displaySize, resolution) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.sky.setSize(width, height);
        this.clouds.setSize(width, height);
        this.distantLand.setSize(2*width, 10*height);
        this.midLand.setSize(width, height);
        this.foreground.setSize(width, height);
    }

    toggleFullscreen() {
        if (!this.scale.isFullscreen) {
            this.scale.startFullscreen();
        } else {
            this.scale.stopFullscreen();
        }
    }

    loadImage() {
        this.load.image('rock', 'src/assets/Rock.png');
    }

    loadBackground() {
        this.load.image('sky', 'src/assets/summer/1.png');
        this.load.image('clouds', 'src/assets/summer/4.png');
        this.load.image('distantLand', 'src/assets/summer/3.png');    
        this.load.image('foreground', 'src/assets/summer/2.png');
    }

    setupSky(s1, s2, s3, s4) {
        this.sky1 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s1).setOrigin(0).setScrollFactor(0);
        this.sky2 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s2).setOrigin(0).setScrollFactor(0);
        this.sky3 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s3).setOrigin(0).setScrollFactor(0);
        this.sky4 = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s4).setOrigin(0).setScrollFactor(0);

        this.sky1.setAlpha(0);  
        this.sky2.setAlpha(0);
        this.sky3.setAlpha(0);
        this.sky4.setAlpha(0);

        this.scale.on('resize', this.resize, this);
        this.scaleBackgrounds();
    }

    loadSky() {
        this.load.image('sky1', 'src/assets/Cloud/Sky2/1.png');
        this.load.image('sky2', 'src/assets/Cloud/Sky2/4.png');
        this.load.image('sky3', 'src/assets/Cloud/Sky2/3.png');    
        this.load.image('sky4', 'src/assets/Cloud/Sky2/2.png');
    }


    loadEffect() {
        this.load.spritesheet('explosion', 'src/assets/sprite/explosion.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    loadEagle() {
        this.load.spritesheet('Eagle', 'src/assets/sprite/eagle.png', {
            frameWidth: 40,   // Width of each frame
            frameHeight: 41   // Height of each frame
        });
    }

    loadOwlet() {
        this.load.spritesheet('Owlet', 'src/assets/Monster/Owlet/Owlet_Monster_Run_6.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
        this.load.spritesheet('Owlet_dead', 'src/assets/Monster/Owlet/Owlet_Monster_Death_8.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
        this.load.spritesheet('Owlet_Throw', 'src/assets/Monster/Owlet/Owlet_Monster_Throw_4.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
    }

    setupBackground(s1, s2, s3, s4) {
        this.sky = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s1).setOrigin(0).setScrollFactor(0);
        this.clouds = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s2).setOrigin(0).setScrollFactor(0);
        this.foreground = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s3).setOrigin(0).setScrollFactor(0);
        this.distantLand = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s4).setOrigin(0).setScrollFactor(0);

        this.scale.on('resize', this.resize, this);
        this.scaleBackgrounds();
    }

    setupAnimation() {
        this.anims.create({
            key: 'EagleFly',
            frames: this.anims.generateFrameNumbers('Eagle', { start: 0, end: 4}), // Adjust if you have more or fewer frames
            frameRate: 10,   // Adjust speed as needed
            repeat: -1       // Loop the animation
        });
        this.anims.create({
            key: 'runLeft',
            frames: this.anims.generateFrameNumbers('Owlet', { start: 0, end: 5 }), // Adjust if you have more or fewer frames
            frameRate: 10,   // Adjust speed as needed
            repeat: -1       // Loop the animation
        });

        this.anims.create({
            key: 'explode',
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 10 }), // Adjust based on the frame count
            frameRate: 20,  // Adjust speed as needed
            hideOnComplete: true  // Automatically hide the explosion after it finishes
        });

        this.anims.create({
            key: 'owletThrow',
            frames: this.anims.generateFrameNumbers('Owlet_Throw', { start: 0, end: 5 }), // Adjust based on frame count
            frameRate: 10,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'owletdead',
            frames: this.anims.generateFrameNumbers('Owlet_dead', { start: 0, end: 15 }), // Adjust based on the frame count
            frameRate: 20,  // Adjust speed as needed
            hideOnComplete: true  // Automatically hide the explosion after it finishes
        });
    }

    setupPlatforms(x, y) {
        this.platforms = this.physics.add.staticGroup();
        const invisibleGround = this.platforms.create(x, y, null); // No texture
        invisibleGround.displayWidth = this.scale.width + 500;
        invisibleGround.displayHeight = 32;
        invisibleGround.refreshBody();
        invisibleGround.setAlpha(0);

    }

    explosionEffect(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion').setScale(2);
        explosion.play('explode');
    }

}
