# Product Manager API Documentation

## Overview
Complete Product Management System with CRUD operations, barcode scanning, and automatic audit logging.

## Base URL
```
http://localhost:3000/api/v1
```

## Swagger Documentation
Interactive API documentation available at:
```
http://localhost:3000/docs
```

---

## Authentication Endpoints

### 1. Register User
**POST** `/auth/register`

Register a new user in the system.

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john.doe@example.com",
  "password": "SecureP@ssw0rd",
  "full_name": "John Doe",
  "role": "viewer" // optional: admin, employee, viewer
}
```

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "email": "john.doe@example.com",
    "role": "viewer",
    "is_active": true,
    ...
  },
  "token": "jwt-token-string"
}
```

### 2. Login User
**POST** `/auth/login`

Authenticate a user and retrieve a JWT token.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecureP@ssw0rd"
}
```

**Response:** `201 Created` (Assuming standard NestJS behavior or 200 OK)
```json
{
  "user": { ... },
  "token": "jwt-token-string"
}
```

### 3. Check Auth Status
**GET** `/auth/check-status`

Check if the current token is valid and refresh it.

**Headers:**
`Authorization: Bearer <token>`

**Response:** `200 OK`
```json
{
  "user": { ... },
  "token": "new-jwt-token-string"
}
```

---

## User Endpoints

### 1. Get All Users
**GET** `/users`
*(Admin only)*

**Query Parameters:**
- `includeInactive`: true/false
- `search`: username, email, full name
- `role`: filter by role

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "username": "...",
    "email": "...",
    "role": "..."
  }
]
```

### 2. Get User by ID
**GET** `/users/:id`
*(Admin or Own Account)*

### 3. Update User
**PATCH** `/users/:id`
*(Admin or Own Account)*

**Request Body:**
```json
{
  "full_name": "New Name",
  "email": "new.email@example.com"
}
```

### 4. Delete User (Soft Delete)
**DELETE** `/users/:id`
*(Admin or Own Account)*

### 5. Restore User
**POST** `/users/:id/restore`
*(Admin only)*

---

## Products Endpoints

### 1. Create Product
**POST** `/products`

Creates a new product with automatic audit logging.

**Request Body:**
```json
{
  "name": "Product Name",
  "description": "Product description",
  "sku": "SKU-001",
  "barcode": "1234567890123",
  "status": "active",
  "unit_type": "unit",
  "units_per_package": 12,
  "color": "Red",
  "size": "M",
  "seasonal": false,
  "supplier_code": "SUP-001",
  "created_by": "user-uuid" // Typically inferred from token in real usage, but DTO might allow it
}
```

**Response:** `201 Created`

### 2. Get All Products
**GET** `/products`

Retrieves all products with optional filtering and pagination.

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `inactive`, `discontinued`
- `search` (optional) - Search by name, SKU, or barcode
- `limit` (optional) - Number of results (default: all)
- `offset` (optional) - Pagination offset (default: 0)
- `minPrice`, `maxPrice` (optional)
- `categoryId` (optional)

**Response:** `200 OK`
```json
{
  "data": [ ... ],
  "total": 100
}
```

### 3. Find Product by Barcode
**GET** `/products/barcode/:barcode`

### 4. Find Product by SKU
**GET** `/products/sku/:sku`

### 5. Get Product by ID
**GET** `/products/:id`

### 6. Update Product
**PATCH** `/products/:id`

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "inactive"
}
```

### 7. Delete Product
**DELETE** `/products/:id`

### 8. Restore Product
**POST** `/products/:id/restore`

---

## Category Endpoints

### 1. Create Category
**POST** `/categories`

**Request Body:**
```json
{
  "name": "Category Name",
  "description": "Optional description",
  "parent_id": "uuid-of-parent", // Optional
  "icon": "icon-name",
  "sort_order": 1,
  "is_active": true
}
```

### 2. Get All Categories
**GET** `/categories`

**Query Parameters:**
- `parent_id`: Filter by parent (use "null" for roots)
- `is_active`: true/false
- `search`: Name/Description query

### 3. Get Category Tree
**GET** `/categories/tree`
Returns a hierarchical structure of categories.

### 4. Get Category Details
**GET** `/categories/:id`

### 5. Update Category
**PUT** `/categories/:id`

### 6. Delete Category
**DELETE** `/categories/:id`

---

## Inventory Endpoints

### 1. Create Inventory Record
**POST** `/inventory`
Initializes inventory for a product.

**Request Body:**
```json
{
  "product_id": "product-uuid",
  "quantity": 100,
  "min_stock": 10,
  "max_stock": 1000,
  "location": "Warehouse A"
}
```

### 2. Get Inventory
**GET** `/inventory`
**Query:** `search`, `includeInactive`

### 3. Get Low Stock
**GET** `/inventory/low-stock`

### 4. Adjust Inventory (Movements)
**POST** `/inventory/:id/adjust`
Creates an IN/OUT movement.

**Request Body:**
```json
{
  "amount": 5,
  "type": "IN", // "IN", "OUT", "ADJUST"
  "reason": "Stock arrived"
}
```

### 5. Get Movement History
**GET** `/inventory/:id/history`

---

## Pricing Endpoints

### 1. Create Pricing
**POST** `/pricing`
Sets a price for a product.

**Request Body:**
```json
{
  "product_id": "product-uuid",
  "selling_price": 150.00,
  "cost_price": 100.00,
  "currency": "USD"
}
```

### 2. Get Current Price
**GET** `/pricing/product/:productId`

### 3. Get Price History
**GET** `/pricing/product/:productId/history`

### 4. Update Price
**PATCH** `/pricing/:id`

---

## Audit Log Endpoints

### 1. Get All Audit Logs
**GET** `/audit-log`

### 2. Get Audit History for Record
**GET** `/audit-log/record/:tableName/:recordId`

---

## Common Enums / Data Models

### User Roles
- `admin`
- `employee`
- `viewer`

### Inventory Movement Types
- `IN`: Increase stock
- `OUT`: Decrease stock
- `ADJUST`: Set specific value / correction

### Product Status
- `active`
- `inactive`
- `discontinued`

---

## Error Handling
Standard HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Invalid/Missing Token)
- `403`: Forbidden (Insufficient Role)
- `404`: Not Found
- `409`: Conflict (Duplicates)
- `500`: Internal Server Error

Error Response Format:
```json
{
  "statusCode": 400,
  "message": "Error details...",
  "error": "Bad Request"
}
```
