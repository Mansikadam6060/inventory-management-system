// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const { Company, Warehouse, Supplier, Product } = require('./src/models');

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for seeding');

    // Clear existing data (optional)
    await Company.deleteMany({});
    await Warehouse.deleteMany({});
    await Supplier.deleteMany({});
    await Product.deleteMany({});

    // Create a sample company
    const company = new Company({ name: "Test Company Inc." });
    await company.save();

    // Create a sample supplier
    const supplier = new Supplier({
      name: "Widgets R Us",
      companyId: company._id,
      contactEmail: "orders@widgetsrus.com",
      contactPhone: "+1-555-0123"
    });
    await supplier.save();

    // Create a sample warehouse
    const warehouse = new Warehouse({
      name: "Main Warehouse",
      companyId: company._id,
      address: "123 Inventory Street, Business City"
    });
    await warehouse.save();

    // Create a sample product
    const product = new Product({
      name: "Premium Widget",
      sku: "WIDGET-001",
      price: 29.99,
      supplierId: supplier._id,
      lowStockThreshold: 25
    });
    await product.save();

    console.log('✅ Sample data created successfully!');
    console.log('Company ID:', company._id);
    console.log('Warehouse ID:', warehouse._id);
    console.log('Supplier ID:', supplier._id);
    console.log('Product ID:', product._id);
    console.log('Product SKU:', product.sku);

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seedData();