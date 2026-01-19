const mongoose = require('mongoose');
const SupplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  companyId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Company', 
    required: true 
  }, // Scoped to a company
  contactEmail: String,
  contactPhone: String,
  createdAt: { type: Date, default: Date.now }
});
module.exports = mongoose.model('Supplier', SupplierSchema);