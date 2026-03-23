// models/Confession.js
// This file defines the structure (schema) of our confession data in MongoDB

const mongoose = require("mongoose");

// Define what a "confession" looks like in our database
const confessionSchema = new mongoose.Schema({
  // The confession text - required field
  text: {
    type: String,
    required: [true, "Confession text is required"],
    trim: true, // Remove leading/trailing spaces
    maxlength: [300, "Confession cannot exceed 300 characters"],
  },

  // Category/tag for the confession
  category: {
    type: String,
    enum: ["Love", "Study", "Life", "Work", "Family", "Secret", "Other"],
    default: "Other",
  },

  // Number of likes, starts at 0
  likes: {
    type: Number,
    default: 0,
  },

  // Automatically set the creation date
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Export the model so we can use it in our routes
module.exports = mongoose.model("Confession", confessionSchema);
