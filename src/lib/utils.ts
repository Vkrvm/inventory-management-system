import { UserRole } from "@prisma/client";

export function hasRole(userRole: UserRole, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(userRole);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function calculateDiscount(
  subtotal: number,
  discountType: "FIXED" | "PERCENTAGE" | null,
  discountValue: number | null
): number {
  if (!discountType || !discountValue) return subtotal;

  if (discountType === "FIXED") {
    return Math.max(0, subtotal - discountValue);
  } else {
    const discount = (subtotal * discountValue) / 100;
    return Math.max(0, subtotal - discount);
  }
}

export function generateInvoiceNumber(): string {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `INV-${timestamp}-${random}`;
}
