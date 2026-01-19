const mongoose = require('mongoose');
const InventoryLogSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true,
    index: true // Add index here instead
  },
  warehouseId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Warehouse', 
    required: true,
    index: true // Add index here instead
  },
  oldQuantity: { type: Number, required: true },
  newQuantity: { type: Number, required: true },
  changeReason: { 
    type: String, 
    enum: ['sale', 'restock', 'adjustment', 'damage'], 
    required: true,
    index: true // Add index here instead
  },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    expires: '730d',
    index: true // This is fine here
  }
});
// Remove the indexes config entirely