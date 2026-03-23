// routes/confessionRoutes.js
// All API endpoints for confessions are defined here

const express = require("express");
const router = express.Router();
const Confession = require("../models/Confession");

// ─── Bad Word Filter ───────────────────────────────────────────────────────────
// Simple list of banned words (expand as needed)
const bannedWords = ["spam", "hate", "abuse", "racist", "slur"];

// Check if text contains any banned words
function containsBannedWords(text) {
  const lower = text.toLowerCase();
  return bannedWords.some((word) => lower.includes(word));
}

// ─── GET /api/confessions ──────────────────────────────────────────────────────
// Fetch all confessions, sorted by newest first
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    // Build a filter object
    let filter = {};
    if (category && category !== "All") {
      filter.category = category;
    }
    if (search) {
      // Case-insensitive search in the text field
      filter.text = { $regex: search, $options: "i" };
    }

    const confessions = await Confession.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: confessions });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── GET /api/confessions/top ──────────────────────────────────────────────────
// Fetch top 5 most-liked confessions
router.get("/top", async (req, res) => {
  try {
    const top = await Confession.find().sort({ likes: -1 }).limit(5);
    res.json({ success: true, data: top });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── POST /api/confessions ─────────────────────────────────────────────────────
// Create a new confession
router.post("/", async (req, res) => {
  try {
    const { text, category } = req.body;

    // Validate: text must not be empty
    if (!text || text.trim() === "") {
      return res.status(400).json({ success: false, message: "Confession text cannot be empty" });
    }

    // Validate: check for banned words
    if (containsBannedWords(text)) {
      return res.status(400).json({ success: false, message: "Your confession contains inappropriate language" });
    }

    // Create and save the confession
    const confession = new Confession({ text: text.trim(), category: category || "Other" });
    await confession.save();

    res.status(201).json({ success: true, data: confession, message: "Confession posted!" });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === "ValidationError") {
      return res.status(400).json({ success: false, message: error.message });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── PUT /api/confessions/:id/like ────────────────────────────────────────────
// Increment likes for a confession
router.put("/:id/like", async (req, res) => {
  try {
    const confession = await Confession.findByIdAndUpdate(
      req.params.id,
      { $inc: { likes: 1 } }, // Increment likes by 1
      { new: true } // Return the updated document
    );

    if (!confession) {
      return res.status(404).json({ success: false, message: "Confession not found" });
    }

    res.json({ success: true, data: confession });
  } catch (error) {
    // Handle invalid MongoDB IDs
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid confession ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// ─── DELETE /api/confessions/:id ──────────────────────────────────────────────
// Delete a confession (optional feature)
router.delete("/:id", async (req, res) => {
  try {
    const confession = await Confession.findByIdAndDelete(req.params.id);

    if (!confession) {
      return res.status(404).json({ success: false, message: "Confession not found" });
    }

    res.json({ success: true, message: "Confession deleted successfully" });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(400).json({ success: false, message: "Invalid confession ID" });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

module.exports = router;
