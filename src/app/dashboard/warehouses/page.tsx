import DashboardLayout from "@/components/DashboardLayout";
import { getWarehouses } from "@/actions/warehouse.actions";
import WarehousesClient from "./WarehousesClient";

export default async function WarehousesPage() {
  const result = await getWarehouses();

  if (!result.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading warehouses: {result.error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <WarehousesClient warehouses={result.warehouses || []} />
    </DashboardLayout>
  );
}
