const express = require("express");
const router  = express.Router();
const path    = require("path");

const clientPath = path.join(__dirname, "../../client");

router.get("/",               (req, res) => res.sendFile("index.html",           { root: clientPath }));
router.get("/auth",           (req, res) => res.sendFile("auth.html",            { root: clientPath }));
router.get("/dashboard",      (req, res) => res.sendFile("dashboard.html",       { root: clientPath }));
router.get("/create-request", (req, res) => res.sendFile("create-request.html",  { root: clientPath }));
router.get("/explore",        (req, res) => res.sendFile("explore.html",         { root: clientPath }));
router.get("/profile",        (req, res) => res.sendFile("profile.html",         { root: clientPath }));
router.get("/messages",       (req, res) => res.sendFile("messages.html",        { root: clientPath }));
router.get("/notifications",  (req, res) => res.sendFile("notifications.html",   { root: clientPath }));
router.get("/leaderboard",    (req, res) => res.sendFile("leaderboard.html",     { root: clientPath }));
router.get("/request/:id",    (req, res) => res.sendFile("request-detail.html",  { root: clientPath }));

module.exports = router;