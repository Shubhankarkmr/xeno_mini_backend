const mongoose = require("mongoose");

// CommunicationLog Schema
const communicationLogSchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: [true, "campaignId is required"],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "customerId is required"],
    },
    customerName: {
      type: String,
      trim: true,
    },
    message: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
    },
    sentAt: {
      type: Date,
    },
    vendorResponse: {
      type: Object, // store API response or simulated result
      default: {},
    },
  },
  {
    timestamps: true, // automatically add createdAt and updatedAt
  }
);

// Optional: method to mark log as sent or failed
communicationLogSchema.methods.updateStatus = async function (status, vendorResponse = {}) {
  if (!["pending", "sent", "failed"].includes(status)) {
    throw new Error("Invalid status");
  }
  this.status = status;
  this.sentAt = new Date();
  this.vendorResponse = vendorResponse;
  return this.save();
};

// Export model
module.exports =
  mongoose.models.CommunicationLog || mongoose.model("CommunicationLog", communicationLogSchema);
