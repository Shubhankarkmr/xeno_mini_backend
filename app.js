

const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;

const authRoutes = require("./routes/auth.js");
const audienceRoutes = require("./routes/audienceRoutes.js");
const campaignRoutes = require("./routes/campaignRoutes.js");
const customerRoutes = require("./routes/customerRoutes.js");
const orderRoutes = require("./routes/orderRoutes.js");
const deliveryRoutes = require("./routes/deliveryRoutes.js");
const aiRoutes=require('./routes/aiRoutes.js');
const User = require("./models/User.js");

dotenv.config();

const app = express();
const { PORT = 5000, MONGO_URI, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL, FRONTEND_URL } = process.env;

// MongoDB Connection
mongoose
  .connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true, // ✅ send HttpOnly cookies
  })
);

// Passport Google OAuth
passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ googleId: profile.id });
        if (!user) {
          user = await User.create({
            googleId: profile.id,
            name: profile.displayName,
            email: profile.emails?.[0]?.value || "",
            picture: profile.photos?.[0]?.value || "",
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

app.use(passport.initialize());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/audiences", audienceRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery", deliveryRoutes);
app.use("/api/ai",aiRoutes);
// Root & 404
app.get("/", (req, res) => res.send("CRM backend is running"));
app.use((req, res) => res.status(404).json({ ok: false, message: "Route not found" }));

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(err.status || 500).json({ ok: false, message: err.message || "Server error" });
});

// Unhandled Rejections & Exceptions
process.on("unhandledRejection", (err) => console.error("❌ Unhandled Rejection:", err));
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

// Start server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
