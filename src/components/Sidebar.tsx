"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { UserRole } from "@prisma/client";
import PreferencesSwitcher from "./PreferencesSwitcher";
import { useTranslation } from "@/hooks/useTranslation";

interface SidebarProps {
  userRole: UserRole;
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();
  const { t } = useTranslation();

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(path + "/");
  };

  const canAccess = (allowedRoles: UserRole[]) => {
    return allowedRoles.includes(userRole);
  };

  return (
    <div className="sidebar p-3">
      <h4 className="text-white mb-4">{t("nav.systemName")}</h4>

      {/* Language and Currency Switcher */}
      <div className="mb-3">
        <PreferencesSwitcher />
      </div>

      <nav className="nav flex-column">
        <Link
          href="/dashboard"
          className={`nav-link ${isActive("/dashboard") && pathname === "/dashboard" ? "active" : ""}`}
        >
          {t("nav.dashboard")}
        </Link>

        {canAccess([UserRole.SUPER_ADMIN]) && (
          <>
            <div className="text-white-50 mt-3 mb-2 px-3 small">
              {t("nav.superAdmin")}
            </div>
            <Link
              href="/dashboard/users"
              className={`nav-link ${isActive("/dashboard/users") ? "active" : ""}`}
            >
              {t("nav.users")}
            </Link>
          </>
        )}

        {canAccess([UserRole.SUPER_ADMIN, UserRole.ADMIN]) && (
          <>
            <div className="text-white-50 mt-3 mb-2 px-3 small">{t("nav.admin")}</div>
            <Link
              href="/dashboard/warehouses"
              className={`nav-link ${isActive("/dashboard/warehouses") ? "active" : ""}`}
            >
              {t("nav.warehouses")}
            </Link>
            <Link
              href="/dashboard/reports"
              className={`nav-link ${isActive("/dashboard/reports") ? "active" : ""}`}
            >
              {t("nav.reports")}
            </Link>
          </>
        )}

        {canAccess([UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER]) && (
          <>
            <div className="text-white-50 mt-3 mb-2 px-3 small">
              {t("nav.management")}
            </div>
            <Link
              href="/dashboard/products"
              className={`nav-link ${isActive("/dashboard/products") ? "active" : ""}`}
            >
              {t("nav.products")}
            </Link>
            <Link
              href="/dashboard/brands"
              className={`nav-link ${isActive("/dashboard/brands") ? "active" : ""}`}
            >
              {t("nav.brands")}
            </Link>
            <Link
              href="/dashboard/categories"
              className={`nav-link ${isActive("/dashboard/categories") ? "active" : ""}`}
            >
              {t("nav.categories")}
            </Link>
            <Link
              href="/dashboard/materials"
              className={`nav-link ${isActive("/dashboard/materials") ? "active" : ""}`}
            >
              {t("nav.materials")}
            </Link>
            <Link
              href="/dashboard/units"
              className={`nav-link ${isActive("/dashboard/units") ? "active" : ""}`}
            >
              {t("nav.units")}
            </Link>
            <Link
              href="/dashboard/stock"
              className={`nav-link ${isActive("/dashboard/stock") ? "active" : ""}`}
            >
              {t("nav.stock")}
            </Link>
            <Link
              href="/dashboard/customers"
              className={`nav-link ${isActive("/dashboard/customers") ? "active" : ""}`}
            >
              {t("nav.customers")}
            </Link>
          </>
        )}

        <div className="text-white-50 mt-3 mb-2 px-3 small">{t("nav.sales")}</div>
        <Link
          href="/dashboard/invoices"
          className={`nav-link ${isActive("/dashboard/invoices") ? "active" : ""}`}
        >
          {t("nav.invoices")}
        </Link>
        <Link
          href="/dashboard/returns"
          className={`nav-link ${isActive("/dashboard/returns") ? "active" : ""}`}
        >
          {t("nav.returns")}
        </Link>
        <Link
          href="/dashboard/returns/damaged"
          className={`nav-link ${isActive("/dashboard/returns/damaged") ? "active" : ""}`}
        >
          {t("nav.damagedReturns")}
        </Link>
        <Link
          href="/dashboard/damaged-items"
          className={`nav-link ${isActive("/dashboard/damaged-items") ? "active" : ""}`}
        >
          {t("nav.damagedItems")}
        </Link>

        <div className="text-white-50 mt-3 mb-2 px-3 small">{t("nav.activity")}</div>
        <Link
          href="/dashboard/history"
          className={`nav-link ${isActive("/dashboard/history") ? "active" : ""}`}
        >
          {t("nav.history")}
        </Link>

        <hr className="text-white-50 my-3" />

        <Link
          href="/dashboard/settings"
          className={`nav-link ${isActive("/dashboard/settings") ? "active" : ""}`}
        >
          {t("nav.settings")}
        </Link>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          className="nav-link btn btn-link text-start text-danger"
        >
          {t("nav.logout")}
        </button>
      </nav>
    </div>
  );
}
