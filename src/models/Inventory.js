const mongoose = require('mongoose');
const InventorySchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  warehouseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true, 
    min: 0, 
    default: 0 
  },
  updatedAt: { type: Date, default: Date.now }
}, {
  // Compound index to ensure one inventory document per product/warehouse combo
  // This replaces the SQL UNIQUE constraint.
  _id: false // We don't need a separate ID for this document
});
// Create a unique compound index
InventorySchema.index({ productId: 1, warehouseId: 1 }, { unique: true });
module.exports = mongoose.model('Inventory', InventorySchema);