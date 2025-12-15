import DashboardLayout from "@/components/DashboardLayout";
import { getAllBrands } from "@/actions/brand.actions";
import BrandsClient from "./BrandsClient";

export default async function BrandsPage() {
  const result = await getAllBrands();

  if (!result.success) {
    return (
      <DashboardLayout>
        <div className="alert alert-danger">
          Error loading brands: {result.error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>

      <BrandsClient brands={result.data || []} />
    </DashboardLayout>
  );
}
