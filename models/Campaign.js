const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Campaign name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    managerId: {
      type: String, // or mongoose.Schema.Types.ObjectId if you link to a User collection
  
    },
    audience: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
      },
    ],
    audienceSize: {
      type: Number,
      default: 0,
    },
    segmentRules: {
      type: Object, // store rules like { logic, spend, visits, inactiveDays }
      default: {},
    },
    sent: {
      type: Number,
      default: 0,
    },
    failed: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["draft", "sent"],
      default: "draft",
    },
    sentAt: {
      type: Date,
    },
    aiMessage: { type: String },        // ✅ selected AI message
    aiSummary: { type: String },
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

module.exports = mongoose.model("Campaign", campaignSchema); 