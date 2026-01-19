const mongoose = require('mongoose');
const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sku: { 
    type: String, 
    required: true, 
    unique: true // Enforces unique SKU across the platform
  },
  price: { type: Number, required: true, min: 0 },
  supplierId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Supplier' 
  }, // Reference to Supplier
  lowStockThreshold: { type: Number, default: 0 },
  isBundle: { type: Boolean, default: false },
  // For bundles, we can store component references within the product document.
  // This is a denormalized approach that works well with MongoDB.
  bundleComponents: [{
    componentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product' 
    },
    quantity: { type: Number, min: 1 }
  }],
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Product', ProductSchema);