const express = require("express");
const router  = express.Router();
const Request = require("../models/Request");

router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).limit(50);
    return res.json(requests);
  } catch (err) {
    console.error("Fetch requests error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, description, tags, category, urgency, author } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required." });
    if (!author?.id || !author?.name)
      return res.status(401).json({ message: "Login first." });

    const tagsArray = typeof tags === "string"
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : tags || [];

    const request = await Request.create({
      title, description, tags: tagsArray,
      category, urgency,
      author: { id: author.id, name: author.name, city: author.city || "Pakistan" },
    });

    return res.status(201).json({ message: "Request published!", request });
  } catch (err) {
    console.error("Create request error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.post("/:id/help", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.status === "Solved")
      return res.status(400).json({ message: "This request is already solved." });

    if (String(request.author.id) === String(req.body.helperId))
      return res.status(400).json({ message: "You can't offer help on your own request." });

    request.helpersInterested = (request.helpersInterested || 0) + 1;
    await request.save();

    return res.json({ message: "Help offer submitted!", helpersInterested: request.helpersInterested });
  } catch (err) {
    console.error("Help error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

router.patch("/:id/solve", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });

    if (request.status === "Solved")
      return res.status(400).json({ message: "This request is already solved." });

    if (String(request.author.id) !== String(req.body.userId))
      return res.status(403).json({ message: "You can only solve your own request." });

    request.status = "Solved";
    await request.save();

    return res.json({ message: "Request solved marked", request });
  } catch (err) {
    console.error("Solve error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;