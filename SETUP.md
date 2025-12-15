# Quick Setup Guide

## Step-by-Step Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and update with your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/invoice_db?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-this-with-openssl-rand-base64-32"
```

### 3. Generate NextAuth Secret

```bash
# On Linux/Mac
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

Copy the output to `NEXTAUTH_SECRET` in your `.env` file.

### 4. Set Up PostgreSQL Database

Create a new PostgreSQL database:

```sql
CREATE DATABASE invoice_db;
```

### 5. Run Migrations

```bash
npm run db:migrate
```

This will:
- Create all database tables
- Set up relationships
- Apply constraints

### 6. Seed the Database

```bash
npm run db:seed
```

This creates:
- **Super Admin**: admin@example.com / admin123
- **Manager**: manager@example.com / manager123
- **Sales**: sales@example.com / sales123
- Sample warehouses (Product & Material)
- Sample products (Wallets, Belts)
- Sample product variants (colors)
- Initial stock
- Sample customers

### 7. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 8. Login

Use one of the seeded accounts:

**Super Admin (Full Access)**
- Email: admin@example.com
- Password: admin123

## Available Routes After Login

### Super Admin Only
- `/dashboard/users` - User Management

### Admin & Super Admin
- `/dashboard/warehouses` - Warehouse Management
- `/dashboard/reports` - Reports & Analytics

### Manager, Admin & Super Admin
- `/dashboard/products` - Product Management
- `/dashboard/materials` - Material Management
- `/dashboard/stock` - Stock Management
- `/dashboard/customers` - Customer Management

### All Authenticated Users
- `/dashboard` - Dashboard Home
- `/dashboard/invoices` - Invoice Management
- `/dashboard/history` - Activity History

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm run start           # Start production server

# Database
npm run db:migrate      # Run migrations
npm run db:seed         # Seed database
npm run db:studio       # Open Prisma Studio (DB GUI)
npm run db:reset        # Reset database (⚠️ deletes all data)

# Linting
npm run lint            # Run ESLint
```

## Prisma Studio (Database GUI)

View and edit your database visually:

```bash
npm run db:studio
```

Opens at [http://localhost:5555](http://localhost:5555)

## Troubleshooting

### Database Connection Error

Ensure PostgreSQL is running and credentials in `.env` are correct.

```bash
# Check PostgreSQL is running (Linux/Mac)
pg_isready

# Windows - check service is running
```

### Migration Error

Reset the database and try again:

```bash
npm run db:reset
npm run db:seed
```

### Port 3000 Already in Use

Change the port:

```bash
PORT=3001 npm run dev
```

### NextAuth Error

Make sure `NEXTAUTH_SECRET` is set in `.env` file.

## Next Steps

1. ✅ Login with admin@example.com / admin123
2. ✅ Create additional users (User Management)
3. ✅ Add warehouses
4. ✅ Create products and variants
5. ✅ Add stock to warehouses
6. ✅ Create customers
7. ✅ Generate invoices

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production`
2. Use strong passwords
3. Generate new `NEXTAUTH_SECRET`
4. Enable HTTPS
5. Set up database backups
6. Use environment variables (not `.env` file)

```bash
# Production build
npm run build
npm start
```

## Security Reminders

- ⚠️ Change default passwords immediately
- ⚠️ Use strong NEXTAUTH_SECRET
- ⚠️ Never commit `.env` file
- ⚠️ Set up HTTPS in production
- ⚠️ Regular database backups
- ⚠️ Keep dependencies updated

---

Happy coding! 🚀
