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
  "created_by": "user-uuid"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Product Name",
  "sku": "SKU-001",
  "barcode": "1234567890123",
  "status": "active",
  "created_at": "2024-01-01T00:00:00.000Z",
  ...
}
```

**Errors:**
- `409 Conflict` - SKU or barcode already exists
- `400 Bad Request` - Validation error

---

### 2. Get All Products
**GET** `/products`

Retrieves all products with optional filtering and pagination.

**Query Parameters:**
- `status` (optional) - Filter by status: `active`, `inactive`, `discontinued`
- `search` (optional) - Search by name, SKU, or barcode
- `limit` (optional) - Number of results (default: all)
- `offset` (optional) - Pagination offset (default: 0)

**Example:**
```
GET /products?status=active&search=shirt&limit=10&offset=0
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Product Name",
      "sku": "SKU-001",
      "barcode": "1234567890123",
      ...
    }
  ],
  "total": 100
}
```

---

### 3. Find Product by Barcode (Barcode Scanning)
**GET** `/products/barcode/:barcode`

Retrieves a product by its barcode. This endpoint is optimized for barcode scanning operations.

**Example:**
```
GET /products/barcode/1234567890123
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Product Name",
  "sku": "SKU-001",
  "barcode": "1234567890123",
  "status": "active",
  ...
}
```

**Errors:**
- `404 Not Found` - Product with barcode not found

---

### 4. Find Product by SKU
**GET** `/products/sku/:sku`

Retrieves a product by its SKU.

**Example:**
```
GET /products/sku/SKU-001
```

**Response:** `200 OK`

---

### 5. Get Product by ID
**GET** `/products/:id`

Retrieves a specific product by ID.

**Response:** `200 OK`

**Errors:**
- `404 Not Found` - Product not found

---

### 6. Get Product Audit History
**GET** `/products/:id/audit-history`

Retrieves the complete audit history for a product, showing all changes made.

**Example:**
```
GET /products/uuid/audit-history
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "table_name": "products",
    "record_id": 123,
    "action": "UPDATE",
    "old_values": { "name": "Old Name" },
    "new_values": { "name": "New Name" },
    "user_id": "user-uuid",
    "ip_address": "192.168.1.1",
    "user_agent": "Mozilla/5.0...",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 7. Update Product
**PATCH** `/products/:id`

Updates an existing product with automatic audit logging.

**Request Body:**
```json
{
  "name": "Updated Name",
  "status": "inactive",
  "updated_by": "user-uuid"
}
```

**Response:** `200 OK`

**Errors:**
- `404 Not Found` - Product not found
- `409 Conflict` - SKU or barcode already exists

---

### 8. Delete Product
**DELETE** `/products/:id?userId=user-uuid`

Deletes a product with automatic audit logging.

**Query Parameters:**
- `userId` (required) - ID of user performing the deletion

**Response:** `204 No Content`

**Errors:**
- `404 Not Found` - Product not found

---

## Audit Log Endpoints

### 1. Get All Audit Logs
**GET** `/audit-log`

Retrieves audit logs with optional filtering.

**Query Parameters:**
- `tableName` (optional) - Filter by table name
- `recordId` (optional) - Filter by record ID
- `limit` (optional) - Limit results (default: 100)

**Example:**
```
GET /audit-log?tableName=products&limit=50
```

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "table_name": "products",
    "record_id": 123,
    "action": "CREATE",
    "new_values": { ... },
    "user_id": "user-uuid",
    "created_at": "2024-01-01T00:00:00.000Z"
  }
]
```

---

### 2. Get Audit History for Record
**GET** `/audit-log/record/:tableName/:recordId`

Retrieves all audit logs for a specific record.

**Example:**
```
GET /audit-log/record/products/123
```

**Response:** `200 OK`

---

### 3. Get Audit Log by ID
**GET** `/audit-log/:id`

Retrieves a specific audit log entry.

**Response:** `200 OK`

---

## Data Models

### Product Status Enum
- `active` - Product is active and available
- `inactive` - Product is temporarily inactive
- `discontinued` - Product is discontinued

### Unit Type Enum
- `unit` - Individual unit
- `package` - Package of units
- `box` - Box containing multiple packages

### Audit Action Enum
- `CREATE` - Record was created
- `UPDATE` - Record was updated
- `DELETE` - Record was deleted
- `READ` - Record was read (optional logging)

---

## Validation Rules

### Product Creation/Update
- `name`: Required, max 200 characters
- `sku`: Required, max 100 characters, unique
- `barcode`: Required, max 100 characters, unique
- `status`: Optional, must be valid enum value
- `unit_type`: Optional, must be valid enum value
- `units_per_package`: Optional, must be >= 1
- `color`: Optional, max 50 characters
- `size`: Optional, max 50 characters
- `seasonal`: Optional, boolean
- `supplier_code`: Optional, max 100 characters
- `created_by`: Required for creation
- `updated_by`: Required for updates

---

## Automatic Audit Logging

All product operations (CREATE, UPDATE, DELETE) are automatically logged to the audit_log table with:
- Table name and record ID
- Action performed
- Old and new values (for updates)
- User ID
- IP address
- User agent
- Timestamp

---

## Error Responses

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

Common status codes:
- `400` - Bad Request (validation error)
- `404` - Not Found
- `409` - Conflict (duplicate SKU/barcode)
- `500` - Internal Server Error

---

## Example Usage

### Barcode Scanning Flow
1. Scan barcode: `1234567890123`
2. Call: `GET /products/barcode/1234567890123`
3. Display product information
4. Update inventory or perform other operations

### Product Management Flow
1. Create product: `POST /products`
2. View all products: `GET /products`
3. Update product: `PATCH /products/:id`
4. View audit history: `GET /products/:id/audit-history`
5. Delete product: `DELETE /products/:id?userId=user-uuid`

---

## Notes

- All timestamps are in ISO 8601 format (UTC)
- UUIDs are used for product IDs
- Integer IDs are used for audit log entries
- CORS is enabled for all origins
- Global validation pipe is enabled
- Swagger documentation includes all endpoints and schemas
