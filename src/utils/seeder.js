const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Banner = require('../models/Banner');
const Coupon = require('../models/Coupon');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('MongoDB connected for seeding...');
};

const categories = [
  { name: 'Protein', slug: 'protein', icon: '💪', color: '#fef3c7', sortOrder: 1 },
  { name: 'Performance', slug: 'performance', icon: '⚡', color: '#dbeafe', sortOrder: 2 },
  { name: 'Pre-Workout', slug: 'pre-workout', icon: '🔥', color: '#fee2e2', sortOrder: 3 },
  { name: 'Recovery', slug: 'recovery', icon: '🌿', color: '#dcfce7', sortOrder: 4 },
  { name: 'Mass Gainer', slug: 'mass-gainer', icon: '🏋️', color: '#ede9fe', sortOrder: 5 },
  { name: 'Vitamins', slug: 'vitamins', icon: '💊', color: '#fce7f3', sortOrder: 6 },
  { name: 'Weight Loss', slug: 'weight-loss', icon: '🌡️', color: '#ecfdf5', sortOrder: 7 },
];

const banners = [
  { title: 'FUEL YOUR', highlight: 'LIMITS', subtitle: 'Premium sports nutrition for elite performance', ctaText: 'Shop Now', ctaLink: '/shop', bgColor: '#0a0a0a', accentColor: '#f59e0b', sortOrder: 1 },
  { title: 'BUILD YOUR', highlight: 'LEGACY', subtitle: 'Protein, creatine & more — engineered for results', ctaText: 'Explore', ctaLink: '/shop', bgColor: '#0f172a', accentColor: '#10b981', sortOrder: 2 },
  { title: 'UNLEASH YOUR', highlight: 'POWER', subtitle: 'Up to 25% off on best-selling supplements', ctaText: 'Grab Deal', ctaLink: '/shop', bgColor: '#1a0a2e', accentColor: '#8b5cf6', sortOrder: 3 },
];

const coupons = [
  { code: 'HY10', discountType: 'percentage', discountValue: 10, description: '10% off on all orders', minOrderValue: 500 },
  { code: 'HY20', discountType: 'percentage', discountValue: 20, description: '20% off on all orders', minOrderValue: 1500 },
  { code: 'WELCOME15', discountType: 'percentage', discountValue: 15, description: '15% off for new customers', minOrderValue: 0 },
  { code: 'FIRST25', discountType: 'percentage', discountValue: 25, description: '25% off first order', minOrderValue: 1000, usageLimit: 100 },
  { code: 'FLAT200', discountType: 'fixed', discountValue: 200, description: '₹200 flat off', minOrderValue: 1500 },
];

const seedDB = async () => {
  try {
    await connectDB();

    // Clear existing
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),
    ]);
    console.log('Existing data cleared');

    // Create admin user
    const admin = await User.create({
      name: 'HY Admin',
      email: 'admin@hynutrition.in',
      password: 'Admin@123',
      role: 'superadmin',
      isVerified: true,
    });
    console.log(`Admin created: admin@hynutrition.in / Admin@123`);

    // Create categories
    const createdCategories = await Category.insertMany(categories);
    const catMap = {};
    createdCategories.forEach(c => { catMap[c.slug] = c._id; });
    console.log(`${createdCategories.length} categories created`);

    // Create products
    const products = [
      {
        name: 'Whey Protein Gold', sku: 'WPG-001', price: 2999, discountPrice: 2499,
        category: catMap['protein'], shortDescription: '25g protein per serving',
        description: 'Premium whey protein isolate with 25g protein per serving. Zero sugar, zero fat. Ideal post-workout recovery supplement.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Whey+Protein+Gold' }],
        nutrition: { protein: '25g', carbs: '3g', fat: '1g', calories: '120kcal', servingSize: '30g' },
        weight: '1kg / 2kg / 5kg', tags: ['protein', 'whey', 'isolate'],
        badge: 'Best Seller', isFeatured: true, isBestSeller: true, stock: 50,
        usageInstructions: 'Mix 1 scoop with 250ml cold water. Consume post-workout.',
      },
      {
        name: 'Creatine Monohydrate', sku: 'CM-002', price: 1499, discountPrice: 1199,
        category: catMap['performance'], shortDescription: '5g creatine per serving',
        description: 'Pure micronized creatine monohydrate for explosive strength and power. Increases ATP production for peak performance.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Creatine' }],
        nutrition: { protein: '0g', carbs: '0g', fat: '0g', calories: '0kcal', servingSize: '5g' },
        weight: '300g / 500g', tags: ['creatine', 'strength', 'power'],
        badge: 'Top Rated', isFeatured: true, isBestSeller: true, stock: 80,
        usageInstructions: 'Take 5g daily with water or juice.',
      },
      {
        name: 'Pre-Workout Surge', sku: 'PWS-003', price: 1899, discountPrice: 1599,
        category: catMap['pre-workout'], shortDescription: 'High-stim energy boost',
        description: 'Explosive energy formula with beta-alanine, caffeine, and NO boosters. Maximum pump and focus for your toughest sessions.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Pre-Workout' }],
        nutrition: { protein: '2g', carbs: '8g', fat: '0g', calories: '40kcal', servingSize: '15g' },
        weight: '300g', tags: ['pre-workout', 'energy', 'pump'],
        badge: 'New', isFeatured: true, stock: 45,
        usageInstructions: 'Mix 1 scoop with 200ml water 20-30 minutes before training.',
      },
      {
        name: 'BCAA Recovery Complex', sku: 'BRC-004', price: 1699, discountPrice: 1399,
        category: catMap['recovery'], shortDescription: 'Intra & post workout',
        description: '2:1:1 BCAA ratio with electrolytes for faster muscle recovery. Reduce soreness and support muscle protein synthesis.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=BCAA' }],
        nutrition: { protein: '5g', carbs: '2g', fat: '0g', calories: '28kcal', servingSize: '10g' },
        weight: '250g / 500g', tags: ['bcaa', 'recovery', 'amino'], stock: 60,
      },
      {
        name: 'Mass Gainer Pro', sku: 'MGP-005', price: 3499, discountPrice: 2999,
        category: catMap['mass-gainer'], shortDescription: '1000+ calories per serving',
        description: 'High-calorie mass gainer with 1000+ kcal, 50g protein, and complex carbs. Engineered for serious bulking.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Mass+Gainer' }],
        nutrition: { protein: '50g', carbs: '165g', fat: '8g', calories: '1000kcal', servingSize: '300g' },
        weight: '3kg / 5kg', tags: ['mass', 'gainer', 'bulking'],
        badge: 'Popular', isFeatured: true, isBestSeller: true, stock: 35,
      },
      {
        name: 'Omega-3 Fish Oil', sku: 'OFO-006', price: 799, discountPrice: 699,
        category: catMap['vitamins'], shortDescription: '1000mg EPA+DHA per cap',
        description: 'High-potency EPA & DHA omega-3 for heart, joint, and brain health.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Omega-3' }],
        nutrition: { protein: '0g', carbs: '0g', fat: '1g', calories: '10kcal', servingSize: '1 cap' },
        weight: '90 caps / 180 caps', tags: ['omega3', 'fish-oil', 'health'], stock: 100,
      },
      {
        name: 'Multivitamin Elite', sku: 'MVE-007', price: 999, discountPrice: 849,
        category: catMap['vitamins'], shortDescription: '30+ vitamins & minerals',
        description: 'Complete 30+ vitamin & mineral formula for peak performance and immunity.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Multivitamin' }],
        nutrition: { protein: '0g', carbs: '0g', fat: '0g', calories: '5kcal', servingSize: '2 tabs' },
        weight: '60 tabs / 120 tabs', tags: ['vitamins', 'health', 'immunity'],
        badge: 'New', stock: 75,
      },
      {
        name: 'Fat Burner Thermo', sku: 'FBT-010', price: 1599, discountPrice: 1299,
        category: catMap['weight-loss'], shortDescription: 'Boost metabolism 24/7',
        description: 'Advanced thermogenic fat burner with green tea extract and L-carnitine.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Fat+Burner' }],
        nutrition: { protein: '0g', carbs: '1g', fat: '0g', calories: '5kcal', servingSize: '2 caps' },
        weight: '60 caps', tags: ['fat-burner', 'weight-loss', 'thermo'],
        badge: 'Hot', isFeatured: true, stock: 65,
      },
      {
        name: 'Vegan Protein Blend', sku: 'VPB-011', price: 2699, discountPrice: 2299,
        category: catMap['protein'], shortDescription: '22g plant protein per serving',
        description: 'Pea + rice protein blend, complete amino acid profile. Plant-powered gains.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=Vegan+Protein' }],
        nutrition: { protein: '22g', carbs: '6g', fat: '3g', calories: '140kcal', servingSize: '35g' },
        weight: '1kg / 2kg', tags: ['vegan', 'plant-protein', 'pea'],
        badge: 'Vegan', stock: 30,
      },
      {
        name: 'ZMA Sleep & Recovery', sku: 'ZSR-012', price: 1099, discountPrice: 899,
        category: catMap['recovery'], shortDescription: 'Deep sleep + hormone support',
        description: 'Zinc, Magnesium, and B6 formula to boost testosterone and improve sleep quality.',
        images: [{ url: 'https://via.placeholder.com/600x600?text=ZMA' }],
        nutrition: { protein: '0g', carbs: '0g', fat: '0g', calories: '5kcal', servingSize: '3 caps' },
        weight: '90 caps', tags: ['zma', 'sleep', 'recovery'], stock: 70,
      },
    ];

    await Product.insertMany(products);
    console.log(`${products.length} products created`);

    await Banner.insertMany(banners);
    console.log(`${banners.length} banners created`);

    await Coupon.insertMany(coupons);
    console.log(`${coupons.length} coupons created`);

    console.log('\n✅ Database seeded successfully!');
    console.log('Admin login: admin@hynutrition.in / Admin@123');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDB();
