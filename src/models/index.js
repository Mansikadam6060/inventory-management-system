// src/models/index.js
const Company = require('./Company');
const Warehouse = require('./Warehouse');
const Supplier = require('./Supplier');
const Product = require('./Product');
const Inventory = require('./Inventory');
const InventoryLog = require('./InventoryLog');



module.exports = {
  Company,
  Warehouse,
  Supplier,
  Product,
  Inventory,
  InventoryLog
};