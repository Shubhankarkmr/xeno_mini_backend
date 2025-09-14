const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const authMiddleware = require("../middleware/auth"); // your auth middleware

router.post("/generate-messages", authMiddleware, aiController.generateMessageVariants);
router.post("/auto-tag", authMiddleware, aiController.autoTagCampaign);
router.post("/parse-segment", authMiddleware, aiController.parseSegmentRules);


module.exports = router;

