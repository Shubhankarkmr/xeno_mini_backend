const mongoose = require("mongoose");
const Campaign = require("../models/Campaign");
const Customer = require("../models/Customer");
const CommunicationLog = require("../models/CommunicationLog");

// ----------------- Filter customers -----------------
const filterCustomers = async (segmentRules = {}) => {
  const { logic = "AND" } = segmentRules;
  const conditions = [];
  const operatorsMap = { ">": "$gt", "<": "$lt", "=": "$eq", ">=": "$gte", "<=": "$lte" };

  const buildCondition = (field, rule) => {
    if (!rule || rule.value == null || rule.value === "") return null;
    if (!operatorsMap[rule.operator]) return null;

    if (field === "inactiveDays") {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - rule.value);
      return rule.operator === ">" ? { lastLogin: { $lte: cutoff } } : { lastLogin: { $gte: cutoff } };
    }

    const dbField = field === "spend" ? "totalSpent" : "visitCount";
    return { [dbField]: { [operatorsMap[rule.operator]]: rule.value } };
  };

  const spendCond = buildCondition("spend", segmentRules.spend);
  if (spendCond) conditions.push(spendCond);

  const visitsCond = buildCondition("visits", segmentRules.visits);
  if (visitsCond) conditions.push(visitsCond);

  const inactiveCond = buildCondition("inactiveDays", segmentRules.inactiveDays);
  if (inactiveCond) conditions.push(inactiveCond);

  if (conditions.length === 0) return Customer.find({});
  return Customer.find(logic === "OR" ? { $or: conditions } : { $and: conditions });
};

// ----------------- Create campaign -----------------
exports.createCampaign = async (req, res) => {
  try {
    const { name, description = "", segmentRules = {}, preview } = req.body;
    const managerId = req.user?.id; // string from auth middleware

    if (!managerId) return res.status(401).json({ message: "Unauthorized" });
    if (!name || name.trim() === "") return res.status(400).json({ message: "Campaign name is required" });

    const rules = Object.keys(segmentRules).length ? segmentRules : { logic: "AND" };
    const customers = await filterCustomers(rules);

    if (preview) return res.status(200).json({ audienceSize: customers.length });

    const campaign = await Campaign.create({
      name: name.trim(),
      description: description.trim(),
      segmentRules: rules,
      audience: customers.map(c => c._id),
      audienceSize: customers.length,
      managerId, // store as string
      sent: 0,
      failed: 0,
      status: "draft",
    });

    // Create communication logs for audience
    if (customers.length > 0) {
      const logs = customers.map(c => ({
        campaignId: campaign._id,
        customerId: c._id,
        customerName: c.name,
        message: `Hi ${c.name}, here’s 10% off on your next order!`,
        status: "pending",
      }));
      await CommunicationLog.insertMany(logs);
    }

    res.status(201).json({
      success: true,
      campaignId: campaign._id,
      audienceSize: customers.length,
      status: campaign.status,
    });
  } catch (err) {
    console.error("❌ createCampaign error:", err);
    res.status(500).json({ message: err.message || "Failed to create campaign" });
  }
};

// ----------------- Get campaign history -----------------
exports.getCampaignHistory = async (req, res) => {
  try {
    const managerId = req.user?.id;
    if (!managerId) return res.status(401).json({ message: "Unauthorized" });

    const campaigns = await Campaign.find({ managerId })
      .sort({ createdAt: -1 })
      .populate("audience", "name email"); // optional

    res.status(200).json({ success: true, data: campaigns });
  } catch (err) {
    console.error("❌ getCampaignHistory error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch campaign history" });
  }
};

// ----------------- Send campaign -----------------
exports.sendCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;
    const managerId = req.user?.id;

    if (!mongoose.Types.ObjectId.isValid(campaignId))
      return res.status(400).json({ success: false, message: "Invalid campaign ID" });

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) return res.status(404).json({ success: false, message: "Campaign not found" });

    if (managerId && campaign.managerId !== managerId)
      return res.status(403).json({ success: false, message: "Not authorized to send this campaign" });

    if (campaign.status === "sent")
      return res.status(400).json({ success: false, message: "Campaign already sent" });

    const logs = await CommunicationLog.find({ campaignId: campaign._id, status: "pending" });
    let sentCount = 0;
    let failedCount = 0;

    for (const log of logs) {
      const isSent = Math.random() < 0.9;
      log.status = isSent ? "sent" : "failed";
      log.sentAt = new Date();
      await log.save();
      isSent ? sentCount++ : failedCount++;
    }

    campaign.status = "sent";
    campaign.sent = sentCount;
    campaign.failed = failedCount;
    campaign.sentAt = new Date();
    await campaign.save();

    res.status(200).json({
      success: true,
      message: `Campaign sent. Sent: ${sentCount}, Failed: ${failedCount}`,
      campaign,
    });
  } catch (err) {
    console.error("❌ sendCampaign error:", err);
    res.status(500).json({ success: false, message: "Failed to send campaign" });
  }
};

// ----------------- Update delivery receipt -----------------
exports.deliveryReceipt = async (req, res) => {
  try {
    const { logId, status } = req.body;
    if (!logId || !["sent", "failed"].includes(status))
      return res.status(400).json({ message: "logId and valid status required" });

    const log = await CommunicationLog.findById(logId);
    if (!log) return res.status(404).json({ message: "Log not found" });

    log.status = status;
    log.sentAt = new Date();
    await log.save();

    const campaign = await Campaign.findById(log.campaignId);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    if (status === "sent") campaign.sent += 1;
    else if (status === "failed") campaign.failed += 1;

    if (campaign.sent + campaign.failed === campaign.audienceSize) campaign.status = "sent";
    await campaign.save();

    res.status(200).json({ success: true, message: `Log updated as ${status}`, log });
  } catch (err) {
    console.error("❌ deliveryReceipt error:", err);
    res.status(500).json({ success: false, message: "Failed to update delivery status" });
  }
};
