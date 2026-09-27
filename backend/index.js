const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Local imports
const userRoutes = require("./routes/userRoutes");
const splitRoutes = require("./routes/splitRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const historyRoutes = require("./routes/historyRoutes");
const groupRoutes = require("./routes/groupRoutes");

const app = express();

// Middleware
app.use(express.json());

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
app.use(cors({
  origin: clientUrl,
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
}));

// MongoDB Connection
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB connected ✅");
    })
    .catch((err) => {
      console.error("MongoDB connection error:", err.message);
    });
} else {
  console.warn("⚠️  MONGO_URI is not set. Set MONGO_URI in .env to connect to MongoDB.");
}

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    dbState: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// Use Routes
app.use(userRoutes);
app.use("/", groupRoutes);  // For group creation
app.use(splitRoutes);
app.use(reviewRoutes);
app.use("/", historyRoutes);

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
