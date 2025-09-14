const express = require("express");
const router = express.Router();
const campaignController = require("../controllers/campaignController");
const userAuth = require("../middleware/auth");

// ----------------- Create a campaign -----------------
router.post("/create", userAuth, campaignController.createCampaign);

// ----------------- Send a campaign -----------------
router.post("/:campaignId/send", userAuth, campaignController.sendCampaign);

// ----------------- Delivery receipt callback -----------------
router.post("/delivery-receipt", campaignController.deliveryReceipt);

// ----------------- Get campaign history -----------------
router.get("/history", userAuth, campaignController.getCampaignHistory);

module.exports = router;



