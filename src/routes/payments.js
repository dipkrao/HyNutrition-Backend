const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
// const {
//   createRazorpayOrder, verifyRazorpayPayment,
//   createStripeIntent, stripeWebhook,
// } = require('../controllers/paymentController'); //TO DO: Uncomment this when we have the payment routes

// Stripe webhook uses raw body (set in server.js before json middleware)
router.post("/stripe/webhook", stripeWebhook);

router.post("/razorpay/create", protect, createRazorpayOrder);
router.post("/razorpay/verify", protect, verifyRazorpayPayment);
router.post("/stripe/create-intent", protect, createStripeIntent);

module.exports = router;
