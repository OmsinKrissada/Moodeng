import express from "express";

const app = express();

app.use(express.static("dist")); // Serve the 'dist' folder

const PORT = 3221;
app.listen(PORT, "0.0.0.0", () => {
    console.log(`Frontend Server running at http://localhost:${PORT}`);
});
