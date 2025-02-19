import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true // Each username should have a single high score
    },
    highscore: {
        type: Number,
        required: true,
        default: 0
    }
});

// Export the model
const Score = mongoose.model("Score", scoreSchema);

export default Score;
