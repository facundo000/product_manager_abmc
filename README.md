<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# Product Manager Backend

NestJS-based backend for managing products, inventory, pricing, and payment processing with Mercado Pago integration.

## Quick Start

Install dependencies:
```bash
npm install
```

Run in development mode:
```bash
npm run start:dev
```

## Testing

Run all tests:
```bash
npm run test
```

Run specific test:
```bash
npm run test <filename>.spec
```

## Features

- **Product Management**: CRUD operations with SKU/barcode uniqueness validation
- **Inventory Tracking**: Stock management with movement history
- **Pricing System**: Dynamic pricing with historical tracking
- **User Management**: Role-based access control (ADMIN, EMPLOYEE, VIEWER)
- **Audit Logging**: Complete audit trail for all changes
- **Payment Integration**: Mercado Pago QR code generation and payment processing
- **Stock Automation**: Automatic stock reduction on payment confirmation
- **Event-Driven Architecture**: Event emitters for asynchronous processing

## Mercado Pago Integration

Full payment integration with automatic QR code generation, payment webhooks, and stock management.

For detailed setup and usage instructions, see [MERCADO_PAGO_INTEGRATION.md](./MERCADO_PAGO_INTEGRATION.md)

### Key Features:
- Dynamic QR code generation for invoices
- Automatic stock reduction on payment confirmation
- Scheduled QR code auto-refresh (daily at 2 AM)
- Atomic transactions with rollback support
- Event-driven stock management

## Architecture

### Database
- PostgreSQL with TypeORM ORM
- Auto-migration via synchronization
- Full audit logging

### Modules
- `user/` - User management and authentication
- `product/` - Product catalog and management
- `category/` - Product categorization
- `inventory/` - Stock tracking
- `pricing/` - Price management
- `audit-log/` - Change tracking
- `product-image/` - Product images
- `auth/` - Authentication and authorization
- `dashboard/` - Analytics and metrics
- `invoice/` - Invoice management
- `payment/` - Payment processing (Mercado Pago)

### Environment Variables

See `.env.example` for all required configuration variables.

## Testing Status

The following test files are currently skipped due to module load issues:

```
src/product/product.controller.spec.ts
src/inventory/inventory.controller.spec.ts
src/category/category.controller.spec.ts
src/pricing/pricing.service.spec.ts
src/pricing/pricing.controller.spec.ts
src/auth/auth.controller.spec.ts
src/inventory/inventory.service.spec.ts
src/auth/auth.service.spec.ts
src/category/category.service.spec.ts
src/user/user.controller.spec.ts
src/auth/guards/user-role/user-role.guard.spec.ts
```

These can be re-enabled and fixed as needed.

## API Documentation

Auto-generated Swagger documentation available at:
```
http://localhost:3000/api/docs
```

## License

UNLICENSED

 3. Roles
  ```ts
  EMPLOYEE = 'employee',
  VIEWER = 'viewer',
  ADMIN = 'admin'
  ```

4. Add protected route to Dashboard

5. Add image user