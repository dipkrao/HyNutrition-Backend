const Razorpay = require('razorpay');
const Stripe = require('stripe');
const crypto = require('crypto');
const Order = require('../models/Order');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Create Razorpay order
// @route   POST /api/payments/razorpay/create
exports.createRazorpayOrder = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const options = {
      amount: Math.round(order.totalPrice * 100), // paise
      currency: 'INR',
      receipt: order.orderId,
      notes: { orderId: order._id.toString() },
    };

    const razorpayOrder = await razorpay.orders.create(options);
    res.status(200).json({
      success: true,
      key: process.env.RAZORPAY_KEY_ID,
      amount: options.amount,
      currency: 'INR',
      orderId: razorpayOrder.id,
      dbOrderId: order._id,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payments/razorpay/verify
exports.verifyRazorpayPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, dbOrderId } = req.body;
    const sign = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(sign)
      .digest('hex');

    if (expectedSign !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    const order = await Order.findByIdAndUpdate(dbOrderId, {
      paymentStatus: 'paid',
      paymentResult: { id: razorpay_payment_id, status: 'paid', updateTime: new Date().toISOString() },
      orderStatus: 'confirmed',
    }, { new: true });

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Create Stripe payment intent
// @route   POST /api/payments/stripe/create-intent
exports.createStripeIntent = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId).populate('user', 'email name');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalPrice * 100),
      currency: 'inr',
      metadata: { orderId: order._id.toString(), orderRef: order.orderId },
      receipt_email: order.user.email,
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Stripe webhook
// @route   POST /api/payments/stripe/webhook
exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata.orderId;
    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: 'paid',
      orderStatus: 'confirmed',
      paymentResult: { id: pi.id, status: 'paid', updateTime: new Date().toISOString() },
    });
  }

  res.json({ received: true });
};
