const express = require("express");
const router  = express.Router();
const jwt     = require("jsonwebtoken");
const User    = require("../models/User");

// ─── Auth Middleware ──────────────────────────────────────────
function protect(req, res, next) {
  try {
    const header = req.headers["authorization"] || "";
    const token  = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Token not found. Please login." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: decoded.id };
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalid or expired." });
  }
}

router.get("/", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "name email role city skills interests badges trustScore contributions"
    );

    if (!user) return res.status(404).json({ message: "User not found." });

    res.json(user);
  } catch (err) {
    console.error("GET /api/profile:", err);
    res.status(500).json({ message: "Server error." });
  }
});

router.put("/", protect, async (req, res) => {
  try {
    const { name, city, skills, interests } = req.body;

    const update = {};

    if (name !== undefined)
      update.name = String(name).trim();

    if (city !== undefined)
      update.city = String(city).trim();

    if (skills !== undefined)
      update.skills = Array.isArray(skills)
        ? skills.map(s => String(s).trim()).filter(Boolean)
        : String(skills).split(",").map(s => s.trim()).filter(Boolean);

    if (interests !== undefined)
      update.interests = Array.isArray(interests)
        ? interests.map(i => String(i).trim()).filter(Boolean)
        : String(interests).split(",").map(i => i.trim()).filter(Boolean);

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select("name email role city skills interests badges trustScore contributions");

    if (!updated) return res.status(404).json({ message: "User not found." });

    res.json(updated);
  } catch (err) {
    console.error("PUT /api/profile:", err);
    res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;