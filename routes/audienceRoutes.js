const express = require("express");
const protect = require("../middleware/authMiddleware"); // JWT authentication middleware
const router = express.Router();

// In-memory storage for demonstration purposes
let audiences = [];

/**
 * @route   POST /api/audiences
 * @desc    Create a new audience (protected)
 * @access  Private
 */
router.post("/", protect, (req, res) => {
  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Audience name is required" });
  }

  const newAudience = {
    id: audiences.length + 1,
    name,
    createdBy: req.user.id, // store the user who created it
  };

  audiences.push(newAudience);

  res.status(201).json({
    success: true,
    message: `Audience "${name}" created successfully`,
    audience: newAudience,
  });
});

/**
 * @route   GET /api/audiences
 * @desc    Get all audiences (protected)
 * @access  Private
 */
router.get("/", protect, (req, res) => {
  res.status(200).json({
    success: true,
    audiences,
  });
});

module.exports = router;
