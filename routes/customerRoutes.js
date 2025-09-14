// routes/customerRoutes.js (CommonJS)
const express = require("express");
const {
  createCustomer,
  getCustomers,
  getCustomer,
  updateCustomer,
  deleteCustomer
} = require("../controllers/customerController.js");
const authMiddleware = require("../middleware/auth.js");

const router = express.Router();

// Protect all routes
router.use(authMiddleware);

router.route("/")
  .post(createCustomer)
  .get(getCustomers);

router.route("/:id")
  .get(getCustomer)
  .put(updateCustomer)
  .delete(deleteCustomer);

module.exports = router;

