const express      = require("express");
const router       = express.Router();
const Notification = require("../models/Notification");

// ── GET /api/notifications?userId=xxx ────────────────────────
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required." });

    const notifs = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50);

    return res.json(notifs);
  } catch (err) {
    console.error("GET notifications:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/notifications/:id/read — single read ──────────
router.patch("/:id/read", async (req, res) => {
  try {
    const notif = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notif) return res.status(404).json({ message: "Notification nahi mili." });
    return res.json(notif);
  } catch (err) {
    console.error("Mark read:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── PATCH /api/notifications/read-all — sab read ─────────────
router.patch("/read-all", async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ message: "userId required." });

    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
    return res.json({ message: "Sab notifications read mark ho gayi." });
  } catch (err) {
    console.error("Read all:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

// ── POST /api/notifications — create (internal use) ──────────
router.post("/", async (req, res) => {
  try {
    const { userId, text, type, link } = req.body;
    if (!userId || !text) return res.status(400).json({ message: "userId aur text zaruri." });

    const notif = await Notification.create({ userId, text, type: type||"Match", link: link||"" });
    return res.status(201).json(notif);
  } catch (err) {
    console.error("Create notif:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;