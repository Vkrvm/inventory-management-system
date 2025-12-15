# Supabase Quick Reference

Quick cheat sheet for working with Supabase in this project.

## Environment Variables

```env
# Transaction mode (port 6543) - for app queries
DATABASE_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Session mode (port 5432) - for migrations
DIRECT_URL="postgresql://postgres.your-ref:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

## Get Connection Strings

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Settings → Database
4. Scroll to "Connection string"
5. Select "Connection pooling" → Copy URI
6. Replace `[YOUR-PASSWORD]` with your database password

## Common Commands

```bash
# Install dependencies
npm install

# Run migrations (creates tables in Supabase)
npm run db:migrate

# Seed database with sample data
npm run db:seed

# View database (Prisma Studio)
npm run db:studio

# View database (Supabase Dashboard)
# Go to project → Table Editor

# Reset database (⚠️ deletes all data)
npm run db:reset

# Start development
npm run dev
```

## Supabase Dashboard

### View Tables
- Project → Table Editor
- Click any table to view/edit data

### Run SQL
- Project → SQL Editor
- Write and execute SQL queries

### Check Usage
- Settings → Database → Usage
- Monitor connections, storage, bandwidth

### Backups
- Settings → Database → Backups
- Create manual backups
- Restore from backups

## Connection Modes

### Transaction Mode (Port 6543)
- Use for: Application queries (Prisma Client)
- Settings: `?pgbouncer=true&connection_limit=1`
- Used in: `DATABASE_URL`

### Session Mode (Port 5432)
- Use for: Database migrations
- Settings: Direct connection
- Used in: `DIRECT_URL`

## Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# View database GUI
npx prisma studio

# Validate schema
npx prisma validate

# Format schema
npx prisma format

# Pull schema from database
npx prisma db pull

# Push schema to database (dev only)
npx prisma db push
```

## Troubleshooting

### Can't connect to database
```bash
# Check if project is paused
# Go to Supabase dashboard → Resume project

# Verify connection string
echo $DATABASE_URL

# Test connection
npm run db:studio
```

### Migration fails
```bash
# Use DIRECT_URL (Session mode)
# Ensure DIRECT_URL is set in .env

# Reset and retry
npm run db:reset
npm run db:migrate
```

### Too many connections
```bash
# Use connection pooler
# Ensure DATABASE_URL includes:
# ?pgbouncer=true&connection_limit=1
```

## Free Tier Limits

- **Database**: 500 MB
- **Bandwidth**: 5 GB/month
- **API Requests**: Unlimited
- **Auth Users**: Unlimited
- **Auto-pause**: After 7 days inactivity

## Monitoring

### Check Database Size
```sql
-- In Supabase SQL Editor
SELECT
  pg_size_pretty(pg_database_size('postgres')) as database_size;
```

### Check Table Sizes
```sql
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Check Connections
- Supabase Dashboard → Settings → Database → Usage

## Security

### Change Database Password
1. Settings → Database
2. Database password → Reset password
3. Update `.env` with new password
4. Restart development server

### Enable SSL (Production)
```env
# Add to connection string
?sslmode=require
```

## Production Deployment

### Vercel
```bash
# Set environment variables in Vercel dashboard
DATABASE_URL=your-supabase-pooler-url
DIRECT_URL=your-supabase-direct-url
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=your-production-secret

# Deploy
vercel

# Run migrations
npx prisma migrate deploy
```

### Other Platforms
Same environment variables, ensure:
1. Both `DATABASE_URL` and `DIRECT_URL` are set
2. Use connection pooler for serverless
3. Run migrations after deployment

## Useful Supabase URLs

- **Dashboard**: https://app.supabase.com
- **Docs**: https://supabase.com/docs
- **Discord**: https://discord.supabase.com
- **Status**: https://status.supabase.com

## Project Structure in Supabase

After running migrations, you'll see these tables:

- User
- Warehouse
- Material
- Product
- ProductVariant
- Stock
- StockMovement
- Customer
- Invoice
- InvoiceItem
- Payment
- History
- _prisma_migrations (Prisma internal)

## Sample Queries

### View all users
```sql
SELECT id, email, name, role, "isActive"
FROM "User"
ORDER BY "createdAt" DESC;
```

### View all products with variants
```sql
SELECT
  p.id,
  p.type,
  p."brandName",
  p.code,
  COUNT(pv.id) as variant_count
FROM "Product" p
LEFT JOIN "ProductVariant" pv ON pv."productId" = p.id
GROUP BY p.id, p.type, p."brandName", p.code;
```

### Check stock levels
```sql
SELECT
  w.name as warehouse,
  COALESCE(m.name, p.type || ' - ' || pv.color) as item,
  s.quantity
FROM "Stock" s
LEFT JOIN "Warehouse" w ON w.id = s."warehouseId"
LEFT JOIN "Material" m ON m.id = s."materialId"
LEFT JOIN "ProductVariant" pv ON pv.id = s."productVariantId"
LEFT JOIN "Product" p ON p.id = pv."productId"
ORDER BY s.quantity ASC;
```

### View unpaid invoices
```sql
SELECT
  i."invoiceNumber",
  c.name as customer,
  i."finalTotal",
  i."paidAmount",
  i."remainingBalance",
  i.status
FROM "Invoice" i
JOIN "Customer" c ON c.id = i."customerId"
WHERE i.status IN ('UNPAID', 'PARTIAL')
ORDER BY i."createdAt" DESC;
```

## Tips

1. **Use connection pooler** for serverless deployments
2. **Monitor database size** to stay within free tier
3. **Regular backups** before major changes
4. **Index important columns** (already configured in schema)
5. **Close Prisma Studio** when not using (saves connections)
6. **Resume paused projects** from Supabase dashboard

## Support

- Supabase Issues: https://github.com/supabase/supabase/issues
- Prisma Issues: https://github.com/prisma/prisma/issues
- Project Issues: Check TROUBLESHOOTING.md

---

**Quick Start**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed setup instructions.
