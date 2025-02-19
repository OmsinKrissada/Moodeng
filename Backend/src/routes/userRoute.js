import express from "express";
import bcrypt from "bcrypt";
import User from "../models/userModel.js";

const router = express.Router();

// Register a new user
router.post("/register", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if username already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists" });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save the new user
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully", user: newUser });
    } catch (err) {
        res.status(500).json({ error: "Error registering user", details: err.message });
    }
});

// Get all users
router.get("/", async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude passwords from the response
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: "Error retrieving users", details: err.message });
    }
});

router.get("/find/:username", async (req, res) => {
    try {
        const username = req.params.username;

        // Find the user by username
        const user = await User.findOne({ username }, { password: 0 }); // Exclude password from the response

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: "Error retrieving user", details: err.message });
    }
});

// Login user
router.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "Invalid username or password" });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        // If successful
        console.log(user + " have login");
        res.status(200).json({ message: "Login successful", user: { id: user._id, username: user.username } });
    } catch (err) {
        res.status(500).json({ error: "Error logging in", details: err.message });
    }
});

export default router;
