const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: [true, "Order must be linked to a customer"],
    },
    items: [
      {
        productName: { type: String, required: [true, "Product name is required"] },
        quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
        price: { type: Number, required: true, min: [0, "Price cannot be negative"] },
      },
    ],
    totalAmount: { type: Number, min: [0, "Total amount cannot be negative"] },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    orderDate: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Calculate totalAmount before save
orderSchema.pre("save", function (next) {
  this.totalAmount = this.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  next();
});

// Calculate totalAmount before update
orderSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.items) {
    update.totalAmount = update.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    this.setUpdate(update);
  }
  next();
});

// Helper: update Customer stats per order
async function updateCustomerStats(customerId) {
  const Customer = mongoose.model("Customer");
  const Order = mongoose.model("Order");

  // 1️⃣ Recalculate totalSpent for all orders
  const result = await Order.aggregate([
    { $match: { customer: new mongoose.Types.ObjectId(customerId) } },
    { $group: { _id: null, total: { $sum: "$totalAmount" } } },
  ]);
  const totalSpent = result.length ? result[0].total : 0;

  // 2️⃣ Update visitCount and inactiveDays
  const customer = await Customer.findById(customerId);
  if (!customer) return;

  const now = new Date();

  // Calculate inactiveDays as difference between now and lastLogin
  const diffMs = customer.lastLogin ? now - new Date(customer.lastLogin).getTime() : 0;
  const inactiveDays = customer.lastLogin ? Math.floor(diffMs / (1000 * 60 * 60 * 24)) : 0;

  // Increment visitCount by 1 per order
  customer.visitCount += 1;
  customer.totalSpent = totalSpent;
  customer.inactiveDays = inactiveDays;
  customer.lastLogin = now;

  await customer.save();
}

// Hooks to update customer after order changes
orderSchema.post("save", async function (doc) {
  if (doc.customer) await updateCustomerStats(doc.customer);
});

orderSchema.post("findOneAndUpdate", async function (doc) {
  if (doc?.customer) await updateCustomerStats(doc.customer);
});

orderSchema.post("findOneAndDelete", async function (doc) {
  if (doc?.customer) await updateCustomerStats(doc.customer);
});

module.exports = mongoose.model("Order", orderSchema);





