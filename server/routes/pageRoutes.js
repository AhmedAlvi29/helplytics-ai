const express = require("express");
const router = express.Router();

router.get("/", (req, res) => {
  res.sendFile("index.html", { root: require("path").join(__dirname, "../../client") });
});

router.get("/auth", (req, res) => {
  res.sendFile("auth.html", { root: require("path").join(__dirname, "../../client") });
});

router.get("/dashboard", (req, res) => {
  res.sendFile("dashboard.html", { root: require("path").join(__dirname, "../../client") });
});

module.exports = router;