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

// CORS (allow frontend from Vercel)
app.use(
  cors({
    origin: "https://xeno-mini-frontend.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Initialize Passport (Google OAuth)
// IMPORTANT: path fixed inside config/passport.js → "../models/User"
require("./config/passport")(); 
app.use(passport.initialize());

// Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/audiences", audienceRoutes);
app.use("/api/campaigns", require("./routes/campaignRoutes"));
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);
