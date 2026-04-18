const express  = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const path = require("path");

const pageRoutes    = require("./routes/pageRoutes");
const authRoutes    = require("./routes/authRoutes");
const requestRoutes = require("./routes/requestRoutes"); // 👈 NEW

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use(express.static(path.join(__dirname, "../client")));

// API routes
app.use("/api/auth",     authRoutes);
app.use("/api/requests", requestRoutes); // 👈 NEW

// Page routes
app.use("/", pageRoutes);

app.listen(5000, () => console.log("Server running on port 5000"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));