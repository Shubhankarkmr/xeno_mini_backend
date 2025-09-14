const Campaign = require("../models/Campaign");
const CommunicationLog = require("../models/CommunicationLog");

/**
 * Send campaign messages to all pending customers
 * Simulates 90% success and 10% failure
 */
exports.sendCampaignMessages = async (req, res) => {
  try {
    const { campaignId } = req.params;

    // Validate campaign
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    // Fetch all pending logs
    const logs = await CommunicationLog.find({ campaignId, status: "pending" });
    if (!logs.length) return res.status(200).json({ success: true, message: "No pending messages" });

    let sentCount = 0;
    let failedCount = 0;
    const bulkOps = [];

    logs.forEach(log => {
      // Simulate delivery (90% success)
      const isSent = Math.random() < 0.9;

      // Update counters
      if (isSent) sentCount++;
      else failedCount++;

      // Prepare bulk update
      bulkOps.push({
        updateOne: {
          filter: { _id: log._id },
          update: {
            status: isSent ? "sent" : "failed",
            sentAt: new Date(),
            vendorResponse: { simulated: true, success: isSent },
          },
        },
      });
    });

    // Execute all updates at once
    if (bulkOps.length > 0) await CommunicationLog.bulkWrite(bulkOps);

    // Update campaign stats
    campaign.sent += sentCount;
    campaign.failed += failedCount;
    if (campaign.sent + campaign.failed >= campaign.audienceSize) campaign.status = "sent";
    campaign.sentAt = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign processed. Sent: ${sentCount}, Failed: ${failedCount}`,
      campaign,
    });
  } catch (err) {
    console.error("❌ sendCampaignMessages error:", err);
    res.status(500).json({ success: false, message: "Failed to send campaign messages", error: err.message });
  }
};

/**
 * Delivery Receipt API
 * Updates delivery status for a single log
 */
exports.deliveryReceipt = async (req, res) => {
  try {
    const { logId, status } = req.body;

    if (!logId || !["sent", "failed"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid logId or status" });
    }

    const log = await CommunicationLog.findById(logId);
    if (!log) return res.status(404).json({ success: false, message: "Communication log not found" });

    log.status = status;
    log.sentAt = new Date();
    await log.save();

    // Update campaign counters atomically
    const campaign = await Campaign.findById(log.campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    if (status === "sent") campaign.sent += 1;
    else campaign.failed += 1;

    if (campaign.sent + campaign.failed >= campaign.audienceSize) campaign.status = "sent";

    await campaign.save();

    res.status(200).json({ success: true, message: `Log updated to "${status}"`, log });
  } catch (err) {
    console.error("❌ deliveryReceipt error:", err);
    res.status(500).json({ success: false, message: "Failed to update delivery status", error: err.message });
  }
};

