const express = require("express");
const router  = express.Router();
const Message = require("../models/Message");
const User    = require("../models/User");

router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required." });

    const messages = await Message.find({
      $or: [{ "from.id": userId }, { "to.id": userId }],
    }).sort({ createdAt: -1 }).limit(100);

    return res.json(messages);
  } catch (err) {
    console.error("GET messages:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/conversation", async (req, res) => {
  try {
    const { userId, otherId } = req.query;
    if (!userId || !otherId) return res.status(400).json({ message: "userId aur otherId required." });

    const messages = await Message.find({
      $or: [
        { "from.id": userId, "to.id": otherId },
        { "from.id": otherId, "to.id": userId },
      ],
    }).sort({ createdAt: 1 });

    await Message.updateMany(
      { "from.id": otherId, "to.id": userId, read: false },
      { $set: { read: true } }
    );

    return res.json(messages);
  } catch (err) {
    console.error("GET conversation:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

router.get("/users", async (req, res) => {
  try {
    const { excludeId } = req.query;
    const query = excludeId ? { _id: { $ne: excludeId } } : {};
    const users = await User.find(query).select("_id name city role").limit(50);
    return res.json(users);
  } catch (err) {
    console.error("GET users:", err.message);
    return res.status(500).json({ message: "Server error." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { fromId, fromName, toId, toName, message } = req.body;

    if (!fromId || !fromName || !toId || !toName || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }
    if (!message.trim()) {
      return res.status(400).json({ message: "Message can't be empty." });
    }
    if (fromId === toId) {
      return res.status(400).json({ message: "You can't message yourself." });
    }

    const msg = await Message.create({
      from: { id: fromId, name: fromName },
      to:   { id: toId,   name: toName   },
      message: message.trim(),
    });

    return res.status(201).json({ message: "Message bhej diya!", data: msg });
  } catch (err) {
    console.error("POST message:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;