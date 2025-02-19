import express from "express";
import cors from "cors";

import userRoute from "./routes/userRoute.js";
import scoreRoute from "./routes/scoreRoute.js"; 

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Mount user routes
app.use("/users", userRoute);
app.use("/scores", scoreRoute);

export default app;
