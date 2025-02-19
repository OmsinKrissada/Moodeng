import { submitScore } from "../scripts/api.js";

export default class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }

    preload() {
        this.loadEffect();
        this.loadImage();
        this.loadFruits();
        this.loadMonsters();
        this.load.image('Moodeng', 'assets/Moodeng.png');
        this.load.image('obstacle_jump', 'assets/obtra.png');
        this.load.image('restartIcon', 'assets/Icon/Icon_Return.png');
        this.load.image('backButton', 'assets/Icon/Icon_Home.png');
        this.load.image('heart', 'assets/Icon/Icon_Heart.png');

        this.loadaudio();
    }

    create() {

        const BASE_WIDTH = 800;
        const BASE_HEIGHT = 600;
        this.scaleRatioX = this.scale.width / BASE_WIDTH
        this.scaleRatioY = this.scale.height / BASE_HEIGHT

        this.levelUpThresholds = [0,50,150,300,500,750,1000,1500];
        this.currentLevelIndex = 0;
        this.levelUpSound = this.sound.add('levelUp', { volume: 0.5 });

        this.input.keyboard.on('keydown-F', () => this.toggleFullscreen());

        this.scale.on('resize', this.resize, this);

        this.cameras.main.fadeIn(1000, 0, 0, 0);

        this.startTime = this.time.now;
        this.elapsedTime = 0;
        this.fruitDamage = 1;
        this.score = 0;
        this.scoreTimer = 0;
        this.gameActive = true;
        this.lives = 5;
        this.hearts = [];
        this.canShoot = true;
        this.shootDelay = 500;   

        this.setupBackground('sky', 'clouds', 'foreground', 'distantLand');
        const backButton = this.add.image(this.scale.width/2, 50, 'backButton') // Assuming 'backButton' is preloaded
        .setInteractive()
        .setScale(0.25)
        .on('pointerdown', () => {
            this.sound.play('buttonClick1'); // Optional sound on button click
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.scene.start('MainMenuScene');
        });
        backButton.setScrollFactor(0);
        this.setupAnimation();

        // Cursor input for jumping
        this.cursors = this.input.keyboard.createCursorKeys();
        this.shootKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.setupPlatforms();

        // Player (Capybara character)
        this.player = this.physics.add.sprite(100, 500, 'Moodeng').setFlipX(true);
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0);
        this.player.setScale(0.2*this.scaleRatioX, 0.25*this.scaleRatioY);
        this.player.setDrag(100, 0);
        this.player.body.gravity.y = 1000;

        this.jumpCount = 0; 
        this.maxJumps = 1;


        // Obstacle group
        this.fruits = this.physics.add.group();
        this.fallingHearts = this.physics.add.group();
        this.monsters = this.physics.add.group();
        this.bounceObjects = this.physics.add.group();

        // Timer to spawn obstacles
        this.spawntime = 2750;
        let hearttime = 20000;
        this.obstacleTimer = this.time.addEvent({ delay: this.spawntime, callback: this.spawnObstacle, callbackScope: this, loop: true });
        this.heartTimer = this.time.addEvent({
            delay: hearttime,
            callback: this.spawnHeart,
            args: [this.scale.width - 50, 50], // Pass arguments as an array
            callbackScope: this,
            loop: true
        });

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

        this.scoreText = this.add.text(16, 16, 'Score: 0', {
            fontSize: '32px',
            fill: '#FFFF00', // Yellow color
            fontFamily: 'Comic Sans MS, Arial, sans-serif', // Cartoon-like font family
            fontStyle: 'bold', // Bold font style
            stroke: '#000000', // Black outline
            strokeThickness: 4, // Thickness of the outline
        });
        

        for (let i = 0; i < this.lives; i++) {
            const heart = this.add.image(this.scale.width - 30 - i * 40, 30, 'heart').setScale(0.15);
            this.hearts.push(heart);
        }

    }

    update(time, delta) {
        this.elapsedTime = this.time.now - this.startTime;
        this.input.setDefaultCursor('url(assets/Mouse/Triangle_Mouse.png), pointer');
        if (this.gameActive) {

            if (this.currentLevelIndex < this.levelUpThresholds.length &&
                this.score >= this.levelUpThresholds[this.currentLevelIndex]) {
                this.levelUpSound.play();
                this.currentLevelIndex++;
            }

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

        // Jumping control
        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) && this.jumpCount < this.maxJumps) {
            this.player.setVelocityY(-600*this.scale.height/600); // Jump
            this.jumpCount++;
        }
    }

    updateSpawnInterval() {
        const maxInterval = 3000; // Default maximum spawn interval
        const minInterval = 1000;  // Minimum spawn interval
        const scalingFactor = 0.5; // Higher value slows the decrease rate
    
        this.spawntime = Math.max(
            maxInterval - this.score * scalingFactor,
            minInterval
        );
        console.log(this.spawntime);
    
        // Update the timer if the spawn interval has changed
        if (this.obstacleTimer.delay !== this.spawntime) {
            this.obstacleTimer.reset({
                delay: this.spawntime,
                callback: this.spawnObstacle,
                callbackScope: this,
                loop: true
            });
        }
    }
    
    getFruitType() {
        const fruitTypes = [
            { key: 'fruit', damage: 1, requiredScore: 0 },     // Default fruit
            { key: 'Apple_Green', damage: 2, requiredScore: 50 },   // Upgrade at 30 score
            { key: 'Blueberry', damage: 3, requiredScore: 150 },  // Upgrade at 60 score
            { key: 'Lemon', damage: 5, requiredScore: 300 }, // Upgrade at 100 score
            { key: 'Pineapple', damage: 7, requiredScore: 500 },
            { key: 'Strawberry', damage: 10, requiredScore: 750 },
            { key: 'Tomato', damage: 15, requiredScore: 1000 },
            { key: 'Banana', damage: 30, requiredScore: 1500 },
            { key: 'Cabbage', damage: 40, requiredScore: 2000 },
            { key: 'Watermelon', damage: 60, requiredScore: 2500 }
               
        ];
    
        // Find the highest upgrade the player qualifies for
        return fruitTypes
            .filter((fruit) => this.score >= fruit.requiredScore)
            .pop();
    }

    shootFruit() {
        this.sound.play('bubble', {volume : 0.5});
        const fruit = this.fruits.create(this.player.x + 20, this.player.y, this.getFruitType().key);
        this.fruitDamage = this.getFruitType().damage;
        if (this.getFruitType().key == 'fruit') fruit.setScale(0.15);
        else if (this.getFruitType().key == 'Apple_Green')  fruit.setScale(2);
        else if (this.getFruitType().key == 'Blueberry')  fruit.setScale(2.3);
        else if (this.getFruitType().key == 'Lemon')  fruit.setScale(2.5);
        else if (this.getFruitType().key == 'Pineapple')  fruit.setScale(2.7);
        else if (this.getFruitType().key == 'Strawberry')  fruit.setScale(2.9);
        else if (this.getFruitType().key == 'Tomato')  fruit.setScale(3.1);
        else if (this.getFruitType().key == 'Watermelon')  fruit.setScale(3.5);
        else if (this.getFruitType().key == 'Banana') fruit.setScale(3);
        else if (this.getFruitType().key == 'Cabbage') fruit.setScale(3.3);
        fruit.setVelocityX(400); // Speed of the fruit projectile
        fruit.body.allowGravity = false; // Disable gravity so it travels in a straight line
        fruit.checkWorldBounds = true;
        fruit.outOfBoundsKill = true; // Destroy fruit when it goes out of bounds
        fruit.setAngularVelocity(300);
    }
    
    hitMonsterWithFruit(fruit, monster) {
        this.sound.play('hitsound');
        fruit.destroy();
        monster.hp -= this.fruitDamage;
        if (monster.hp <= 0) {
            this.sound.play('bump', {volume : 1});
            if (monster.texture.key === 'Owlet') {
                this.score += 20;
                if (monster.throwTimer) {
                    monster.throwTimer.remove(false);
                }
                monster.play('owletdead'); // Optional: play an explosion or death animation
            
    
                monster.on('animationcomplete-owletdead', () => {
                    this.spawnHeart(monster.x, monster.y);
                    monster.destroy();
                });

            } else {
                if (monster.texture.key === 'Bluebird') {
                    this.score += 50;
                } else if (monster.texture.key === 'Rino') {
                    this.score += 30;
                } else if (monster.texture.key === 'Ghost') {
                    this.score += 10;
                } else if (monster.texture.key === 'Chicken') {
                    this.score += 40;
                } else if (monster.texture.key === 'Fatbird') {
                    this.score += 100;
                }
                this.explosionEffect(monster.x, monster.y);
                monster.destroy();
            } 
            this.scoreText.setText('Score: ' + this.score);
        }
    }

    getScaledHP(baseHP) {
        const maxScale = 300; // Maximum scaling multiplier
        const scalingFactor = 0.2; // HP increases by this factor per second
        const elapsedTimed = Math.floor(this.elapsedTime / 1000); // Get elapsed time in seconds
    
        const scaledHP = baseHP + Math.floor(elapsedTimed * scalingFactor);
    
        return Math.min(scaledHP, baseHP * maxScale); // Cap the HP to prevent it from scaling infinitely
    }
    

    spawnObstacle() {
            if (!this.gameActive) return;

            this.updateSpawnInterval();
        
            // Define obstacle types and their respective spawn methods
            const obstacleTypes = [
                { key: 'ghost', spawnMethod: this.spawnGhost.bind(this) },
                { key: 'owlet', spawnMethod: this.spawnOwlet.bind(this) },
                { key: 'bluebird', spawnMethod: this.spawnBlueBird.bind(this) },
                { key: 'rino', spawnMethod: this.spawnRino.bind(this)},
                { key: 'chicken', spawnMethod: this.spawnChicken.bind(this)},
                { key: 'fatbird', spawnMethod: this.spawnFatbird.bind(this)}
            ];
        
            // Randomly select an obstacle type
            const obstacleData = Phaser.Utils.Array.GetRandom(obstacleTypes);
        
            // Call the spawn method for the selected type
            let monster = obstacleData.spawnMethod();
            console.log(`Spawned monster with HP: ${monster.hp}`);
            return monster;
    }

    spawnFatbird() {
        if (!this.gameActive) return;
        const fatbird = this.monsters.create(
            this.scale.width,
            Phaser.Math.Between(50, 300), // Random Y position
            'Fatbird' // Sprite key for the Fatbird image
        );
        
        // Set its physics properties
        fatbird.play('FatbirdFly');
        fatbird.hp = this.getScaledHP(10);
        fatbird.setBounce(1); // Enable bouncing
        fatbird.setCollideWorldBounds(true); // Allow collision with world bounds
        fatbird.setVelocity(
            Phaser.Math.Between(-200, 200), // Random horizontal velocity
            Phaser.Math.Between(-200, 200)  // Random vertical velocity
        );
    
        // Optional: Scale the Fatbird sprite if needed
        fatbird.setScale(1.75*this.scaleRatioX, 1.75*this.scaleRatioY); // Adjust size to match the design
        
    
        // Add collision with other game elements
        this.physics.add.collider(fatbird, this.platforms); // Collide with platforms
        this.physics.add.collider(fatbird, this.monsters);  // Collide with other monsters

        return fatbird;
    }
    

    spawnChicken() {
        if (!this.gameActive) return;
        const chicken = this.monsters.create(this.scale.width, 0.75*this.scale.height, 'Chicken'); // Spawn at the right edge
        chicken.hp = this.getScaledHP(4);
        chicken.setScale(2*this.scaleRatioX, 2*this.scaleRatioY); // Adjust size
        chicken.setBounce(1); // Make it bounce on collision with the ground
        chicken.setCollideWorldBounds(true); // Prevent it from falling out of the world
        chicken.setVelocityX(-100); // Make it run to the left
        chicken.play('ChickenRun'); // Start the running animation
        chicken.body.setGravityY(100);
        // Add jumping behavior
        chicken.jumpCount = 0;
        const jumpInterval = Phaser.Math.Between(2000, 3000); // Random jump every 2-3 seconds
        this.time.addEvent({
            delay: jumpInterval,
            callback: () => {
                if (chicken.active && chicken.jumpCount < 1) { // Only jump if it's on the ground
                    chicken.setVelocityY(-400);
                    chicken.jumpCount++; // Apply an upward force for jumping
                }
            },
            callbackScope: this,
            loop: true,
        });

        this.physics.add.collider(chicken, this.platforms, () => {
            chicken.jumpCount = 0; // Reset jump count when the chicken touches the ground
        });
    
        // Destroy chicken when it goes out of bounds
        chicken.outOfBoundsKill = true;
        return chicken;
    }

    spawnOwlet() {
        if (!this.gameActive) return;
        const owlet = this.monsters.create(this.scale.width, 0.72*this.scale.height, 'Owlet').setScale(3*this.scaleRatioX, 3*this.scaleRatioY).setVelocityX(-100).play('runLeft').setFlipX(true);
        owlet.hp = this.getScaledHP(5);
        owlet.body.setOffset(owlet.width * 0.1, owlet.height * 0.1);
    
        // Set a timed event for the Owlet to throw rocks at intervals
        owlet.throwTimer = this.time.addEvent({
            delay: Phaser.Math.Between(3000, 5000), // Throw every 3-5 seconds
            callback: () => {
                if (this.gameActive && owlet.active && owlet.hp > 0) {
                    owlet.play('owletThrow'); // Play throw animation
                    this.throwRock(owlet, 500, 0); // Spawn a rock
    
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

        return owlet;
    }

    spawnHeart(x, y) {
        if (!this.gameActive) return;
        const xPosition = x;
        const yPosition = y; 

        const heart = this.fallingHearts.create(xPosition, yPosition, 'heart');

        heart.setBounce(0.6);
        heart.setScale(0.15*this.scaleRatioX, 0.15*this.scaleRatioY);
        heart.setVelocityY(200);
        heart.setVelocityX(-200);
    }

    

    spawnGhost() {
        if (!this.gameActive) return;
        const ghost = this.monsters.create(this.scale.width, 0.75*this.scale.height, 'ghost');
        ghost.setScale(0.25*this.scaleRatioX, 0.25*this.scaleRatioY);
        ghost.setVelocityX(-150);
        ghost.body.allowGravity = false;
        ghost.hp = this.getScaledHP(2);
    
        // Optional: Adjust hitbox or animations
        ghost.body.setSize(ghost.width * 0.8, ghost.height * 0.8);
        ghost.body.setOffset(ghost.width * 0.1, ghost.height * 0.1);
    
        ghost.checkWorldBounds = true;
        ghost.outOfBoundsKill = true;

        return ghost;
    }
    

    spawnRino() {
        if (!this.gameActive) return;
        // Create the Rino sprite
        const rino = this.monsters.create(this.scale.width, 0.75*this.scale.height, 'Rino');
        rino.setScale(3*this.scaleRatioX, 3*this.scaleRatioY); // Adjust the scale as needed
        rino.setVelocityX(-400); // Set a high speed for the Rino
        rino.body.allowGravity = true; // Prevent gravity effect (optional)
        rino.hp = this.getScaledHP(4); // Set high HP for Rino (can be adjusted)

        // Adjust hitbox for Rino
        rino.body.setSize(rino.width * 0.8, rino.height * 0.8);
        rino.body.setOffset(rino.width * 0.1, rino.height * 0.1);

        // Play any Rino-specific animations (if available)
        rino.play('RinoRun'); // Replace 'rinoRun' with your animation key

        // Remove Rino when it goes off-screen
        rino.checkWorldBounds = true;
        rino.outOfBoundsKill = true;

        // Optional: Add unique behaviors or effects for Rino
        this.time.addEvent({
            delay: 1000,
            callback: () => {
                if (rino.active) {
                    rino.setVelocityX(rino.body.velocity.x * 1.1); // Gradually increase speed
                }
            },
            repeat: 3 // Increases speed a few times
        });

        return rino; // Return Rino instance in case further customization is needed
    }

    spawnBlueBird() {
        if (!this.gameActive) return;
        // Create the bluebird at the right side of the screen, with a random vertical position
        const bluebird = this.monsters.create(this.scale.width, Phaser.Math.Between(0.2*this.scale.height, 0.3*this.scale.height), 'BlueBird');
        this.throwRock(bluebird, 250, 0);
    
        bluebird.setScale(1.8*this.scaleRatioX, 1.8*this.scaleRatioY); // Adjust scale if needed
        bluebird.hp = this.getScaledHP(3); // Set HP for the bluebird
        bluebird.setVelocityX(-100); // Move bluebird to the left
        bluebird.play('BlueBirdFlying'); // Play flying animation
        bluebird.body.setAllowGravity(false);
    
        // Set up bounds so bluebird is removed when it leaves the screen
        bluebird.setCollideWorldBounds(false);
        bluebird.checkWorldBounds = true;
        bluebird.outOfBoundsKill = true; // Automatically destroy the bluebird when it goes out of bounds
    
        // Timer to drop rocks at intervals while the bluebird is on screen
        bluebird.dropTimer = this.time.addEvent({
            delay: Phaser.Math.Between(4000, 10000), // Drop rocks every 2-4 seconds
            callback: () => {
                if (bluebird.active) {
                    this.throwRock(bluebird, 250, 0);
                }
            },
            loop: true
        });
    
        // Cleanup: Remove the timer when the bluebird is destroyed
        bluebird.on('destroy', () => {
            if (bluebird.dropTimer) {
                bluebird.dropTimer.remove(false);
            }
        });

        return bluebird;
    }
    

    collectHeart(player, heart) {
        heart.destroy(); // Remove the heart from the game
        
        // Increase lives and update heart display
        if (this.lives < 5) { // Limit lives to a maximum of 5
            this.hearts[this.lives].setVisible(true);
            this.lives += 1;
        }
    }

    hitMonster(player, monster, damage) {
        this.sound.play('hurt');
        if (this.lives > 0) {
            this.lives -= 1;
            this.hearts[this.lives].setVisible(false); // Hide one heart
            monster.destroy(); // Remove the obstacle after collision
            if (this.lives === 0) {
                this.gameOver(); // Trigger game over if lives reach 0
            }
        }
    }

    throwRock(owlet, speedX, speedY) {
        const rock = this.bounceObjects.create(owlet.x, owlet.y, 'rock');
        rock.setScale(3);
        rock.setVelocityX(-speedX);
        rock.setVelocityY(-speedY);
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

        // Update score in database
        const username = localStorage.getItem("username"); // Assume username is stored locally after login
        if (username) {
            console.log(this.score);
            submitScore(username, this.score)
                .then((response) => {
                    console.log("Score updated:", response);
                })
                .catch((error) => {
                    console.error("Failed to update score:", error.message);
                });
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
            this.startTime = this.time.now;
            this.scene.restart(); // Restart the scene
        });

        this.physics.pause();
        this.player.setTint(0xff0000);
        this.scoreText.setText('Game Over! Score: ' + this.score);
        
    }

    scaleBackgrounds() {
        this.sky.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.clouds.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.foreground.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.distantLand.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        
    }

    resize(gameSize, baseSize, displaySize, resolution) {
        const width = gameSize.width;
        const height = gameSize.height;

        this.sky.setSize(width, height);
        this.clouds.setSize(width, height);
        this.distantLand.setSize(2*width, 10*height);
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
        this.load.image('rock', 'assets/Rock.png');
    }

    loadEffect() {
        this.load.spritesheet('explosion', 'assets/sprite/explosion.png', {
            frameWidth: 64,
            frameHeight: 64
        });
    }

    loadFatbird() {
        this.load.spritesheet('Fatbird', 'assets/Monster/Fatbird/fatbird.png', {
            frameWidth: 40,
            frameHeight: 48
        });
    }

    loadChicken() {
        this.load.spritesheet('Chicken', 'assets/Monster/Chicken/chicken.png', {
            frameWidth: 32,
            frameHeight: 34
        });
    }

    loadRino() {
        this.load.spritesheet('Rino', 'assets/Monster/Rino/Run.png', {
            frameWidth: 52,   // Width of each frame
            frameHeight: 34   // Height of each frame
        });
    }

    loadBlueBird() {
        this.load.spritesheet('BlueBird', 'assets/Monster/Bluebird/Flying.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
    }

    loadOwlet() {
        this.load.spritesheet('Owlet', 'assets/Monster/Owlet/Owlet_Monster_Run_6.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
        this.load.spritesheet('Owlet_dead', 'assets/Monster/Owlet/Owlet_Monster_Death_8.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
        this.load.spritesheet('Owlet_Throw', 'assets/Monster/Owlet/Owlet_Monster_Throw_4.png', {
            frameWidth: 32,   // Width of each frame
            frameHeight: 32   // Height of each frame
        });
    }

    loadaudio() {
        this.load.audio('buttonClick1', 'assets/sounds/Coffee1.mp3');
        this.load.audio('hitsound', 'assets/sounds/Hit_damage.wav')
        this.load.audio('bubble', 'assets/sounds/Bubble.wav')
        this.load.audio('bump', 'assets/sounds/Bump.wav')
        this.load.audio('hurt', 'assets/sounds/Hurt.wav')
        this.load.audio('levelUp', 'assets/sounds/Powerup.wav');
    }

    loadMonsters() {
        this.loadBlueBird();
        this.loadChicken();
        this.loadFatbird();
        this.loadOwlet();
        this.loadRino();
        this.load.image('ghost', 'assets/Icon/Icon_Ghost.png');
    }

    loadFruits() {
        this.load.image('fruit', 'assets/Fruits/Icon_Food.png');
        this.load.image('Apple_Green', 'assets/Fruits/Apple_Green.png');
        this.load.image('Blueberry', 'assets/Fruits/Blueberry.png');
        this.load.image('Lemon', 'assets/Fruits/Lemon.png');
        this.load.image('Pineapple', 'assets/Fruits/Pineapple.png');
        this.load.image('Strawberry', 'assets/Fruits/Strawberry.png');
        this.load.image('Tomato', 'assets/Fruits/Tomato.png');
        this.load.image('Watermelon', 'assets/Fruits/Watermelon.png');
        this.load.image('Banana', 'assets/Fruits/Banana_Peeled.png');
        this.load.image('Cabbage', 'assets/Fruits/Cabbage.png');
    }

    setupBackground(s1, s2, s3, s4) {
        this.sky = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s1).setOrigin(0).setScrollFactor(0);
        this.clouds = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s2).setOrigin(0).setScrollFactor(0);
        this.foreground = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s3).setOrigin(0).setScrollFactor(0);
        this.distantLand = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s4).setOrigin(0).setScrollFactor(0);
        this.scaleBackgrounds();
    }

    setupAnimation() {

        this.anims.create({
            key: 'FatbirdFly',
            frames: this.anims.generateFrameNumbers('Fatbird', { start: 0, end: 7}), // Adjust if you have more or fewer frames
            frameRate: 30,   // Adjust speed as needed
            repeat: -1 
        })

        this.anims.create({
            key: 'ChickenRun',
            frames: this.anims.generateFrameNumbers('Chicken', { start: 0, end: 13}), // Adjust if you have more or fewer frames
            frameRate: 30,   // Adjust speed as needed
            repeat: -1 
        })

        this.anims.create({
            key: 'RinoRun',
            frames: this.anims.generateFrameNumbers('Rino', { start: 0, end: 5}), // Adjust if you have more or fewer frames
            frameRate: 30,   // Adjust speed as needed
            repeat: -1       // Loop the animation
        });

        this.anims.create({
            key: 'BlueBirdFlying',
            frames: this.anims.generateFrameNumbers('BlueBird', { start: 0, end: 8}), // Adjust if you have more or fewer frames
            frameRate: 30,   // Adjust speed as needed
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
            frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 9 }), // Adjust based on the frame count
            frameRate: 20,  // Adjust speed as needed
            hideOnComplete: true  // Automatically hide the explosion after it finishes
        });

        this.anims.create({
            key: 'owletThrow',
            frames: this.anims.generateFrameNumbers('Owlet_Throw', { start: 0, end: 3 }), // Adjust based on frame count
            frameRate: 10,
            hideOnComplete: true
        });

        this.anims.create({
            key: 'owletdead',
            frames: this.anims.generateFrameNumbers('Owlet_dead', { start: 0, end: 7 }), // Adjust based on the frame count
            frameRate: 20,  // Adjust speed as needed
            hideOnComplete: true  // Automatically hide the explosion after it finishes
        });
    }

    setupPlatforms() {
        
        this.platforms = this.physics.add.staticGroup();
        const invisibleGround = this.platforms.create(0, this.scale.height - 0.14*this.scale.height, null); // No texture
        
        invisibleGround.displayWidth = this.scale.width*10;
        invisibleGround.displayHeight = 32;
        invisibleGround.refreshBody();
        invisibleGround.setAlpha(0);

    }

    explosionEffect(x, y) {
        const explosion = this.add.sprite(x, y, 'explosion').setScale(2);
        explosion.play('explode');
    }

}
