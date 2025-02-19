import { registerUser, loginUser } from "../scripts/api.js";
import { fetchLeaderboard } from "../scripts/api.js";


export default class MainMenuScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainMenuScene' });
    }

    preload() {
        // Load background and button images
        this.loadBackground();
        this.load.image('startButton', 'assets/Icon/Icon_Play.png'); // Start button image
        this.load.audio('buttonClick2', 'assets/sounds/Coffee2.mp3');
        this.load.image('loginButton', 'assets/Icon/Icon_Mail.png');
        this.load.image("leaderboardButton", "assets/Icon/Icon_Award.png");
        this.load.image("IconMoodeng", "assets/Icon/Icon_Moodeng.png");

        this.load.audio('backgroundMusic', 'assets/Music/Blackjack.mp3');
    }


    create() {

        const BASE_WIDTH = 800;
        const BASE_HEIGHT = 600;
        this.scaleRatioX = this.scale.width / BASE_WIDTH
        this.scaleRatioY = this.scale.height / BASE_HEIGHT

        this.cameras.main.fadeIn(1000, 0, 0, 0);
        
        console.log(this.scale.width + " + " +  this.scale.height);
        this.input.keyboard.on('keydown-F', () => this.toggleFullscreen());

        this.setupBackground('sky', 'clouds', 'foreground', 'distantLand');
        this.setupButton();
        const title = this.add.image(this.scale.width/2, this.scale.height/2.75, 'IconMoodeng').setScale(0.25*this.scaleRatioX, 0.25*this.scaleRatioY);
        
        if (!this.sound.get('backgroundMusic')) {
            this.backgroundMusic = this.sound.add('backgroundMusic', { volume: 0.5, loop: true });
            this.backgroundMusic.play();
        }

    }

    update() {
        this.input.setDefaultCursor('url(assets/Mouse/Triangle_Mouse.png), pointer');

        this.sky.tilePositionX += 0.2;         // Move very slowly
        this.clouds.tilePositionX += 0.4;      // Move slowly
        this.distantLand.tilePositionX += 0.6; // Move at medium speed
        this.foreground.tilePositionX += 0.6;
    }

    async updateLeaderboard() {
        const leaderboardTableBody = document.querySelector("#leaderboard-table tbody");
        leaderboardTableBody.innerHTML = ""; // Clear previous leaderboard entries

        try {
            const leaderboard = await fetchLeaderboard();

            leaderboard.forEach((entry, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td>${entry.username}</td>
                    <td>${entry.highscore}</td>
                `;
                leaderboardTableBody.appendChild(row);
            });
        } catch (error) {
            console.error("Failed to fetch leaderboard:", error);
            alert("Failed to load leaderboard. Please try again later.");
        }
    }

    setupBackground(s1, s2, s3, s4) {
        this.sky = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s1).setOrigin(0).setScrollFactor(0);
        this.clouds = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s2).setOrigin(0).setScrollFactor(0);
        this.foreground = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s3).setOrigin(0).setScrollFactor(0);
        this.distantLand = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, s4).setOrigin(0).setScrollFactor(0);
        this.scaleBackgrounds();
    }

    scaleBackgrounds() {
        this.sky.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.clouds.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.foreground.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        this.distantLand.setScale(1.85*this.scaleRatioX, 1.85*this.scaleRatioY);
        
    }
    
    
    toggleFullscreen() {
        if (!this.scale.isFullscreen) {
            this.scale.startFullscreen();
        } else {
            this.scale.stopFullscreen();
        }
    }

    loadBackground() {
        this.load.image('sky', 'assets/summer/1.png');
        this.load.image('clouds', 'assets/summer/4.png');
        this.load.image('distantLand', 'assets/summer/3.png');    
        this.load.image('foreground', 'assets/summer/2.png');
    }

    setupButton() {
        // Add the start button as an image and make it interactive
        this.startButton = this.add.image(this.scale.width / 2, this.scale.height - 150*this.scaleRatioY, 'startButton')
            .setInteractive()
            .setScale(0.25*this.scaleRatioX, 0.25*this.scaleRatioY); // Adjust scale as needed

        // Add click event to start the game
        this.startButton.on('pointerdown', () => {
            this.sound.play('buttonClick2');
            this.scene.start('GameScene');

        });

        // Optional: Add hover effect
        this.startButton.on('pointerover', () => {
            this.startButton.setScale(0.30*this.scaleRatioX, 0.30*this.scaleRatioY); // Scale up slightly on hover
        });
        this.startButton.on('pointerout', () => {
            this.startButton.setScale(0.25*this.scaleRatioX, 0.25*this.scaleRatioY); // Scale back down on hover out
        });


        // Add Leaderboard Button
        const leaderboardButton = this.add
            .image(175, 50, "leaderboardButton")
            .setInteractive()
            .setScale(0.35)
            .on("pointerdown", async () => {
                this.input.enabled = false;
                document.getElementById("leaderboard-container").style.display = "flex";
                await this.updateLeaderboard();
            });

        // Close leaderboard modal
        document.getElementById("close-leaderboard").addEventListener("click", () => {
            this.input.enabled = true;
            document.getElementById("leaderboard-container").style.display = "none";
        });

        // Login Button
        const loginButton = this.add.image(75, 50, "loginButton").setScale(0.35)
        .setInteractive()
        .on("pointerdown", () => {
            this.input.enabled = false;
            document.getElementById("login-container").style.display = "flex";
        });

        // Add event listener for the login form
        document.getElementById("login-form").addEventListener("submit", async (event) => {
            event.preventDefault();
        
            const loginButton = event.target.querySelector(".primary-button"); // Target the login button
            loginButton.disabled = true; // Disable the button to prevent multiple clicks
            loginButton.textContent = "Logging in..."; // Optional: Change button text to indicate progress
        
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;
        
            try {
                // Attempt to login the user
                const response = await loginUser(username, password);
                alert(`Welcome, ${response.message}`);
                this.input.enabled = true;
                // Store username in local storage
                localStorage.setItem("username", username);
        
                // Hide the login container
                document.getElementById("login-container").style.display = "none";
            } catch (error) {
                alert("Login failed: " + error.message);
            } finally {
                // Re-enable the button regardless of success or failure
                loginButton.disabled = false;
                loginButton.textContent = "Login";
            }
        });
        

        // Close login modal

        //register
        document.getElementById("close-login").addEventListener("click", () => {
            this.input.enabled = true;
            document.getElementById("login-container").style.display = "none";
        });

        document.getElementById("show-register").addEventListener("click", () => {
            this.input.enabled = false;
            document.getElementById("login-container").style.display = "none";
            document.getElementById("register-container").style.display = "flex";
        });
        
        document.getElementById("close-register").addEventListener("click", () => {
            this.input.enabled = true;
            document.getElementById("register-container").style.display = "none";
        });

        document.getElementById('show-login').addEventListener('click', () => {
            document.getElementById('register-container').style.display = 'none';
            document.getElementById('login-container').style.display = 'flex';
        });

        document.getElementById("register-form").addEventListener("submit", async (e) => {
            e.preventDefault();
        
            const registerButton = e.target.querySelector(".primary-button"); // Target the register button
            registerButton.disabled = true; // Disable the button to prevent multiple clicks
            registerButton.textContent = "Registering..."; // Optional: Change button text to indicate progress
        
            const username = document.getElementById("register-username").value;
            const password = document.getElementById("register-password").value;
            const confirmPassword = document.getElementById("register-confirm-password").value;
        
            // Ensure passwords match
            if (password !== confirmPassword) {
                alert("Passwords do not match. Please try again.");
                registerButton.disabled = false; // Re-enable the button
                registerButton.textContent = "Register"; // Reset button text
                return;
            }
        
            try {
                // Send data to register the user
                const response = await registerUser(username, password);
                alert("Registration successful!");
                this.input.enabled = true;
                // Hide the register container and show the login container
                document.getElementById("register-container").style.display = "none";
                document.getElementById("login-container").style.display = "flex";
            } catch (error) {
                alert(`Registration failed: ${error.message}`);
            } finally {
                // Re-enable the button regardless of success or failure
                registerButton.disabled = false;
                registerButton.textContent = "Register";
            }
        });
    }
}


