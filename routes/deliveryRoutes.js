const express = require("express");
const router = express.Router();
const { sendCampaignMessages, deliveryReceipt } = require("../controllers/deliveryController");
const userAuth = require("../middleware/auth"); // optional auth middleware

router.post("/:campaignId/send", userAuth, sendCampaignMessages);

router.post("/delivery-receipt", userAuth, deliveryReceipt);

module.exports = router;


