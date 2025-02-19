import express from "express";
import Score from "../models/scoreModel.js";

const router = express.Router();

// Get the leaderboard sorted by high score (descending)
router.get("/leaderboard", async (req, res) => {
    try {
        const leaderboard = await Score.find().sort({ highscore: -1 }).limit(10); // Top 10 scores
        res.status(200).json(leaderboard);
    } catch (error) {
        res.status(500).json({ error: "Failed to retrieve leaderboard", details: error.message });
    }
});

// Submit or update a high score
router.post("/submit", async (req, res) => {
    try {
        const { username, highscore } = req.body;

        // Check if the user already exists in the database
        let scoreEntry = await Score.findOne({ username });
        if (scoreEntry) {
            // Update the high score only if the new score is higher
            if (highscore > scoreEntry.highscore) {
                scoreEntry.highscore = highscore;
                await scoreEntry.save();
            }
        } else {
            // Create a new entry if the user doesn't exist
            scoreEntry = new Score({ username, highscore });
            await scoreEntry.save();
        }

        res.status(200).json({ message: "High score submitted successfully", score: scoreEntry });
    } catch (error) {
        res.status(500).json({ error: "Failed to submit high score", details: error.message });
    }
});

// Export the router
export default router;
