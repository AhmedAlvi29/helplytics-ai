const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    from: {
      id:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
    },
    to: {
      id:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true },
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true, collection: "messages" }
);

module.exports = mongoose.model("Message", messageSchema);