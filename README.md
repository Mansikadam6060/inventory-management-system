# StockFlow Inventory Management System - MongoDB Take Home Solution

This repository contains my solutions to the StockFlow take-home assignment, implemented in **Node.js with Express and MongoDB**.

## Solution Overview

### Part 1: Code Review & Debugging

**Identified Issues & Fixes:**
1.  **Missing Input Validation & Error Handling:** Added explicit checks for required fields and error handling middleware compatibility.
2.  **SKU Uniqueness Not Enforced:** Relies on MongoDB's unique index on the `sku` field, with proper error handling for `11000` duplicate key errors.
3.  **Non-Atomic Operation:** Solved using a **MongoDB Transaction** to ensure the Product and Inventory document are created atomically.
4.  **Warehouse Existence Not Verified:** Added a check to ensure the `warehouseId` exists before creating the inventory record.
5.  **No Error Handling:** Wrapped the entire operation in a try-catch block and implemented appropriate HTTP error responses.

**Corrected Code:** [`src/routes/products.js`](./src/routes/products.js)

### Part 2: Database Design (MongoDB with Mongoose)

I designed a NoSQL schema using Mongoose ODM. The key design choices are:
*   **Embedding vs. Referencing:** Used references (`ObjectId`) for major relationships (Product-Warehouse, Product-Supplier) for flexibility and to avoid data duplication. Embedded the `bundleComponents` array for performance.
*   **Atomicity:** Used transactions for critical operations like creating a product with its initial inventory.
*   **Indexing:** Implemented critical indexes (e.g., unique compound index on `Inventory(productId, warehouseId)`, unique index on `Product.sku`) for performance and data integrity.
*   **Data Integrity:** Enforced at the application layer using Mongoose schemas with validation and references.

**Models:**
*   [`src/models/Company.js`](./src/models/Company.js)
*   [`src/models/Warehouse.js`](./src/models/Warehouse.js)
*   [`src/models/Supplier.js`](./src/models/Supplier.js)
*   [`src/models/Product.js`](./src/models/Product.js)
*   [`src/models/Inventory.js`](./src/models/Inventory.js)
*   [`src/models/InventoryLog.js`](./src/models/InventoryLog.js)

**Identified Gaps & Questions for the Product Team:**
1.  **Company Context & Authentication:** How is user auth handled? How does an endpoint know which company a user belongs to?
2.  **Supplier Relationship Details:** Can a product have multiple suppliers? Is the `supplierId` for reordering purposes?
3.  **Bundle Logic Implementation:** Does selling a bundle decrement the bundle's stock or the components' stock? This is critical for the inventory logic.
4.  **Inventory History Detail Level:** Do we need to track the user who made the change or link to an order ID?
5.  **Product Categorization:** Are product types or categories needed for applying rules like low-stock thresholds?
6.  **Warehouse Properties:** Are there properties like `isActive` or `country` that would affect business logic?

### Part 3: API Implementation (MongoDB Aggregation)

**Assumptions:**
*   User authentication middleware populates `req.user.companyId`.
*   The `InventoryLog` collection is populated with documents where `changeReason: 'sale'` for each sale transaction.
*   "Recent sales activity" is defined as any sale in the last 30 days.

**Implementation:** [`src/routes/alerts.js`](./src/routes/alerts.js)

The solution uses a single, complex **MongoDB Aggregation Pipeline** to:
1.  **`$lookup`** (join) the necessary collections (Product, Warehouse, Supplier, InventoryLog).
2.  **Filter** the warehouses to those belonging to the requested company.
3.  **Calculate** the average daily sales for each product/warehouse combo from the `InventoryLog` collection.
4.  **Apply the business logic filters:** `currentStock <= threshold` and `recent sales activity > 0`.
5.  **Calculate** the `days_until_stockout` forecast.
6.  **Project** the final response shape to match the required format.

**Handled Edge Cases:**
*   **Authorization:** Ensures users can only access data for their own company.
*   **No Recent Sales:** The `$match` stage filters out products with no recent sales, as per the business rule.
*   **Division by Zero:** The `$cond` operator safely calculates `days_until_stockout` without errors.
*   **Missing Supplier:** Used a `LEFT JOIN` (via `preserveNullAndEmptyArrays: true`) so the alert still returns if a supplier has been deleted.

## How to Run

1.  Clone this repo.
2.  Run `npm install` to install dependencies (Express, Mongoose).
3.  Ensure a MongoDB instance is running and set the `MONGODB_URI` environment variable.
4.  The code is provided as a solution showcase. The models and routes would need to be integrated into a full Express application server.
