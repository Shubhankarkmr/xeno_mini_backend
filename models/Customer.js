const mongoose = require("mongoose");
const Customer = require("./Customer"); // Ensure Customer is loaded
const Order = require("./Order"); // Import your Order model if not already

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please enter a valid email address"],
    },
    phone: {
      type: String,
      match: [/^\+?[1-9]\d{7,14}$/, "Please enter a valid phone number"],
    },
    address: {
      street: String,
      city: String,
      state: String,
      zip: String,
      country: { type: String, default: "India" },
    },
    lastLogin: { type: Date, default: Date.now },
    visits: { type: [Date], default: [] },
    isActive: { type: Boolean, default: true },

    totalSpent: { type: Number, default: 0, min: 0 },
    visitCount: { type: Number, default: 0 },
    inactiveDays: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/**
 * Update customer's totalSpent, visitCount, and inactiveDays
 */
customerSchema.statics.updateCustomerStats = async function (customerId, orderAmount) {
  const customer = await this.findById(customerId);
  if (!customer) throw new Error("Customer not found");

  const now = new Date();

  // 1️⃣ Update totalSpent by adding the new order amount
  customer.totalSpent += orderAmount;

  // 2️⃣ Record this visit
  if (customer.lastLogin) {
    const diffMs = now - new Date(customer.lastLogin).getTime();
    customer.inactiveDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  } else {
    customer.inactiveDays = 0;
  }

  // Keep last 50 visits
  customer.visits = customer.visits.slice(-49).concat(now);

  // Update visitCount
  customer.visitCount = customer.visits.length;

  // Update lastLogin
  customer.lastLogin = now;

  // Save changes
  await customer.save();

  return customer;
};


module.exports = mongoose.model("Customer", customerSchema);


