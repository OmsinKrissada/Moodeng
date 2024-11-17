import "dotenv/config"; // Load environment variables
import "./config/db.js"; // Connect to the database
import app from "./app.js"; // Import the main Express app

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.error(err.name, err.message);
  console.error(err.stack);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥 Shutting down...");
  console.error(`${err}`);
  server.close(() => {
    process.exit(1);
  });
});

// Start the server
const PORT = process.env.PORT || 3222;
const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Backend Server ready at http://localhost:${PORT}`);
});
