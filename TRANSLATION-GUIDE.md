# 🌍 Translation System Guide

## ✅ What's Implemented:

### 1. Translation Hook
**File:** `src/hooks/useTranslation.ts`

Simple hook to use translations in any client component:

```typescript
import { useTranslation } from "@/hooks/useTranslation";

function MyComponent() {
  const { t, language } = useTranslation();

  return (
    <div>
      <h1>{t("invoices.title")}</h1>
      <p>{t("common.loading")}</p>
    </div>
  );
}
```

### 2. Translation Files
**Files:**
- `src/messages/ar.json` - Arabic (200+ strings)
- `src/messages/en.json` - English (200+ strings)

**Structure:**
```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "nav": {
    "dashboard": "Dashboard",
    "products": "Products"
  },
  "invoices": {
    "title": "Invoices",
    "createInvoice": "Create New Invoice"
  }
}
```

### 3. Already Translated:
✅ **Sidebar** - All navigation items
✅ **Invoices Page** - Title and "Create New Invoice" button

## 📝 How to Add Translations:

### Step 1: Import the hook
```typescript
import { useTranslation } from "@/hooks/useTranslation";
```

### Step 2: Use the hook in your component
```typescript
export default function MyComponent() {
  const { t } = useTranslation();

  // Your component code
}
```

### Step 3: Replace hardcoded text
**Before:**
```tsx
<button>Save</button>
```

**After:**
```tsx
<button>{t("common.save")}</button>
```

## 🎯 Translation Keys Reference:

### Common Actions
```typescript
t("common.save")      // "Save" / "حفظ"
t("common.cancel")    // "Cancel" / "إلغاء"
t("common.delete")    // "Delete" / "حذف"
t("common.edit")      // "Edit" / "تعديل"
t("common.create")    // "Create" / "إنشاء"
t("common.view")      // "View" / "عرض"
t("common.print")     // "Print" / "طباعة"
```

### Navigation
```typescript
t("nav.dashboard")    // "Dashboard" / "لوحة التحكم"
t("nav.products")     // "Products" / "المنتجات"
t("nav.invoices")     // "Invoices" / "الفواتير"
t("nav.customers")    // "Customers" / "العملاء"
```

### Invoices
```typescript
t("invoices.title")              // "Invoices" / "الفواتير"
t("invoices.createInvoice")      // "Create New Invoice" / "إنشاء فاتورة جديدة"
t("invoices.viewInvoice")        // "View Invoice" / "عرض الفاتورة"
t("invoices.printInvoice")       // "Print Invoice" / "طباعة الفاتورة"
t("invoices.invoiceNumber")      // "Invoice Number" / "رقم الفاتورة"
t("invoices.customer")           // "Customer" / "العميل"
t("invoices.paymentType")        // "Payment Type" / "نوع الدفع"
```

### Products
```typescript
t("products.title")              // "Products" / "المنتجات"
t("products.createProduct")      // "Create New Product" / "إضافة منتج جديد"
t("products.productCode")        // "Product Code" / "كود المنتج"
t("products.category")           // "Category" / "الفئة"
t("products.brand")              // "Brand" / "العلامة التجارية"
```

## 🔍 Example: Translating a Page

### Before (Hardcoded English):
```typescript
export default function BrandsClient({ brands }: any) {
  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">Brands</h5>
        <button className="btn btn-primary">
          Create New Brand
        </button>

        <table className="table">
          <thead>
            <tr>
              <th>Brand Name</th>
              <th>Products Count</th>
              <th>Actions</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}
```

### After (With Translations):
```typescript
import { useTranslation } from "@/hooks/useTranslation";

export default function BrandsClient({ brands }: any) {
  const { t } = useTranslation();

  return (
    <div className="card">
      <div className="card-body">
        <h5 className="card-title">{t("brands.title")}</h5>
        <button className="btn btn-primary">
          {t("brands.createBrand")}
        </button>

        <table className="table">
          <thead>
            <tr>
              <th>{t("brands.brandName")}</th>
              <th>{t("brands.productsCount")}</th>
              <th>{t("common.actions")}</th>
            </tr>
          </thead>
        </table>
      </div>
    </div>
  );
}
```

## 🎨 How It Works:

1. **User selects language** in the sidebar (العربية / English)
2. **Language saved** to database in User table
3. **Page reloads** to apply new language
4. **HTML attributes updated**: `dir="rtl"` / `dir="ltr"`, `lang="ar"` / `lang="en"`
5. **All `t()` calls** return text in the selected language
6. **CSS automatically adjusts** for RTL/LTR layout

## 📋 Translation Progress:

| Component | Status |
|-----------|--------|
| Sidebar | ✅ Complete |
| Invoices Page (partial) | ✅ Title & Button |
| Products | ⏳ Pending |
| Brands | ⏳ Pending |
| Categories | ⏳ Pending |
| Customers | ⏳ Pending |
| Stock | ⏳ Pending |
| Warehouses | ⏳ Pending |
| Materials | ⏳ Pending |
| Reports | ⏳ Pending |
| History | ⏳ Pending |

## 🚀 Quick Start:

1. **Restart dev server** to apply changes
2. **Test the Sidebar** - All navigation should show in Arabic/English
3. **Test Invoices page** - Title and button should translate
4. **Add more translations** - Use the pattern above for other pages

## 💡 Tips:

- ✅ All translation keys are **type-safe**
- ✅ Missing translations will show the key (e.g., "invoices.title")
- ✅ Use nested keys for organization (`"invoices.paymentTypes.CASH"`)
- ✅ Translation files have **200+ pre-written strings** ready to use
- ✅ Just import `useTranslation` hook and start using `t()`

---

**Note:** The translation system is lightweight and doesn't require next-intl routing or complex setup. It's perfect for this use case!
