const express = require("express");
const router  = express.Router();
const Request = require("../models/Request");

// ── POST /api/requests — naya request banao ──────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description, tags, category, urgency, author } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title aur description zaruri hain." });
    }
    if (!author || !author.id || !author.name) {
      return res.status(401).json({ message: "Login karein pehle." });
    }

    // tags string se array banao  e.g. "JS, CSS" → ["JS","CSS"]
    const tagsArray = typeof tags === "string"
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : tags || [];

    const request = await Request.create({
      title,
      description,
      tags: tagsArray,
      category,
      urgency,
      author: {
        id:   author.id,
        name: author.name,
        city: author.city || "Pakistan",
      },
    });

    return res.status(201).json({ message: "Request publish ho gayi!", request });
  } catch (err) {
    console.error("Create request error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── GET /api/requests — tamam requests (newest first) ────────
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find()
      .sort({ createdAt: -1 })
      .limit(50);
    return res.json(requests);
  } catch (err) {
    console.error("Fetch requests error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;