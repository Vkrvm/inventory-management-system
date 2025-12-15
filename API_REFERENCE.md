# API Reference

Complete reference for all Server Actions in the system.

## User Actions (`user.actions.ts`)

### `createUser(formData)`
Create a new user account.

**Authorization**: SUPER_ADMIN only

**Parameters**:
```typescript
{
  email: string;
  password: string;
  name: string;
  role: UserRole; // SUPER_ADMIN | ADMIN | MANAGER | SALES | WAREHOUSE
}
```

**Returns**:
```typescript
{ success: true, user: User } | { error: string }
```

---

### `updateUserRole(userId, role)`
Change a user's role.

**Authorization**: SUPER_ADMIN only

**Parameters**:
- `userId`: string
- `role`: UserRole

**Returns**:
```typescript
{ success: true, user: User } | { error: string }
```

---

### `resetUserPassword(userId, newPassword)`
Reset a user's password.

**Authorization**: SUPER_ADMIN only

**Parameters**:
- `userId`: string
- `newPassword`: string

**Returns**:
```typescript
{ success: true } | { error: string }
```

---

### `toggleUserStatus(userId, isActive)`
Activate or deactivate a user account.

**Authorization**: SUPER_ADMIN only

**Parameters**:
- `userId`: string
- `isActive`: boolean

**Returns**:
```typescript
{ success: true, user: User } | { error: string }
```

---

### `getUsers()`
Fetch all users.

**Authorization**: SUPER_ADMIN only

**Returns**:
```typescript
{ success: true, users: User[] } | { error: string }
```

---

## Warehouse Actions (`warehouse.actions.ts`)

### `createWarehouse(formData)`
Create a new warehouse.

**Authorization**: SUPER_ADMIN, ADMIN

**Parameters**:
```typescript
{
  name: string;
  type: WarehouseType; // MATERIAL | PRODUCT
}
```

**Returns**:
```typescript
{ success: true, warehouse: Warehouse } | { error: string }
```

---

### `updateWarehouse(id, formData)`
Update warehouse details.

**Authorization**: SUPER_ADMIN, ADMIN

**Parameters**:
- `id`: string
- `formData`: Same as createWarehouse

**Returns**:
```typescript
{ success: true, warehouse: Warehouse } | { error: string }
```

---

### `deleteWarehouse(id)`
Delete a warehouse.

**Authorization**: SUPER_ADMIN, ADMIN

**Parameters**:
- `id`: string

**Returns**:
```typescript
{ success: true } | { error: string }
```

---

### `getWarehouses()`
Fetch all warehouses with stock counts.

**Authorization**: All authenticated users

**Returns**:
```typescript
{
  success: true,
  warehouses: (Warehouse & { _count: { stocks: number } })[]
} | { error: string }
```

---

## Product Actions (`product.actions.ts`)

### `createProduct(formData)`
Create a new product.

**Authorization**: SUPER_ADMIN, ADMIN, MANAGER

**Parameters**:
```typescript
{
  type: ProductType; // WALLET | BELT | BAG | ACCESSORY | OTHER
  brandName: string;
  code: string;
  description?: string;
}
```

**Constraints**:
- Unique combination of (type, brandName, code)

**Returns**:
```typescript
{ success: true, product: Product } | { error: string }
```

---

### `createProductVariant(formData)`
Add a color variant to a product.

**Authorization**: SUPER_ADMIN, ADMIN, MANAGER

**Parameters**:
```typescript
{
  productId: string;
  color: string;
}
```

**Constraints**:
- Unique combination of (productId, color)

**Returns**:
```typescript
{ success: true, variant: ProductVariant } | { error: string }
```

---

### `getProducts()`
Fetch all products with variants.

**Authorization**: All authenticated users

**Returns**:
```typescript
{
  success: true,
  products: (Product & { variants: ProductVariant[] })[]
} | { error: string }
```

---

### `deleteProduct(id)`
Delete a product and all its variants.

**Authorization**: SUPER_ADMIN, ADMIN, MANAGER

**Parameters**:
- `id`: string

**Returns**:
```typescript
{ success: true } | { error: string }
```

---

## Stock Actions (`stock.actions.ts`)

### `updateStock(formData)`
Add or remove stock from a warehouse.

**Authorization**: All authenticated users

**Parameters**:
```typescript
{
  warehouseId: string;
  materialId?: string;        // Either materialId OR productVariantId
  productVariantId?: string;  // (not both)
  quantity: number;
  type: MovementType;         // IN | OUT | ADJUSTMENT
  notes?: string;
}
```

**Business Rules**:
- Cannot reduce stock below 0
- Creates StockMovement record
- Logs action in History

**Returns**:
```typescript
{ success: true, stock: Stock } | { error: string }
```

---

### `transferStock(formData)`
Transfer stock between warehouses.

**Authorization**: All authenticated users

**Parameters**:
```typescript
{
  warehouseFromId: string;
  warehouseToId: string;
  materialId?: string;        // Either materialId OR productVariantId
  productVariantId?: string;
  quantity: number;
  notes?: string;
}
```

**Business Rules**:
- Checks source warehouse has sufficient stock
- Reduces from source
- Adds to destination
- Creates TRANSFER StockMovement

**Returns**:
```typescript
{ success: true } | { error: string }
```

---

### `getStockByWarehouse()`
Fetch all stock entries with details.

**Authorization**: All authenticated users

**Returns**:
```typescript
{
  success: true,
  stocks: (Stock & {
    warehouse: Warehouse;
    material?: Material;
    productVariant?: ProductVariant & { product: Product };
  })[]
} | { error: string }
```

---

## Customer Actions (`customer.actions.ts`)

### `createCustomer(formData)`
Create a new customer.

**Authorization**: SUPER_ADMIN, ADMIN, MANAGER

**Parameters**:
```typescript
{
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}
```

**Returns**:
```typescript
{ success: true, customer: Customer } | { error: string }
```

---

### `updateCustomer(id, formData)`
Update customer information.

**Authorization**: SUPER_ADMIN, ADMIN, MANAGER

**Parameters**:
- `id`: string
- `formData`: Same as createCustomer

**Returns**:
```typescript
{ success: true, customer: Customer } | { error: string }
```

---

### `getCustomers()`
Fetch all customers with invoice counts.

**Authorization**: All authenticated users

**Returns**:
```typescript
{
  success: true,
  customers: (Customer & { _count: { invoices: number } })[]
} | { error: string }
```

---

### `getCustomerById(id)`
Get customer details with invoice history and balance.

**Authorization**: All authenticated users

**Parameters**:
- `id`: string

**Returns**:
```typescript
{
  success: true,
  customer: Customer & { invoices: Invoice[] },
  totalBalance: number
} | { error: string }
```

---

## Invoice Actions (`invoice.actions.ts`)

### `createInvoice(formData)`
Create a new sales invoice.

**Authorization**: All authenticated users

**Parameters**:
```typescript
{
  customerId: string;
  paymentType: PaymentType;  // CASH | CREDIT
  discountType?: DiscountType; // FIXED | PERCENTAGE
  discountValue?: number;
  items: Array<{
    productVariantId: string;
    quantity: number;
    price: number;
  }>;
  warehouseId: string;
  notes?: string;
}
```

**Business Rules**:
- Calculates subtotal from items
- Applies discount if provided
- For CASH: status = PAID, paidAmount = finalTotal
- For CREDIT: status = UNPAID, paidAmount = 0
- Reduces stock automatically
- Creates StockMovement records

**Returns**:
```typescript
{
  success: true,
  invoice: Invoice & {
    items: InvoiceItem[];
    customer: Customer;
  }
} | { error: string }
```

---

### `addPayment(formData)`
Add a payment to a CREDIT invoice.

**Authorization**: All authenticated users

**Parameters**:
```typescript
{
  invoiceId: string;
  amount: number;
  notes?: string;
}
```

**Business Rules**:
- Only for CREDIT invoices
- Cannot exceed remaining balance
- Updates invoice.paidAmount
- Updates invoice.remainingBalance
- Updates invoice.status (PARTIAL or PAID)

**Returns**:
```typescript
{ success: true } | { error: string }
```

---

### `getInvoices()`
Fetch all invoices with details.

**Authorization**: All authenticated users

**Returns**:
```typescript
{
  success: true,
  invoices: (Invoice & {
    customer: Customer;
    items: InvoiceItem[];
    _count: { payments: number };
  })[]
} | { error: string }
```

---

### `getInvoiceById(id)`
Get detailed invoice information.

**Authorization**: All authenticated users

**Parameters**:
- `id`: string

**Returns**:
```typescript
{
  success: true,
  invoice: Invoice & {
    customer: Customer;
    user: User;
    items: InvoiceItem[];
    payments: Payment[];
  }
} | { error: string }
```

---

## Helper Functions (`lib/utils.ts`)

### `hasRole(userRole, allowedRoles)`
Check if user has required role.

**Parameters**:
- `userRole`: UserRole
- `allowedRoles`: UserRole[]

**Returns**: boolean

---

### `formatCurrency(amount)`
Format number as currency.

**Parameters**:
- `amount`: number

**Returns**: string (e.g., "$1,234.56")

---

### `formatDate(date)`
Format date for display.

**Parameters**:
- `date`: Date | string

**Returns**: string (e.g., "Dec 14, 2025, 10:30 AM")

---

### `calculateDiscount(subtotal, discountType, discountValue)`
Calculate final amount after discount.

**Parameters**:
- `subtotal`: number
- `discountType`: "FIXED" | "PERCENTAGE" | null
- `discountValue`: number | null

**Returns**: number

**Examples**:
```typescript
calculateDiscount(100, "FIXED", 10)      // 90
calculateDiscount(100, "PERCENTAGE", 10) // 90
calculateDiscount(100, null, null)       // 100
```

---

### `generateInvoiceNumber()`
Generate unique invoice number.

**Returns**: string (e.g., "INV-1702512345678-123")

---

## History Logging (`lib/history.ts`)

### `logHistory(data)`
Log an action to history.

**Parameters**:
```typescript
{
  userId: string;
  action: string;        // e.g., "CREATE_PRODUCT"
  entity?: string;       // e.g., "Product"
  entityId?: string;     // ID of affected entity
  details?: Record<string, any>; // Additional JSON data
}
```

**Returns**: void (fire and forget)

**Example**:
```typescript
await logHistory({
  userId: session.user.id,
  action: "CREATE_INVOICE",
  entity: "Invoice",
  entityId: invoice.id,
  details: {
    invoiceNumber: invoice.invoiceNumber,
    total: invoice.finalTotal,
  },
});
```

---

## Error Handling

All server actions follow this pattern:

```typescript
// Success
{ success: true, data: any }

// Error
{ error: "Human-readable error message" }
```

Always check for `error` property first:

```typescript
const result = await someAction(data);

if (result.error) {
  // Handle error
  showAlert("danger", result.error);
  return;
}

// Use result.data
```

---

## Revalidation

Actions that modify data call `revalidatePath()`:

```typescript
revalidatePath("/dashboard/products");  // Refresh specific page
revalidatePath("/dashboard");           // Refresh dashboard
```

This ensures the UI shows updated data immediately.

---

## Authentication

All server actions check authentication:

```typescript
const session = await auth();

if (!session?.user) {
  return { error: "Unauthorized" };
}

// Use session.user.id, session.user.role
```

---

## Database Transactions

For operations requiring multiple database changes:

```typescript
await prisma.$transaction([
  prisma.stock.update({ ... }),
  prisma.stockMovement.create({ ... }),
  prisma.invoice.create({ ... }),
]);
```

If any operation fails, all are rolled back.

---

## Performance Tips

1. **Parallel Queries**: Use `Promise.all()`
```typescript
const [products, customers] = await Promise.all([
  prisma.product.findMany(),
  prisma.customer.findMany(),
]);
```

2. **Select Only Needed Fields**:
```typescript
const users = await prisma.user.findMany({
  select: { id: true, name: true, email: true },
});
```

3. **Use Indexes**: Already configured in schema for common queries

4. **Pagination**: For large datasets
```typescript
const products = await prisma.product.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});
```

---

This API reference covers all server actions available in the system. For UI components and patterns, see [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).
