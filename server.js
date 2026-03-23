// backend/server.js
// Main server file - the entry point for our backend
require('dns').setDefaultResultOrder('ipv4first');
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// ─── App Setup ─────────────────────────────────────────────────────────────────
const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
// Allow cross-origin requests (frontend talking to backend)
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Serve frontend files statically
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── MongoDB Connection ────────────────────────────────────────────────────────
const MONGO_URI = "mongodb://abinjohn055_db_user:vi69deha0fZccbzA@ac-wndzcyx-shard-00-00.hltshkq.mongodb.net:27017,ac-wndzcyx-shard-00-01.hltshkq.mongodb.net:27017,ac-wndzcyx-shard-00-02.hltshkq.mongodb.net:27017/confessionsDB?ssl=true&replicaSet=atlas-v70cri-shard-0&authSource=admin&appName=Cluster0";

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB successfully!"))
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ─── Routes ────────────────────────────────────────────────────────────────────
const confessionRoutes = require("./routes/confessionRoutes");

// All confession-related routes are prefixed with /api/confessions
app.use("/api/confessions", confessionRoutes);

// Serve index.html for the root URL
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});

// ─── Start Server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📖 Open your browser and go to http://localhost:${PORT}`);
});
