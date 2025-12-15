# Prisma Client Regeneration Required

## Issue
The `accountBalance` field has been added to the Customer model in the database schema, but the Prisma client hasn't been regenerated yet. This causes the error when creating CREDIT invoices.

## Steps to Fix

1. **Stop the development server**
   - Press `Ctrl+C` in the terminal running `npm run dev`

2. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

3. **Restart the development server**
   ```bash
   npm run dev
   ```

## What This Does
- Regenerates the TypeScript types and client code to include the new `accountBalance` field
- Allows the application to update customer account balances when creating CREDIT invoices

After completing these steps, creating invoices (both CASH and CREDIT) will work properly.
