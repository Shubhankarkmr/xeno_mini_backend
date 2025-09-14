const express = require("express");
const passport = require("passport");
const { register, login } = require("../controllers/authController");

const router = express.Router();

// Email/Password routes (public)
router.post("/register", register);
router.post("/login", login);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);
// routes/auth.js
router.get("/google/callback",
  passport.authenticate("google", { session: false, failureRedirect: `${FRONTEND_URL}/login` }),
  async (req, res) => {
    if (!req.user) return res.redirect(`${FRONTEND_URL}/login?error=nouser`);

    const token = jwt.sign(
      { id: req.user._id, name: req.user.name, email: req.user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // HttpOnly cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect(`${FRONTEND_URL}/dashboard`);
  }
);


module.exports = router;
