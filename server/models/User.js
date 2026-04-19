const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },

    email: {
      type: String, required: true, unique: true,
      lowercase: true, trim: true,
    },

    password: { type: String, required: true },

    role: {
      type: String,
      enum: ["Need Help", "Can Help", "Both"],
      default: "Both",
    },

    // ── Profile fields (profileRoutes pe use ho rahe hain) ──
    city:       { type: String, default: "" },
    skills:     { type: [String], default: [] },
    interests:  { type: [String], default: [] },
    badges:     { type: [String], default: ["Design Ally", "Fast Responder", "Top Mentor"] },
    trustScore: { type: Number,  default: 92 },
    contributions: { type: Number, default: 31 },

    // ── Email verification ───────────────────────────────────
    isVerified:        { type: Boolean, default: false },
    verifyToken:       { type: String,  default: null  },
    verifyTokenExpiry: { type: Date,    default: null  },
  },
  { timestamps: true, collection: "user" }
);

module.exports = mongoose.model("User", userSchema);