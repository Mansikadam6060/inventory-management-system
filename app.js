require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
})
.catch((error) => {
  console.error('❌ MongoDB connection error:', error);
});

// SIMPLIFIED MODELS - Defined directly in app.js
const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Company = mongoose.model('Company', CompanySchema);

const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  address: String,
  createdAt: { type: Date, default: Date.now }
});
const Warehouse = mongoose.model('Warehouse', WarehouseSchema);

const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  contactEmail: String,
  contactPhone: String,
  createdAt: { type: Date, default: Date.now }
});
const Supplier = mongoose.model('Supplier', SupplierSchema);

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { type: String, required: true, unique: true },
  price: { type: Number, required: true, min: 0 },
  supplierId: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier' },
  lowStockThreshold: { type: Number, default: 0 },
  isBundle: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});
const Product = mongoose.model('Product', ProductSchema);

const InventorySchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  warehouseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
  quantity: { type: Number, required: true, min: 0, default: 0 },
  updatedAt: { type: Date, default: Date.now }
});
const Inventory = mongoose.model('Inventory', InventorySchema);

// Create unique compound index for Inventory
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });

// ROOT ENDPOINT
app.get('/', (req, res) => {
  res.send('StockFlow API is running!');
});

// PRODUCTS ENDPOINT - Added directly to app.js
// PRODUCTS ENDPOINT - WITHOUT TRANSACTIONS (for standalone MongoDB)
app.post('/api/products', async (req, res) => {
  try {
    const { name, sku, price, warehouseId, initialQuantity } = req.body;

    // 1. Input Validation
    if (!name || !sku || !price || !warehouseId || initialQuantity === undefined) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }
    if (initialQuantity < 0) {
      return res.status(400).json({ error: 'Initial quantity cannot be negative.' });
    }

    // 2. Check if Warehouse exists
    const warehouseExists = await Warehouse.findById(warehouseId);
    if (!warehouseExists) {
      return res.status(404).json({ error: 'Warehouse not found.' });
    }

    // 3. Check for duplicate SKU first
    const existingProduct = await Product.findOne({ sku: sku });
    if (existingProduct) {
      return res.status(409).json({ error: 'A product with this SKU already exists.' });
    }

    // 4. Create Product
    const product = new Product({ 
      name: name,
      sku: sku,
      price: price
    });
    await product.save();

    // 5. Create Inventory
    const inventory = new Inventory({
      productId: product._id,
      warehouseId: warehouseId,
      quantity: initialQuantity
    });
    await inventory.save();

    res.status(201).json({
      message: 'Product created successfully',
      product_id: product._id
    });

  } catch (error) {
    console.error('Error creating product:', error);

    // Handle duplicate SKU error (in case race condition)
    if (error.code === 11000) {
      return res.status(409).json({ error: 'A product with this SKU already exists.' });
    }

    res.status(500).json({ error: 'Internal server error creating product.' });
  }
});

// LOW STOCK ALERTS ENDPOINT - Simplified version
// LOW STOCK ALERTS ENDPOINT - Simplified
app.get('/api/companies/:companyId/alerts/low-stock', async (req, res) => {
  try {
    const { companyId } = req.params;

    // Simple approach: Find warehouses for this company, then check inventory
    const warehouses = await Warehouse.find({ companyId: companyId });
    const warehouseIds = warehouses.map(w => w._id);

    const lowStockItems = await Inventory.find({
      warehouseId: { $in: warehouseIds }
    }).populate('productId').populate('warehouseId');

    const alerts = [];
    
    for (const item of lowStockItems) {
      if (item.productId && item.quantity <= item.productId.lowStockThreshold) {
        // Get supplier info
        const supplier = await Supplier.findById(item.productId.supplierId);
        
        alerts.push({
          product_id: item.productId._id,
          product_name: item.productId.name,
          sku: item.productId.sku,
          warehouse_id: item.warehouseId._id,
          warehouse_name: item.warehouseId.name,
          current_stock: item.quantity,
          threshold: item.productId.lowStockThreshold,
          supplier: supplier ? {
            id: supplier._id,
            name: supplier.name,
            contact_email: supplier.contactEmail
          } : null
        });
      }
    }

    res.json({
      alerts: alerts,
      total_alerts: alerts.length
    });

  } catch (error) {
    console.error('Low stock alerts error:', error);
    res.status(500).json({ error: 'Failed to generate low-stock alerts.' });
  }
});
// SIMPLE TEST ENDPOINT
app.post('/api/test-save', async (req, res) => {
  try {
    const company = new Company({ name: req.body.name || "Test Company" });
    const savedCompany = await company.save();
    
    res.json({ success: true, company: savedCompany });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ULTRA-SIMPLE SEED ENDPOINT (ONE STEP AT A TIME)
app.post('/api/seed-simple', async (req, res) => {
  try {
    console.log('Step 1: Creating company...');
    const company = new Company({ name: req.body.name || "Test Company Inc." });
    await company.save();
    console.log('✅ Company created');

    console.log('Step 2: Creating warehouse...');
    const warehouse = new Warehouse({
      name: "Main Warehouse",
      companyId: company._id
    });
    await warehouse.save();
    console.log('✅ Warehouse created');

    res.json({
      success: true,
      message: "Basic data created",
      companyId: company._id,
      warehouseId: warehouse._id
    });

  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// STEP-BY-STEP SEED BUILDUP
app.post('/api/seed-step1', async (req, res) => {
  try {
    const company = new Company({ name: req.body.name || "Test Company Inc." });
    await company.save();
    res.json({ success: true, companyId: company._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/seed-step2', async (req, res) => {
  try {
    const warehouse = new Warehouse({
      name: "Main Warehouse",
      companyId: req.body.companyId
    });
    await warehouse.save();
    res.json({ success: true, warehouseId: warehouse._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/seed-step3', async (req, res) => {
  try {
    const supplier = new Supplier({
      name: "Widgets R Us",
      companyId: req.body.companyId,
      contactEmail: "orders@widgetsrus.com"
    });
    await supplier.save();
    res.json({ success: true, supplierId: supplier._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/seed-step4', async (req, res) => {
  try {
    const product = new Product({
      name: "Sample Widget",
      sku: "SAMPLE-" + Date.now(), // Unique SKU
      price: 19.99,
      supplierId: req.body.supplierId
    });
    await product.save();
    res.json({ success: true, productId: product._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/seed-step5', async (req, res) => {
  try {
    const inventory = new Inventory({
      productId: req.body.productId,
      warehouseId: req.body.warehouseId,
      quantity: 15
    });
    await inventory.save();
    res.json({ success: true, inventoryId: inventory._id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});