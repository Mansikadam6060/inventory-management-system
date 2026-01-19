const mongoose = require('mongoose');
const WarehouseSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  }, // Reference to Company
  address: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Warehouse', WarehouseSchema);