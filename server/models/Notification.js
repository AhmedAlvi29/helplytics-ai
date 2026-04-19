const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text:   { type: String, required: true },
    type:   { type: String, enum: ["Status","Match","Reputation","Insight","Message"], default: "Match" },
    read:   { type: Boolean, default: false },
    link:   { type: String, default: "" },
  },
  { timestamps: true, collection: "notifications" }
);

module.exports = mongoose.model("Notification", notificationSchema);