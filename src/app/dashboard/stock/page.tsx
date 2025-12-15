import DashboardLayout from "@/components/DashboardLayout";
import { getStockByWarehouse } from "@/actions/stock.actions";
import { getWarehouses } from "@/actions/warehouse.actions";
import { getMaterials } from "@/actions/material.actions";
import { getProducts } from "@/actions/product.actions";
import { getAllCategories } from "@/actions/category.actions";
import StockClient from "./StockClient";

export default async function StockPage() {
  const [stockResult, warehousesResult, materialsResult, productsResult, categoriesResult] = await Promise.all([
    getStockByWarehouse(),
    getWarehouses(),
    getMaterials(),
    getProducts(),
    getAllCategories(),
  ]);

  if (!stockResult.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">Error loading stock: {stockResult.error}</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <StockClient
        stocks={stockResult.stocks || []}
        warehouses={warehousesResult.warehouses || []}
        materials={materialsResult.materials || []}
        products={productsResult.products || []}
        categories={categoriesResult.data || []}
      />
    </DashboardLayout>
  );
}
