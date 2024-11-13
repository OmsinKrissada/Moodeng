class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        // Load background and button images
        this.loadBackground();
        this.load.image('startButton', 'src/assets/Icon_Play.png'); // Start button image
        this.load.audio('buttonClick2', 'src/assets/sounds/Coffee2.mp3');

        this.load.audio('backgroundMusic', 'src/assets/Music/Blackjack.mp3');
    }

    create() {
        this.setupBackground('sky', 'clouds', 'foreground', 'distantLand');

        // Add outstanding title text
        const titleText = this.add.text(this.scale.width / 2, this.scale.height / 2.5, 'Moodeng Chase', {
            fontSize: '64px',
            fontFamily: 'Arial',
            fontStyle: 'bold',
            fill: '#FFD700',
        }).setOrigin(0.5);

        titleText.setShadow(5, 5, '#000000', 10, true, true);
        titleText.setStroke('#FFFFFF', 8);
        titleText.setTint(0xffa500, 0xffff00, 0xffd700, 0xffc400);

        // Add instructions text
        this.add.text(this.scale.width / 2, this.scale.height / 2, 'Press Start to Begin', {
            fontSize: '24px',
            fill: '#000'
        }).setOrigin(0.5);

        // Add the start button as an image and make it interactive
        const startButton = this.add.image(this.scale.width / 2, this.scale.height / 1.5, 'startButton')
            .setInteractive()
            .setScale(0.5); // Adjust scale as needed

        // Add click event to start the game
        startButton.on('pointerdown', () => {
            this.sound.play('buttonClick2');
            this.scene.start('GameScene');
        });

        // Optional: Add hover effect
        startButton.on('pointerover', () => {
            startButton.setScale(0.55); // Scale up slightly on hover
        });
        startButton.on('pointerout', () => {
            startButton.setScale(0.5); // Scale back down on hover out
        });

        if (!this.sound.get('backgroundMusic')) {
            this.backgroundMusic = this.sound.add('backgroundMusic', { volume: 0.5, loop: true });
            this.backgroundMusic.play();
        }
    }

    update() {
        this.sky.tilePositionX += 0.2;         // Move very slowly
        this.clouds.tilePositionX += 0.4;      // Move slowly
        this.distantLand.tilePositionX += 0.6; // Move at medium speed
        this.foreground.tilePositionX += 0.6;
    }

    setupBackground(s1, s2, s3, s4) {
        this.sky = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s1).setOrigin(0).setScrollFactor(0);
        this.clouds = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s2).setOrigin(0).setScrollFactor(0);
        this.foreground = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s3).setOrigin(0).setScrollFactor(0);
        this.distantLand = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s4).setOrigin(0).setScrollFactor(0);

        this.scale.on('resize', this.resize, this);
        this.scaleBackgrounds();
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

    loadBackground() {
        this.load.image('sky', 'src/assets/summer/1.png');
        this.load.image('clouds', 'src/assets/summer/4.png');
        this.load.image('distantLand', 'src/assets/summer/3.png');    
        this.load.image('foreground', 'src/assets/summer/2.png');
    }
}
