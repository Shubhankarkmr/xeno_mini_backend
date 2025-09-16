const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const morgan = require("morgan");
const cors = require("cors");
const passport = require("passport");
const errorHandler = require("./middleware/errorMiddleware"); // central error handler
const audienceRoutes = require("./routes/audienceRoutes");

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB().catch((err) => console.error("MongoDB connection error:", err));

// Initialize app
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "https://xeno-mini-frontend.vercel.app", // your frontend
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ✅ Initialize Passport (Google OAuth) properly
require("./config/passport")(passport);
app.use(passport.initialize());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/audiences", audienceRoutes);
app.use("/api/campaigns", require("./routes/campaignRoutes")); // ensure route exists
app.use("/api/customers", require("./routes/customerRoutes"));
app.use("/api/orders", require("./routes/orderRoutes"));
app.use("/api/delivery", require("./routes/deliveryRoutes"));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// Central Error Handler
app.use(errorHandler);

// Handle unhandled rejections
process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
