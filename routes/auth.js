require("dotenv").config();
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();
const { JWT_SECRET, REFRESH_TOKEN_SECRET, FRONTEND_URL, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI } = process.env;

router.get("/google", (req, res) => {
  const authURL = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&scope=profile email&access_type=offline&prompt=consent`;
  res.redirect(authURL);
});

router.get("/google/callback", async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) return res.redirect(`${FRONTEND_URL}/login`);

    const params = new URLSearchParams();
    params.append("code", code);
    params.append("client_id", GOOGLE_CLIENT_ID);
    params.append("client_secret", GOOGLE_CLIENT_SECRET);
    params.append("redirect_uri", GOOGLE_REDIRECT_URI);
    params.append("grant_type", "authorization_code");

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params
    });
    const tokenData = await tokenRes.json();
    const base64Url = tokenData.id_token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const userPayload = JSON.parse(Buffer.from(base64, 'base64').toString('utf-8'));

    let user = await User.findOne({ email: userPayload.email });
    if (!user) {
      user = await User.create({
        googleId: userPayload.sub,
        name: userPayload.name,
        email: userPayload.email,
        picture: userPayload.picture
      });
    }

    const accessToken = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });

    res.cookie("accessToken", accessToken, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 15*60*1000 });
    res.cookie("refreshToken", refreshToken, { httpOnly: true, secure: false, sameSite: "lax", maxAge: 7*24*60*60*1000 });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${FRONTEND_URL}/login`);
  }
});

router.get("/", async (req, res) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) return res.status(401).json({ ok: false, message: "Not authenticated" });
    const payload = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(payload.id).select("-__v -password");
    res.json({ ok: true, user });
  } catch (err) {
    console.error("Get user error:", err);
    res.status(401).json({ ok: false, message: "Invalid or expired token" });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ ok: true, message: "Logged out" });
});

module.exports = router;


