const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require("../models/User");
const jwt = require("jsonwebtoken")

// ─── LOGIN route — JWT token ke saath ────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email aur password daalein." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email registered nahi hai." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email verify nahi ki. Pehle apni email check karein.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Password galat hai." });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token, 
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

// ─── Nodemailer Transporter ───────────────────────────────────────────────────
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Helper: Send Verification Email ─────────────────────────────────────────
async function sendVerificationEmail(email, name, token) {
  const verifyURL = `${process.env.BASE_URL}/api/auth/verify-email?token=${token}`;

  await transporter.sendMail({
    from: `"HelpHub AI" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: " Verify your HelpHub AI account",
    html: `
      <div style="font-family: 'DM Sans', Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; background: #f5f0e8; border-radius: 16px;">
        <div style="background: #1e3530; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 28px;">
          <span style="color: #fff; font-size: 22px; font-weight: 700;">H &nbsp; HelpHub AI</span>
        </div>
        <h2 style="color: #1a2e2a; margin-bottom: 12px;">Hi ${name} 👋</h2>
        <p style="color: #5a6b65; line-height: 1.7; margin-bottom: 28px;">
          Thanks for joining the HelpHub AI community! Please verify your email address to activate your account.
        </p>
        <a href="${verifyURL}"
           style="display: block; background: #1a7a6e; color: #fff; text-decoration: none;
                  text-align: center; padding: 14px 28px; border-radius: 10px;
                  font-size: 15px; font-weight: 600; margin-bottom: 24px;">
          Verify My Email
        </a>
        <p style="color: #9aaba5; font-size: 13px; text-align: center;">
          This link expires in 24 hours. If you didn't sign up, ignore this email.
        </p>
      </div>
    `,
  });
}

// ─── REGISTER ────────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email aur password zaruri hain." });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "Password kam az kam 6 characters ka hona chahiye." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: "Ye email pehle se registered hai." });
    }

    const hashed = await bcrypt.hash(password, 12);
    const verifyToken = crypto.randomBytes(32).toString("hex");
    const verifyTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await User.create({
      name,
      email,
      password: hashed,
      role: role || "Both",
      isVerified: false,
      verifyToken,
      verifyTokenExpiry,
    });

    await sendVerificationEmail(email, name, verifyToken);

    return res.status(201).json({
      message: "Account ban gaya! Apni email check karein — verification link bheja gaya hai.",
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({ message: "Server error. Dobara koshish karein." });
  }
});

// ─── VERIFY EMAIL ─────────────────────────────────────────────────────────────
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).send("Token missing.");

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).send(`
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f0e8;">
          <h2 style="color:#c0000a;">Link invalid ya expire ho gaya hai.</h2>
          <p>Dobara register karein ya login page par jayein.</p>
          <a href="/auth" style="color:#1a7a6e;">← Auth Page</a>
        </body></html>
      `);
    }

    user.isVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save();

    return res.send(`
      <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#f5f0e8;">
        <div style="max-width:480px;margin:auto;background:#fff;border-radius:16px;padding:48px;">
          <div style="background:#1e3530;border-radius:10px;padding:18px;margin-bottom:24px;">
            <span style="color:#fff;font-size:18px;font-weight:700;">H &nbsp; HelpHub AI</span>
          </div>
          <h2 style="color:#1a7a6e;margin-bottom:12px;"> Email Verified!</h2>
          <p style="color:#5a6b65;margin-bottom:28px;">Welcome to HelpHub AI, <strong>${user.name}</strong>! Aapka account active ho gaya.</p>
          <a href="/auth" style="display:inline-block;background:#1a7a6e;color:#fff;text-decoration:none;
             padding:12px 28px;border-radius:10px;font-weight:600;">
            Continue to Login →
          </a>
        </div>
      </body></html>
    `);
  } catch (err) {
    console.error("Verify error:", err);
    return res.status(500).send("Server error.");
  }
});

// ─── LOGIN ────────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email is not registered." });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        message: "Email is not verified. Please check your email first.",
      });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: "Password is wrong." });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "Login successful!",
      user: {
        id:    user._id,
        name:  user.name,
        email: user.email,
        role:  user.role,
        token, 
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

router.put("/update-profile", async (req, res) => {
  try {
    const { id, name, location, skills, interests } = req.body;

    if (!id)   return res.status(400).json({ message: "User ID missing." });
    if (!name) return res.status(400).json({ message: "Name is required." });

    const user = await User.findByIdAndUpdate(
      id,
      {
        name,
        "profile.location":  location  || "",
        "profile.skills":    skills    || "",
        "profile.interests": interests || "",
      },
      { new: true, runValidators: false }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found." });

    return res.json({
      message: "Profile updated!",
      user: {
        id:   user._id,
        name: user.name,
        email: user.email,
        role:  user.role,
      },
    });
  } catch (err) {
    console.error("Update profile error:", err.message);
    return res.status(500).json({ message: "Server error: " + err.message });
  }
});

module.exports = router;