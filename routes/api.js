// routes/api.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import Customer from "../models/Customer.js";
import Order from "../models/Order.js";

const router = express.Router();

// All API routes require auth
router.use(authMiddleware);

// Customers
router.post("/customers", async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const c = await Customer.create({ name, email, phone, createdBy: req.user._id });
    res.status(201).json(c);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/customers", async (req, res) => {
  const customers = await Customer.find().sort("-createdAt").lean();
  res.json(customers);
});

// Orders
router.post("/orders", async (req, res) => {
  try {
    const { customerId, product, amount } = req.body;
    const o = await Order.create({
      customer: customerId,
      product,
      amount,
      createdBy: req.user._id,
    });
    res.status(201).json(o);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get("/orders", async (req, res) => {
  const orders = await Order.find().populate("customer").populate("createdBy", "name email").sort("-createdAt");
  res.json(orders);
});

export default router;
