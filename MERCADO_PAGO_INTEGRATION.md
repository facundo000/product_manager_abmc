# Mercado Pago Integration Guide

## Overview

This document describes the Mercado Pago payment integration for the Product Manager backend. The system allows generating dynamic QR codes for invoices, processing payments, and automatically reducing stock upon payment confirmation.

## Architecture

### Modules

1. **InvoiceModule** - Manages invoices and invoice items
2. **PaymentModule** - Handles Mercado Pago integration and payment processing
3. **ListenersModule** - Contains event listeners for payment-related events

### Key Components

#### Invoice Entity
- `id`: UUID (primary key)
- `number`: Unique invoice number (auto-generated)
- `total`: Total amount in decimal
- `itemCount`: Number of items
- `status`: Enum (PENDING, PAID, FAILED, EXPIRED, CANCELLED)
- `paymentMethod`: Enum (MERCADO_PAGO, CASH, TRANSFER)
- `paymentId`: Unique payment ID from Mercado Pago
- `qrCode`: Data URL of the generated QR code
- `qrExpiration`: Timestamp when QR code expires
- `items`: One-to-many relationship with InvoiceItem
- `createdBy`: Reference to User entity

#### InvoiceItem Entity
- `id`: UUID (primary key)
- `invoice`: Many-to-one relationship to Invoice (CASCADE DELETE)
- `product`: Many-to-one relationship to Product
- `quantity`: Number of units
- `unitPrice`: Price per unit
- `subtotal`: quantity × unitPrice

#### PaymentService
Handles all Mercado Pago API interactions:
- `processPaymentMercadoPago(invoiceId)`: Generates dynamic QR code
- `handleMercadoPagoWebhook(webhookData)`: Processes payment confirmations
- `refreshExpiredQRs()`: Auto-refreshes expired QR codes

#### StockListener
Event listener that reduces product stock when an invoice is paid:
- Listens to `invoice.paid` event
- Uses QueryRunner for atomic transactions
- Updates product quantities and logs audit trails

#### QrRefreshService
Scheduled service that runs daily at 2 AM to refresh expiring QR codes

## Setup Instructions

### 1. Environment Configuration

Add these variables to your `.env` file:

```env
MERCADO_PAGO_ACCESS_TOKEN=your_access_token_here
MERCADO_PAGO_USER_ID=your_user_id_here
MERCADO_PAGO_POS_ID=your_pos_id_here
WEBHOOK_SECRET=your_webhook_secret_here
API_URL=https://your-api-domain.com
QR_EXPIRATION_HOURS=24
```

**Getting Mercado Pago Credentials:**

1. Create a Mercado Pago business account at https://www.mercadopago.com.ar
2. Go to "Configuración" → "Tokens" to get your ACCESS_TOKEN
3. In "Configuración" → "Punto de Venta", create a new POS and note the ID
4. Extract your USER_ID from your profile settings

### 2. Database Setup

The entities will be auto-created via TypeORM synchronization:

```bash
npm run start:dev
```

No manual migration needed - the Invoice and InvoiceItem tables are created automatically.

### 3. Webhook Configuration

Configure your Mercado Pago webhook in the dashboard:

1. Go to Mercado Pago Admin → Settings → Notifications
2. Add a webhook with URL: `https://your-api-domain.com/payment/webhook/mercadopago`
3. Subscribe to: `payment.created` and `payment.updated` events
4. Note the webhook secret for signature verification

## API Endpoints

### Create Invoice

```http
POST /invoices
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-uuid",
      "quantity": 2,
      "unitPrice": 99.99
    }
  ]
}
```

**Response (201 Created):**
```json
{
  "id": "invoice-uuid",
  "number": "INV-0001",
  "total": 199.98,
  "itemCount": 1,
  "status": "pending",
  "paymentMethod": null,
  "paymentId": null,
  "qrCode": null,
  "qrExpiration": null,
  "items": [
    {
      "id": "item-uuid",
      "product": { "id": "...", "name": "..." },
      "quantity": 2,
      "unitPrice": "99.99",
      "subtotal": "199.98"
    }
  ],
  "createdAt": "2026-01-28T10:30:00Z",
  "updatedAt": "2026-01-28T10:30:00Z"
}
```

### Generate QR Code (Process Payment)

```http
POST /payment/process/:invoiceId
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "qrUrl": "data:image/png;base64,iVBORw0KGgoAAAANS...",
  "qrData": "00020126580014br.gov.bcb.brcode01051.0.0...",
  "expiresAt": "2026-01-29T10:30:00Z"
}
```

### Get Invoice

```http
GET /invoices/:id
Authorization: Bearer <token>
```

### List Invoices

```http
GET /invoices?page=1&limit=10&status=pending
Authorization: Bearer <token>
```

### Webhook Endpoint

```http
POST /payment/webhook/mercadopago
x-signature: <signature-from-mercado-pago>
Content-Type: application/json

{
  "type": "payment",
  "data": {
    "id": "payment_id_from_mp"
  }
}
```

## Payment Flow

### 1. Create Invoice
User creates an invoice with items and quantities. Stock is NOT deducted yet.

### 2. Generate QR Code
User requests QR code generation. System validates:
- Invoice is in PENDING status
- All products have sufficient stock
- Generates dynamic QR via Mercado Pago API
- Stores QR data URL and expiration time

### 3. Customer Payment
Customer scans QR code and completes payment via Mercado Pago.

### 4. Webhook Notification
Mercado Pago sends payment confirmation webhook to `/payment/webhook/mercadopago`.

System:
1. Validates webhook signature (optional, currently skipped)
2. Fetches payment details from Mercado Pago API
3. Updates Invoice status to "paid"
4. **Emits `invoice.paid` event**

### 5. Stock Reduction (Event-Driven)
StockListener:
1. Listens to `invoice.paid` event
2. Loads invoice items
3. For each item:
   - Validates stock availability
   - Reduces product quantity
   - Logs audit entry
4. Uses atomic transaction - all or nothing

### 6. QR Auto-Refresh
Daily at 2 AM, QrRefreshService:
1. Finds all invoices with expired QR codes in PENDING status
2. For each expired QR, regenerates new code
3. Updates Invoice with new qrUrl and expiration

## Error Handling

### Stock Validation
- **Before QR generation**: Checks all products have sufficient stock
- **During payment webhook**: Validates stock again before reduction
- **Rollback**: If any item fails, entire stock reduction transaction rolls back

### Mercado Pago API Errors
- Connection errors: Logged and re-thrown with descriptive messages
- Invalid response: Returns 500 Internal Server Error
- Missing configuration: Throws error on service initialization

### QR Code Expiration
- QR codes expire after 24 hours (configurable via `QR_EXPIRATION_HOURS`)
- Expired QR codes automatically refresh daily
- User can manually trigger refresh by requesting new QR for same invoice

### Payment Failures
- If payment fails on Mercado Pago, webhook indicates "rejected" status
- System does NOT reduce stock for rejected payments
- Invoice remains in PENDING status, can be retried with same QR or new one

## Database Transactions

All multi-step operations use TypeORM QueryRunner for atomic transactions:

### Invoice Creation
```
START TRANSACTION
  - Validate all products and stock
  - Create Invoice record
  - Create InvoiceItem records for each item
COMMIT TRANSACTION
```

### Stock Reduction
```
START TRANSACTION
  - Load invoice with items
  - For each item:
    - Check stock availability
    - Reduce product quantity
    - Log audit entry
COMMIT TRANSACTION
(or ROLLBACK if any step fails)
```

## Audit Logging

All changes are logged to `audit_log` table:
- **Invoice creation**: Records new invoice number, total, items
- **Payment status change**: Records old/new status and payment ID
- **Stock reduction**: Records old/new quantity for each product

## Configuration

### QR Expiration
Default: 24 hours. Modify via environment variable:
```env
QR_EXPIRATION_HOURS=24
```

### Auto-Refresh Schedule
Default: Daily at 2 AM. To modify, edit [qr-refresh.service.ts](src/payment/qr-refresh.service.ts):
```typescript
@Cron(CronExpression.EVERY_DAY_AT_2AM)  // Change cron expression
async refreshExpiredQRs(): Promise<void>
```

## Testing Guide

### Manual Testing in Sandbox

1. **Create Invoice:**
```bash
curl -X POST http://localhost:3000/invoices \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "items": [
      {"productId": "UUID", "quantity": 5, "unitPrice": 100}
    ]
  }'
```

2. **Generate QR:**
```bash
curl -X POST http://localhost:3000/payment/process/invoice-uuid \
  -H "Authorization: Bearer <your-token>"
```

3. **Simulate Payment via Mercado Pago Dashboard:**
   - Go to Mercado Pago Admin
   - Use "Test Payment" feature
   - Use test QR code from your invoice
   - Complete payment

4. **Verify Stock Reduction:**
```bash
curl -X GET http://localhost:3000/products/product-uuid \
  -H "Authorization: Bearer <your-token>"
```
Check that quantity has decreased by the invoice amount.

### Webhook Testing

To test webhook locally without HTTPS:

1. Use ngrok to expose local server: `ngrok http 3000`
2. Configure webhook in Mercado Pago with ngrok URL
3. Trigger test payment through Mercado Pago dashboard
4. Check server logs for webhook handling

## Security Considerations

### Webhook Signature Verification
Currently bypassed in development. For production, implement:
```typescript
// In PaymentController
const isValid = this.paymentService.verifyWebhookSignature(signature, req.rawBody);
if (!isValid) {
  throw new BadRequestException('Invalid webhook signature');
}
```

### HTTPS Requirement
- Development: HTTP OK with ngrok
- Production: MUST use HTTPS
- Mercado Pago webhook validation depends on HTTPS

### Payment ID Uniqueness
- Database constraint: `paymentId` is unique
- Prevents duplicate stock reduction if webhook retried

### Role-Based Access
- Only ADMIN and EMPLOYEE can create invoices
- Viewers cannot access payment endpoints

## Troubleshooting

### QR Code Generation Fails
**Check:**
- All environment variables configured correctly
- Mercado Pago API token is valid (not expired)
- POS ID exists in your account
- Product stock is sufficient

### Stock Not Reducing After Payment
**Check:**
- Invoice status changed to "paid" in database
- Check server logs for StockListener errors
- Verify products exist with correct IDs
- Check audit_log for failed entries

### Webhook Not Being Triggered
**Check:**
- Webhook registered in Mercado Pago dashboard
- Using HTTPS in production
- Firewall allows inbound traffic
- Check Mercado Pago webhook logs for failures

### QR Already Exists Error
**Resolution:**
- Wait for QR to expire (24 hours)
- Or manually refresh: request new process/payment
- Current QR prevents creating duplicates

## Future Enhancements

1. **Webhook Signature Verification**: Implement HMAC validation
2. **Refund Handling**: Trigger on "refund" webhooks to restore stock
3. **Partial Payments**: Support multiple transactions per invoice
4. **Invoice Expiration**: Auto-cancel invoices that expire without payment
5. **Payment History**: Track all payment attempts per invoice
6. **Multiple Payment Methods**: Support cash, transfers, other providers
7. **Invoice PDF Generation**: Generate downloadable invoices
8. **Email Notifications**: Send QR code to customer email

## References

- [Mercado Pago QR API Documentation](https://www.mercadopago.com.ar/developers/es/reference/qr/_instore_orders_qr_seller_collectors_%7Buser_id%7D_pos_%7Bexternal_pos_id%7D_qrs/post)
- [Mercado Pago Webhooks](https://www.mercadopago.com.ar/developers/es/docs/webhooks/overview)
- [NestJS Event Emitter](https://docs.nestjs.com/techniques/events)
- [NestJS Scheduling](https://docs.nestjs.com/techniques/task-scheduling)
