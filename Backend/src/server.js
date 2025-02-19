import "dotenv/config"; // Load environment variables
import "./config/db.js"; // Connect to MongoDB
import app from "./app.js"; // Import the Express app

const PORT = process.env.PORT || 3222;

// Start the server
const server = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
    console.error(err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥 Shutting down...");
    console.error(err);
    server.close(() => {
        process.exit(1);
    });
});
