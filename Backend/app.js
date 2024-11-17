import express from "express";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Routes
app.get("/", (req, res) => {
  res.status(200).send({ message: "Welcome to the Backend API" });
});

// Example User Route
app.post("/api/users", (req, res) => {
  const { username, password } = req.body;
  res.status(200).send({ message: `User ${username} created successfully!` });
});

// Export the app for server.js
export default app;
