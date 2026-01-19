// src/routes/products.js - UPDATED
const express = require('express');
const router = express.Router();

// This function will receive the models from app.js
module.exports = (models) => {
  const { Product, Inventory, Warehouse } = models;

  /**
   * POST /api/products
   * Creates a new product and its initial inventory.
   * Uses a MongoDB transaction to ensure atomicity.
   */
  router.post('/api/products', async (req, res) => {
    const session = await Product.startSession();
    session.startTransaction();

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
      const warehouseExists = await Warehouse.findById(warehouseId).session(session);
      if (!warehouseExists) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ error: 'Warehouse not found.' });
      }

      // 3. & 4. Create Product and Inventory inside the transaction
      const product = new Product({ name, sku, price });
      const inventory = new Inventory({
        productId: product._id,
        warehouseId: warehouseId,
        quantity: initialQuantity
      });

      await product.save({ session });
      await inventory.save({ session });

      await session.commitTransaction();
      session.endSession();

      res.status(201).json({
        message: 'Product created successfully',
        product_id: product._id
      });

    } catch (error) {
      await session.abortTransaction();
      session.endSession();

      console.error('Error creating product:', error);

      // Handle duplicate SKU error
      if (error.code === 11000) {
        return res.status(409).json({ error: 'A product with this SKU already exists.' });
      }

      res.status(500).json({ error: 'Internal server error creating product.' });
    }
  });

  return router;
};
