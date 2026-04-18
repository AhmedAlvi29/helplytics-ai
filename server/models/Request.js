const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      enum: ["Web Development", "Design", "Career", "AI/ML", "Mobile", "Other"],
      default: "Other",
    },
    urgency: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["Open", "Solved"],
      default: "Open",
    },
    author: {
      id:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String },
      city: { type: String, default: "Pakistan" },
    },
    helpersInterested: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);