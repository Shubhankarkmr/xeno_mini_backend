const express = require("express");
const {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
} = require("../controllers/orderController.js");
const authMiddleware = require("../middleware/auth.js");

const router = express.Router();

// ✅ Protect all order routes with middleware
router.use(authMiddleware);

router.route("/")
  .post(createOrder)   // POST /api/orders
  .get(getOrders);     // GET /api/orders

router.route("/:id")
  .get(getOrder)       // GET /api/orders/:id
  .put(updateOrder)    // PUT /api/orders/:id
  .delete(deleteOrder);// DELETE /api/orders/:id

// ✅ Correct export for CJS
module.exports = router;



