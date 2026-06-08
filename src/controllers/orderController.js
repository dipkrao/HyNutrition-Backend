const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const sendEmail = require('../utils/sendEmail');

// @desc    Create order
// @route   POST /api/orders
exports.createOrder = async (req, res, next) => {
  try {
    const { items, shippingAddress, paymentMethod, couponCode } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'No order items' });
    }

    // Verify stock and calculate prices
    let itemsPrice = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product) return res.status(404).json({ success: false, message: `Product ${item.product} not found` });
      if (product.stock < item.quantity) {
        return res.status(400).json({ success: false, message: `Insufficient stock for ${product.name}` });
      }
      const price = product.discountPrice || product.price;
      itemsPrice += price * item.quantity;
      orderItems.push({
        product: product._id,
        name: product.name,
        image: product.images?.[0]?.url || '',
        price,
        quantity: item.quantity,
      });
    }

    // Apply coupon
    let discountAmount = 0;
    let couponDoc = null;
    if (couponCode) {
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (couponDoc) {
        const validity = couponDoc.isValid(req.user._id, itemsPrice);
        if (validity.valid) {
          discountAmount = couponDoc.calculateDiscount(itemsPrice);
        }
      }
    }

    const shippingPrice = itemsPrice >= 999 ? 0 : 99;
    const taxPrice = Math.round((itemsPrice - discountAmount) * 0.05);
    const totalPrice = itemsPrice - discountAmount + shippingPrice + taxPrice;

    const order = await Order.create({
      user: req.user._id,
      items: orderItems,
      shippingAddress,
      paymentMethod,
      coupon: couponDoc?._id,
      couponCode: couponDoc?.code,
      itemsPrice,
      discountAmount,
      shippingPrice,
      taxPrice,
      totalPrice,
      paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
    });

    // Reduce stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, sold: item.quantity },
      });
    }

    // Record coupon usage
    if (couponDoc) {
      couponDoc.usageCount += 1;
      couponDoc.usedBy.push(req.user._id);
      await couponDoc.save();
    }

    // Send confirmation email
    try {
      await sendEmail({
        to: req.user.email,
        subject: `Order Confirmed - ${order.orderId} | HY Nutrition`,
        html: `<h2>Thank you for your order!</h2>
          <p>Your order <strong>${order.orderId}</strong> has been placed successfully.</p>
          <p>Total: ₹${totalPrice.toLocaleString()}</p>
          <p>We'll notify you when it ships.</p>`,
      });
    } catch (e) { /* email failure shouldn't break order */ }

    const populated = await Order.findById(order._id).populate('items.product', 'name images');
    res.status(201).json({ success: true, order: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user orders
// @route   GET /api/orders/myorders
exports.getMyOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      Order.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments({ user: req.user._id }),
    ]);
    res.status(200).json({ success: true, orders, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate('items.product', 'name images slug');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString() && req.user.role === 'user') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['processing', 'confirmed'].includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }
    order.orderStatus = 'cancelled';
    order.cancelledAt = Date.now();
    order.cancelReason = req.body.reason || 'Customer requested cancellation';
    await order.save();

    // Restore stock
    for (const item of order.items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: item.quantity, sold: -item.quantity },
      });
    }

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};

// ===== ADMIN =====

// @desc    Get all orders (admin)
// @route   GET /api/orders
exports.getAllOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const filter = {};
    if (req.query.status) filter.orderStatus = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;

    const [orders, total] = await Promise.all([
      Order.find(filter).populate('user', 'name email').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Order.countDocuments(filter),
    ]);
    res.status(200).json({ success: true, orders, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status (admin)
// @route   PUT /api/orders/:id/status
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { orderStatus, trackingNumber, trackingUrl, shippingCarrier } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      {
        orderStatus,
        ...(trackingNumber && { trackingNumber }),
        ...(trackingUrl && { trackingUrl }),
        ...(shippingCarrier && { shippingCarrier }),
        ...(orderStatus === 'delivered' && { deliveredAt: Date.now(), paymentStatus: 'paid' }),
      },
      { new: true }
    ).populate('user', 'name email');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Send status email
    try {
      await sendEmail({
        to: order.user.email,
        subject: `Order ${order.orderId} - ${orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)} | HY Nutrition`,
        html: `<p>Hi ${order.user.name}, your order <strong>${order.orderId}</strong> status is now: <strong>${orderStatus}</strong>.</p>
          ${trackingNumber ? `<p>Tracking: ${trackingNumber}</p>` : ''}`,
      });
    } catch (e) {}

    res.status(200).json({ success: true, order });
  } catch (err) {
    next(err);
  }
};
