const express      = require("express");
const router       = express.Router();
const Message      = require("../models/Message");
const User         = require("../models/User");
const Notification = require("../models/Notification");

async function createNotif(userId, text, type, link) {
  try { await Notification.create({ userId, text, type, link: link||"" }); }
  catch(e) { console.error("Notif err:", e.message); }
}

// GET /api/messages
router.get("/", async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ message: "userId required." });
    const messages = await Message.find({
      $or: [{ "from.id": userId }, { "to.id": userId }],
    }).sort({ createdAt: -1 }).limit(100);
    return res.json(messages);
  } catch (err) { return res.status(500).json({ message: "Server error." }); }
});

// GET /api/messages/conversation
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
  } catch (err) { return res.status(500).json({ message: "Server error." }); }
});

// GET /api/messages/users
router.get("/users", async (req, res) => {
  try {
    const { excludeId } = req.query;
    const query = excludeId ? { _id: { $ne: excludeId } } : {};
    const users = await User.find(query).select("_id name city role").limit(50);
    return res.json(users);
  } catch (err) { return res.status(500).json({ message: "Server error." }); }
});

// POST /api/messages
router.post("/", async (req, res) => {
  try {
    const { fromId, fromName, toId, toName, message } = req.body;
    if (!fromId || !fromName || !toId || !toName || !message)
      return res.status(400).json({ message: "Tamam fields zaruri hain." });
    if (!message.trim())
      return res.status(400).json({ message: "Message khali nahi ho sakta." });
    if (fromId === toId)
      return res.status(400).json({ message: "Apne aap ko message nahi kar sakte." });

    const msg = await Message.create({
      from: { id: fromId, name: fromName },
      to:   { id: toId,   name: toName   },
      message: message.trim(),
    });

    // ✅ Receiver ko notification bhejo
    await createNotif(
      toId,
      `${fromName} ne aapko message kiya: "${message.trim().slice(0,60)}${message.length>60?"...":""}"`,
      "Message",
      "/messages"
    );

    return res.status(201).json({ message: "Message bhej diya!", data: msg });
  } catch (err) { return res.status(500).json({ message: "Server error: " + err.message }); }
});

module.exports = router;