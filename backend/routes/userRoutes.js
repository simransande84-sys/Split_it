const express = require("express");
const { v4: uuidv4 } = require("uuid");
const SignUpModel = require("../models/Users");
const transporter = require("../mailer");

const router = express.Router();
require("dotenv").config();
const BASE_URL = process.env.BASE_URL;

router.post("/sign_up", async (req, res) => {
  const { username, email, password } = req.body;
  const verificationToken = uuidv4();

  try {
    let user = await SignUpModel.findOne({ email });
    if (user && user.isVerified) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    const hasEmailCredentials = process.env.EMAIL_USER && process.env.EMAIL_PASS && !process.env.EMAIL_USER.includes("your_email");
    const autoVerify = !hasEmailCredentials; // In local development without configured SMTP, auto-verify

    if (user) {
      user.username = username;
      user.password = password;
      user.verificationToken = verificationToken;
      user.isVerified = autoVerify;
    } else {
      user = new SignUpModel({
        username,
        email,
        password,
        verificationToken,
        isVerified: autoVerify,
      });
    }

    await user.save();

    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    const verifyLink = `${baseUrl}/verify/${verificationToken}`;

    if (hasEmailCredentials) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Verify Your Email - Split_it",
        html: `<p>Hello ${username},</p><p>Click <a href="${verifyLink}">here</a> to verify your email address.</p>`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email:", error.message);
          console.log(`\n🔗 [Split_it Dev] Verification link: ${verifyLink}\n`);
        }
        return res.status(200).json({
          message: "Signup successful. Please check your email to verify your account.",
          userId: user._id,
        });
      });
    } else {
      console.log(`\n⚡ [Split_it Local Dev] Auto-verified user '${email}' (No SMTP configured).\n🔗 Manual verify link: ${verifyLink}\n`);
      return res.status(200).json({
        message: "Signup successful. Please check your email to verify your account.",
        userId: user._id,
      });
    }

  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Signup failed", error: error.message });
  }
});

router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;
  const user = await SignUpModel.findOne({ verificationToken: token });

  if (!user) return res.status(400).send("<h3>Invalid or expired verification link.</h3>");

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";
  res.send(`
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
      <h2 style="color: #1F3C9A;">Email Verified Successfully! ✅</h2>
      <p>Your Split_it account is now active.</p>
      <a href="${clientUrl}/login" style="display: inline-block; padding: 10px 20px; background-color: #1F3C9A; color: white; text-decoration: none; border-radius: 6px; margin-top: 15px;">Go to Login</a>
    </div>
  `);
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  SignUpModel.findOne({ email })
    .then(user => {
      if (!user) return res.status(404).json({ error: "User not found" });
      if (!user.isVerified) return res.status(403).json({ message: "Please verify your email before logging in." });
      if (user.password !== password) return res.status(401).json({ error: "Incorrect password" });

      res.json({ message: "Login successful",  userId: user._id,
      userEmail: user.email
        });
    })
    .catch(err => {
      console.error("Error during login:", err);
      res.status(500).json({ error: "Login error", details: err });
    });
});

router.get("/users/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const user = await SignUpModel.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({
      username: user.username,
      email: user.email,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    res.status(500).json({ message: "Failed to fetch user" });
  }
});

router.get('/user-count', async (req, res) => {
  const count = await SignUpModel.countDocuments();
  res.json({ count });
});

module.exports = router;
