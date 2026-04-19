const express      = require("express");
const router       = express.Router();
const mongoose     = require("mongoose");
const Request      = require("../models/Request");
const Notification = require("../models/Notification");
const User         = require("../models/User");

// ── Helper ───────────────────────────────────────────────────
async function createNotif(userId, text, type, link) {
  try { await Notification.create({ userId, text, type, link: link || "" }); }
  catch(e) { console.error("Notif err:", e.message); }
}

// ── GET /api/requests ─────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 }).limit(50);
    return res.json(requests);
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── POST /api/requests ────────────────────────────────────────
router.post("/", async (req, res) => {
  try {
    const { title, description, tags, category, urgency, author } = req.body;

    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required." });
    if (!author?.id || !author?.name)
      return res.status(401).json({ message: "Please login first." });

    const tagsArray = typeof tags === "string"
      ? tags.split(",").map(t => t.trim()).filter(Boolean)
      : tags || [];

    // Request save
    const request = await Request.create({
      title, description, tags: tagsArray, category, urgency,
      author: { id: author.id, name: author.name, city: author.city || "Pakistan" },
    });

    console.log("Request created:", request._id);

    // ── Notifications ─────────────────────────────────────────
    // author.id ko safely ObjectId mein convert karo
    let authorObjectId;
    try {
      authorObjectId = new mongoose.Types.ObjectId(author.id);
    } catch(e) {
      console.error("Invalid author.id for ObjectId:", author.id);
      // Request ban gayi — notification fail pe return mat karo
      return res.status(201).json({ message: "Request published successfully!", request });
    }

    // Saare users except author
    const allUsers = await User.find({ _id: { $ne: authorObjectId } }).select("_id");
    console.log(`Notifying ${allUsers.length} users`);

    if (allUsers.length > 0) {
      const notifText = `${author.name} posted a new ${category} request: "${title.slice(0, 60)}${title.length > 60 ? "..." : ""}"`;

      const notifDocs = allUsers.map(u => ({
        userId: u._id,
        text:   notifText,
        type:   "Match",
        link:   "/explore",
        read:   false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      await Notification.insertMany(notifDocs);
      console.log(`${notifDocs.length} notifications created`);
    }

    return res.status(201).json({ message: "Request published successfully!", request });
  } catch (err) {
    console.error("Create request error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── POST /api/requests/:id/help ───────────────────────────────
router.post("/:id/help", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.status === "Solved")
      return res.status(400).json({ message: "This request is already solved." });

    const { helperId, helperName } = req.body;

    if (String(request.author.id) === String(helperId))
      return res.status(400).json({ message: "You cannot offer help on your own request." });

    request.helpersInterested = (request.helpersInterested || 0) + 1;
    await request.save();

    await createNotif(
      request.author.id,
      `${helperName} offered help on "${request.title.slice(0, 55)}${request.title.length > 55 ? "..." : ""}"`,
      "Match", "/explore"
    );

    return res.json({ message: "Help offer submitted successfully!", helpersInterested: request.helpersInterested });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ── PATCH /api/requests/:id/solve ────────────────────────────
router.patch("/:id/solve", async (req, res) => {
  try {
    const request = await Request.findById(req.params.id);
    if (!request) return res.status(404).json({ message: "Request not found." });
    if (request.status === "Solved")
      return res.status(400).json({ message: "This request is already solved." });

    const { userId } = req.body;
    if (String(request.author.id) !== String(userId))
      return res.status(403).json({ message: "You can only mark your own request as solved." });

    request.status = "Solved";
    await request.save();

    await createNotif(
      request.author.id,
      `"${request.title.slice(0, 60)}${request.title.length > 60 ? "..." : ""}" was marked as solved`,
      "Status", "/explore"
    );

    return res.json({ message: "Request solved successfully!", request });
  } catch (err) {
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;