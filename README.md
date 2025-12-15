# Inventory, Sales, and Invoice Management System

A professional full-stack inventory and invoice management system built with Next.js 15, TypeScript, Prisma ORM, PostgreSQL, and Bootstrap.

## Features

### Authentication & Authorization
- **Role-based access control** with 5 user roles:
  - `SUPER_ADMIN` - Full system access including user management
  - `ADMIN` - Warehouse and reports management
  - `MANAGER` - Product, material, stock, and customer management
  - `SALES` - Invoice creation and management
  - `WAREHOUSE` - Stock operations
- Secure authentication using NextAuth v5
- Protected routes with middleware

### Warehouse Management
- Two warehouse types: `MATERIAL` and `PRODUCT`
- Stock tracking per warehouse
- Stock movement history (IN, OUT, TRANSFER, ADJUSTMENT)
- Transfer items between warehouses

### Product Management
- Product catalog with types (Wallet, Belt, Bag, Accessory, Other)
- Composite unique constraint: `type + brandName + code`
- Product variants with colors
- Unique constraint per product: `productId + color`

### Material Management
- Raw materials inventory
- Unit types: KG, METER, PIECE
- Stock tracking in material warehouses

### Stock Management
- Real-time stock tracking
- Separate stock for materials and product variants
- Low stock alerts
- Stock movement logging

### Customer Management
- Customer profiles
- Contact information (email, phone, address)
- Customer balance tracking
- Invoice history per customer

### Invoice System
- Create invoices with multiple product items
- Support for discounts:
  - Fixed amount discount
  - Percentage discount
- Payment types:
  - **CASH** - Immediate full payment
  - **CREDIT** - Partial payments allowed
- Invoice status tracking: PAID, PARTIAL, UNPAID
- Automatic stock reduction on invoice creation

### Payment Tracking
- Multiple payments per credit invoice
- Automatic balance calculation
- Payment history

### Activity Logging
- Complete history of all important actions
- User tracking for all operations
- Filterable by user, action, entity, and date

### Reports & Dashboard
- Total products, customers, revenue
- Unpaid invoice tracking
- Recent invoice list
- Low stock alerts
- Sales reports

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma
- **Authentication**: NextAuth v5 (not Supabase Auth)
- **UI**: Bootstrap 5 with SCSS
- **Server**: Server Actions + API Routes

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier available)

## Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd invoice-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up Supabase Database**

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

Quick steps:
- Create a free Supabase account at [supabase.com](https://supabase.com)
- Create a new project
- Get your connection strings from Settings → Database

4. **Set up environment variables**

Create a `.env` file in the root directory:

```env
# Supabase Database (get from your Supabase project)
DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
# Generate secret: openssl rand -base64 32
```

5. **Run database migrations**

```bash
# Create tables in Supabase
npm run db:migrate

# Seed the database with initial data
npm run db:seed
```

This will create all tables in your Supabase database and seed with:
- Super Admin user: `admin@example.com` / `admin123`
- Manager user: `manager@example.com` / `manager123`
- Sales user: `sales@example.com` / `sales123`
- Sample warehouses, products, and customers

6. **Start the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data
- `npm run db:studio` - Open Prisma Studio (database GUI)
- `npm run db:reset` - Reset database and run migrations

## Default Login Credentials

After running the seed script:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@example.com | admin123 |
| Manager | manager@example.com | manager123 |
| Sales | sales@example.com | sales123 |

**⚠️ IMPORTANT**: Change these passwords immediately in production!

## Project Structure

```
invoice-system/
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts           # Database seeding
├── src/
│   ├── actions/          # Server actions
│   │   ├── user.actions.ts
│   │   ├── warehouse.actions.ts
│   │   ├── product.actions.ts
│   │   ├── stock.actions.ts
│   │   ├── customer.actions.ts
│   │   └── invoice.actions.ts
│   ├── app/              # Next.js app router
│   │   ├── api/
│   │   │   └── auth/     # NextAuth API routes
│   │   ├── auth/
│   │   │   └── signin/   # Sign-in page
│   │   └── dashboard/    # Protected dashboard routes
│   │       ├── users/    # User management (SUPER_ADMIN)
│   │       ├── warehouses/
│   │       ├── products/
│   │       ├── materials/
│   │       ├── stock/
│   │       ├── customers/
│   │       ├── invoices/
│   │       └── history/
│   ├── components/       # Reusable components
│   │   ├── Sidebar.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Alert.tsx
│   │   └── LoadingSpinner.tsx
│   ├── lib/             # Utilities
│   │   ├── db.ts        # Prisma client
│   │   ├── auth.ts      # NextAuth configuration
│   │   ├── history.ts   # Activity logging
│   │   └── utils.ts     # Helper functions
│   ├── styles/
│   │   └── globals.scss # Global styles
│   └── types/
│       └── next-auth.d.ts # TypeScript definitions
├── .env.example         # Environment template
└── package.json
```

## Key Features Explained

### Role-Based Access Control

Routes are protected by middleware based on user roles:

- **SUPER_ADMIN only**: `/dashboard/users`
- **ADMIN+**: `/dashboard/warehouses`, `/dashboard/reports`
- **MANAGER+**: `/dashboard/products`, `/dashboard/materials`, `/dashboard/stock`, `/dashboard/customers`
- **All authenticated**: `/dashboard/invoices`, `/dashboard/history`

### User Management (SUPER_ADMIN only)

Only SUPER_ADMIN can:
- Create new users
- Assign and change user roles
- Reset passwords
- Activate/deactivate accounts

Public user registration is disabled for security.

### Stock Operations

Stock can be updated through:
1. **IN** - Add stock to warehouse
2. **OUT** - Remove stock from warehouse
3. **TRANSFER** - Move stock between warehouses
4. **ADJUSTMENT** - Manual stock adjustments

All operations are logged in the StockMovement table.

### Invoice Workflow

1. Select customer
2. Add product variants with quantities
3. Apply discount (optional)
4. Choose payment type (CASH or CREDIT)
5. Submit invoice
6. Stock is automatically reduced
7. For CREDIT invoices, add payments over time

### History Tracking

All important actions are logged including:
- User creation/updates
- Product/variant creation
- Stock movements
- Invoice creation
- Payment additions

## Production Deployment

1. **Set environment variables** in your hosting platform
2. **Run database migrations**:
   ```bash
   npx prisma migrate deploy
   ```
3. **Build the application**:
   ```bash
   npm run build
   ```
4. **Start the production server**:
   ```bash
   npm start
   ```

## Security Considerations

- ✅ All routes protected by middleware
- ✅ Role-based authorization on server actions
- ✅ Passwords hashed with bcrypt
- ✅ CSRF protection via NextAuth
- ✅ SQL injection prevention via Prisma
- ✅ No public user registration
- ⚠️ Change default passwords immediately
- ⚠️ Use strong NEXTAUTH_SECRET in production
- ⚠️ Enable HTTPS in production
- ⚠️ Set up proper database backups

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues and questions, please open an issue on GitHub.

---

Built with ❤️ using Next.js, TypeScript, and Prisma
