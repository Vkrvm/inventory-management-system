# Troubleshooting Guide

Common issues and their solutions.

## Installation Issues

### npm install fails

**Symptom**: Error during `npm install`

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Prisma generate fails

**Symptom**: `Error: Prisma schema not found`

**Solution**:
```bash
# Ensure schema exists
ls prisma/schema.prisma

# Regenerate
npx prisma generate
```

---

## Database Issues

### Cannot connect to database

**Symptom**: `Can't reach database server`

**Solutions**:

1. **Check PostgreSQL is running**
   ```bash
   # Windows: Check services
   # Linux: sudo systemctl status postgresql
   # Mac: brew services list
   ```

2. **Check DATABASE_URL in .env**
   ```env
   # Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
   DATABASE_URL="postgresql://postgres:password@localhost:5432/invoice_db"
   ```

3. **Create database if it doesn't exist**
   ```bash
   # Connect to PostgreSQL
   psql -U postgres

   # Create database
   CREATE DATABASE invoice_db;
   ```

### Migration fails

**Symptom**: `Migration engine error`

**Solutions**:

1. **Check for syntax errors in schema**
   ```bash
   npx prisma validate
   ```

2. **Reset and try again**
   ```bash
   npm run db:reset
   npm run db:migrate
   ```

3. **Drop database and recreate**
   ```bash
   dropdb invoice_db
   createdb invoice_db
   npm run db:migrate
   ```

### Seed fails

**Symptom**: `Unique constraint failed`

**Solution**:
```bash
# Clear existing data
npm run db:reset

# Run seed
npm run db:seed
```

---

## Authentication Issues

### Can't login

**Symptom**: "Invalid email or password"

**Solutions**:

1. **Check credentials**
   - Email: admin@example.com
   - Password: admin123

2. **Ensure database is seeded**
   ```bash
   npm run db:seed
   ```

3. **Check NEXTAUTH_SECRET is set**
   ```env
   # In .env
   NEXTAUTH_SECRET="your-secret-here"
   ```

4. **Clear cookies and try again**
   - Open browser DevTools
   - Application → Cookies → Clear all

### Redirected to login after login

**Symptom**: Logs in but redirects back to login

**Solutions**:

1. **Check NEXTAUTH_URL**
   ```env
   NEXTAUTH_URL="http://localhost:3000"
   ```

2. **Ensure no CORS issues**
   - Check browser console for errors

3. **Clear browser cache**

### Session expires immediately

**Symptom**: Need to login every page refresh

**Solutions**:

1. **Check NEXTAUTH_SECRET is consistent**
   - Don't change it after creating sessions

2. **Check cookies are enabled**
   - Browser settings

3. **Check for middleware issues**
   - Look at `src/middleware.ts`

---

## Development Server Issues

### Port 3000 already in use

**Symptom**: `Port 3000 is already in use`

**Solutions**:

1. **Use different port**
   ```bash
   PORT=3001 npm run dev
   ```

2. **Kill process using port 3000**
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F

   # Linux/Mac
   lsof -ti:3000 | xargs kill -9
   ```

### Changes not reflecting

**Symptom**: Code changes don't show in browser

**Solutions**:

1. **Hard refresh browser**
   - Ctrl+Shift+R (Windows/Linux)
   - Cmd+Shift+R (Mac)

2. **Clear Next.js cache**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Restart development server**
   - Stop server (Ctrl+C)
   - Run `npm run dev` again

### Build fails

**Symptom**: `npm run build` fails

**Solutions**:

1. **Check TypeScript errors**
   ```bash
   npx tsc --noEmit
   ```

2. **Fix linting issues**
   ```bash
   npm run lint
   ```

3. **Clear cache and rebuild**
   ```bash
   rm -rf .next
   npm run build
   ```

---

## Runtime Errors

### 500 Internal Server Error

**Symptom**: Page shows 500 error

**Solutions**:

1. **Check terminal for error details**

2. **Check database connection**
   ```bash
   npm run db:studio
   ```

3. **Regenerate Prisma Client**
   ```bash
   npx prisma generate
   ```

### Hydration errors

**Symptom**: "Text content does not match server-rendered HTML"

**Solutions**:

1. **Check for date formatting issues**
   - Use consistent date format on server and client

2. **Use suppressHydrationWarning**
   ```tsx
   <div suppressHydrationWarning>{date}</div>
   ```

3. **Ensure no random values during SSR**

### Module not found

**Symptom**: `Cannot find module '@/...'`

**Solutions**:

1. **Restart TypeScript server**
   - VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

2. **Check tsconfig.json paths**
   ```json
   {
     "compilerOptions": {
       "paths": {
         "@/*": ["./src/*"]
       }
     }
   }
   ```

3. **Reinstall dependencies**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## Prisma Issues

### P2002: Unique constraint failed

**Symptom**: `Unique constraint failed on the fields`

**Solution**:
- You're trying to create duplicate data
- Change the unique value
- Or delete existing record first

### P2003: Foreign key constraint failed

**Symptom**: `Foreign key constraint failed`

**Solution**:
- Referenced record doesn't exist
- Create parent record first
- Or check IDs are correct

### P2025: Record not found

**Symptom**: `Record to update not found`

**Solution**:
- Record was already deleted
- Check ID is correct
- Refresh data

---

## UI/UX Issues

### Modal won't close

**Symptom**: Modal stays open after submit

**Solution**:
```typescript
const [showModal, setShowModal] = useState(false);

const handleSubmit = async (e) => {
  e.preventDefault();
  await submitAction();
  setShowModal(false); // ← Add this
};
```

### Form not submitting

**Symptom**: Button click does nothing

**Solutions**:

1. **Check form has onSubmit**
   ```tsx
   <form onSubmit={handleSubmit}>
   ```

2. **Check button type**
   ```tsx
   <button type="submit">Submit</button>
   ```

3. **Check for JavaScript errors**
   - Open browser console (F12)

### Alert not showing

**Symptom**: Success/error message doesn't appear

**Solution**:
```typescript
const [alert, setAlert] = useState(null);

// After action
if (result.error) {
  setAlert({ type: "danger", message: result.error });
} else {
  setAlert({ type: "success", message: "Success!" });
}

// In JSX
{alert && <Alert {...alert} onClose={() => setAlert(null)} />}
```

---

## Performance Issues

### Page loads slowly

**Solutions**:

1. **Check for N+1 queries**
   ```typescript
   // Bad
   const products = await prisma.product.findMany();
   // Then products.forEach(p => fetch variants)

   // Good
   const products = await prisma.product.findMany({
     include: { variants: true }
   });
   ```

2. **Use parallel queries**
   ```typescript
   const [products, customers] = await Promise.all([
     prisma.product.findMany(),
     prisma.customer.findMany(),
   ]);
   ```

3. **Add database indexes**
   - Already configured in schema

### Large bundle size

**Solutions**:

1. **Use dynamic imports**
   ```typescript
   const Component = dynamic(() => import('./Component'));
   ```

2. **Check bundle analyzer**
   ```bash
   npm install @next/bundle-analyzer
   ```

---

## Security Issues

### CSRF errors

**Symptom**: "CSRF token mismatch"

**Solution**:
- NextAuth handles this automatically
- Don't disable CSRF protection
- Check cookies are enabled

### Unauthorized access

**Symptom**: User accessing restricted pages

**Solution**:
1. **Check middleware**
   - `src/middleware.ts`

2. **Check server action authorization**
   ```typescript
   if (![UserRole.ADMIN].includes(session.user.role)) {
     return { error: "Unauthorized" };
   }
   ```

---

## Production Issues

### Environment variables not working

**Symptom**: App works locally but not in production

**Solution**:
- Set environment variables in hosting platform
- Don't commit `.env` file
- Use platform-specific config

### Database migrations in production

**Symptom**: Schema mismatch in production

**Solution**:
```bash
# Use deploy command (non-interactive)
npx prisma migrate deploy
```

### Build succeeds but runtime errors

**Symptom**: Build works but app crashes

**Solutions**:

1. **Check logs**
   - Look for error messages

2. **Test production build locally**
   ```bash
   npm run build
   npm start
   ```

3. **Check environment variables**

---

## Data Issues

### Stock goes negative

**Symptom**: Stock quantity is negative

**Solution**:
- This should be prevented by server actions
- If it happens, check `updateStock` function
- Manual fix via Prisma Studio

### Invoice total incorrect

**Symptom**: Calculated total is wrong

**Solution**:
- Check `calculateDiscount` function
- Verify discount type and value
- Check for rounding issues

### Orphaned records

**Symptom**: Records without parent

**Solution**:
- Cascade deletes are configured
- If happens, check foreign key constraints
- Clean up via SQL or Prisma Studio

---

## TypeScript Issues

### Type errors

**Symptom**: TS errors in IDE

**Solutions**:

1. **Regenerate Prisma types**
   ```bash
   npx prisma generate
   ```

2. **Restart TS server**
   - VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

3. **Check imports**
   ```typescript
   // Use Prisma-generated types
   import { UserRole } from "@prisma/client";
   ```

### Argument type errors

**Symptom**: Type mismatch in function calls

**Solution**:
```typescript
// Check function signature
export async function updateStock(formData: {
  quantity: number; // ← number, not string
  // ...
})

// Pass correct types
updateStock({
  quantity: parseInt(value), // Convert string to number
})
```

---

## Browser-Specific Issues

### Works in Chrome but not Safari

**Solutions**:
- Check for browser-specific CSS
- Test with browser DevTools
- Use polyfills if needed

### Cookies not working in incognito

**Solution**:
- Expected behavior
- Incognito blocks some cookies
- Test in normal mode

---

## Getting More Help

1. **Check error message carefully**
   - Read the full error
   - Look for file names and line numbers

2. **Check browser console**
   - F12 → Console tab
   - Look for red errors

3. **Check terminal output**
   - Server errors appear here
   - Database errors logged here

4. **Use Prisma Studio**
   ```bash
   npm run db:studio
   ```
   - Visual database inspection
   - Check actual data

5. **Review documentation**
   - [README.md](README.md)
   - [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md)
   - [API_REFERENCE.md](API_REFERENCE.md)

6. **Check existing code**
   - Product management is complete
   - Use as reference

---

## Emergency Reset

If nothing works, nuclear option:

```bash
# Stop server
# Ctrl+C

# Delete everything generated
rm -rf node_modules .next prisma/migrations

# Drop and recreate database
dropdb invoice_db
createdb invoice_db

# Reinstall
npm install

# Setup from scratch
npm run db:migrate
npm run db:seed

# Start fresh
npm run dev
```

⚠️ **This deletes all data!**

---

## Prevention Tips

1. **Commit often**
   - Use git
   - Commit working states

2. **Test before committing**
   - Run `npm run build`
   - Check all features work

3. **Use TypeScript**
   - Catch errors early
   - Don't use `any`

4. **Read error messages**
   - They usually tell you what's wrong

5. **Keep dependencies updated**
   ```bash
   npm outdated
   npm update
   ```

---

## Still Stuck?

1. Copy the error message
2. Check which file and line
3. Look at that code
4. Compare with working examples (Products page)
5. Check if it's a known issue above

**Most issues are one of**:
- Database not running
- Environment variables not set
- Missing migration
- TypeScript needs restart
- Cache needs clearing

---

Good luck! 🍀
